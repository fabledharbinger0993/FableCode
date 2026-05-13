import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

// Load .env — app.getAppPath() always resolves to the Scaffold/ root in Electron
const dotenvResult = dotenv.config({ path: path.join(app.getAppPath(), '.env') });
if (dotenvResult.error) {
  console.warn('[dotenv] .env not loaded:', dotenvResult.error.message);
}
import { registerPersistenceHandlers } from './persistence';
import { inspectToolkits } from './toolkits';
import type { AgentProfile, AnthropicModel, ChatMessage, DebugFinding, DebugReport, ToolkitSummary, ToolchainCommand, ToolchainSummary, WorkspaceFile } from '../shared/types';

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
const ANTHROPIC_MODELS: AnthropicModel[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant',    name: 'Llama 3.1 8B'  },
  { id: 'mixtral-8x7b-32768',      name: 'Mixtral 8x7B'  },
];
const DEFAULT_TOOLCHAIN_ROOT = '/Volumes/DJMT/FABLEDHARBINGER/toolchains';
const MAX_FILES = 500;
const MAX_READ_BYTES = 1024 * 1024;

const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'target'
]);

const textExtensions = new Set([
  '.c', '.cc', '.cpp', '.cs', '.css', '.go', '.h', '.hpp', '.html', '.java', '.js', '.json', '.jsx',
  '.kt', '.md', '.mjs', '.py', '.rb', '.rs', '.scss', '.sh', '.sql', '.swift', '.toml', '.ts', '.tsx',
  '.txt', '.vue', '.xml', '.yaml', '.yml'
]);

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    title: 'FableCode',
    backgroundColor: '#111318',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl).catch((error: unknown) => {
      console.error('Failed to load development server:', error);
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch((error: unknown) => {
    console.error('Failed to load packaged renderer:', error);
  });
}

void (async () => {
  await app.whenReady();
  registerPersistenceHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
})();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('anthropic:listModels', async (): Promise<AnthropicModel[]> => {
  return ANTHROPIC_MODELS;
});

ipcMain.handle('anthropic:chat', async (_event: IpcMainInvokeEvent, payload: { model: string; messages: ChatMessage[]; temperature?: number }) => {
  return postAnthropicChat(payload.model, payload.messages, payload.temperature);
});

ipcMain.handle('workspace:pick', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Open a workspace for FableCode'
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('workspace:listFiles', async (_event: IpcMainInvokeEvent, workspacePath: string): Promise<WorkspaceFile[]> => {
  return listWorkspaceFiles(workspacePath);
});

ipcMain.handle('workspace:readFile', async (_event: IpcMainInvokeEvent, payload: { workspacePath: string; relativePath: string }): Promise<string> => {
  const root = path.resolve(payload.workspacePath);
  const target = path.resolve(root, payload.relativePath);
  if (!target.startsWith(root)) {
    throw new Error('Refusing to read outside the selected workspace.');
  }

  const stat = await fs.stat(target);
  if (stat.size > MAX_READ_BYTES) {
    throw new Error('File is too large to preview in FableCode.');
  }

  return fs.readFile(target, 'utf8');
});

ipcMain.handle('toolchain:inspect', async (_event: IpcMainInvokeEvent, rootPath?: string): Promise<ToolchainSummary> => {
  return inspectToolchain(rootPath || DEFAULT_TOOLCHAIN_ROOT);
});

ipcMain.handle('toolkits:inspect', async (_event: IpcMainInvokeEvent, payload?: { workspacePath?: string; toolchainRoot?: string }): Promise<ToolkitSummary> => {
  return inspectToolkits(payload?.workspacePath, payload?.toolchainRoot || DEFAULT_TOOLCHAIN_ROOT);
});

ipcMain.handle('debug:analyze', async (_event: IpcMainInvokeEvent, payload: {
  model?: string;
  agent: AgentProfile;
  filePath: string;
  content: string;
  focus: string;
  toolchainContext?: string;
}): Promise<DebugReport> => {
  const findings = runLocalDebugScan(payload.filePath, payload.content);
  const findingWord = findings.length === 1 ? 'finding' : 'findings';
  const report: DebugReport = {
    summary: findings.length === 0
      ? 'No high-signal local findings were detected. Use the model review for deeper reasoning.'
      : `${findings.length} local ${findingWord} detected across correctness, security, performance, and maintainability.`,
    findings
  };

  if (!payload.model) {
    return report;
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
  ].join('\n');

  try {
    report.agentReview = await postAnthropicChat(payload.model, [
      { role: 'system', content: payload.agent.systemPrompt },
      { role: 'user', content: reviewPrompt }
    ], payload.agent.temperature);
  } catch (error) {
    report.agentReview = `Groq review unavailable: ${error instanceof Error ? error.message : 'unknown error'}`;
  }

  return report;
});

async function postAnthropicChat(model: string, messages: ChatMessage[], temperature = 0.2): Promise<string> {
  if (!model) {
    throw new Error('Choose a Groq model before sending a request.');
  }
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Add it to your .env file.');
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

async function listWorkspaceFiles(workspacePath: string): Promise<WorkspaceFile[]> {
  const root = path.resolve(workspacePath);
  const files: WorkspaceFile[] = [];
  await walk(root, root, files);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function walk(root: string, current: string, files: WorkspaceFile[]): Promise<void> {
  if (files.length >= MAX_FILES) {
    return;
  }

  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (files.length >= MAX_FILES) {
      return;
    }

    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walk(root, fullPath, files);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension)) {
      continue;
    }

    const stat = await fs.stat(fullPath);
    if (stat.size > MAX_READ_BYTES) {
      continue;
    }

    files.push({
      path: path.relative(root, fullPath).split(path.sep).join('/'),
      size: stat.size,
      extension
    });
  }
}

async function inspectToolchain(rootPath: string): Promise<ToolchainSummary> {
  const root = path.resolve(rootPath);
  const summary: ToolchainSummary = {
    rootPath: root,
    exists: false,
    directories: [],
    commands: [],
    configFiles: []
  };

  try {
    const rootStat = await fs.stat(root);
    if (!rootStat.isDirectory()) {
      return summary;
    }

    summary.exists = true;
    summary.activationCommand = `source ${path.join(root, 'config/djmt-toolchains.zsh')}`;
    summary.directories = await listChildDirectories(root);
    summary.commands = await listToolchainCommands(root);
    summary.configFiles = await listToolchainConfigFiles(root);

    const readmePath = path.join(root, 'README.md');
    try {
      summary.readme = await fs.readFile(readmePath, 'utf8');
    } catch {
      summary.readme = undefined;
    }
  } catch {
    return summary;
  }

  return summary;
}

async function listChildDirectories(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function listToolchainCommands(root: string): Promise<ToolchainCommand[]> {
  const commandRoots = [
    { source: 'bin', fullPath: path.join(root, 'bin') },
    { source: 'npm-global/bin', fullPath: path.join(root, 'npm-global/bin') },
    { source: 'pnpm', fullPath: path.join(root, 'pnpm') }
  ];
  const commands: ToolchainCommand[] = [];

  for (const commandRoot of commandRoots) {
    try {
      const entries = await fs.readdir(commandRoot.fullPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.name.startsWith('.') && (entry.isFile() || entry.isSymbolicLink())) {
          commands.push({
            name: entry.name,
            path: path.join(commandRoot.fullPath, entry.name),
            source: commandRoot.source
          });
        }
      }
    } catch {
      // Missing command roots are expected while the depot is still being filled.
    }
  }

  commands.sort((left, right) => left.name.localeCompare(right.name));
  return commands.slice(0, 160);
}

async function listToolchainConfigFiles(root: string): Promise<string[]> {
  const configRoot = path.join(root, 'config');
  try {
    const entries = await fs.readdir(configRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
      .map((entry) => path.relative(root, path.join(configRoot, entry.name)).split(path.sep).join('/'))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function runLocalDebugScan(filePath: string, content: string): DebugFinding[] {
  const findings: DebugFinding[] = [];
  const lines = content.split(/\r?\n/);
  const extension = path.extname(filePath).toLowerCase();

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

  if ((extension === '.ts' || extension === '.tsx' || extension === '.js' || extension === '.jsx') && /setInterval\s*\(/.test(content) && !/clearInterval\s*\(/.test(content)) {
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
