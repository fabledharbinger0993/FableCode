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
import {
  LOGIX_BLOCK_TEMPLATES,
  createLogixBlock,
  createLogixStarterFlow,
  templateForLogixKind,
  validateLogixFlow
} from '../labs/logix';
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
        <h3>Logix Chain</h3>
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

  const [sandboxFlow, setSandboxFlow] = useState<FlowDefinition>(() => createLogixStarterFlow());
  const [selectedSandboxBlockId, setSelectedSandboxBlockId] = useState('');
  const [sandboxMessages, setSandboxMessages] = useState<ChatMessage[]>([]);
  const [sandboxPrompt, setSandboxPrompt] = useState('Suggest the next node and route for this Logix chain.');
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [toolkits] = useState<ToolkitSummary | null>(null);
  const [copiedKey, setCopiedKey] = useState('');

  const selectedSandboxBlock = useMemo(() => {
    return sandboxFlow.blocks.find((b) => b.id === selectedSandboxBlockId) ?? sandboxFlow.blocks[0] ?? null;
  }, [sandboxFlow.blocks, selectedSandboxBlockId]);

  const logixIssues = useMemo(() => validateLogixFlow(sandboxFlow), [sandboxFlow]);

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
    const validationList = logixIssues.length > 0
      ? logixIssues.slice(0, 8).map((issue) => `${issue.severity}: ${issue.title} - ${issue.detail}`).join('\n')
      : 'No Logix validation issues.';
    return [
      `Flow: ${sandboxFlow.name}`,
      `Goal: ${sandboxFlow.goal}`,
      `Selected block: ${selected}`,
      `Blocks: ${blockList}`,
      routeList ? `Routes:\n${routeList}` : 'Routes: none yet',
      `Validation:\n${validationList}`,
      capabilityList ? `Available devtool skills: ${capabilityList}` : ''
    ].filter(Boolean).join('\n');
  }, [sandboxFlow, selectedSandboxBlock, toolkits, logixIssues]);

  function mutateSandboxFlow(updater: (flow: FlowDefinition) => FlowDefinition) {
    setSandboxFlow((current) => ({
      ...updater(current),
      updatedAt: new Date().toISOString()
    }));
  }

  function addSandboxBlock(kind: FlowBlockKind, suggestedBy: FlowBlock['suggestedBy'] = 'user') {
    const template = templateForLogixKind(kind);
    const offset = sandboxFlow.blocks.length * 42;
    const newBlock = createLogixBlock(template, {
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
      'Logix chain context:',
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
          { role: 'system', content: `${agent.systemPrompt}\nYou are also operating inside FabledLabs: Logix, a visual logic-chain builder for blocks, routes, validation gates, and reusable execution patterns.` },
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
    const nextFlow = createLogixStarterFlow();
    setSandboxFlow(nextFlow);
    setSelectedSandboxBlockId(nextFlow.blocks[0]?.id ?? '');
    setSandboxMessages([]);
    setSandboxPrompt('Suggest the next node and route for this Logix chain.');
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
            <span className="eyebrow">Logix Chain</span>
            <h2>{sandboxFlow.name}</h2>
            <p>{sandboxFlow.blocks.length} nodes / {sandboxFlow.routes.length} routes / {logixIssues.length} checks / updated {new Date(sandboxFlow.updatedAt).toLocaleTimeString()}</p>
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
              {LOGIX_BLOCK_TEMPLATES.map((template) => (
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
            <div className="suggestion-stack">
              <div className="sandbox-section-heading compact">
                <h3>Validation</h3>
                <CheckCircle2 size={17} aria-hidden="true" />
              </div>
              {logixIssues.length > 0 ? logixIssues.slice(0, 4).map((issue) => (
                <button key={issue.id} className={`logix-issue logix-issue-${issue.severity}`} type="button">
                  <strong>{issue.title}</strong>
                  <small>{issue.detail}</small>
                </button>
              )) : (
                <div className="empty-debug">No chain validation issues.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
