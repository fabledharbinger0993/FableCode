/**
 * HttpPlatformApi — implements the FableApi contract over HTTP fetch.
 *
 * Used by the Capacitor (iOS/iPadOS) build and any plain-browser deployment.
 * AI/chat/debug requests are forwarded to the companion Express backend server.
 * Persistence is handled locally via localStorage so that session data survives
 * without requiring filesystem access.
 *
 * Features with no mobile equivalent (DJMT toolchain, Holograim MCP subprocess)
 * return safe "unavailable" stubs rather than throwing.
 */

import type {
  AgentProfile,
  AnthropicModel,
  ChatMessage,
  DebugFinding,
  DebugReport,
  FableApi,
  HolograimStatus,
  PersistenceLoadResult,
  PersistenceSaveResult,
  PersistenceSnapshot,
  RecallResult,
  ToolkitSummary,
  ToolchainSummary,
  WebSearchResult,
  WorkspaceFile
} from '../shared/types';

const LOCAL_SNAPSHOT_KEY = 'fablecode_session_snapshot';

// Default backend request timeout. Long enough for slow model responses,
// short enough that a dead server doesn't hang the UI indefinitely.
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Backend request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export class HttpPlatformApi implements FableApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // ── Anthropic ────────────────────────────────────────────────────────────

  async listModels(): Promise<AnthropicModel[]> {
    const response = await this.get<AnthropicModel[]>('/anthropic/models');
    return response ?? [];
  }

  async chat(payload: { model: string; messages: ChatMessage[]; temperature?: number }): Promise<string> {
    return this.post<string>('/anthropic/chat', payload);
  }

  // ── Workspace (server-proxied) ───────────────────────────────────────────
  //
  // The Electron native folder picker is unavailable in Capacitor/web.
  // pickWorkspace() returns null — the App component prompts the user to type
  // a path directly; that path is then passed to listWorkspaceFiles/readFile
  // which are forwarded to the backend server.  This lets an iOS device browse
  // files that reside on the connected Mac running the server.

  async pickWorkspace(): Promise<string | null> {
    return null;
  }

  async listWorkspaceFiles(workspacePath: string): Promise<WorkspaceFile[]> {
    try {
      return await this.post<WorkspaceFile[]>('/workspace/files', { workspacePath });
    } catch {
      return [];
    }
  }

  async readWorkspaceFile(workspacePath: string, relativePath: string): Promise<string> {
    try {
      return await this.post<string>('/workspace/read', { workspacePath, relativePath });
    } catch {
      return '';
    }
  }

  // ── Toolchain / Toolkits (desktop-only stubs) ────────────────────────────

  async inspectToolchain(_rootPath?: string): Promise<ToolchainSummary> {
    return {
      rootPath: '',
      exists: false,
      directories: [],
      commands: [],
      configFiles: []
    };
  }

  async inspectToolkits(_payload?: { workspacePath?: string; toolchainRoot?: string }): Promise<ToolkitSummary> {
    return {
      checkedAt: new Date().toISOString(),
      toolchainRoot: '',
      availableCount: 0,
      partialCount: 0,
      missingCount: 0,
      capabilities: []
    };
  }

  // ── Debug ────────────────────────────────────────────────────────────────
  //
  // The local heuristic scan runs client-side (same logic, no Node APIs).
  // The Anthropic model review is forwarded to the backend.

  async debugAnalyze(payload: {
    model?: string;
    agent: AgentProfile;
    filePath: string;
    content: string;
    focus: string;
    toolchainContext?: string;
  }): Promise<DebugReport> {
    const findings = runClientDebugScan(payload.filePath, payload.content);
    const findingWord = findings.length === 1 ? 'finding' : 'findings';
    const report: DebugReport = {
      summary: findings.length === 0
        ? 'No high-signal local findings detected. Use model review for deeper reasoning.'
        : `${findings.length} local ${findingWord} detected across correctness, security, performance, and maintainability.`,
      findings
    };

    if (!payload.model) {
      return report;
    }

    try {
      report.agentReview = await this.post<string>('/debug/analyze', payload);
    } catch (error) {
      report.agentReview = `Model review unavailable: ${error instanceof Error ? error.message : 'unknown error'}`;
    }

    return report;
  }

  // ── Web search ───────────────────────────────────────────────────────────

  async webSearch(query: string): Promise<WebSearchResult> {
    try {
      return await this.post<WebSearchResult>('/web/search', { query });
    } catch (error) {
      return {
        query,
        answer: null,
        summary: null,
        sourceUrl: null,
        related: [],
        error: error instanceof Error ? error.message : 'web search failed'
      };
    }
  }

  // ── Persistence (localStorage) ───────────────────────────────────────────

  async loadPersistence(): Promise<PersistenceLoadResult> {
    const holograim = this.unavailableHolograimStatus();
    try {
      const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
      const snapshot: PersistenceSnapshot | null = raw ? (JSON.parse(raw) as PersistenceSnapshot) : null;
      return { snapshot, holograim, recall: [] };
    } catch {
      return { snapshot: null, holograim, recall: [] };
    }
  }

  async savePersistence(snapshot: PersistenceSnapshot): Promise<PersistenceSaveResult> {
    const localSnapshotPath = LOCAL_SNAPSHOT_KEY;
    try {
      localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(snapshot));
      return { saved: true, localSnapshotPath, holograimStored: false };
    } catch (error) {
      return {
        saved: false,
        localSnapshotPath,
        holograimStored: false,
        error: error instanceof Error ? error.message : 'localStorage write failed'
      };
    }
  }

  async recallPersistence(query: string): Promise<RecallResult> {
    return { query, memories: [], holograimAvailable: false, error: 'Holograim MCP is not available on iOS.' };
  }

  async getHolograimStatus(): Promise<HolograimStatus> {
    return this.unavailableHolograimStatus();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async get<T>(path: string): Promise<T> {
    const response = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      headers: { Accept: 'application/json' }
    }, DEFAULT_REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`Backend error ${response.status}: ${await response.text()}`);
    }
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }, DEFAULT_REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`Backend error ${response.status}: ${await response.text()}`);
    }
    return response.json() as Promise<T>;
  }

  private unavailableHolograimStatus(): HolograimStatus {
    return {
      configured: false,
      serverPath: '',
      command: '',
      args: [],
      localSnapshotPath: LOCAL_SNAPSHOT_KEY,
      lastError: 'Holograim MCP subprocess is not available on iOS.'
    };
  }
}

// ── Client-side debug scan ────────────────────────────────────────────────
//
// Mirrors the heuristic rules from src/main/main.ts but uses only browser-safe
// APIs so it can run inside the Capacitor webview without a Node.js process.

function extname(filePath: string): string {
  const match = /(\.[^./\\]+)$/.exec(filePath);
  return match ? match[1].toLowerCase() : '';
}

function firstMatchLine(lines: string[], pattern: RegExp): number | undefined {
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : undefined;
}

function addRegexFinding(
  findings: DebugFinding[],
  lines: string[],
  pattern: RegExp,
  finding: Omit<DebugFinding, 'line'>
): void {
  const line = firstMatchLine(lines, pattern);
  if (line) {
    findings.push({ ...finding, line });
  }
}

function runClientDebugScan(filePath: string, content: string): DebugFinding[] {
  const findings: DebugFinding[] = [];
  const lines = content.split(/\r?\n/);
  const extension = extname(filePath);

  addRegexFinding(findings, lines, /\beval\s*\(/, {
    severity: 'error',
    category: 'security',
    title: 'Dynamic code execution',
    detail: 'Avoid eval-style execution unless the input is fully trusted and sandboxed.'
  });

  addRegexFinding(findings, lines, /innerHTML\s*=/, {
    severity: 'warning',
    category: 'security',
    title: 'Direct HTML injection',
    detail: 'Prefer safe DOM APIs or sanitization before assigning HTML strings.'
  });

  addRegexFinding(findings, lines, /(api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/i, {
    severity: 'error',
    category: 'security',
    title: 'Possible hard-coded credential',
    detail: 'Move secrets to environment variables or a secret manager before committing.'
  });

  addRegexFinding(findings, lines, /catch\s*\([^)]*\)\s*{\s*}/, {
    severity: 'warning',
    category: 'correctness',
    title: 'Empty catch block',
    detail: 'Handle the error, rethrow it, or record why ignoring it is intentional.'
  });

  addRegexFinding(findings, lines, /console\.log\s*\(/, {
    severity: 'info',
    category: 'maintainability',
    title: 'Console logging left in code',
    detail: 'Use structured logging or remove temporary diagnostics before shipping.'
  });

  if (lines.length > 300) {
    findings.push({
      severity: 'warning',
      category: 'maintainability',
      title: 'Large file',
      detail: 'This file is large enough to make review harder. Consider splitting stable responsibilities.',
      line: 1
    });
  }

  if (
    (extension === '.ts' || extension === '.tsx' || extension === '.js' || extension === '.jsx') &&
    /setInterval\s*\(/.test(content) &&
    !/clearInterval\s*\(/.test(content)
  ) {
    findings.push({
      severity: 'warning',
      category: 'performance',
      title: 'Interval without cleanup',
      detail: 'Pair intervals with cleanup to avoid leaking work after unmount or shutdown.',
      line: firstMatchLine(lines, /setInterval\s*\(/)
    });
  }

  return findings;
}
