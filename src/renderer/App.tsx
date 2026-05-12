import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  Bot,
  Bug,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FolderOpen,
  GitBranch,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  RefreshCw,
  Route,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Boxes,
  TerminalSquare,
  Wand2,
  Waypoints,
  Workflow,
  Wrench
} from 'lucide-react';
import { AGENT_PROFILES, DEFAULT_AGENT_ID } from '../shared/agents';
import type {
  AgentId,
  ChatMessage,
  DebugReport,
  AnthropicModel,
  FableApi,
  FlowBlock,
  FlowBlockKind,
  FlowDefinition,
  FlowRouteKind,
  HolograimStatus,
  PersistenceSnapshot,
  ToolkitCapability,
  ToolkitSummary,
  ToolchainSummary,
  WorkspaceFile
} from '../shared/types';
import LearnPanel from './LearnPanel';

const quickPrompts = [
  'Plan the next implementation step.',
  'Review this file for risks and missing tests.',
  'Suggest a minimal refactor that preserves behavior.',
  'Write a clear commit summary for these changes.'
];

const defaultToolchainRoot = '/Volumes/DJMT/FABLEDHARBINGER/toolchains';
const makeSessionId = () => `fablecode-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const makeFlowId = () => `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const makeBlockId = (kind: FlowBlockKind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

type SandboxTemplate = Omit<FlowBlock, 'id' | 'position' | 'suggestedBy'> & {
  accent: string;
};

const port = (id: string, name: string, kind: 'input' | 'output', dataType: FlowBlock['inputs'][number]['dataType']) => ({
  id,
  name,
  kind,
  dataType
});

const sandboxBlockTemplates: SandboxTemplate[] = [
  {
    kind: 'trigger',
    title: 'Intent Trigger',
    description: 'Starts the builder flow from a user goal, file change, schedule, or manual run.',
    instructions: 'Capture the goal and normalize it into a compact build brief.',
    tags: ['entry', 'goal'],
    accent: '#31caff',
    inputs: [],
    outputs: [port('brief', 'Brief', 'output', 'text')]
  },
  {
    kind: 'agent',
    title: 'Agent Reasoning',
    description: 'Delegates planning, review, or implementation reasoning to the selected FableCode agent.',
    instructions: 'Use the active agent profile and local context to produce the next build decision.',
    tags: ['copilot', 'agent'],
    accent: '#e05a47',
    inputs: [port('context', 'Context', 'input', 'text')],
    outputs: [port('decision', 'Decision', 'output', 'decision')]
  },
  {
    kind: 'tool',
    title: 'Toolkit Action',
    description: 'Calls into DJMT, VS Code, GitHub, browser automation, cloud, database, or test tooling.',
    instructions: 'Choose the least risky local tool and report exact inputs and outputs.',
    tags: ['toolchain', 'skills'],
    accent: '#2f8f83',
    inputs: [port('request', 'Request', 'input', 'text')],
    outputs: [port('result', 'Result', 'output', 'json')]
  },
  {
    kind: 'condition',
    title: 'Route Gate',
    description: 'Branches the pathway based on pass/fail checks, user choice, confidence, or missing context.',
    instructions: 'Evaluate the prior result and choose one clearly labeled route.',
    tags: ['branch', 'decision'],
    accent: '#b66a1f',
    inputs: [port('signal', 'Signal', 'input', 'decision')],
    outputs: [port('pass', 'Pass', 'output', 'decision'), port('fallback', 'Fallback', 'output', 'decision')]
  },
  {
    kind: 'function',
    title: 'Function Draft',
    description: 'Defines a reusable function, command wrapper, schema transform, or prompt utility.',
    instructions: 'Draft the function signature, inputs, output contract, and verification notes.',
    tags: ['code', 'function'],
    accent: '#4f6bed',
    inputs: [port('spec', 'Spec', 'input', 'text')],
    outputs: [port('function', 'Function', 'output', 'text')]
  },
  {
    kind: 'memory',
    title: 'Holograim Recall',
    description: 'Pulls session memory, durable references, and prior decisions into the active pathway.',
    instructions: 'Query memory for constraints, previous decisions, and reference paths relevant to this block.',
    tags: ['memory', 'context'],
    accent: '#b45cff',
    inputs: [port('query', 'Query', 'input', 'text')],
    outputs: [port('memory', 'Memory', 'output', 'memory')]
  },
  {
    kind: 'file',
    title: 'Workspace File',
    description: 'Reads or stages file context from the selected workspace for the agent or tool chain.',
    instructions: 'Select the relevant file set and summarize only the context needed downstream.',
    tags: ['workspace', 'files'],
    accent: '#9edfff',
    inputs: [port('path', 'Path', 'input', 'file')],
    outputs: [port('content', 'Content', 'output', 'text')]
  },
  {
    kind: 'terminal',
    title: 'Terminal Check',
    description: 'Runs a build, test, lint, or setup command through the local development toolchain.',
    instructions: 'Specify command, working directory, expected signal, and failure recovery path.',
    tags: ['verify', 'terminal'],
    accent: '#c6f36d',
    inputs: [port('command', 'Command', 'input', 'command')],
    outputs: [port('output', 'Output', 'output', 'text')]
  },
  {
    kind: 'approval',
    title: 'Human Approval',
    description: 'Pauses the pathway for a user decision before risky edits, deletes, deploys, or commits.',
    instructions: 'Ask one concise approval question and list the concrete action that will follow.',
    tags: ['gate', 'human'],
    accent: '#ffd166',
    inputs: [port('request', 'Request', 'input', 'text')],
    outputs: [port('approved', 'Approved', 'output', 'decision')]
  },
  {
    kind: 'output',
    title: 'Delivery Output',
    description: 'Packages the final answer, artifact, commit summary, or deployment handoff.',
    instructions: 'Produce the final user-facing result and include verification status.',
    tags: ['finish', 'handoff'],
    accent: '#ff6b9e',
    inputs: [port('result', 'Result', 'input', 'any')],
    outputs: []
  }
];

function templateForKind(kind: FlowBlockKind): SandboxTemplate {
  return sandboxBlockTemplates.find((template) => template.kind === kind) ?? sandboxBlockTemplates[0];
}

function createSandboxBlock(
  template: SandboxTemplate,
  position: FlowBlock['position'],
  suggestedBy: FlowBlock['suggestedBy'] = 'user'
): FlowBlock {
  return {
    id: makeBlockId(template.kind),
    kind: template.kind,
    title: template.title,
    description: template.description,
    instructions: template.instructions,
    position,
    inputs: template.inputs,
    outputs: template.outputs,
    tags: template.tags,
    suggestedBy
  };
}

function createStarterFlow(): FlowDefinition {
  const trigger = createSandboxBlock(templateForKind('trigger'), { x: 54, y: 96 }, 'system');
  const agentBlock = createSandboxBlock(templateForKind('agent'), { x: 330, y: 84 }, 'system');
  const toolBlock = createSandboxBlock(templateForKind('tool'), { x: 622, y: 150 }, 'system');
  const outputBlock = createSandboxBlock(templateForKind('output'), { x: 914, y: 108 }, 'system');

  return {
    id: makeFlowId(),
    name: 'Builder Copilot Pathway',
    goal: 'Turn an app idea into a routed implementation plan with agent help, local tooling, and verification gates.',
    blocks: [trigger, agentBlock, toolBlock, outputBlock],
    routes: [
      {
        id: `route-${trigger.id}-${agentBlock.id}`,
        fromBlockId: trigger.id,
        fromPortId: 'brief',
        toBlockId: agentBlock.id,
        toPortId: 'context',
        label: 'brief to agent',
        kind: 'default'
      },
      {
        id: `route-${agentBlock.id}-${toolBlock.id}`,
        fromBlockId: agentBlock.id,
        fromPortId: 'decision',
        toBlockId: toolBlock.id,
        toPortId: 'request',
        label: 'tool action',
        kind: 'ai-selected'
      },
      {
        id: `route-${toolBlock.id}-${outputBlock.id}`,
        fromBlockId: toolBlock.id,
        fromPortId: 'result',
        toBlockId: outputBlock.id,
        toPortId: 'result',
        label: 'verified output',
        kind: 'success'
      }
    ],
    suggestions: [
      {
        id: 'suggest-memory',
        title: 'Add recall before planning',
        detail: 'Pull Holograim memory into the pathway before the reasoning block.',
        blockKind: 'memory',
        routeKind: 'default'
      },
      {
        id: 'suggest-approval',
        title: 'Gate risky actions',
        detail: 'Insert a human approval block before terminal, deploy, delete, or commit actions.',
        blockKind: 'approval',
        routeKind: 'manual-approval'
      },
      {
        id: 'suggest-condition',
        title: 'Branch after verification',
        detail: 'Split success and fallback routes from a test or build check.',
        blockKind: 'condition',
        routeKind: 'condition'
      }
    ],
    updatedAt: new Date().toISOString()
  };
}

function flowBlockIcon(kind: FlowBlockKind) {
  switch (kind) {
    case 'agent':
    case 'model':
      return <BrainCircuit size={15} aria-hidden="true" />;
    case 'tool':
      return <Wrench size={15} aria-hidden="true" />;
    case 'function':
      return <SlidersHorizontal size={15} aria-hidden="true" />;
    case 'condition':
    case 'route':
      return <Route size={15} aria-hidden="true" />;
    case 'memory':
      return <Database size={15} aria-hidden="true" />;
    case 'file':
      return <FolderOpen size={15} aria-hidden="true" />;
    case 'terminal':
      return <TerminalSquare size={15} aria-hidden="true" />;
    case 'git':
      return <GitBranch size={15} aria-hidden="true" />;
    case 'approval':
      return <ShieldCheck size={15} aria-hidden="true" />;
    case 'output':
      return <CheckCircle2 size={15} aria-hidden="true" />;
    default:
      return <Workflow size={15} aria-hidden="true" />;
  }
}

function blockClassName(kind: FlowBlockKind): string {
  return `block-kind-${kind}`;
}

function setSandboxNodeTransform(element: HTMLButtonElement | null, position: FlowBlock['position']) {
  if (!element) {
    return;
  }

  element.style.transform = `translate(${position.x}px, ${position.y}px)`;
}

function moveSandboxBlock(blocks: FlowBlock[], blockId: string, position: FlowBlock['position']): FlowBlock[] {
  return blocks.map((item) => item.id === blockId ? { ...item, position } : item);
}

const chatContextInstruction = [
  'Answer the user request directly. The following context is background only.',
  'Use paths, tools, recall, or file contents only when they help the answer.',
  'Do not summarize or list available tools unless the user specifically asks about tools.'
].join(' ');

function fableApi(): FableApi {
  return Reflect.get(globalThis, 'fable') as FableApi;
}

function recallStatusText(available: boolean, count: number, error?: string): string {
  if (!available) {
    return `Holograim unavailable: ${error ?? 'no recall results'}`;
  }

  const memoryWord = count === 1 ? 'memory' : 'memories';
  return `Holograim returned ${count} ${memoryWord}.`;
}

function persistenceSaveLabel(holograimQueued?: boolean, holograimStored?: boolean): string {
  if (holograimQueued) {
    return 'Saved locally, Holograim queued';
  }

  if (holograimStored) {
    return 'Saved locally and to Holograim';
  }

  return 'Saved locally';
}

function buildModelPrompt(userPrompt: string, contextBlocks: string[]): string {
  const context = contextBlocks.filter(Boolean).join('\n\n');
  if (!context) {
    return userPrompt;
  }

  return [
    'USER REQUEST:',
    userPrompt,
    'BACKGROUND CONTEXT:',
    chatContextInstruction,
    context
  ].join('\n\n');
}

function formatConversationForClipboard(messages: ChatMessage[]): string {
  return messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join('\n\n---\n\n');
}

function ConversationView({
  agentName,
  copiedKey,
  messages,
  selectedFile,
  onCopy
}: Readonly<{
  agentName: string;
  copiedKey: string;
  messages: ChatMessage[];
  selectedFile: string;
  onCopy: (text: string, key: string) => void;
}>) {
  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <ShieldCheck size={30} aria-hidden="true" />
        <h3>Ready for local reasoning</h3>
        <p>{selectedFile ? `Context will include ${selectedFile}.` : 'Select a file to add code context to the next turn.'}</p>
      </div>
    );
  }

  return messages.map((message, index) => {
    const copyKey = `${message.role}-${index}`;
    return (
      <article key={copyKey} className={`message ${message.role}`}>
        <div className="message-heading">
          <strong>{message.role === 'assistant' ? agentName : 'You'}</strong>
          <button className="message-copy" onClick={() => onCopy(message.content, copyKey)} title="Copy message" aria-label="Copy message">
            {copiedKey === copyKey ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <p className="message-body">{message.content}</p>
      </article>
    );
  });
}

function RecallSection({
  holograimStatus,
  lastSaved,
  recall,
  recallQuery,
  referenceContext,
  onRecallQueryChange,
  onRefreshRecall
}: Readonly<{
  holograimStatus: HolograimStatus | null;
  lastSaved: string;
  recall: string[];
  recallQuery: string;
  referenceContext: string;
  onRecallQueryChange: (query: string) => void;
  onRefreshRecall: () => void;
}>) {
  return (
    <section className="recall-section" aria-labelledby="recall-heading">
      <div className="panel-header compact-header">
        <div>
          <h2 id="recall-heading">Recall</h2>
          <p>{holograimStatus?.configured ? 'Holograim MCP discovered' : 'Local snapshot fallback'}</p>
        </div>
        <Database size={22} aria-hidden="true" />
      </div>

      <div className="recall-card">
        <div className="status-row">
          <span>{holograimStatus?.configured ? 'MCP ready' : 'MCP offline'}</span>
          <small>{lastSaved}</small>
        </div>
        <code>{referenceContext}</code>
        <label className="focus-label" htmlFor="recall-query">Query</label>
        <div className="inline-control">
          <input
            id="recall-query"
            value={recallQuery}
            onChange={(event) => onRecallQueryChange(event.target.value)}
          />
          <button className="icon-button" onClick={onRefreshRecall} title="Query Holograim" aria-label="Query Holograim">
            <Search size={16} />
          </button>
        </div>
        <div className="recall-list" aria-label="Recalled Holograim memories">
          {recall.length > 0 ? recall.slice(0, 4).map((item, index) => (
            <p key={`${item.slice(0, 30)}-${index}`}>{item}</p>
          )) : <p>No recalled memories yet.</p>}
        </div>
      </div>
    </section>
  );
}

function ToolkitSection({
  toolkits,
  busy,
  onRefresh,
  onPrompt
}: Readonly<{
  toolkits: ToolkitSummary | null;
  busy: boolean;
  onRefresh: () => void;
  onPrompt: (capability: ToolkitCapability) => void;
}>) {
  const capabilities = toolkits?.capabilities ?? [];
  const available = capabilities.filter((capability) => capability.status === 'available');
  const partial = capabilities.filter((capability) => capability.status === 'partial');
  const visibleCapabilities = [...available, ...partial].slice(0, 10);

  return (
    <section className="toolkit-section" aria-labelledby="toolkits-heading">
      <div className="panel-header compact-header">
        <div>
          <h2 id="toolkits-heading">Toolkits</h2>
          <p>{toolkits ? `${toolkits.availableCount} ready, ${toolkits.partialCount} partial` : 'Scan local capabilities'}</p>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={onRefresh} title="Refresh toolkits" aria-label="Refresh toolkits">
            {busy ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          </button>
          <Boxes size={22} aria-hidden="true" />
        </div>
      </div>

      {toolkits ? (
        <div className="toolkit-card">
          <div className="metric-grid three-up">
            <span><strong>{toolkits.availableCount}</strong> ready</span>
            <span><strong>{toolkits.partialCount}</strong> partial</span>
            <span><strong>{toolkits.missingCount}</strong> quiet</span>
          </div>
          <div className="toolkit-list" aria-label="Detected toolkit capabilities">
            {visibleCapabilities.map((capability) => (
              <button key={capability.id} className={`toolkit-item ${capability.status}`} onClick={() => onPrompt(capability)}>
                <span>
                  <strong>{capability.name}</strong>
                  <small>{capability.summary}</small>
                </span>
                <em>{capability.category}</em>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-debug">Refresh to map local CLIs, VS Code extensions, workspace configs, MCP paths, and DJMT tools.</div>
      )}
    </section>
  );
}

export function App() { // NOSONAR - The Electron workbench state remains centralized until the planned component split.
  const [sessionId, setSessionId] = useState(makeSessionId);
  const [agentId, setAgentId] = useState<AgentId>(DEFAULT_AGENT_ID);
  const [models, setModels] = useState<AnthropicModel[]>([]);
  const [learnOpen, setLearnOpen] = useState(false);
  const [model, setModel] = useState('');
  const [workspacePath, setWorkspacePath] = useState('');
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [fileFilter, setFileFilter] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [debugFocus, setDebugFocus] = useState('correctness, security, performance, maintainability, and missing tests');
  const [debugReport, setDebugReport] = useState<DebugReport | null>(null);
  const [toolchainRoot, setToolchainRoot] = useState(defaultToolchainRoot);
  const [toolchain, setToolchain] = useState<ToolchainSummary | null>(null);
  const [toolkits, setToolkits] = useState<ToolkitSummary | null>(null);
  const [toolFilter, setToolFilter] = useState('');
  const [includeToolchainContext, setIncludeToolchainContext] = useState(true);
  const [holograimStatus, setHolograimStatus] = useState<HolograimStatus | null>(null);
  const [recall, setRecall] = useState<string[]>([]);
  const [recallQuery, setRecallQuery] = useState('FableCode current workspace priorities and recent decisions');
  const [lastSaved, setLastSaved] = useState('Not saved yet');
  const [copiedKey, setCopiedKey] = useState('');
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxFlow, setSandboxFlow] = useState<FlowDefinition>(() => createStarterFlow());
  const [selectedSandboxBlockId, setSelectedSandboxBlockId] = useState('');
  const [sandboxMessages, setSandboxMessages] = useState<ChatMessage[]>([]);
  const [sandboxPrompt, setSandboxPrompt] = useState('Suggest the next block and route for this builder flow.');
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [busy, setBusy] = useState<'models' | 'workspace' | 'chat' | 'debug' | 'toolchain' | 'toolkits' | null>(null);
  const [status, setStatus] = useState('Ready');
  const hydratedRef = useRef(false);
  const brandDragRef = useRef<HTMLDivElement>(null);
  const chatInFlightRef = useRef(false);

  const agent = useMemo(
    () => AGENT_PROFILES.find((profile) => profile.id === agentId) ?? AGENT_PROFILES[0],
    [agentId]
  );

  const filteredFiles = useMemo(() => {
    const query = fileFilter.trim().toLowerCase();
    if (!query) {
      return files;
    }

    return files.filter((file) => file.path.toLowerCase().includes(query));
  }, [fileFilter, files]);

  const filteredCommands = useMemo(() => {
    const commands = toolchain?.commands ?? [];
    const query = toolFilter.trim().toLowerCase();
    if (!query) {
      return commands;
    }

    return commands.filter((command) =>
      command.name.toLowerCase().includes(query) || command.source.toLowerCase().includes(query)
    );
  }, [toolFilter, toolchain]);

  const toolchainContext = useMemo(() => {
    if (!toolchain?.exists) {
      return '';
    }

    const commandNames = toolchain.commands.slice(0, 28).map((command) => `${command.name} (${command.source})`).join(', ');
    const configFiles = toolchain.configFiles.join(', ');
    return [
      `Root: ${toolchain.rootPath}`,
      toolchain.activationCommand ? `Activate: ${toolchain.activationCommand}` : '',
      commandNames ? `Commands: ${commandNames}` : '',
      configFiles ? `Config: ${configFiles}` : ''
    ].filter(Boolean).join('\n');
  }, [toolchain]);

  const toolkitContext = useMemo(() => {
    if (!toolkits) {
      return '';
    }

    return toolkits.capabilities
      .filter((capability) => capability.status !== 'missing')
      .slice(0, 7)
      .map((capability) => {
        const commands = capability.commands.slice(0, 4).map((command) => command.name).join(', ');
        const configs = capability.configFiles.slice(0, 3).join(', ');
        const sources = capability.sources.join(', ');
        const commandText = commands ? `commands: ${commands}; ` : '';
        const configText = configs ? `configs: ${configs}; ` : '';
        return `${capability.name}: ${capability.status}; sources: ${sources || 'none'}; ${commandText}${configText}${capability.summary}`;
      })
      .join('\n');
  }, [toolkits]);

  const selectedSandboxBlock = useMemo(() => {
    return sandboxFlow.blocks.find((block) => block.id === selectedSandboxBlockId) ?? sandboxFlow.blocks[0] ?? null;
  }, [sandboxFlow.blocks, selectedSandboxBlockId]);

  const sandboxContext = useMemo(() => {
    const selected = selectedSandboxBlock
      ? `${selectedSandboxBlock.title} (${selectedSandboxBlock.kind}): ${selectedSandboxBlock.instructions}`
      : 'No block selected.';
    const routeList = sandboxFlow.routes.map((route) => `${route.label}: ${route.fromBlockId} -> ${route.toBlockId}`).join('\n');
    const blockList = sandboxFlow.blocks.map((block) => `${block.title} [${block.kind}]`).join(', ');
    const capabilityList = toolkits?.capabilities
      .filter((capability) => capability.status !== 'missing')
      .slice(0, 10)
      .map((capability) => `${capability.name} (${capability.status})`)
      .join(', ');

    return [
      `Flow: ${sandboxFlow.name}`,
      `Goal: ${sandboxFlow.goal}`,
      `Selected block: ${selected}`,
      `Blocks: ${blockList}`,
      routeList ? `Routes:\n${routeList}` : 'Routes: none yet',
      capabilityList ? `Available devtool skills: ${capabilityList}` : '',
      workspacePath ? `Workspace: ${workspacePath}` : ''
    ].filter(Boolean).join('\n');
  }, [sandboxFlow, selectedSandboxBlock, toolkits, workspacePath]);

  const referenceContext = useMemo(() => {
    return [
      `Session ID: ${sessionId}`,
      `Workspace root: ${workspacePath || 'not selected'}`,
      `Selected file: ${selectedFile || 'not selected'}`,
      `Toolchain root: ${toolchainRoot || 'not set'}`,
      holograimStatus?.serverPath ? `Holograim MCP server: ${holograimStatus.serverPath}` : '',
      holograimStatus?.databasePath ? `Holograim database: ${holograimStatus.databasePath}` : '',
      `Saved snapshot: ${holograimStatus?.localSnapshotPath ?? 'pending'}`
    ].filter(Boolean).join('\n');
  }, [holograimStatus, selectedFile, sessionId, toolchainRoot, workspacePath]);

  useEffect(() => {
    void refreshModels();
    void refreshToolchain();
    void refreshToolkits();
    void restorePersistence();
  }, []);

  useEffect(() => {
    brandDragRef.current?.style.setProperty('-webkit-app-region', 'drag');
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    const handle = globalThis.setTimeout(() => {
      void savePersistenceSnapshot();
    }, 1600);

    return () => globalThis.clearTimeout(handle);
  }, [agentId, debugFocus, fileFilter, includeToolchainContext, messages, model, sandboxFlow, sandboxMessages, selectedFile, toolchainRoot, workspacePath]);

  useEffect(() => {
    if (!model) {
      setModel(agent.modelHint);
    }
  }, [agent.modelHint, model]);

  async function refreshModels() {
    setBusy('models');
    try {
      const nextModels = await fableApi().listModels();
      setModels(nextModels);
      if (nextModels.length > 0) {
        setModel((current: string) => current || nextModels[0].id);
        setStatus(`Anthropic models loaded.`);
      } else {
        setModel((current: string) => current || agent.modelHint);
        setStatus('No Anthropic models available.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load Anthropic models.');
    } finally {
      setBusy(null);
    }
  }

  async function restorePersistence() {
    try {
      const result = await fableApi().loadPersistence();
      setHolograimStatus(result.holograim);
      setRecall(result.recall);

      if (!result.snapshot) {
        hydratedRef.current = true;
        setLastSaved('No previous session');
        return;
      }

      const {
        agentId: restoredAgentId,
        debugFocus: restoredDebugFocus,
        fileFilter: restoredFileFilter,
        includeToolchainContext: restoredToolchainContext,
        messages: restoredMessages,
        model: restoredModel,
        savedAt,
        sandboxFlow: restoredSandboxFlow,
        sandboxMessages: restoredSandboxMessages,
        selectedFile: restoredSelectedFile,
        sessionId: restoredSessionId,
        toolchainRoot: restoredToolchainRoot,
        workspacePath: restoredWorkspacePath
      } = result.snapshot;

      setSessionId(restoredSessionId || makeSessionId());
      setAgentId(restoredAgentId || DEFAULT_AGENT_ID);
      setModel(restoredModel || '');
      setWorkspacePath(restoredWorkspacePath || '');
      setSelectedFile(restoredSelectedFile || '');
      setFileFilter(restoredFileFilter || '');
      setToolchainRoot(restoredToolchainRoot || defaultToolchainRoot);
      setIncludeToolchainContext(restoredToolchainContext);
      setDebugFocus(restoredDebugFocus || debugFocus);
      setMessages(restoredMessages || []);
      if (restoredSandboxFlow?.blocks?.length) {
        setSandboxFlow(restoredSandboxFlow);
        setSelectedSandboxBlockId(restoredSandboxFlow.blocks[0].id);
      }
      setSandboxMessages(restoredSandboxMessages || []);
      setLastSaved(`Restored ${new Date(savedAt).toLocaleString()}`);

      if (restoredToolchainRoot) {
        void refreshToolchain(restoredToolchainRoot);
      }

      void refreshToolkits(restoredToolchainRoot || defaultToolchainRoot, restoredWorkspacePath || '');

      if (restoredWorkspacePath) {
        try {
          const restoredFiles = await fableApi().listWorkspaceFiles(restoredWorkspacePath);
          setFiles(restoredFiles);
          if (restoredSelectedFile) {
            const content = await fableApi().readWorkspaceFile(restoredWorkspacePath, restoredSelectedFile);
            setFileContent(content);
          }
        } catch (error) {
          setStatus(error instanceof Error ? error.message : 'Saved workspace could not be restored.');
        }
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load saved session.');
    } finally {
      hydratedRef.current = true;
    }
  }

  async function savePersistenceSnapshot() {
    const snapshot: PersistenceSnapshot = {
      sessionId,
      savedAt: new Date().toISOString(),
      agentId,
      model,
      workspacePath,
      selectedFile,
      fileFilter,
      toolchainRoot,
      includeToolchainContext,
      debugFocus,
      messages,
      sandboxFlow,
      sandboxMessages
    };

    try {
      const result = await fableApi().savePersistence(snapshot);
      setLastSaved(persistenceSaveLabel(result.holograimQueued, result.holograimStored));
      if (result.error) {
        setStatus(`Recall fallback active: ${result.error}`);
      }
    } catch (error) {
      setLastSaved('Save failed');
      setStatus(error instanceof Error ? error.message : 'Unable to save session.');
    }
  }

  async function refreshRecall(query = recallQuery) {
    const trimmed = query.trim();
    if (!trimmed) {
      setStatus('Enter a recall query first.');
      return;
    }

    try {
      const result = await fableApi().recallPersistence(trimmed);
      setRecall(result.memories);
      setStatus(recallStatusText(result.holograimAvailable, result.memories.length, result.error));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to query Holograim recall.');
    }
  }

  async function refreshToolchain(rootPath = toolchainRoot) {
    setBusy('toolchain');
    try {
      const summary = await fableApi().inspectToolchain(rootPath.trim() || defaultToolchainRoot);
      const commandWord = summary.commands.length === 1 ? 'command' : 'commands';
      setToolchain(summary);
      setToolchainRoot(summary.rootPath);
      setStatus(summary.exists
        ? `Toolchain loaded with ${summary.commands.length} ${commandWord}`
        : 'Toolchain folder was not found.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to inspect the toolchain depot.');
    } finally {
      setBusy(null);
    }
  }

  async function refreshToolkits(rootPath = toolchainRoot, currentWorkspace = workspacePath) {
    setBusy('toolkits');
    try {
      const summary = await fableApi().inspectToolkits({
        workspacePath: currentWorkspace,
        toolchainRoot: rootPath.trim() || defaultToolchainRoot
      });
      setToolkits(summary);
      setStatus(`Toolkits mapped: ${summary.availableCount} ready, ${summary.partialCount} partial.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to inspect local toolkits.');
    } finally {
      setBusy(null);
    }
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setStatus('Copied to clipboard.');
      globalThis.setTimeout(() => setCopiedKey((current) => current === key ? '' : current), 1400);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Clipboard copy failed.');
    }
  }

  async function openWorkspace() {
    setBusy('workspace');
    try {
      const pickedPath = await fableApi().pickWorkspace();
      if (!pickedPath) {
        return;
      }

      const nextFiles = await fableApi().listWorkspaceFiles(pickedPath);
      setWorkspacePath(pickedPath);
      setFiles(nextFiles);
      setFileFilter('');
      setSelectedFile('');
      setFileContent('');
      setDebugReport(null);
      setStatus(`Loaded ${nextFiles.length} reviewable file${nextFiles.length === 1 ? '' : 's'}`);
      void refreshToolkits(toolchainRoot, pickedPath);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to open workspace.');
    } finally {
      setBusy(null);
    }
  }

  async function selectFile(filePath: string) {
    if (!workspacePath) {
      return;
    }

    setSelectedFile(filePath);
    setDebugReport(null);
    try {
      const content = await fableApi().readWorkspaceFile(workspacePath, filePath);
      setFileContent(content);
      setStatus(`Opened ${filePath}`);
    } catch (error) {
      setFileContent('');
      setStatus(error instanceof Error ? error.message : 'Unable to read file.');
    }
  }

  async function sendPrompt(text = prompt) {
    if (chatInFlightRef.current) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    if (!model.trim()) {
      setStatus('Choose an Anthropic model first.');
      return;
    }

    chatInFlightRef.current = true;
    const fileContext = selectedFile && fileContent
      ? `Current file: ${selectedFile}\n\n\`\`\`\n${fileContent.slice(0, 14000)}\n\`\`\``
      : '';
    const localTools = includeToolchainContext && (toolchainContext || toolkitContext)
      ? `Available local tooling:\n${[toolchainContext, toolkitContext].filter(Boolean).join('\n\n')}`
      : '';
    const references = `Reference paths:\n${referenceContext}`;
    const recallContext = recall.length > 0
      ? `Holograim recall:\n${recall.slice(0, 3).join('\n\n')}`
      : '';
    const modelPrompt = buildModelPrompt(trimmed, [fileContext, localTools, references, recallContext]);

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed }
    ];

    setMessages(nextMessages);
    setPrompt('');
    setBusy('chat');

    try {
      const response = await fableApi().chat({
        model: model.trim(),
        temperature: agent.temperature,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          ...messages.slice(-12),
          { role: 'user', content: modelPrompt }
        ]
      });
      setMessages([...nextMessages, { role: 'assistant', content: response || 'The model returned an empty response.' }]);
      setStatus(`${agent.name} completed the turn.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The Anthropic request failed.');
    } finally {
      setBusy(null);
      chatInFlightRef.current = false;
    }
  }

  async function runDebug() {
    if (!selectedFile || !fileContent) {
      setStatus('Open a file before running debug review.');
      return;
    }

    setBusy('debug');
    try {
      const report = await fableApi().debugAnalyze({
        model: model.trim(),
        agent,
        filePath: selectedFile,
        content: fileContent,
        focus: debugFocus,
        toolchainContext: includeToolchainContext ? [toolchainContext, toolkitContext].filter(Boolean).join('\n\n') : undefined
      });
      setDebugReport(report);
      setStatus('Debug review complete.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Debug review failed.');
    } finally {
      setBusy(null);
    }
  }

  function promptWithToolchain(commandName?: string) {
    const command = commandName ? ` Use ${commandName} from the DJMT toolchain where helpful.` : '';
    setPrompt(`Use the available DJMT toolchain to improve this project.${command}`);
  }

  function promptWithToolkit(capability: ToolkitCapability) {
    const commands = capability.commands.slice(0, 6).map((command) => command.name).join(', ');
    const configs = capability.configFiles.slice(0, 4).join(', ');
    const commandText = commands ? `Available commands: ${commands}. ` : '';
    const configText = configs ? `Workspace configs: ${configs}. ` : '';
    setPrompt([
      'Use the ',
      capability.name,
      ' capability in FableCode. Status: ',
      capability.status,
      '. ',
      commandText,
      configText,
      'Suggest the safest next action for this workspace.'
    ].join(''));
  }

  function mutateSandboxFlow(updater: (flow: FlowDefinition) => FlowDefinition) {
    setSandboxFlow((current) => ({
      ...updater(current),
      updatedAt: new Date().toISOString()
    }));
  }

  function addSandboxBlock(kind: FlowBlockKind, suggestedBy: FlowBlock['suggestedBy'] = 'user') {
    const template = templateForKind(kind);
    const offset = sandboxFlow.blocks.length * 42;
    const newBlock = createSandboxBlock(template, {
      x: 86 + (offset % 520),
      y: 300 + (offset % 220)
    }, suggestedBy);

    mutateSandboxFlow((current) => {
      const selected = current.blocks.find((block) => block.id === selectedSandboxBlock?.id);
      const nextRoutes = [...current.routes];
      if (selected?.outputs[0] && newBlock.inputs[0]) {
        nextRoutes.push({
          id: `route-${selected.id}-${newBlock.id}`,
          fromBlockId: selected.id,
          fromPortId: selected.outputs[0].id,
          toBlockId: newBlock.id,
          toPortId: newBlock.inputs[0].id,
          label: `${selected.title} to ${newBlock.title}`,
          kind: suggestedBy === 'copilot' ? 'ai-selected' : 'default'
        });
      }

      return {
        ...current,
        blocks: [...current.blocks, newBlock],
        routes: nextRoutes
      };
    });
    setSelectedSandboxBlockId(newBlock.id);
  }

  function updateSandboxGoal(goal: string) {
    mutateSandboxFlow((current) => ({ ...current, goal }));
  }

  function updateSelectedSandboxBlock(patch: Partial<Pick<FlowBlock, 'title' | 'description' | 'instructions'>>) {
    if (!selectedSandboxBlock) {
      return;
    }

    mutateSandboxFlow((current) => ({
      ...current,
      blocks: current.blocks.map((block) => block.id === selectedSandboxBlock.id ? { ...block, ...patch } : block)
    }));
  }

  function connectSandboxBlocks(toBlockId: string, kind: FlowRouteKind = 'default') {
    if (!selectedSandboxBlock || selectedSandboxBlock.id === toBlockId || !selectedSandboxBlock.outputs[0]) {
      return;
    }

    mutateSandboxFlow((current) => {
      const target = current.blocks.find((block) => block.id === toBlockId);
      if (!target?.inputs[0]) {
        return current;
      }

      const alreadyConnected = current.routes.some((route) =>
        route.fromBlockId === selectedSandboxBlock.id && route.toBlockId === target.id
      );
      if (alreadyConnected) {
        return current;
      }

      return {
        ...current,
        routes: [
          ...current.routes,
          {
            id: `route-${selectedSandboxBlock.id}-${target.id}`,
            fromBlockId: selectedSandboxBlock.id,
            fromPortId: selectedSandboxBlock.outputs[0].id,
            toBlockId: target.id,
            toPortId: target.inputs[0].id,
            label: `${selectedSandboxBlock.title} to ${target.title}`,
            kind
          }
        ]
      };
    });
  }

  function startSandboxDrag(event: ReactMouseEvent<HTMLButtonElement>, blockId: string) {
    event.preventDefault();
    setSelectedSandboxBlockId(blockId);
    const block = sandboxFlow.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const initialPosition = block.position;

    const handleMove = (moveEvent: MouseEvent) => {
      const nextX = Math.max(24, Math.min(1080, initialPosition.x + moveEvent.clientX - startX));
      const nextY = Math.max(24, Math.min(620, initialPosition.y + moveEvent.clientY - startY));
      setSandboxFlow((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        blocks: moveSandboxBlock(current.blocks, blockId, { x: nextX, y: nextY })
      }));
    };

    const handleUp = () => {
      globalThis.removeEventListener('mousemove', handleMove);
      globalThis.removeEventListener('mouseup', handleUp);
    };

    globalThis.addEventListener('mousemove', handleMove);
    globalThis.addEventListener('mouseup', handleUp, { once: true });
  }

  async function sendSandboxPrompt(text = sandboxPrompt) {
    const trimmed = text.trim();
    if (!trimmed || sandboxBusy) {
      return;
    }

    if (!model.trim()) {
      setStatus('Choose an Anthropic model first.');
      return;
    }

    const nextMessages: ChatMessage[] = [...sandboxMessages, { role: 'user', content: trimmed }];
    const flowPrompt = buildModelPrompt(trimmed, [
      'Grid Sandbox context:',
      sandboxContext,
      'Respond as a builder-copilot for a visual block workflow. Suggest concrete blocks, route labels, function signatures, and verification gates. Keep the answer actionable.'
    ]);

    setSandboxMessages(nextMessages);
    setSandboxPrompt('');
    setSandboxBusy(true);
    setSandboxOpen(true);

    try {
      const response = await fableApi().chat({
        model: model.trim(),
        temperature: Math.min(agent.temperature + 0.05, 0.9),
        messages: [
          { role: 'system', content: `${agent.systemPrompt}\nYou are also operating inside FableCode Grid Sandbox, a visual builder for app, agent, tool, and verification flows.` },
          ...sandboxMessages.slice(-8),
          { role: 'user', content: flowPrompt }
        ]
      });
      setSandboxMessages([...nextMessages, { role: 'assistant', content: response || 'The model returned an empty sandbox response.' }]);
      setStatus('Grid Sandbox copilot completed the turn.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The sandbox Anthropic request failed.');
    } finally {
      setSandboxBusy(false);
    }
  }

  function resetSandboxFlow() {
    const nextFlow = createStarterFlow();
    setSandboxFlow(nextFlow);
    setSelectedSandboxBlockId(nextFlow.blocks[0]?.id ?? '');
    setSandboxMessages([]);
    setSandboxPrompt('Suggest the next block and route for this builder flow.');
  }

  return (
    <main className="app-shell">
      <div className="lava-background" aria-hidden="true">
        <span className="lava-blob lava-blob-a" />
        <span className="lava-blob lava-blob-b" />
        <span className="lava-blob lava-blob-c" />
        <span className="lava-blob lava-blob-d" />
        <span className="lava-blob lava-blob-e" />
        <span className="lava-blob lava-blob-f" />
      </div>
      <aside className="agent-rail" aria-label="Agent and runtime controls">
        <div className="brand-block" ref={brandDragRef}>
          <div className="brand-mark" aria-hidden="true"><Sparkles size={18} /></div>
          <div>
            <h1>FableCode</h1>
            <p>Local agent workbench</p>
          </div>
        </div>

        <button className="primary-action" onClick={openWorkspace} disabled={busy === 'workspace'}>
          {busy === 'workspace' ? <Loader2 className="spin" size={18} /> : <FolderOpen size={18} />}
          <span>Open Workspace</span>
        </button>

        <button className="primary-action sandbox-launch" onClick={() => setSandboxOpen(true)}>
          <PanelRightOpen size={18} />
          <span>Grid Sandbox</span>
        </button>

        <section className="rail-section" aria-labelledby="agents-heading">
          <h2 id="agents-heading">Agents</h2>
          <div className="agent-list">
            {AGENT_PROFILES.map((profile) => (
              <button
                key={profile.id}
                className={`agent-option agent-${profile.id} ${profile.id === agent.id ? 'active' : ''}`}
                onClick={() => setAgentId(profile.id)}
              >
                <span className="agent-dot" aria-hidden="true" />
                <span>
                  <strong>{profile.name}</strong>
                  <small>{profile.tagline}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rail-section model-box" aria-labelledby="anthropic-heading">
          <div className="section-heading">
            <h2 id="anthropic-heading">Model</h2>
            <button className="icon-button" onClick={refreshModels} title="Refresh models" aria-label="Refresh models">
              {busy === 'models' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
            </button>
          </div>
          <label htmlFor="model-input">Anthropic Model</label>
          <select
            id="model-input"
            className="model-select"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p aria-live="polite">{status}</p>
        </section>

        <section className="rail-section" aria-label="Learn CSS">
          <button
            className="icon-button learn-btn"
            onClick={() => setLearnOpen(true)}
            title="Open the interactive CSS course"
          >
            Learn CSS
          </button>
        </section>
      </aside>

      <section className="workspace-panel" aria-labelledby="workspace-heading">
        <div className="panel-header">
          <div>
            <h2 id="workspace-heading">Workspace</h2>
            <p title={workspacePath}>{workspacePath || 'No folder selected'}</p>
          </div>
          <span>{filteredFiles.length}/{files.length} files</span>
        </div>
        <label className="search-box" htmlFor="file-filter">
          <Search size={15} aria-hidden="true" />
          <input
            id="file-filter"
            value={fileFilter}
            onChange={(event) => setFileFilter(event.target.value)}
            placeholder="Filter files"
          />
        </label>
        <div className="file-list" aria-label="Workspace files">
          {filteredFiles.map((file) => (
            <button
              key={file.path}
              className={file.path === selectedFile ? 'selected' : ''}
              onClick={() => selectFile(file.path)}
              title={file.path}
            >
              <span>{file.path}</span>
              <small>{Math.ceil(file.size / 1024)} KB</small>
            </button>
          ))}
        </div>
        <pre className="code-preview">{fileContent || 'Open a workspace and choose a file.'}</pre>
      </section>

      <section className="chat-panel" aria-labelledby="chat-heading">
        <div className="panel-header chat-heading">
          <div>
            <h2 id="chat-heading">{agent.name}</h2>
            <p>{agent.tagline}</p>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={() => copyText(formatConversationForClipboard(messages), 'conversation')}
              disabled={messages.length === 0}
              title="Copy conversation"
              aria-label="Copy conversation"
            >
              {copiedKey === 'conversation' ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <Bot size={24} color={agent.color} aria-hidden="true" />
          </div>
        </div>

        <div className="quick-prompts" aria-label="Quick prompts">
          {quickPrompts.map((item) => (
            <button key={item} onClick={() => sendPrompt(item)} disabled={busy === 'chat'}>
              {item}
            </button>
          ))}
        </div>

        <div className="conversation" aria-live="polite">
          <ConversationView
            agentName={agent.name}
            copiedKey={copiedKey}
            messages={messages}
            selectedFile={selectedFile}
            onCopy={(text, key) => { void copyText(text, key); }}
          />
        </div>

        <form className="composer" onSubmit={(event) => { event.preventDefault(); void sendPrompt(); }}>
          <label className="sr-only" htmlFor="agent-prompt">Agent prompt</label>
          <textarea
            id="agent-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendPrompt();
              }
            }}
            placeholder="Ask the selected agent..."
            rows={3}
          />
          <button className="send-button" type="submit" disabled={busy === 'chat'} title="Send" aria-label="Send">
            {busy === 'chat' ? <Loader2 className="spin" size={19} /> : <Send size={19} />}
          </button>
        </form>
      </section>

      <aside className="debug-panel" aria-label="Toolchain and debug controls">
        <section className="toolchain-section" aria-labelledby="toolchain-heading">
          <div className="panel-header compact-header">
            <div>
              <h2 id="toolchain-heading">Toolchain</h2>
              <p>{toolchain?.exists ? 'DJMT depot connected' : 'Depot not connected'}</p>
            </div>
            <Wrench size={22} aria-hidden="true" />
          </div>

          <label className="focus-label" htmlFor="toolchain-root">Root</label>
          <div className="inline-control">
            <input
              id="toolchain-root"
              value={toolchainRoot}
              onChange={(event) => setToolchainRoot(event.target.value)}
            />
            <button className="icon-button" onClick={() => { void refreshToolchain(); void refreshToolkits(); }} title="Inspect toolchain" aria-label="Inspect toolchain">
              {busy === 'toolchain' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
            </button>
          </div>

          <label className="toggle-line">
            <input
              type="checkbox"
              checked={includeToolchainContext}
              onChange={(event) => setIncludeToolchainContext(event.target.checked)}
            />
            <span>Include toolchain in agent context</span>
          </label>

          {toolchain?.exists ? (
            <div className="toolchain-card">
              <div className="metric-grid">
                <span><strong>{toolchain.commands.length}</strong> commands</span>
                <span><strong>{toolchain.directories.length}</strong> roots</span>
              </div>
              {toolchain.activationCommand ? (
                <code>{toolchain.activationCommand}</code>
              ) : null}
              <label className="search-box compact-search" htmlFor="tool-filter">
                <Search size={15} aria-hidden="true" />
                <input
                  id="tool-filter"
                  value={toolFilter}
                  onChange={(event) => setToolFilter(event.target.value)}
                  placeholder="Filter commands"
                />
              </label>
              <div className="command-list" aria-label="Available toolchain commands">
                {filteredCommands.slice(0, 34).map((command) => (
                  <button key={`${command.source}-${command.name}`} onClick={() => promptWithToolchain(command.name)}>
                    <TerminalSquare size={14} aria-hidden="true" />
                    <span>{command.name}</span>
                    <small>{command.source}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-debug">Inspect the DJMT toolchain root to expose local commands.</div>
          )}
        </section>

        <ToolkitSection
          toolkits={toolkits}
          busy={busy === 'toolkits'}
          onRefresh={() => refreshToolkits()}
          onPrompt={promptWithToolkit}
        />

        <RecallSection
          holograimStatus={holograimStatus}
          lastSaved={lastSaved}
          recall={recall}
          recallQuery={recallQuery}
          referenceContext={referenceContext}
          onRecallQueryChange={setRecallQuery}
          onRefreshRecall={() => refreshRecall()}
        />

        <section className="debug-section" aria-labelledby="debug-heading">
          <div className="panel-header compact-header">
            <div>
              <h2 id="debug-heading">Debug</h2>
              <p>Sourcery-style scan and model review</p>
            </div>
            <Bug size={22} aria-hidden="true" />
          </div>

          <label className="focus-label" htmlFor="debug-focus">Focus</label>
          <textarea
            id="debug-focus"
            value={debugFocus}
            onChange={(event) => setDebugFocus(event.target.value)}
            rows={4}
          />
          <button className="primary-action debug-run" onClick={runDebug} disabled={busy === 'debug'}>
            {busy === 'debug' ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
            <span>Run Debug</span>
          </button>

          {debugReport ? (
            <div className="debug-results">
              <div className="summary-line">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{debugReport.summary}</span>
              </div>
              {debugReport.findings.map((finding, index) => (
                <article key={`${finding.title}-${index}`} className={`finding ${finding.severity}`}>
                  <div>
                    <AlertTriangle size={16} aria-hidden="true" />
                    <strong>{finding.title}</strong>
                  </div>
                  <small>{finding.category}{finding.line ? ` / line ${finding.line}` : ''}</small>
                  <p>{finding.detail}</p>
                </article>
              ))}
              {debugReport.agentReview ? (
                <article className="agent-review">
                  <strong>{agent.name} review</strong>
                  <p>{debugReport.agentReview}</p>
                </article>
              ) : null}
            </div>
          ) : (
            <div className="empty-debug">Open a file, tune the focus, and run a debug pass.</div>
          )}
        </section>
      </aside>

      {sandboxOpen ? (
        <aside className="sandbox-drawer" aria-label="Grid Sandbox flow builder">
          <div className="sandbox-header">
            <div>
              <span className="eyebrow">Grid Sandbox</span>
              <h2>{sandboxFlow.name}</h2>
              <p>{sandboxFlow.blocks.length} blocks / {sandboxFlow.routes.length} routes / updated {new Date(sandboxFlow.updatedAt).toLocaleTimeString()}</p>
            </div>
            <div className="header-actions">
              <button className="icon-button" onClick={resetSandboxFlow} title="Reset sandbox" aria-label="Reset sandbox">
                <RefreshCw size={16} />
              </button>
              <button className="icon-button" onClick={() => setSandboxOpen(false)} title="Close sandbox" aria-label="Close sandbox">
                <PanelRightClose size={16} />
              </button>
            </div>
          </div>

          <div className="sandbox-body">
            <section className="sandbox-palette" aria-label="Block palette">
              <div className="sandbox-section-heading">
                <h3>Blocks</h3>
                <Waypoints size={17} aria-hidden="true" />
              </div>
              <div className="palette-list">
                {sandboxBlockTemplates.map((template) => (
                  <button key={template.kind} onClick={() => addSandboxBlock(template.kind)}>
                    <span className={`palette-icon ${blockClassName(template.kind)}`}>
                      {flowBlockIcon(template.kind)}
                    </span>
                    <span>
                      <strong>{template.title}</strong>
                      <small>{template.description}</small>
                    </span>
                    <Plus size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>

            <section className="sandbox-canvas-shell" aria-label="Visual flow canvas">
              <div className="sandbox-goal-row">
                <label htmlFor="sandbox-goal">Flow goal</label>
                <input
                  id="sandbox-goal"
                  value={sandboxFlow.goal}
                  onChange={(event) => updateSandboxGoal(event.target.value)}
                />
              </div>
              <div className="sandbox-canvas">
                <svg className="sandbox-routes" viewBox="0 0 1180 720" preserveAspectRatio="none" aria-hidden="true">
                  {sandboxFlow.routes.map((route) => {
                    const source = sandboxFlow.blocks.find((block) => block.id === route.fromBlockId);
                    const target = sandboxFlow.blocks.find((block) => block.id === route.toBlockId);
                    if (!source || !target) {
                      return null;
                    }

                    const startX = source.position.x + 226;
                    const startY = source.position.y + 62;
                    const endX = target.position.x;
                    const endY = target.position.y + 62;
                    const curveX = Math.max(72, (endX - startX) / 2);
                    return (
                      <g key={route.id}>
                        <path
                          d={`M ${startX} ${startY} C ${startX + curveX} ${startY}, ${endX - curveX} ${endY}, ${endX} ${endY}`}
                          className={`route-line route-${route.kind}`}
                        />
                        <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 8}>{route.label}</text>
                      </g>
                    );
                  })}
                </svg>

                {sandboxFlow.blocks.map((block) => {
                  const active = selectedSandboxBlock?.id === block.id;
                  return (
                    <button
                      key={block.id}
                      ref={(element) => setSandboxNodeTransform(element, block.position)}
                      className={`sandbox-node ${blockClassName(block.kind)} ${active ? 'active' : ''}`}
                      onMouseDown={(event) => startSandboxDrag(event, block.id)}
                    >
                      <span className="node-topline">
                        <span className="node-icon">{flowBlockIcon(block.kind)}</span>
                        <span>{block.kind}</span>
                      </span>
                      <strong>{block.title}</strong>
                      <small>{block.description}</small>
                      <span className="node-ports">
                        <span>{block.inputs.length} in</span>
                        <span>{block.outputs.length} out</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="sandbox-inspector" aria-label="Selected block inspector">
              <div className="sandbox-section-heading">
                <h3>Inspector</h3>
                <SlidersHorizontal size={17} aria-hidden="true" />
              </div>
              {selectedSandboxBlock ? (
                <div className="inspector-form">
                  <label htmlFor="sandbox-block-title">Title</label>
                  <input
                    id="sandbox-block-title"
                    value={selectedSandboxBlock.title}
                    onChange={(event) => updateSelectedSandboxBlock({ title: event.target.value })}
                  />
                  <label htmlFor="sandbox-block-description">Description</label>
                  <textarea
                    id="sandbox-block-description"
                    rows={3}
                    value={selectedSandboxBlock.description}
                    onChange={(event) => updateSelectedSandboxBlock({ description: event.target.value })}
                  />
                  <label htmlFor="sandbox-block-instructions">Instructions</label>
                  <textarea
                    id="sandbox-block-instructions"
                    rows={5}
                    value={selectedSandboxBlock.instructions}
                    onChange={(event) => updateSelectedSandboxBlock({ instructions: event.target.value })}
                  />
                  <div className="route-picker">
                    <strong>Route from selected</strong>
                    {sandboxFlow.blocks
                      .filter((block) => block.id !== selectedSandboxBlock.id && block.inputs.length > 0)
                      .slice(0, 5)
                      .map((block) => (
                        <button key={block.id} onClick={() => connectSandboxBlocks(block.id, 'manual-approval')}>
                          <Route size={13} aria-hidden="true" />
                          <span>{block.title}</span>
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="empty-debug">Select a block on the grid.</div>
              )}

              <div className="suggestion-stack">
                <div className="sandbox-section-heading compact">
                  <h3>AI Pathways</h3>
                  <Wand2 size={17} aria-hidden="true" />
                </div>
                {sandboxFlow.suggestions.map((suggestion) => (
                  <button key={suggestion.id} onClick={() => addSandboxBlock(suggestion.blockKind, 'copilot')}>
                    <strong>{suggestion.title}</strong>
                    <small>{suggestion.detail}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <section className="sandbox-chat" aria-label="Sandbox copilot chat">
            <div className="sandbox-chat-header">
              <div>
                <h3>Sandbox Copilot</h3>
                <p>Uses {agent.name} via Anthropic, selected block, routes, workspace, and toolkits.</p>
              </div>
              <div className="sandbox-chat-actions">
                {['Suggest next block', 'Draft function', 'Find fallback route'].map((item) => (
                  <button key={item} onClick={() => sendSandboxPrompt(item)} disabled={sandboxBusy}>{item}</button>
                ))}
              </div>
            </div>
            <div className="sandbox-conversation" aria-live="polite">
              <ConversationView
                agentName="Sandbox Copilot"
                copiedKey={copiedKey}
                messages={sandboxMessages}
                selectedFile={selectedSandboxBlock?.title ?? ''}
                onCopy={(text, key) => { void copyText(text, key); }}
              />
            </div>
            <form className="composer sandbox-composer" onSubmit={(event) => { event.preventDefault(); void sendSandboxPrompt(); }}>
              <label className="sr-only" htmlFor="sandbox-prompt">Sandbox prompt</label>
              <textarea
                id="sandbox-prompt"
                value={sandboxPrompt}
                onChange={(event) => setSandboxPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendSandboxPrompt();
                  }
                }}
                placeholder="Ask for routes, functions, conditions, verification gates..."
                rows={2}
              />
              <button className="send-button" type="submit" disabled={sandboxBusy} title="Send to sandbox copilot" aria-label="Send to sandbox copilot">
                {sandboxBusy ? <Loader2 className="spin" size={19} /> : <Send size={19} />}
              </button>
            </form>
          </section>
        </aside>
      ) : null}
      {learnOpen && (
        <LearnPanel agent={agent} model={model} onClose={() => setLearnOpen(false)} />
      )}
    </main>
  );
}
