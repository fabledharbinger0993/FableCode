/**
 * FableCode companion backend server.
 *
 * Exposes the Groq AI endpoints over HTTP so that the Capacitor iOS app
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
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs/promises';
import Groq from 'groq-sdk';
import https from 'node:https';
import type { AgentProfile, AnthropicModel, ChatMessage, DebugFinding, DebugReport, WebSearchResult, WorkspaceFile } from '../src/shared/types';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
// Also try the project root (when running from compiled dist/server/server/index.js
// the previous join lands inside dist/, which never holds a .env file).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
const PORT = Number(process.env.PORT ?? 3333);

const GROQ_MODELS: AnthropicModel[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant',    name: 'Llama 3.1 8B'  },
  { id: 'mixtral-8x7b-32768',      name: 'Mixtral 8x7B'  },
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

// Rate limiter for file-system routes — prevents enumeration of the host filesystem.
const filesystemLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many file-system requests, please slow down.' }
});

// ── Routes ────────────────────────────────────────────────────────────────

app.get('/anthropic/models', (_req: Request, res: Response) => {
  res.json(GROQ_MODELS);
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

    if (!payload.model || !GROQ_API_KEY) {
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
    groqConfigured: GROQ_API_KEY.length > 0,
    models: GROQ_MODELS.map((m) => m.id)
  });
});

app.post('/workspace/files', filesystemLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspacePath } = req.body as { workspacePath: string };
    if (!workspacePath) {
      res.status(400).json({ error: 'workspacePath is required' });
      return;
    }

    // Reject relative paths to prevent traversal attacks.
    if (!path.isAbsolute(workspacePath)) {
      res.status(400).json({ error: 'workspacePath must be an absolute path.' });
      return;
    }

    const files = await listWorkspaceFiles(workspacePath);
    res.json(files);
  } catch (error) {
    next(error);
  }
});

app.post('/workspace/read', filesystemLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspacePath, relativePath } = req.body as { workspacePath: string; relativePath: string };
    if (!workspacePath || !relativePath) {
      res.status(400).json({ error: 'workspacePath and relativePath are required' });
      return;
    }

    // Reject relative workspace roots to prevent traversal attacks.
    if (!path.isAbsolute(workspacePath)) {
      res.status(400).json({ error: 'workspacePath must be an absolute path.' });
      return;
    }

    const root = path.resolve(workspacePath);
    const target = path.resolve(root, relativePath);

    // Ensure target is strictly inside root (append sep to prevent /foo matching /foobar).
    if (!target.startsWith(root + path.sep) && target !== root) {
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

app.post('/web/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body as { query: string };
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query is required' });
      return;
    }
    const result = await duckduckgoSearch(query);
    res.json(result);
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
  if (!GROQ_API_KEY) {
    console.warn('[server] GROQ_API_KEY is not set — chat and debug review will fail.');
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
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set on the backend server.');
  }

  const client = new Groq({ apiKey: GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    temperature,
    messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  });

  return response.choices[0]?.message?.content ?? '';
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

// ── DuckDuckGo Instant Answers ────────────────────────────────────────────

interface DDGTopic { Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }
interface DDGResponse { Answer?: string; AbstractText?: string; AbstractURL?: string; RelatedTopics?: DDGTopic[] }

async function duckduckgoSearch(query: string): Promise<WebSearchResult> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  return new Promise<WebSearchResult>((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'FableCode/0.1' } }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8');
          const data = JSON.parse(raw) as DDGResponse;
          const related: Array<{ text: string; url: string }> = [];
          for (const topic of data.RelatedTopics ?? []) {
            if (topic.Text && topic.FirstURL) related.push({ text: topic.Text, url: topic.FirstURL });
            for (const sub of topic.Topics ?? []) {
              if (sub.Text && sub.FirstURL) related.push({ text: sub.Text, url: sub.FirstURL });
            }
            if (related.length >= 8) break;
          }
          resolve({
            query,
            answer: data.Answer || null,
            summary: data.AbstractText || null,
            sourceUrl: data.AbstractURL || null,
            related: related.slice(0, 8),
            error: null
          });
        } catch (error) {
          resolve({ query, answer: null, summary: null, sourceUrl: null, related: [], error: error instanceof Error ? error.message : 'parse failed' });
        }
      });
    });
    req.on('error', (error) => {
      resolve({ query, answer: null, summary: null, sourceUrl: null, related: [], error: error.message });
    });
    req.setTimeout(8000, () => {
      req.destroy(new Error('DuckDuckGo request timed out'));
    });
  });
}
