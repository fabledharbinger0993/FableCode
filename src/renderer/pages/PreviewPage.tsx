import { useRef, useState } from 'react';
import { Bot, Check, Copy, ExternalLink, Loader2, RefreshCw, Send } from 'lucide-react';
import { AGENT_PROFILES } from '../../shared/agents';
import { getPlatformApi } from '../../platform';
import type { ChatMessage, FableApi } from '../../shared/types';
import { useAppContext } from '../context/AppContext';

const platformApi = getPlatformApi();
function fableApi(): FableApi { return platformApi; }

const previewSystemPrompt = (agentSystemPrompt: string) =>
  `${agentSystemPrompt}\n\nYou are operating in FableCode Preview mode. The user is looking at a live preview of their code in an iframe. Help them debug, test, and troubleshoot what they see. Keep responses concise and actionable. Ask clarifying questions when the issue is ambiguous.`;

function ConversationView({
  agentName, copiedKey, messages, onCopy
}: Readonly<{
  agentName: string; copiedKey: string; messages: ChatMessage[];
  onCopy: (text: string, key: string) => void;
}>) {
  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <ExternalLink size={28} aria-hidden="true" />
        <h3>Preview mode</h3>
        <p>Enter a URL or paste HTML to preview, then ask the agent to help you debug or test it.</p>
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

const QUICK_PROMPTS = [
  'What do you see in the preview?',
  'Check for layout or style issues.',
  'Is there anything broken or missing?',
  'Suggest one improvement to this UI.'
];

export function PreviewPage() {
  const { agentId, model } = useAppContext();
  const agent = AGENT_PROFILES.find((p) => p.id === agentId) ?? AGENT_PROFILES[0];

  const [previewUrl, setPreviewUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [useHtml, setUseHtml] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const chatInFlight = useRef(false);

  function loadUrl() {
    const url = previewUrl.trim();
    if (!url) return;
    setActiveUrl(url);
    setUseHtml(false);
  }

  function loadHtml() {
    setUseHtml(true);
    setActiveUrl('');
  }

  async function sendPrompt(text = prompt) {
    if (chatInFlight.current || busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!model.trim()) return;

    chatInFlight.current = true;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setPrompt('');
    setBusy(true);

    try {
      const previewContext = useHtml
        ? `User is previewing custom HTML (${htmlSource.length} chars).`
        : activeUrl
        ? `User is previewing URL: ${activeUrl}`
        : 'No preview loaded yet.';

      const response = await fableApi().chat({
        model: model.trim(),
        temperature: agent.temperature,
        messages: [
          { role: 'system', content: previewSystemPrompt(agent.systemPrompt) },
          { role: 'system', content: `Preview context: ${previewContext}` },
          ...messages.slice(-10),
          { role: 'user', content: trimmed }
        ]
      });
      setMessages([...nextMessages, { role: 'assistant', content: response || 'The model returned an empty response.' }]);
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'Request failed. Check your model and API key.' }]);
    } finally {
      setBusy(false);
      chatInFlight.current = false;
    }
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

  const srcdoc = useHtml
    ? `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>html,body{margin:0;padding:12px;background:#111;color:#eee;font-family:sans-serif}</style></head><body>${htmlSource}</body></html>`
    : undefined;

  return (
    <div className="preview-page">
      {/* ── Left: chat ── */}
      <section className="preview-chat" aria-label="Preview agent chat">
        <div className="panel-header chat-heading">
          <div>
            <h2>{agent.name}</h2>
            <p>Preview &amp; debug</p>
          </div>
          <Bot size={24} color={agent.color} aria-hidden="true" />
        </div>

        <div className="quick-prompts" aria-label="Quick prompts">
          {QUICK_PROMPTS.map((item) => (
            <button key={item} onClick={() => sendPrompt(item)} disabled={busy}>
              {item}
            </button>
          ))}
        </div>

        <div className="conversation" aria-live="polite">
          <ConversationView
            agentName={agent.name}
            copiedKey={copiedKey}
            messages={messages}
            onCopy={(text, key) => { void copyText(text, key); }}
          />
        </div>

        <form className="composer" onSubmit={(e) => { e.preventDefault(); void sendPrompt(); }}>
          <label className="sr-only" htmlFor="preview-prompt">Agent prompt</label>
          <textarea
            id="preview-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendPrompt(); } }}
            placeholder="Describe what you see or ask about the preview..."
            rows={3}
          />
          <button className="send-button" type="submit" disabled={busy} title="Send" aria-label="Send">
            {busy ? <Loader2 className="spin" size={19} /> : <Send size={19} />}
          </button>
        </form>
      </section>

      {/* ── Right: preview pane ── */}
      <section className="preview-pane" aria-label="Live preview">
        <div className="preview-toolbar">
          <div className="preview-toolbar-row">
            <form className="preview-url-form" onSubmit={(e) => { e.preventDefault(); loadUrl(); }}>
              <label className="sr-only" htmlFor="preview-url">Preview URL</label>
              <input
                id="preview-url"
                className="preview-url-input"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="https://example.com or leave blank to use HTML"
              />
              <button type="submit" className="icon-button" title="Load URL" aria-label="Load URL">
                <RefreshCw size={16} />
              </button>
            </form>
          </div>
          <div className="preview-toolbar-row preview-mode-row">
            <button
              className={`preview-mode-btn${!useHtml ? ' active' : ''}`}
              onClick={loadUrl}
              disabled={!previewUrl.trim()}
            >
              URL
            </button>
            <button
              className={`preview-mode-btn${useHtml ? ' active' : ''}`}
              onClick={loadHtml}
            >
              HTML
            </button>
            {useHtml && (
              <textarea
                className="preview-html-input"
                value={htmlSource}
                onChange={(e) => setHtmlSource(e.target.value)}
                placeholder="<div>Paste or type HTML here…</div>"
                rows={4}
              />
            )}
          </div>
        </div>

        <div className="preview-frame-wrapper">
          {(activeUrl || useHtml) ? (
            <iframe
              className="preview-frame"
              src={!useHtml ? activeUrl : undefined}
              srcDoc={srcdoc}
              sandbox="allow-scripts allow-forms"
              title="Live preview"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="preview-empty">
              <ExternalLink size={40} aria-hidden="true" />
              <p>Enter a URL above or switch to HTML mode to start previewing.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
