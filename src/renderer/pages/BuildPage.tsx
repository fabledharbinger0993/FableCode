import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Boxes,
  Bug,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  FolderOpen,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
  Wrench
} from 'lucide-react';
import { AGENT_PROFILES } from '../../shared/agents';
import { getPlatformApi, isHttpPlatform } from '../../platform';
import type {
  ChatMessage,
  DebugReport,
  FableApi,
  HolograimStatus,
  PersistenceSnapshot,
  ToolkitCapability,
  ToolkitSummary,
  ToolchainSummary,
  WorkspaceFile
} from '../../shared/types';
import { useAppContext } from '../context/AppContext';

const quickPrompts = [
  'Plan the next implementation step.',
  'Review this file for risks and missing tests.',
  'Suggest a minimal refactor that preserves behavior.',
  'Write a clear commit summary for these changes.'
];

const defaultToolchainRoot = '/Volumes/DJMT/FABLEDHARBINGER/toolchains';
const makeSessionId = () => `fablecode-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Module-level platform API singleton — created once, shared across renders.
const platformApi = getPlatformApi();
// True when running in the Capacitor / browser context (no Electron IPC).
const httpPlatform = isHttpPlatform();

const chatContextInstruction = [
  'Answer the user request directly. The following context is background only.',
  'Use paths, tools, recall, or file contents only when they help the answer.',
  'Do not summarize or list available tools unless the user specifically asks about tools.'
].join(' ');

function fableApi(): FableApi {
  return platformApi;
}

function recallStatusText(available: boolean, count: number, error?: string): string {
  if (!available) {
    return `Holograim unavailable: ${error ?? 'no recall results'}`;
  }
  const memoryWord = count === 1 ? 'memory' : 'memories';
  return `Holograim returned ${count} ${memoryWord}.`;
}

function persistenceSaveLabel(holograimQueued?: boolean, holograimStored?: boolean): string {
  if (holograimQueued) return 'Saved locally, Holograim queued';
  if (holograimStored) return 'Saved locally and to Holograim';
  return 'Saved locally';
}

function buildModelPrompt(userPrompt: string, contextBlocks: string[]): string {
  const context = contextBlocks.filter(Boolean).join('\n\n');
  if (!context) return userPrompt;
  return [
    'USER REQUEST:',
    userPrompt,
    'BACKGROUND CONTEXT:',
    chatContextInstruction,
    context
  ].join('\n\n');
}

function formatConversationForClipboard(messages: ChatMessage[]): string {
  return messages.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n---\n\n');
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
            onChange={(e) => onRecallQueryChange(e.target.value)}
          />
          <button className="icon-button" onClick={onRefreshRecall} title="Query Holograim" aria-label="Query Holograim">
            <Search size={16} />
          </button>
        </div>
        <div className="recall-list" aria-label="Recalled Holograim memories">
          {recall.length > 0 ? recall.slice(0, 4).map((item, i) => (
            <p key={`${item.slice(0, 30)}-${i}`}>{item}</p>
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
  const available = capabilities.filter((c) => c.status === 'available');
  const partial = capabilities.filter((c) => c.status === 'partial');
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

export function BuildPage() { // NOSONAR - The Electron workbench state remains centralized until the planned component split.
  const { agentId, setAgentId, model, setModel, models, setModels } = useAppContext();

  const [sessionId, setSessionId] = useState(makeSessionId);
  const [workspacePath, setWorkspacePath] = useState('');
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [backendUrl, setBackendUrl] = useState(
    () => (httpPlatform ? (localStorage.getItem('fablecode_backend_url') ?? 'http://localhost:3333') : '')
  );
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
  const [busy, setBusy] = useState<'models' | 'workspace' | 'chat' | 'debug' | 'toolchain' | 'toolkits' | null>(null);
  const [status, setStatus] = useState('Ready');
  const hydratedRef = useRef(false);
  const brandDragRef = useRef<HTMLDivElement>(null);
  const chatInFlightRef = useRef(false);

  const agent = useMemo(
    () => AGENT_PROFILES.find((p) => p.id === agentId) ?? AGENT_PROFILES[0],
    [agentId]
  );

  const filteredFiles = useMemo(() => {
    const query = fileFilter.trim().toLowerCase();
    if (!query) return files;
    return files.filter((f) => f.path.toLowerCase().includes(query));
  }, [fileFilter, files]);

  const filteredCommands = useMemo(() => {
    const commands = toolchain?.commands ?? [];
    const query = toolFilter.trim().toLowerCase();
    if (!query) return commands;
    return commands.filter((c) =>
      c.name.toLowerCase().includes(query) || c.source.toLowerCase().includes(query)
    );
  }, [toolFilter, toolchain]);

  const toolchainContext = useMemo(() => {
    if (!toolchain?.exists) return '';
    const commandNames = toolchain.commands.slice(0, 28).map((c) => `${c.name} (${c.source})`).join(', ');
    const configFiles = toolchain.configFiles.join(', ');
    return [
      `Root: ${toolchain.rootPath}`,
      toolchain.activationCommand ? `Activate: ${toolchain.activationCommand}` : '',
      commandNames ? `Commands: ${commandNames}` : '',
      configFiles ? `Config: ${configFiles}` : ''
    ].filter(Boolean).join('\n');
  }, [toolchain]);

  const toolkitContext = useMemo(() => {
    if (!toolkits) return '';
    return toolkits.capabilities
      .filter((c) => c.status !== 'missing')
      .slice(0, 7)
      .map((c) => {
        const commands = c.commands.slice(0, 4).map((cmd) => cmd.name).join(', ');
        const configs = c.configFiles.slice(0, 3).join(', ');
        const sources = c.sources.join(', ');
        return `${c.name}: ${c.status}; sources: ${sources || 'none'}; ${commands ? `commands: ${commands}; ` : ''}${configs ? `configs: ${configs}; ` : ''}${c.summary}`;
      })
      .join('\n');
  }, [toolkits]);

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
    if (!hydratedRef.current) return;
    const handle = globalThis.setTimeout(() => {
      void savePersistenceSnapshot();
    }, 1600);
    return () => globalThis.clearTimeout(handle);
  }, [agentId, debugFocus, fileFilter, includeToolchainContext, messages, model, selectedFile, toolchainRoot, workspacePath]);

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
        setStatus('Models loaded.');
      } else {
        setModel((current: string) => current || agent.modelHint);
        setStatus('No models available.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load models.');
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
        selectedFile: restoredSelectedFile,
        sessionId: restoredSessionId,
        toolchainRoot: restoredToolchainRoot,
        workspacePath: restoredWorkspacePath
      } = result.snapshot;

      setSessionId(restoredSessionId || makeSessionId());
      setAgentId(restoredAgentId || 'mojo-dojo');
      setModel(restoredModel || '');
      setWorkspacePath(restoredWorkspacePath || '');
      setSelectedFile(restoredSelectedFile || '');
      setFileFilter(restoredFileFilter || '');
      setToolchainRoot(restoredToolchainRoot || defaultToolchainRoot);
      setIncludeToolchainContext(restoredToolchainContext);
      setDebugFocus(restoredDebugFocus || debugFocus);
      setMessages(restoredMessages || []);
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
      messages
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
      let pickedPath: string | null;
      if (httpPlatform) {
        pickedPath = workspaceInput.trim() || null;
      } else {
        pickedPath = await fableApi().pickWorkspace();
      }
      if (!pickedPath) return;
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
    if (!workspacePath) return;
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
    if (chatInFlightRef.current) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!model.trim()) {
      setStatus('Choose a model first.');
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
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
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
      setStatus(error instanceof Error ? error.message : 'The model request failed.');
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
    const commands = capability.commands.slice(0, 6).map((c) => c.name).join(', ');
    const configs = capability.configFiles.slice(0, 4).join(', ');
    setPrompt([
      'Use the ', capability.name, ' capability in FableCode. Status: ', capability.status, '. ',
      commands ? `Available commands: ${commands}. ` : '',
      configs ? `Workspace configs: ${configs}. ` : '',
      'Suggest the safest next action for this workspace.'
    ].join(''));
  }

  function saveBackendUrl(url: string) {
    const trimmed = url.trim();
    setBackendUrl(trimmed);
    try {
      localStorage.setItem('fablecode_backend_url', trimmed);
    } catch {
      // localStorage may be unavailable in sandboxed contexts.
    }
    globalThis.location.reload();
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

        {httpPlatform ? (
          <form
            className="workspace-path-form"
            onSubmit={(e) => { e.preventDefault(); void openWorkspace(); }}
          >
            <label className="sr-only" htmlFor="workspace-path-input">Workspace path on server</label>
            <input
              id="workspace-path-input"
              className="workspace-path-input"
              value={workspaceInput}
              onChange={(e) => setWorkspaceInput(e.target.value)}
              placeholder="/path/to/project"
            />
          </form>
        ) : null}

        {/* Mode navigation links */}
        <nav className="rail-mode-nav" aria-label="Switch mode">
          <NavLink to="/blocks" className={({ isActive }) => `rail-mode-link${isActive ? ' active' : ''}`}>
            <Workflow size={16} aria-hidden="true" />
            <span>Blocks</span>
          </NavLink>
          <NavLink to="/school" className={({ isActive }) => `rail-mode-link${isActive ? ' active' : ''}`}>
            <BookOpen size={16} aria-hidden="true" />
            <span>School</span>
          </NavLink>
          <NavLink to="/preview" className={({ isActive }) => `rail-mode-link${isActive ? ' active' : ''}`}>
            <Code2 size={16} aria-hidden="true" />
            <span>Preview</span>
          </NavLink>
        </nav>

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

        <section className="rail-section model-box" aria-labelledby="model-heading">
          <div className="section-heading">
            <h2 id="model-heading">Model</h2>
            <button className="icon-button" onClick={refreshModels} title="Refresh models" aria-label="Refresh models">
              {busy === 'models' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
            </button>
          </div>
          <label htmlFor="model-input">Groq Model</label>
          <select
            id="model-input"
            className="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p aria-live="polite">{status}</p>
        </section>

        {httpPlatform ? (
          <section className="rail-section backend-section" aria-labelledby="backend-heading">
            <h2 id="backend-heading">Backend</h2>
            <p>Server URL for AI and file access</p>
            <form
              className="backend-form"
              onSubmit={(e) => { e.preventDefault(); saveBackendUrl(backendUrl); }}
            >
              <label className="sr-only" htmlFor="backend-url-input">Backend server URL</label>
              <input
                id="backend-url-input"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://192.168.x.x:3333"
              />
              <button type="submit" className="icon-button" title="Save and reload" aria-label="Save backend URL">
                <Check size={16} />
              </button>
            </form>
          </section>
        ) : null}
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
            onChange={(e) => setFileFilter(e.target.value)}
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

        <form className="composer" onSubmit={(e) => { e.preventDefault(); void sendPrompt(); }}>
          <label className="sr-only" htmlFor="agent-prompt">Agent prompt</label>
          <textarea
            id="agent-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
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
        {!httpPlatform ? (
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
                onChange={(e) => setToolchainRoot(e.target.value)}
              />
              <button className="icon-button" onClick={() => { void refreshToolchain(); void refreshToolkits(); }} title="Inspect toolchain" aria-label="Inspect toolchain">
                {busy === 'toolchain' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              </button>
            </div>
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={includeToolchainContext}
                onChange={(e) => setIncludeToolchainContext(e.target.checked)}
              />
              <span>Include toolchain in agent context</span>
            </label>
            {toolchain?.exists ? (
              <div className="toolchain-card">
                <div className="metric-grid">
                  <span><strong>{toolchain.commands.length}</strong> commands</span>
                  <span><strong>{toolchain.directories.length}</strong> roots</span>
                </div>
                {toolchain.activationCommand ? <code>{toolchain.activationCommand}</code> : null}
                <label className="search-box compact-search" htmlFor="tool-filter">
                  <Search size={15} aria-hidden="true" />
                  <input
                    id="tool-filter"
                    value={toolFilter}
                    onChange={(e) => setToolFilter(e.target.value)}
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
        ) : null}

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
            onChange={(e) => setDebugFocus(e.target.value)}
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
    </main>
  );
}
