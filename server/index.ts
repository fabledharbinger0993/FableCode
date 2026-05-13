/**
 * FableCode companion backend server.
 *
 * Exposes the Anthropic AI endpoints over HTTP so that the Capacitor iOS app
 * (and any plain-browser deployment) can reach them without an Electron IPC
 * bridge.  Deploy this server on a Mac reachable from the device (same Wi-Fi,
 * Tailscale, or a cloud host) and point the app at it via the backend URL
 * setting.
 *
 * Endpoints mirror the Electron ipcMain handlers in src/main/main.ts:
 *
 *   GET  /anthropic/models
 *   POST /anthropic/chat      { model, messages, temperature? }
 *   POST /debug/analyze       { model?, agent, filePath, content, focus, toolchainContext? }
 *
 * Start:  node dist/server/index.js
 * Dev:    npx ts-node --project server/tsconfig.json server/index.ts
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import type { AgentProfile, AnthropicModel, ChatMessage, DebugFinding, DebugReport, WorkspaceFile } from '../src/shared/types';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const PORT = Number(process.env.PORT ?? 3333);

const ANTHROPIC_MODELS: AnthropicModel[] = [
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-3-5', name: 'Claude Haiku 3.5' },
  { id: 'claude-opus-4', name: 'Claude Opus 4' }
];

const textExtensions = new Set([
  '.c', '.cc', '.cpp', '.cs', '.css', '.go', '.h', '.hpp', '.html', '.java', '.js', '.json', '.jsx',
  '.kt', '.md', '.mjs', '.py', '.rb', '.rs', '.scss', '.sh', '.sql', '.swift', '.toml', '.ts', '.tsx',
  '.txt', '.vue', '.xml', '.yaml', '.yml'
]);

const MAX_FILES = 500;
const MAX_READ_BYTES = 1024 * 1024;

const ignoredDirectories = new Set([
  '.git', '.next', '.turbo', '.vite', 'build', 'coverage', 'dist', 'node_modules', 'out', 'target'
]);

// ── Express setup ─────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json({ limit: '4mb' }));

// ── Routes ────────────────────────────────────────────────────────────────

app.get('/anthropic/models', (_req: Request, res: Response) => {
  res.json(ANTHROPIC_MODELS);
});

app.post('/anthropic/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { model, messages, temperature } = req.body as {
      model: string;
      messages: ChatMessage[];
      temperature?: number;
    };

    if (!model) {
      res.status(400).json({ error: 'model is required' });
      return;
    }

    const result = await postAnthropicChat(model, messages, temperature);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/debug/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as {
      model?: string;
      agent: AgentProfile;
      filePath: string;
      content: string;
      focus: string;
      toolchainContext?: string;
    };

    if (!payload.model || !ANTHROPIC_API_KEY) {
      res.json('');
      return;
    }

    const reviewPrompt = [
      'Act as a Sourcery-style automated debugging and code-review assistant.',
      'Prioritize concrete bugs, risky behavior, security issues, performance traps, maintainability problems, and missing tests.',
      'Give actionable fixes. Avoid generic praise. Keep the answer compact.',
      `Focus: ${payload.focus || 'general review'}`,
      `File: ${payload.filePath}`,
      payload.toolchainContext ? `Available local toolchain:\n${payload.toolchainContext}` : '',
      'Code:',
      '```',
      payload.content.slice(0, 20000),
      '```'
    ].filter(Boolean).join('\n');

    const agentReview = await postAnthropicChat(payload.model, [
      { role: 'system', content: payload.agent.systemPrompt },
      { role: 'user', content: reviewPrompt }
    ], payload.agent.temperature);

    res.json(agentReview);
  } catch (error) {
    next(error);
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    anthropicConfigured: ANTHROPIC_API_KEY.length > 0,
    models: ANTHROPIC_MODELS.map((m) => m.id)
  });
});

app.post('/workspace/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspacePath } = req.body as { workspacePath: string };
    if (!workspacePath) {
      res.status(400).json({ error: 'workspacePath is required' });
      return;
    }

    const files = await listWorkspaceFiles(workspacePath);
    res.json(files);
  } catch (error) {
    next(error);
  }
});

app.post('/workspace/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspacePath, relativePath } = req.body as { workspacePath: string; relativePath: string };
    if (!workspacePath || !relativePath) {
      res.status(400).json({ error: 'workspacePath and relativePath are required' });
      return;
    }

    const root = path.resolve(workspacePath);
    const target = path.resolve(root, relativePath);
    if (!target.startsWith(root)) {
      res.status(403).json({ error: 'Refusing to read outside the selected workspace.' });
      return;
    }

    const stat = await fs.stat(target);
    if (stat.size > MAX_READ_BYTES) {
      res.status(413).json({ error: 'File is too large to preview.' });
      return;
    }

    const content = await fs.readFile(target, 'utf8');
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// ── Error handler ─────────────────────────────────────────────────────────

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('[server]', message);
  res.status(500).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`FableCode backend listening on http://localhost:${PORT}`);
  if (!ANTHROPIC_API_KEY) {
    console.warn('[server] ANTHROPIC_API_KEY is not set — chat and debug review will fail.');
  }
});

// ── Workspace helpers ─────────────────────────────────────────────────────

async function listWorkspaceFiles(workspacePath: string): Promise<WorkspaceFile[]> {
  const root = path.resolve(workspacePath);
  const files: WorkspaceFile[] = [];
  await walk(root, root, files);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function walk(root: string, current: string, files: WorkspaceFile[]): Promise<void> {
  if (files.length >= MAX_FILES) return;

  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (files.length >= MAX_FILES) return;

    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walk(root, fullPath, files);
      }
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension)) continue;

    const stat = await fs.stat(fullPath);
    if (stat.size > MAX_READ_BYTES) continue;

    files.push({
      path: path.relative(root, fullPath).split(path.sep).join('/'),
      size: stat.size,
      extension
    });
  }
}

// ── Anthropic helper ─────────────────────────────────────────────────────

async function postAnthropicChat(model: string, messages: ChatMessage[], temperature = 0.2): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set on the backend server.');
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const systemMsg = messages.find((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system') as Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature,
    ...(systemMsg ? { system: systemMsg.content } : {}),
    messages: conversationMessages
  });

  const block = response.content[0];
  return block?.type === 'text' ? block.text : '';
}

// ── Local debug scan helpers (mirrored from src/main/main.ts) ─────────────
//
// Kept here so the /debug/analyze endpoint can include the local findings in
// the server-side summary if needed in future iterations.

export function runServerDebugScan(filePath: string, content: string): DebugFinding[] {
  const findings: DebugFinding[] = [];
  const lines = content.split(/\r?\n/);
  const extension = path.extname(filePath).toLowerCase();

  if (!textExtensions.has(extension)) {
    return findings;
  }

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

function firstMatchLine(lines: string[], pattern: RegExp): number | undefined {
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : undefined;
}
