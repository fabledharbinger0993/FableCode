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

export interface AnthropicModel {
  id: string;
  name: string;
}

// Lesson types
export interface SliderParam {
  label: string;
  property: string;
  selector?: string;
  type: 'slider';
  min: number;
  max: number;
  default: number;
  unit: string;
  shadow_component?: 'x' | 'y' | 'blur' | 'spread';
}

export interface ColorParam {
  label: string;
  property: string;
  selector?: string;
  type: 'color';
  default: string;
  show_formats?: boolean;
  shadow_component?: 'color';
}

export interface SelectParam {
  label: string;
  property: string;
  selector?: string;
  type: 'select';
  options: string[];
  default: string;
}

export type LessonParam = SliderParam | ColorParam | SelectParam;

// Ring and pacing types
export type RingId = 'ring_1' | 'ring_2' | 'ring_3' | 'ring_4' | 'ring_5';
export type PhaseType = 'intro' | 'core' | 'translation' | 'interference' | 'synthesis' | 'finale' | 'gate';
export type DomainType = 'logic' | 'visual' | 'translation' | 'synthesis' | 'finale';
export type PacingMode = 'guided' | 'fast';

export interface PreviewContract {
  expectedStateShape: string; // JSON schema or description
  expectedVisibleChanges: string[]; // list of observable UI changes
  parityCheckRule: 'exact' | 'approximate' | 'semantic'; // how strict the equivalence is
}

export interface GateCriteria {
  correctness: number; // target score 0-100
  parity: number; // representation parity score
  translation: number; // code ↔ blocks fidelity
  debug: number; // debug recovery score
  preview: number; // preview coherence score
  passThreshold: number; // overall threshold (typically 80)
}

export interface LessonHelpScenario {
  topic: string;
  question: string;
  answer: string;
}

export interface LessonHelp {
  objective: string;
  scenarios: LessonHelpScenario[];
}

export interface Ring {
  id: RingId;
  title: string;
  concept: string;
  tagline: string;
  color: string;
  guideCount: number; // lessons in guided path
  fastCount: number; // lessons in fast path
  prerequisites: RingId[]; // rings that must be completed first
  competencies: string[]; // what learner can do after this ring
}

export interface Lesson {
  id: string;
  title: string;
  concept: string;
  html: string;
  css: string;
  parameters: LessonParam[];
  next_concept: string | null;
  sandbox?: boolean;

  // Ring-based additions
  ringId?: RingId;
  phaseType?: PhaseType;
  domainType?: DomainType;
  chapterOrder?: number; // 1-indexed position within ring

  // Pacing and equivalence
  modePathAvailable?: PacingMode | 'both'; // which paths include this lesson
  equivalentLessonId?: string; // link to logic ↔ visual equivalents
  isSkippableInGuided?: boolean; // can guided learners skip this lesson after checkpoint

  // Preview and validation
  previewContract?: PreviewContract;
  gateCriteria?: GateCriteria;

  // Metadata
  isFinale?: boolean;
  hints?: string[];
  antiPatterns?: string[];
  help?: LessonHelp;
}

export interface WorkspaceFile {
  path: string;
  size: number;
  extension: string;
}

export type FlowBlockKind =
  | 'trigger'
  | 'agent'
  | 'model'
  | 'tool'
  | 'function'
  | 'condition'
  | 'route'
  | 'memory'
  | 'file'
  | 'terminal'
  | 'git'
  | 'api'
  | 'approval'
  | 'output';

export type FlowPortKind = 'input' | 'output';

export type FlowRouteKind = 'default' | 'success' | 'failure' | 'condition' | 'ai-selected' | 'manual-approval' | 'fallback';

export interface FlowPort {
  id: string;
  name: string;
  kind: FlowPortKind;
  dataType: 'any' | 'text' | 'json' | 'file' | 'command' | 'model' | 'memory' | 'decision';
}

export interface FlowBlockPosition {
  x: number;
  y: number;
}

export interface FlowBlock {
  id: string;
  kind: FlowBlockKind;
  title: string;
  description: string;
  instructions: string;
  position: FlowBlockPosition;
  inputs: FlowPort[];
  outputs: FlowPort[];
  tags: string[];
  suggestedBy?: 'system' | 'user' | 'copilot';
}

export interface FlowRoute {
  id: string;
  fromBlockId: string;
  fromPortId: string;
  toBlockId: string;
  toPortId: string;
  label: string;
  kind: FlowRouteKind;
}

export interface FlowSuggestion {
  id: string;
  title: string;
  detail: string;
  blockKind: FlowBlockKind;
  routeKind: FlowRouteKind;
}

export interface FlowDefinition {
  id: string;
  name: string;
  goal: string;
  blocks: FlowBlock[];
  routes: FlowRoute[];
  suggestions: FlowSuggestion[];
  updatedAt: string;
}

export interface ToolchainCommand {
  name: string;
  path: string;
  source: string;
}

export type ToolkitCategory = 'ai' | 'runtime' | 'container' | 'cloud' | 'git' | 'quality' | 'data' | 'design' | 'build';
export type ToolkitStatus = 'available' | 'partial' | 'missing';
export type ToolkitSource = 'djmt' | 'system' | 'workspace' | 'vscode' | 'mcp';

export interface ToolchainSummary {
  rootPath: string;
  exists: boolean;
  activationCommand?: string;
  readme?: string;
  directories: string[];
  commands: ToolchainCommand[];
  configFiles: string[];
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
  sandboxFlow?: FlowDefinition;
  sandboxMessages?: ChatMessage[];
}

export interface ToolkitCapability {
  id: string;
  name: string;
  category: ToolkitCategory;
  summary: string;
  status: ToolkitStatus;
  sources: ToolkitSource[];
  commands: ToolchainCommand[];
  configFiles: string[];
  extensionMatches: string[];
  referencePaths: string[];
  notes: string[];
}

export interface ToolkitSummary {
  checkedAt: string;
  workspacePath?: string;
  toolchainRoot: string;
  availableCount: number;
  partialCount: number;
  missingCount: number;
  capabilities: ToolkitCapability[];
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

export interface WebSearchResult {
  query: string;
  answer: string | null;
  summary: string | null;
  sourceUrl: string | null;
  related: Array<{ text: string; url: string }>;
  error: string | null;
}

export interface FableApi {
  listModels: () => Promise<AnthropicModel[]>;
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
  webSearch: (query: string) => Promise<WebSearchResult>;
}
