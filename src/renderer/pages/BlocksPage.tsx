import { useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FolderOpen,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  Wand2,
  Waypoints,
  Workflow,
  Wrench
} from 'lucide-react';
import { AGENT_PROFILES } from '../../shared/agents';
import { getPlatformApi } from '../../platform';
import type {
  ChatMessage,
  FableApi,
  FlowBlock,
  FlowBlockKind,
  FlowDefinition,
  FlowRouteKind,
  ToolkitSummary
} from '../../shared/types';
import { useAppContext } from '../context/AppContext';

// ─── Platform API ────────────────────────────────────────────
const platformApi = getPlatformApi();
function fableApi(): FableApi { return platformApi; }

// ─── Flow helpers (same as App.tsx) ─────────────────────────
const makeFlowId = () => `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const makeBlockId = (kind: FlowBlockKind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

type SandboxTemplate = Omit<FlowBlock, 'id' | 'position' | 'suggestedBy'> & { accent: string };

const port = (id: string, name: string, kind: 'input' | 'output', dataType: FlowBlock['inputs'][number]['dataType']) => ({
  id, name, kind, dataType
});

const sandboxBlockTemplates: SandboxTemplate[] = [
  {
    kind: 'trigger', title: 'Intent Trigger',
    description: 'Starts the builder flow from a user goal, file change, schedule, or manual run.',
    instructions: 'Capture the goal and normalize it into a compact build brief.',
    tags: ['entry', 'goal'], accent: '#31caff',
    inputs: [], outputs: [port('brief', 'Brief', 'output', 'text')]
  },
  {
    kind: 'agent', title: 'Agent Reasoning',
    description: 'Delegates planning, review, or implementation reasoning to the selected FableCode agent.',
    instructions: 'Use the active agent profile and local context to produce the next build decision.',
    tags: ['copilot', 'agent'], accent: '#e05a47',
    inputs: [port('context', 'Context', 'input', 'text')],
    outputs: [port('decision', 'Decision', 'output', 'decision')]
  },
  {
    kind: 'tool', title: 'Toolkit Action',
    description: 'Calls into DJMT, VS Code, GitHub, browser automation, cloud, database, or test tooling.',
    instructions: 'Choose the least risky local tool and report exact inputs and outputs.',
    tags: ['toolchain', 'skills'], accent: '#2f8f83',
    inputs: [port('request', 'Request', 'input', 'text')],
    outputs: [port('result', 'Result', 'output', 'json')]
  },
  {
    kind: 'condition', title: 'Route Gate',
    description: 'Branches the pathway based on pass/fail checks, user choice, confidence, or missing context.',
    instructions: 'Evaluate the prior result and choose one clearly labeled route.',
    tags: ['branch', 'decision'], accent: '#b66a1f',
    inputs: [port('signal', 'Signal', 'input', 'decision')],
    outputs: [port('pass', 'Pass', 'output', 'decision'), port('fallback', 'Fallback', 'output', 'decision')]
  },
  {
    kind: 'function', title: 'Function Draft',
    description: 'Defines a reusable function, command wrapper, schema transform, or prompt utility.',
    instructions: 'Draft the function signature, inputs, output contract, and verification notes.',
    tags: ['code', 'function'], accent: '#4f6bed',
    inputs: [port('spec', 'Spec', 'input', 'text')],
    outputs: [port('function', 'Function', 'output', 'text')]
  },
  {
    kind: 'memory', title: 'Holograim Recall',
    description: 'Pulls session memory, durable references, and prior decisions into the active pathway.',
    instructions: 'Query memory for constraints, previous decisions, and reference paths relevant to this block.',
    tags: ['memory', 'context'], accent: '#b45cff',
    inputs: [port('query', 'Query', 'input', 'text')],
    outputs: [port('memory', 'Memory', 'output', 'memory')]
  },
  {
    kind: 'file', title: 'Workspace File',
    description: 'Reads or stages file context from the selected workspace for the agent or tool chain.',
    instructions: 'Select the relevant file set and summarize only the context needed downstream.',
    tags: ['workspace', 'files'], accent: '#9edfff',
    inputs: [port('path', 'Path', 'input', 'file')],
    outputs: [port('content', 'Content', 'output', 'text')]
  },
  {
    kind: 'terminal', title: 'Terminal Check',
    description: 'Runs a build, test, lint, or setup command through the local development toolchain.',
    instructions: 'Specify command, working directory, expected signal, and failure recovery path.',
    tags: ['verify', 'terminal'], accent: '#c6f36d',
    inputs: [port('command', 'Command', 'input', 'command')],
    outputs: [port('output', 'Output', 'output', 'text')]
  },
  {
    kind: 'approval', title: 'Human Approval',
    description: 'Pauses the pathway for a user decision before risky edits, deletes, deploys, or commits.',
    instructions: 'Ask one concise approval question and list the concrete action that will follow.',
    tags: ['gate', 'human'], accent: '#ffd166',
    inputs: [port('request', 'Request', 'input', 'text')],
    outputs: [port('approved', 'Approved', 'output', 'decision')]
  },
  {
    kind: 'output', title: 'Delivery Output',
    description: 'Packages the final answer, artifact, commit summary, or deployment handoff.',
    instructions: 'Produce the final user-facing result and include verification status.',
    tags: ['finish', 'handoff'], accent: '#ff6b9e',
    inputs: [port('result', 'Result', 'input', 'any')],
    outputs: []
  }
];

function templateForKind(kind: FlowBlockKind): SandboxTemplate {
  return sandboxBlockTemplates.find((t) => t.kind === kind) ?? sandboxBlockTemplates[0];
}

function createSandboxBlock(
  template: SandboxTemplate,
  position: FlowBlock['position'],
  suggestedBy: FlowBlock['suggestedBy'] = 'user'
): FlowBlock {
  return {
    id: makeBlockId(template.kind),
    kind: template.kind, title: template.title, description: template.description,
    instructions: template.instructions, position,
    inputs: template.inputs, outputs: template.outputs, tags: template.tags, suggestedBy
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
      { id: `route-${trigger.id}-${agentBlock.id}`, fromBlockId: trigger.id, fromPortId: 'brief', toBlockId: agentBlock.id, toPortId: 'context', label: 'brief to agent', kind: 'default' },
      { id: `route-${agentBlock.id}-${toolBlock.id}`, fromBlockId: agentBlock.id, fromPortId: 'decision', toBlockId: toolBlock.id, toPortId: 'request', label: 'tool action', kind: 'ai-selected' },
      { id: `route-${toolBlock.id}-${outputBlock.id}`, fromBlockId: toolBlock.id, fromPortId: 'result', toBlockId: outputBlock.id, toPortId: 'result', label: 'verified output', kind: 'success' }
    ],
    suggestions: [
      { id: 'suggest-memory', title: 'Add recall before planning', detail: 'Pull Holograim memory into the pathway before the reasoning block.', blockKind: 'memory', routeKind: 'default' },
      { id: 'suggest-approval', title: 'Gate risky actions', detail: 'Insert a human approval block before terminal, deploy, delete, or commit actions.', blockKind: 'approval', routeKind: 'manual-approval' },
      { id: 'suggest-condition', title: 'Branch after verification', detail: 'Split success and fallback routes from a test or build check.', blockKind: 'condition', routeKind: 'condition' }
    ],
    updatedAt: new Date().toISOString()
  };
}

function flowBlockIcon(kind: FlowBlockKind) {
  switch (kind) {
    case 'agent': case 'model': return <BrainCircuit size={15} aria-hidden="true" />;
    case 'tool': return <Wrench size={15} aria-hidden="true" />;
    case 'function': return <SlidersHorizontal size={15} aria-hidden="true" />;
    case 'condition': case 'route': return <Route size={15} aria-hidden="true" />;
    case 'memory': return <Database size={15} aria-hidden="true" />;
    case 'file': return <FolderOpen size={15} aria-hidden="true" />;
    case 'terminal': return <TerminalSquare size={15} aria-hidden="true" />;
    case 'git': return <GitBranch size={15} aria-hidden="true" />;
    case 'approval': return <ShieldCheck size={15} aria-hidden="true" />;
    case 'output': return <CheckCircle2 size={15} aria-hidden="true" />;
    default: return <Workflow size={15} aria-hidden="true" />;
  }
}

function blockClassName(kind: FlowBlockKind): string {
  return `block-kind-${kind}`;
}

function setSandboxNodeTransform(element: HTMLButtonElement | null, position: FlowBlock['position']) {
  if (!element) return;
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

function buildModelPrompt(userPrompt: string, contextBlocks: string[]): string {
  const context = contextBlocks.filter(Boolean).join('\n\n');
  if (!context) return userPrompt;
  return ['USER REQUEST:', userPrompt, 'BACKGROUND CONTEXT:', chatContextInstruction, context].join('\n\n');
}

// ─── ConversationView ─────────────────────────────────────────
function ConversationView({
  agentName, copiedKey, messages, selectedFile, onCopy
}: Readonly<{
  agentName: string; copiedKey: string; messages: ChatMessage[]; selectedFile: string;
  onCopy: (text: string, key: string) => void;
}>) {
  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <ShieldCheck size={30} aria-hidden="true" />
        <h3>Grid Sandbox</h3>
        <p>{selectedFile ? `Selected block: ${selectedFile}` : 'Add blocks and routes, then ask the copilot.'}</p>
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

// ─── BlocksPage ───────────────────────────────────────────────
export function BlocksPage() {
  const { agentId, model } = useAppContext();
  const agent = useMemo(
    () => AGENT_PROFILES.find((p) => p.id === agentId) ?? AGENT_PROFILES[0],
    [agentId]
  );

  const [sandboxFlow, setSandboxFlow] = useState<FlowDefinition>(() => createStarterFlow());
  const [selectedSandboxBlockId, setSelectedSandboxBlockId] = useState('');
  const [sandboxMessages, setSandboxMessages] = useState<ChatMessage[]>([]);
  const [sandboxPrompt, setSandboxPrompt] = useState('Suggest the next block and route for this builder flow.');
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [toolkits] = useState<ToolkitSummary | null>(null);
  const [copiedKey, setCopiedKey] = useState('');

  const selectedSandboxBlock = useMemo(() => {
    return sandboxFlow.blocks.find((b) => b.id === selectedSandboxBlockId) ?? sandboxFlow.blocks[0] ?? null;
  }, [sandboxFlow.blocks, selectedSandboxBlockId]);

  const sandboxContext = useMemo(() => {
    const selected = selectedSandboxBlock
      ? `${selectedSandboxBlock.title} (${selectedSandboxBlock.kind}): ${selectedSandboxBlock.instructions}`
      : 'No block selected.';
    const routeList = sandboxFlow.routes.map((r) => `${r.label}: ${r.fromBlockId} -> ${r.toBlockId}`).join('\n');
    const blockList = sandboxFlow.blocks.map((b) => `${b.title} [${b.kind}]`).join(', ');
    const capabilityList = toolkits?.capabilities
      .filter((c) => c.status !== 'missing')
      .slice(0, 10)
      .map((c) => `${c.name} (${c.status})`)
      .join(', ');
    return [
      `Flow: ${sandboxFlow.name}`,
      `Goal: ${sandboxFlow.goal}`,
      `Selected block: ${selected}`,
      `Blocks: ${blockList}`,
      routeList ? `Routes:\n${routeList}` : 'Routes: none yet',
      capabilityList ? `Available devtool skills: ${capabilityList}` : ''
    ].filter(Boolean).join('\n');
  }, [sandboxFlow, selectedSandboxBlock, toolkits]);

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
      const selected = current.blocks.find((b) => b.id === selectedSandboxBlock?.id);
      const nextRoutes = [...current.routes];
      if (selected?.outputs[0] && newBlock.inputs[0]) {
        nextRoutes.push({
          id: `route-${selected.id}-${newBlock.id}`,
          fromBlockId: selected.id, fromPortId: selected.outputs[0].id,
          toBlockId: newBlock.id, toPortId: newBlock.inputs[0].id,
          label: `${selected.title} to ${newBlock.title}`,
          kind: suggestedBy === 'copilot' ? 'ai-selected' : 'default'
        });
      }
      return { ...current, blocks: [...current.blocks, newBlock], routes: nextRoutes };
    });
    setSelectedSandboxBlockId(newBlock.id);
  }

  function updateSandboxGoal(goal: string) {
    mutateSandboxFlow((current) => ({ ...current, goal }));
  }

  function updateSelectedSandboxBlock(patch: Partial<Pick<FlowBlock, 'title' | 'description' | 'instructions'>>) {
    if (!selectedSandboxBlock) return;
    mutateSandboxFlow((current) => ({
      ...current,
      blocks: current.blocks.map((b) => b.id === selectedSandboxBlock.id ? { ...b, ...patch } : b)
    }));
  }

  function connectSandboxBlocks(toBlockId: string, kind: FlowRouteKind = 'default') {
    if (!selectedSandboxBlock || selectedSandboxBlock.id === toBlockId || !selectedSandboxBlock.outputs[0]) return;
    mutateSandboxFlow((current) => {
      const target = current.blocks.find((b) => b.id === toBlockId);
      if (!target?.inputs[0]) return current;
      const alreadyConnected = current.routes.some((r) =>
        r.fromBlockId === selectedSandboxBlock.id && r.toBlockId === target.id
      );
      if (alreadyConnected) return current;
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
    if (!block) return;
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
    if (!trimmed || sandboxBusy) return;
    if (!model.trim()) return;
    const nextMessages: ChatMessage[] = [...sandboxMessages, { role: 'user', content: trimmed }];
    const flowPrompt = buildModelPrompt(trimmed, [
      'Grid Sandbox context:',
      sandboxContext,
      'Respond as a builder-copilot for a visual block workflow. Suggest concrete blocks, route labels, function signatures, and verification gates. Keep the answer actionable.'
    ]);
    setSandboxMessages(nextMessages);
    setSandboxPrompt('');
    setSandboxBusy(true);
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
    } catch {
      // Error silently handled — UI already shows busy state.
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

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      globalThis.setTimeout(() => setCopiedKey((c) => c === key ? '' : c), 1400);
    } catch {
      // Clipboard unavailable.
    }
  }

  return (
    <div className="blocks-page">
      {/* ── Left: chat copilot ── */}
      <section className="blocks-chat" aria-label="Sandbox copilot chat">
        <div className="sandbox-chat-header">
          <div>
            <h3>Sandbox Copilot</h3>
            <p>Uses {agent.name} · {sandboxFlow.blocks.length} blocks · {sandboxFlow.routes.length} routes</p>
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
        <form className="composer sandbox-composer" onSubmit={(e) => { e.preventDefault(); void sendSandboxPrompt(); }}>
          <label className="sr-only" htmlFor="blocks-sandbox-prompt">Sandbox prompt</label>
          <textarea
            id="blocks-sandbox-prompt"
            value={sandboxPrompt}
            onChange={(e) => setSandboxPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendSandboxPrompt(); } }}
            placeholder="Ask for routes, functions, conditions, verification gates..."
            rows={2}
          />
          <button className="send-button" type="submit" disabled={sandboxBusy} title="Send" aria-label="Send">
            {sandboxBusy ? <Loader2 className="spin" size={19} /> : <Send size={19} />}
          </button>
        </form>
      </section>

      {/* ── Right: canvas + palette + inspector ── */}
      <div className="blocks-canvas-area">
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
              <label htmlFor="blocks-sandbox-goal">Flow goal</label>
              <input
                id="blocks-sandbox-goal"
                value={sandboxFlow.goal}
                onChange={(e) => updateSandboxGoal(e.target.value)}
              />
            </div>
            <div className="sandbox-canvas">
              <svg className="sandbox-routes" viewBox="0 0 1180 720" preserveAspectRatio="none" aria-hidden="true">
                {sandboxFlow.routes.map((route) => {
                  const source = sandboxFlow.blocks.find((b) => b.id === route.fromBlockId);
                  const target = sandboxFlow.blocks.find((b) => b.id === route.toBlockId);
                  if (!source || !target) return null;
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
                <label htmlFor="blocks-block-title">Title</label>
                <input
                  id="blocks-block-title"
                  value={selectedSandboxBlock.title}
                  onChange={(e) => updateSelectedSandboxBlock({ title: e.target.value })}
                />
                <label htmlFor="blocks-block-description">Description</label>
                <textarea
                  id="blocks-block-description"
                  rows={3}
                  value={selectedSandboxBlock.description}
                  onChange={(e) => updateSelectedSandboxBlock({ description: e.target.value })}
                />
                <label htmlFor="blocks-block-instructions">Instructions</label>
                <textarea
                  id="blocks-block-instructions"
                  rows={5}
                  value={selectedSandboxBlock.instructions}
                  onChange={(e) => updateSelectedSandboxBlock({ instructions: e.target.value })}
                />
                <div className="route-picker">
                  <strong>Route from selected</strong>
                  {sandboxFlow.blocks
                    .filter((b) => b.id !== selectedSandboxBlock.id && b.inputs.length > 0)
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
      </div>
    </div>
  );
}
