import { contextBridge, ipcRenderer } from 'electron';
import type {
  AgentProfile,
  ChatMessage,
  DebugReport,
  HolograimStatus,
  OllamaModel,
  PersistenceLoadResult,
  PersistenceSaveResult,
  PersistenceSnapshot,
  RecallResult,
  ToolkitSummary,
  ToolchainSummary,
  WorkspaceFile
} from '../shared/types';

const api = {
  listModels: (): Promise<OllamaModel[]> => ipcRenderer.invoke('ollama:listModels'),
  chat: (payload: { model: string; messages: ChatMessage[]; temperature?: number }): Promise<string> =>
    ipcRenderer.invoke('ollama:chat', payload),
  pickWorkspace: (): Promise<string | null> => ipcRenderer.invoke('workspace:pick'),
  listWorkspaceFiles: (workspacePath: string): Promise<WorkspaceFile[]> =>
    ipcRenderer.invoke('workspace:listFiles', workspacePath),
  readWorkspaceFile: (workspacePath: string, relativePath: string): Promise<string> =>
    ipcRenderer.invoke('workspace:readFile', { workspacePath, relativePath }),
  inspectToolchain: (rootPath?: string): Promise<ToolchainSummary> => ipcRenderer.invoke('toolchain:inspect', rootPath),
  inspectToolkits: (payload?: { workspacePath?: string; toolchainRoot?: string }): Promise<ToolkitSummary> =>
    ipcRenderer.invoke('toolkits:inspect', payload),
  loadPersistence: (): Promise<PersistenceLoadResult> => ipcRenderer.invoke('persistence:load'),
  savePersistence: (snapshot: PersistenceSnapshot): Promise<PersistenceSaveResult> =>
    ipcRenderer.invoke('persistence:save', snapshot),
  recallPersistence: (query: string): Promise<RecallResult> => ipcRenderer.invoke('persistence:recall', query),
  getHolograimStatus: (): Promise<HolograimStatus> => ipcRenderer.invoke('persistence:holograimStatus'),
  debugAnalyze: (payload: {
    model?: string;
    agent: AgentProfile;
    filePath: string;
    content: string;
    focus: string;
    toolchainContext?: string;
  }): Promise<DebugReport> => ipcRenderer.invoke('debug:analyze', payload)
};

contextBridge.exposeInMainWorld('fable', api);
