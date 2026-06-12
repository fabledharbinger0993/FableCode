import { app, ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  HolograimStatus,
  PersistenceLoadResult,
  PersistenceSaveResult,
  PersistenceSnapshot,
  RecallResult
} from '../shared/types';

const HOLOGRAIM_SERVER_PATH = process.env.HOLOGRAIM_MCP_SERVER
  ?? '/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/server.py';
const HOLOGRAIM_COMMAND = process.env.HOLOGRAIM_MCP_COMMAND
  ?? '/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/.venv/bin/python';
const SNAPSHOT_FILE_NAME = 'fablecode-session.json';
const MCP_TIMEOUT_MS = 45000;
const HOLOGRAIM_SYNC_INTERVAL_MS = 30000;

let holograimSyncInFlight = false;
let lastHolograimSyncAt = 0;
let lastHolograimSignature = '';

type JsonRpcResponse = {
  id?: number;
  result?: unknown;
  error?: { message?: string; code?: number; data?: unknown };
};

type HolograimToolResult = {
  content?: Array<{ type?: string; text?: string }>;
  isError?: boolean;
};

export function registerPersistenceHandlers(): void {
  ipcMain.handle('persistence:load', async (): Promise<PersistenceLoadResult> => loadPersistence());
  ipcMain.handle('persistence:save', async (_event, snapshot: PersistenceSnapshot): Promise<PersistenceSaveResult> => savePersistence(snapshot));
  ipcMain.handle('persistence:recall', async (_event, query: string): Promise<RecallResult> => recallPersistence(query));
  ipcMain.handle('persistence:holograimStatus', async (): Promise<HolograimStatus> => getHolograimStatus());
}

async function loadPersistence(): Promise<PersistenceLoadResult> {
  const status = await getHolograimStatus();
  const snapshot = await readLocalSnapshot();

  return { snapshot, holograim: status, recall: [] };
}

async function savePersistence(snapshot: PersistenceSnapshot): Promise<PersistenceSaveResult> {
  const snapshotPath = getSnapshotPath();
  await ensurePersistenceDirectory();
  await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');

  const result: PersistenceSaveResult = {
    saved: true,
    localSnapshotPath: snapshotPath,
    holograimStored: false
  };

  const status = await getHolograimStatus();
  if (!status.configured) {
    result.error = status.lastError;
    return result;
  }

  if (shouldQueueHolograimSync(snapshot)) {
    result.holograimQueued = true;
    queueHolograimSync(snapshot);
  }

  return result;
}

async function recallPersistence(query: string): Promise<RecallResult> {
  const status = await getHolograimStatus();
  if (!status.configured) {
    return {
      query,
      memories: [],
      holograimAvailable: false,
      error: status.lastError
    };
  }

  try {
    return {
      query,
      memories: await recallHolograim(query, 8),
      holograimAvailable: true
    };
  } catch (error) {
    return {
      query,
      memories: [],
      holograimAvailable: false,
      error: error instanceof Error ? error.message : 'Unable to query Holograim.'
    };
  }
}

async function getHolograimStatus(): Promise<HolograimStatus> {
  const localSnapshotPath = getSnapshotPath();
  const serverPath = path.resolve(HOLOGRAIM_SERVER_PATH);
  const dataPath = path.join(path.dirname(serverPath), 'data');
  const databasePath = path.join(dataPath, 'holograim.db');

  try {
    const stat = await fs.stat(serverPath);
    if (!stat.isFile()) {
      return {
        configured: false,
        serverPath,
        command: HOLOGRAIM_COMMAND,
        args: [serverPath],
        dataPath,
        databasePath,
        localSnapshotPath,
        lastError: 'Holograim server path is not a file.'
      };
    }

    if (path.isAbsolute(HOLOGRAIM_COMMAND)) {
      await fs.access(HOLOGRAIM_COMMAND);
    }

    return {
      configured: true,
      serverPath,
      command: HOLOGRAIM_COMMAND,
      args: [serverPath],
      dataPath,
      databasePath,
      localSnapshotPath
    };
  } catch (error) {
    return {
      configured: false,
      serverPath,
      command: HOLOGRAIM_COMMAND,
      args: [serverPath],
      dataPath,
      databasePath,
      localSnapshotPath,
      lastError: error instanceof Error ? error.message : 'Holograim server was not found.'
    };
  }
}

async function readLocalSnapshot(): Promise<PersistenceSnapshot | null> {
  try {
    const raw = await fs.readFile(getSnapshotPath(), 'utf8');
    return JSON.parse(raw) as PersistenceSnapshot;
  } catch {
    return null;
  }
}

async function recallHolograim(query: string, topK: number): Promise<string[]> {
  const toolResult = await callHolograimTool('query_memory', {
    query,
    top_k: topK,
    holographic: true,
    min_confidence: 0.2
  });
  const parsed = parseToolText(toolResult);
  const results = Array.isArray(parsed?.results) ? parsed.results : [];

  return results
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return '';
      }
      const record = item as { content?: unknown; text?: unknown; id?: unknown; similarity_score?: unknown };
      let content = '';
      if (typeof record.content === 'string') {
        content = record.content;
      } else if (typeof record.text === 'string') {
        content = record.text;
      }
      const score = typeof record.similarity_score === 'number' ? ` (${record.similarity_score.toFixed(2)})` : '';
      const id = typeof record.id === 'string' ? `[${record.id}] ` : '';
      return content ? `${id}${content}${score}` : '';
    })
    .filter(Boolean)
    .slice(0, topK);
}

function shouldQueueHolograimSync(snapshot: PersistenceSnapshot): boolean {
  if (holograimSyncInFlight || snapshot.messages.length === 0) {
    return false;
  }

  const latestMessage = snapshot.messages.at(-1);
  const signature = [
    snapshot.sessionId,
    snapshot.messages.length,
    latestMessage?.role ?? '',
    latestMessage?.content.slice(0, 140) ?? ''
  ].join('|');
  const now = Date.now();

  if (signature === lastHolograimSignature || now - lastHolograimSyncAt < HOLOGRAIM_SYNC_INTERVAL_MS) {
    return false;
  }

  return true;
}

function commitHolograimSyncCheckpoint(snapshot: PersistenceSnapshot): void {
  const latestMessage = snapshot.messages.at(-1);
  lastHolograimSignature = [
    snapshot.sessionId,
    snapshot.messages.length,
    latestMessage?.role ?? '',
    latestMessage?.content.slice(0, 140) ?? ''
  ].join('|');
  lastHolograimSyncAt = Date.now();
}

function queueHolograimSync(snapshot: PersistenceSnapshot): void {
  holograimSyncInFlight = true;
  commitHolograimSyncCheckpoint(snapshot);
  storeSnapshotInHolograim(snapshot).finally(() => {
    holograimSyncInFlight = false;
  });
}

async function storeSnapshotInHolograim(snapshot: PersistenceSnapshot): Promise<void> {
  try {
    const status = await getHolograimStatus();
    if (!status.configured) {
      return;
    }

    await callHolograimTool('store_memory', {
      content: formatSnapshotForMemory(snapshot),
      confidence: 0.82,
      source: 'FableCode',
      tags: ['fablecode', 'session', 'workspace', snapshot.agentId, snapshot.workspacePath ? 'workspace-context' : 'no-workspace'],
      flag_important: true
    });
  } catch (error) {
    console.warn('Holograim background sync failed:', error);
  }
}

async function callHolograimTool(name: string, args: Record<string, unknown>): Promise<HolograimToolResult> {
  const serverPath = path.resolve(HOLOGRAIM_SERVER_PATH);
  await fs.access(serverPath);

  return new Promise((resolve, reject) => {
    const child = spawn(HOLOGRAIM_COMMAND, [serverPath], {
      cwd: path.dirname(serverPath),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    let nextId = 1;
    const initializeId = nextId++;
    const toolCallId = nextId++;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error(`Holograim MCP call timed out. ${stderr.trim()}`.trim()));
      }
    }, MCP_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
      const response = extractResponse(stdout, toolCallId);
      if (response && !settled) {
        settled = true;
        clearTimeout(timeout);
        child.kill();
        if (response.error) {
          reject(new Error(response.error.message ?? `MCP error ${response.error.code ?? ''}`));
          return;
        }
        resolve(response.result as HolograimToolResult);
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(error);
      }
    });

    child.on('exit', () => {
      if (!settled) {
        const response = extractResponse(stdout, toolCallId);
        settled = true;
        clearTimeout(timeout);
        if (response?.result) {
          resolve(response.result as HolograimToolResult);
        } else {
          reject(new Error(`Holograim MCP exited before returning a tool result. ${stderr.trim()}`.trim()));
        }
      }
    });

    writeJsonRpc(child.stdin, { jsonrpc: '2.0', id: initializeId, method: 'initialize', params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'FableCode', version: '0.1.0' }
    } });
    writeJsonRpc(child.stdin, { jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
    writeJsonRpc(child.stdin, { jsonrpc: '2.0', id: toolCallId, method: 'tools/call', params: { name, arguments: args } });
  });
}

function writeJsonRpc(stdin: NodeJS.WritableStream, payload: unknown): void {
  stdin.write(`${JSON.stringify(payload)}\n`);
}

function extractResponse(buffer: string, responseId: number): JsonRpcResponse | null {
  const lines = buffer.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as JsonRpcResponse;
      if (parsed.id === responseId) {
        return parsed;
      }
    } catch {
      // Non-JSON lines (server logs, partial chunks) are expected. Keep scanning.
      continue;
    }
  }

  return null;
}

function parseToolText(toolResult: HolograimToolResult): Record<string, unknown> | null {
  const text = toolResult.content?.find((item) => item.type === 'text')?.text;
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { text };
  }
}

function formatSnapshotForMemory(snapshot: PersistenceSnapshot): string {
  const recentMessages = snapshot.messages.slice(-8).map((message) => `${message.role}: ${message.content.slice(0, 900)}`).join('\n\n');
  return [
    'FableCode session snapshot for cross-session recall.',
    `Session: ${snapshot.sessionId}`,
    `Saved: ${snapshot.savedAt}`,
    `Agent: ${snapshot.agentId}`,
    `Model: ${snapshot.model || 'unset'}`,
    `Workspace: ${snapshot.workspacePath || 'none'}`,
    `Selected file: ${snapshot.selectedFile || 'none'}`,
    `Toolchain root: ${snapshot.toolchainRoot || 'none'}`,
    `Debug focus: ${snapshot.debugFocus}`,
    recentMessages ? `Recent conversation:\n${recentMessages}` : 'Recent conversation: none'
  ].join('\n');
}

async function ensurePersistenceDirectory(): Promise<void> {
  await fs.mkdir(getPersistenceDirectory(), { recursive: true });
}

function getPersistenceDirectory(): string {
  return path.join(app.getPath('userData'), 'persistence');
}

function getSnapshotPath(): string {
  return path.join(getPersistenceDirectory(), SNAPSHOT_FILE_NAME);
}
