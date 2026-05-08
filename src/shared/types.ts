export type AgentId = 'mojo-dojo' | 'sovern' | 'bool' | 'bane';

export interface AgentProfile {
  id: AgentId;
  name: string;
  tagline: string;
  modelHint: string;
  temperature: number;
  color: string;
  systemPrompt: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaModel {
  name: string;
  modified_at?: string;
  size?: number;
}

export interface WorkspaceFile {
  path: string;
  size: number;
  extension: string;
}

export interface ToolchainCommand {
  name: string;
  path: string;
  source: string;
}

export interface ToolchainSummary {
  rootPath: string;
  exists: boolean;
  activationCommand?: string;
  readme?: string;
  directories: string[];
  commands: ToolchainCommand[];
  configFiles: string[];
}

export type ToolkitCategory = 'ai' | 'cloud' | 'runtime' | 'quality' | 'data' | 'git' | 'design' | 'container' | 'build';

export type ToolkitStatus = 'available' | 'partial' | 'missing';

export type ToolkitSource = 'system' | 'djmt' | 'workspace' | 'vscode' | 'mcp';

export interface ToolkitCapability {
  id: string;
  name: string;
  category: ToolkitCategory;
  status: ToolkitStatus;
  summary: string;
  commands: ToolchainCommand[];
  configFiles: string[];
  extensionMatches: string[];
  referencePaths: string[];
  sources: ToolkitSource[];
  notes: string[];
}

export interface ToolkitSummary {
  checkedAt: string;
  workspacePath: string;
  toolchainRoot: string;
  availableCount: number;
  partialCount: number;
  missingCount: number;
  capabilities: ToolkitCapability[];
}

export interface DebugFinding {
  severity: 'info' | 'warning' | 'error';
  category: 'correctness' | 'security' | 'performance' | 'maintainability' | 'style';
  title: string;
  detail: string;
  line?: number;
}

export interface DebugReport {
  summary: string;
  findings: DebugFinding[];
  agentReview?: string;
}

export interface PersistenceSnapshot {
  sessionId: string;
  savedAt: string;
  agentId: AgentId;
  model: string;
  workspacePath: string;
  selectedFile: string;
  fileFilter: string;
  toolchainRoot: string;
  includeToolchainContext: boolean;
  debugFocus: string;
  messages: ChatMessage[];
}

export interface HolograimStatus {
  configured: boolean;
  serverPath: string;
  command: string;
  args: string[];
  dataPath?: string;
  databasePath?: string;
  localSnapshotPath: string;
  lastError?: string;
}

export interface PersistenceLoadResult {
  snapshot: PersistenceSnapshot | null;
  holograim: HolograimStatus;
  recall: string[];
}

export interface PersistenceSaveResult {
  saved: boolean;
  localSnapshotPath: string;
  holograimStored: boolean;
  holograimQueued?: boolean;
  holograimMemoryId?: string;
  error?: string;
}

export interface RecallResult {
  query: string;
  memories: string[];
  holograimAvailable: boolean;
  error?: string;
}

export interface FableApi {
  listModels: () => Promise<OllamaModel[]>;
  chat: (payload: { model: string; messages: ChatMessage[]; temperature?: number }) => Promise<string>;
  pickWorkspace: () => Promise<string | null>;
  listWorkspaceFiles: (workspacePath: string) => Promise<WorkspaceFile[]>;
  readWorkspaceFile: (workspacePath: string, relativePath: string) => Promise<string>;
  inspectToolchain: (rootPath?: string) => Promise<ToolchainSummary>;
  inspectToolkits: (payload?: { workspacePath?: string; toolchainRoot?: string }) => Promise<ToolkitSummary>;
  loadPersistence: () => Promise<PersistenceLoadResult>;
  savePersistence: (snapshot: PersistenceSnapshot) => Promise<PersistenceSaveResult>;
  recallPersistence: (query: string) => Promise<RecallResult>;
  getHolograimStatus: () => Promise<HolograimStatus>;
  debugAnalyze: (payload: {
    model?: string;
    agent: AgentProfile;
    filePath: string;
    content: string;
    focus: string;
    toolchainContext?: string;
  }) => Promise<DebugReport>;
}
