import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './LearnPanel.css';
import {
  RINGS,
  RING_1_GUIDED,
  RING_1_FAST,
  RING_2_GUIDED,
  RING_2_FAST,
  RING_3_GUIDED,
  RING_3_FAST,
  RING_4_GUIDED,
  RING_4_FAST,
  RING_5_GUIDED,
  RING_5_FAST
} from '../shared/lessons';
import { buildLessonHelpIndex } from '../shared/lessonHelp';
import type {
  AgentProfile,
  ChatMessage,
  Lesson,
  LessonHelpScenario,
  LessonParam,
  SliderParam,
  ColorParam,
  SelectParam,
  RingId,
  PacingMode
} from '../shared/types';

// ─── fableApi bridge ──────────────────────────────────────
declare global {
  interface Window {
    fableApi?: {
      chat: (payload: { model: string; messages: ChatMessage[]; temperature?: number }) => Promise<string>;
    };
  }
}

function fableApi() {
  const bridge = window.fable ?? window.fableApi;
  if (!bridge) throw new Error('Electron API bridge not found');
  return bridge;
}

// ─── Shadow state ─────────────────────────────────────────
interface ShadowState { x: number; y: number; blur: number; spread: number; color: string }

function initShadow(params: LessonParam[]): ShadowState {
  const s: ShadowState = { x: 4, y: 4, blur: 12, spread: 0, color: '#000000' };
  for (const p of params) {
    if (!('shadow_component' in p) || !p.shadow_component) continue;
    if (p.shadow_component === 'color') s.color = String(p.default);
    else s[p.shadow_component as 'x' | 'y' | 'blur' | 'spread'] = Number(p.default);
  }
  return s;
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const big = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  return { r: (big >> 16) & 255, g: (big >> 8) & 255, b: big & 255 };
}

function buildShadow(s: ShadowState): string {
  const { r, g, b } = hexToRgb(s.color);
  return `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgba(${r}, ${g}, ${b}, 0.5)`;
}

// ─── Surgical CSS updater (ported from learn.js) ──────────
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateCSSProperty(css: string, property: string, newValue: string, selector: string | null | undefined): string {
  const propRegex = new RegExp(`(${escapeRegex(property)}\\s*:\\s*)([^;\\n]+)(;)`, 'g');

  if (!selector) {
    return css.replace(propRegex, `$1${newValue}$3`);
  }

  let result = '';
  let pos = 0;
  while (pos < css.length) {
    const closeIdx = css.indexOf('}', pos);
    if (closeIdx === -1) { result += css.substring(pos); break; }
    const block = css.substring(pos, closeIdx + 1);
    const openIdx = block.indexOf('{');
    if (openIdx !== -1) {
      const blockSelector = block.substring(0, openIdx).trim();
      const selectors = blockSelector.split(',').map(s => s.trim());
      if (selectors.includes(selector)) {
        result += block.replace(propRegex, `$1${newValue}$3`);
        pos = closeIdx + 1;
        continue;
      }
    }
    result += block;
    pos = closeIdx + 1;
  }
  return result;
}

function approximateColorName(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  if (r > 200 && g < 80  && b < 80)  return 'red (approximate)';
  if (r < 80  && g > 180 && b < 80)  return 'green (approximate)';
  if (r < 80  && g < 80  && b > 200) return 'blue (approximate)';
  if (r > 200 && g > 180 && b < 80)  return 'yellow (approximate)';
  if (r > 200 && g < 80  && b > 180) return 'magenta (approximate)';
  if (r < 80  && g > 180 && b > 180) return 'cyan (approximate)';
  if (r > 220 && g > 220 && b > 220) return 'white (approximate)';
  if (r < 40  && g < 40  && b < 40)  return 'black (approximate)';
  if (r > 160 && g > 100 && b < 80)  return 'orange (approximate)';
  if (r > 130 && g < 80  && b > 130) return 'purple (approximate)';
  return 'custom color';
}

function harbingerFocus(lesson: Lesson): string {
  switch (lesson.phaseType) {
    case 'intro':
      return 'Frame the concept, then anchor it with one clean example.';
    case 'core':
      return 'Reinforce the state transition and verify each visible change.';
    case 'translation':
      return 'Map code and blocks one-to-one before adding complexity.';
    case 'interference':
      return 'Trace the divergence point first, then patch the smallest mismatch.';
    case 'synthesis':
      return 'Keep both representations in lockstep while building the feature.';
    case 'finale':
      return 'Stress test parity and gate criteria before advancing rings.';
    default:
      return 'Maintain parity and momentum through the lesson sequence.';
  }
}

// ─── Props ────────────────────────────────────────────────
interface Props {
  agent: AgentProfile;
  model: string;
  onClose: () => void;
}

const HARBINGER_IMAGE_PATH = './harbinger.png';

const LESSONS_BY_RING_MODE: Record<RingId, Record<PacingMode, Lesson[]>> = {
  ring_1: { guided: RING_1_GUIDED, fast: RING_1_FAST },
  ring_2: { guided: RING_2_GUIDED, fast: RING_2_FAST },
  ring_3: { guided: RING_3_GUIDED, fast: RING_3_FAST },
  ring_4: { guided: RING_4_GUIDED, fast: RING_4_FAST },
  ring_5: { guided: RING_5_GUIDED, fast: RING_5_FAST }
};

// ─── LearnPanel ───────────────────────────────────────────
export default function LearnPanel({ agent, model, onClose }: Props) {
  const [selectedRingId, setSelectedRingId] = useState<RingId>('ring_1');
  const [pacingMode, setPacingMode]         = useState<PacingMode>('guided');
  const [lessonIndex, setLessonIndex]       = useState(0);
  const [harbingerImageReady, setHarbingerImageReady] = useState(true);
  const [htmlCode, setHtmlCode]             = useState('');
  const [cssCode, setCssCode]               = useState('');
  const [shadow, setShadow]                 = useState<ShadowState>({ x: 4, y: 4, blur: 12, spread: 0, color: '#000000' });
  const [chatMessages, setChatMessages]     = useState<ChatMessage[]>([]);
  const [chatPrompt, setChatPrompt]         = useState('');
  const [chatBusy, setChatBusy]             = useState(false);
  const [showLessonHelp, setShowLessonHelp] = useState(false);
  const [showMasterIndex, setShowMasterIndex] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showLineByLine, setShowLineByLine] = useState(false);
  const [consolidationBanner, setConsolidationBanner] = useState(false);
  const [consolidationMsg, setConsolidationMsg] = useState('');
  const consolidationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const visibleLessons = LESSONS_BY_RING_MODE[selectedRingId][pacingMode];
  const lesson = visibleLessons[lessonIndex] ?? visibleLessons[0];
  const activeRing = RINGS.find((r) => r.id === selectedRingId);
  const lessonHelp = lesson.help?.scenarios ?? [];
  const lessonHelpIndex = useMemo(() => {
    return buildLessonHelpIndex(visibleLessons).map((entry, index) => ({
      ...entry,
      lessonPosition: index,
      orderLabel: `${String(index + 1).padStart(2, '0')}. ${entry.lessonTitle}`
    }));
  }, [visibleLessons]);

  // ─── Load lesson ────────────────────────────────────────
  const loadLesson = useCallback((index: number, nextChatMessages: ChatMessage[] = []) => {
    const next = visibleLessons[index];
    if (!next) return;
    setLessonIndex(index);
    setHtmlCode(next.html ?? '');
    setCssCode(next.css ?? '');
    setShadow(initShadow(next.parameters));
    setCompletedSteps(new Set());
    setShowLineByLine(false);
    const seedMessages: ChatMessage[] = [];
    if (!next.sandbox && next.teaching?.openingFraming) {
      seedMessages.push({ role: 'assistant', content: next.teaching.openingFraming });
    }
    setChatMessages([...seedMessages, ...nextChatMessages]);
    setShowLessonHelp(false);
    setShowMasterIndex(false);
  }, [visibleLessons]);

  useEffect(() => {
    setLessonIndex(0);
    loadLesson(0);
  }, [selectedRingId, pacingMode, loadLesson]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setHarbingerImageReady(true);
    probe.onerror = () => setHarbingerImageReady(false);
    probe.src = HARBINGER_IMAGE_PATH;
  }, []);

  if (!lesson || !activeRing) {
    return null;
  }

  // ─── Preview srcdoc ─────────────────────────────────────
  const buildSrcdoc = (html: string, css: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
html,body{margin:0;padding:0;}
body {
  margin: 0; padding: 28px; min-height: 100vh;
  background-color: #000;
  background-image:
    linear-gradient(rgba(0,160,255,0.12) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,160,255,0.12) 1px,transparent 1px),
    linear-gradient(rgba(0,80,200,0.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,80,200,0.05) 1px,transparent 1px);
  background-size:120px 120px,120px 120px,24px 24px,24px 24px;
}
.harbinger-scene {
  position: relative;
  min-height: calc(100vh - 56px);
}
.harbinger-orb {
  position: fixed;
  right: 14px;
  bottom: 12px;
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 1px solid rgba(236, 72, 153, 0.75);
  box-shadow: 0 0 14px rgba(236, 72, 153, 0.55), 0 0 36px rgba(236, 72, 153, 0.32);
  animation: harbingerSceneBob 2.9s ease-in-out infinite;
  background: radial-gradient(circle at 30% 25%, #fb7185 0%, #ec4899 45%, #831843 100%);
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: none;
  z-index: 999;
}
.harbinger-orb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.harbinger-fallback {
  color: #fbcfe8;
  font-family: sans-serif;
  font-size: 20px;
  font-weight: 800;
}
@keyframes harbingerSceneBob {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
}
${css}
</style>
</head>
<body>
  <div class="harbinger-scene">
    ${html}
    <div class="harbinger-orb" aria-hidden="true">
      <img src="${HARBINGER_IMAGE_PATH}" alt="Harbinger" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" />
      <span class="harbinger-fallback" style="display:none;">H</span>
    </div>
  </div>
</body>
</html>`;

  // ─── Apply parameter ─────────────────────────────────────
  const applyParam = useCallback((param: LessonParam, rawValue: string) => {
    if ('shadow_component' in param && param.shadow_component) {
      setShadow(prev => {
        const next = { ...prev };
        if (param.shadow_component === 'color') next.color = rawValue;
        else next[param.shadow_component as 'x' | 'y' | 'blur' | 'spread'] = Number(rawValue);
        const shadowVal = buildShadow(next);
        setCssCode(css => updateCSSProperty(css, 'box-shadow', shadowVal, null));
        return next;
      });
      return;
    }

    const p = param as SliderParam | ColorParam | SelectParam;
    const formattedValue = ('unit' in p && p.unit) ? `${rawValue}${p.unit}` : rawValue;
    setCssCode(css => updateCSSProperty(css, p.property, formattedValue, p.selector ?? null));

    // lesson_09 color formats
    if ('show_formats' in p && p.show_formats) {
      const rgb = hexToRgb(rawValue);
      setHtmlCode(html =>
        html
          .replace(/Hex: #[0-9a-fA-F]{3,6}/, `Hex: ${rawValue}`)
          .replace(/RGB: rgb\([^)]+\)/, `RGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
          .replace(/Named: [^<]+/, `Named: ${approximateColorName(rawValue)}`)
      );
    }
  }, []);

  // ─── AI tutor chat ────────────────────────────────────────
  const submitChat = async () => {
    const text = chatPrompt.trim();
    if (!text || chatBusy) return;
    setChatPrompt('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatBusy(true);
    try {
      const systemMsg: ChatMessage = {
        role: 'system',
        content: lesson.sandbox
          ? `You are a helpful CSS/HTML coding assistant inside a live sandbox editor. The user can type HTML and CSS and see it render immediately. Help them experiment, debug their code, and understand what they wrote. Be concise and practical.`
          : `You are an encouraging CSS tutor embedded in a learning app. The student is on lesson: "${lesson.title}". Concept: "${lesson.concept}". Answer in 2-3 clear sentences. Use simple language.`
      };
      const history = [...chatMessages, userMsg];
      const reply = await fableApi().chat({ model, messages: [systemMsg, ...history], temperature: agent.temperature });
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
    } finally {
      setChatBusy(false);
    }
  };

  const applyHelpScenario = useCallback((scenario: LessonHelpScenario, targetLessonIndex?: number) => {
    const scriptedMessages: ChatMessage[] = [
      { role: 'user', content: scenario.question },
      { role: 'assistant', content: scenario.answer }
    ];

    if (typeof targetLessonIndex === 'number' && targetLessonIndex !== lessonIndex) {
      loadLesson(targetLessonIndex, scriptedMessages);
      return;
    }

    setChatMessages((prev) => ([...prev, ...scriptedMessages]));
    setShowLessonHelp(false);
    setShowMasterIndex(false);
  }, [lessonIndex, loadLesson]);

  const handleLessonSelect = useCallback((targetIndex: number) => {
    if (targetIndex !== lessonIndex) {
      const current = visibleLessons[lessonIndex];
      if (current?.teaching?.consolidation) {
        if (consolidationTimerRef.current) clearTimeout(consolidationTimerRef.current);
        setConsolidationMsg(current.teaching.consolidation);
        setConsolidationBanner(true);
        consolidationTimerRef.current = setTimeout(() => setConsolidationBanner(false), 6000);
      }
    }
    loadLesson(targetIndex);
  }, [lessonIndex, visibleLessons, loadLesson]);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="lp-container">
      {/* ── Header bar ── */}
      <div className="lp-header">
        <span className="lp-header-title">Learn CSS</span>
        <span className="lp-header-sub">{activeRing.title} · {lesson.title}</span>
        <span className="lp-ring-mode-chip">{pacingMode.toUpperCase()}</span>
        <button onClick={onClose} className="lp-close-btn" title="Close Learn mode">✕ Exit Learn</button>
      </div>

      <div className="lp-body">
        {/* ── Sidebar: lesson list ── */}
        <aside className="lp-sidebar">
          <div className="lp-ring-picker">
            {RINGS.map((ring) => (
              <button
                key={ring.id}
                className={`lp-ring-btn lp-ring-btn--${ring.id}${ring.id === selectedRingId ? ' lp-ring-btn--active' : ''}`}
                onClick={() => setSelectedRingId(ring.id)}
              >
                <span className="lp-ring-btn-title">{ring.title}</span>
                <span className="lp-ring-btn-sub">{ring.tagline}</span>
              </button>
            ))}
          </div>
          <div className="lp-mode-toggle" aria-label="Lesson pacing mode">
            <button
              className={`lp-mode-btn${pacingMode === 'guided' ? ' lp-mode-btn--active' : ''}`}
              onClick={() => setPacingMode('guided')}
            >
              Guided
            </button>
            <button
              className={`lp-mode-btn${pacingMode === 'fast' ? ' lp-mode-btn--active' : ''}`}
              onClick={() => setPacingMode('fast')}
            >
              Fast
            </button>
          </div>
          <div className="lp-lesson-list">
            {visibleLessons.map((l, i) => {
              return (
                <button
                  key={l.id}
                  onClick={() => handleLessonSelect(i)}
                  className={`lp-lesson-btn${i === lessonIndex ? ' lp-lesson-btn--active' : ''}`}
                >
                  {l.sandbox ? '⬡ Sandbox' : `${String(i + 1).padStart(2, '0')}. ${l.title}`}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="lp-main">
          {/* ── Consolidation banner ── */}
          {consolidationBanner && consolidationMsg && (
            <div className="lp-consolidation-banner">
              <span className="lp-consolidation-text">✦ {consolidationMsg}</span>
              <button
                type="button"
                className="lp-consolidation-close"
                onClick={() => setConsolidationBanner(false)}
                aria-label="Dismiss consolidation"
              >×</button>
            </div>
          )}

          {/* Concept (structured lessons only) */}
          {!lesson.sandbox && (
            <div className="lp-concept-box">
              <div className="lp-harbinger-banner">
                <HarbingerAvatar size="small" canRenderImage={harbingerImageReady} />
                <div className="lp-harbinger-banner-copy">
                  <p className="lp-harbinger-banner-title">Harbinger</p>
                  <p className="lp-harbinger-banner-text">Guiding this lesson with live code-to-visual parity.</p>
                </div>
              </div>
              <p className="lp-concept-text">{lesson.concept}</p>
              {lesson.teaching?.whyItMatters && (
                <p className="lp-why-it-matters">{lesson.teaching.whyItMatters}</p>
              )}
              {lesson.teaching?.predictPrompt && (
                <p className="lp-predict-prompt">🔮 {lesson.teaching.predictPrompt}</p>
              )}
              {lesson.next_concept && (
                <p className="lp-next-concept">Next: {lesson.next_concept}</p>
              )}
            </div>
          )}

          {/* ── Walkthrough rail ── */}
          {!lesson.sandbox && lesson.teaching?.walkthrough && lesson.teaching.walkthrough.length > 0 && (
            <div className="lp-walkthrough-rail">
              <p className="lp-walkthrough-title">Walkthrough</p>
              <ol className="lp-walkthrough-list">
                {lesson.teaching.walkthrough.map((step, si) => {
                  const key = `${lessonIndex}:${si}`;
                  const done = completedSteps.has(key);
                  return (
                    <li key={si} className={`lp-walkthrough-step${done ? ' lp-walkthrough-step--done' : ''}`}>
                      <label className="lp-walkthrough-check-label">
                        <input
                          type="checkbox"
                          className="lp-walkthrough-checkbox"
                          checked={done}
                          onChange={() => {
                            setCompletedSteps(prev => {
                              const next = new Set(prev);
                              if (done) next.delete(key); else next.add(key);
                              return next;
                            });
                          }}
                          aria-label={`Mark step ${si + 1} done`}
                        />
                        <span className="lp-walkthrough-instruction">{step.instruction}</span>
                      </label>
                      <p className="lp-walkthrough-watch">Watch for: {step.watchFor}</p>
                      {step.paramHint && (
                        <span className="lp-walkthrough-param-hint">→ Use the "{step.paramHint}" control</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* ── SANDBOX: split code-editor + live preview ── */}
          {lesson.sandbox ? (
            <div className="lp-sandbox-layout">
              {/* Editors column */}
              <div className="lp-editors-col">
                <div className="lp-editor-block">
                  <div className="lp-editor-label">HTML</div>
                  <textarea
                    className="lp-code-area"
                    value={htmlCode}
                    onChange={e => setHtmlCode(e.target.value)}
                    spellCheck={false}
                    placeholder={'<div class="box">Hello</div>'}
                  />
                </div>
                <div className="lp-editor-block">
                  <div className="lp-editor-label">CSS</div>
                  <textarea
                    className="lp-code-area"
                    value={cssCode}
                    onChange={e => setCssCode(e.target.value)}
                    spellCheck={false}
                    placeholder=".box { color: hotpink; }"
                  />
                </div>
              </div>
              {/* Live preview column */}
              <div className="lp-sandbox-preview">
                <div className="lp-editor-label">Live Preview</div>
                <iframe
                  className="lp-iframe-full"
                  srcDoc={buildSrcdoc(htmlCode, cssCode)}
                  sandbox="allow-scripts"
                  title="Sandbox Preview"
                />
              </div>
            </div>
          ) : (
            /* ── STRUCTURED LESSON: preview + controls row ── */
            <div className="lp-preview-row">
              <div className="lp-preview-container">
                <div className="lp-panel-label lp-panel-label--with-guide">
                  <span>Preview</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {lesson.teaching?.lineByLine && lesson.teaching.lineByLine.length > 0 && (
                      <button
                        type="button"
                        className={`lp-explain-btn${showLineByLine ? ' lp-explain-btn--active' : ''}`}
                        onClick={() => setShowLineByLine(v => !v)}
                      >
                        {showLineByLine ? 'Hide code notes' : 'Explain the code'}
                      </button>
                    )}
                    <HarbingerAvatar size="tiny" canRenderImage={harbingerImageReady} />
                  </div>
                </div>
                {showLineByLine && lesson.teaching?.lineByLine && (
                  <div className="lp-line-by-line">
                    {lesson.teaching.lineByLine.map((item, li) => (
                      <div key={li} className="lp-annotated-line">
                        <code className="lp-annotated-code">{item.code}</code>
                        <p className="lp-annotated-explanation">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
                <iframe
                  key={lessonIndex}
                  className="lp-iframe"
                  srcDoc={buildSrcdoc(htmlCode, cssCode)}
                  sandbox="allow-scripts"
                  title="CSS Preview"
                />
              </div>
              {lesson.parameters.length > 0 && (
                <div className="lp-params-panel">
                  <div className="lp-panel-label">Controls</div>
                  <div className="lp-params-list">
                    {lesson.parameters.map((param, pi) => (
                      <ParamControl
                        key={pi}
                        param={param}
                        shadow={shadow}
                        onApply={applyParam}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="lp-guide-rail">
            <div className="lp-guide-rail-head">
              <HarbingerAvatar size="medium" canRenderImage={harbingerImageReady} />
              <div>
                <p className="lp-guide-rail-name">Harbinger</p>
                <p className="lp-guide-rail-meta">{activeRing.title} · Lesson {lessonIndex + 1}/{visibleLessons.length}</p>
              </div>
            </div>
            <p className="lp-guide-rail-tip">{harbingerFocus(lesson)}</p>
          </div>

          {/* AI tutor chat */}
          <div className="lp-chat-panel">
            <div className="lp-panel-label lp-panel-label--with-guide">
              <span>AI Tutor · {agent.name}</span>
              <HarbingerAvatar size="tiny" canRenderImage={harbingerImageReady} />
            </div>
            <div className="lp-chat-toolbar">
              <button
                type="button"
                className={`lp-chat-tool${showLessonHelp ? ' lp-chat-tool--active' : ''}`}
                onClick={() => setShowLessonHelp((current) => !current)}
                disabled={chatBusy || lessonHelp.length === 0}
              >
                Help
              </button>
              <button
                type="button"
                className={`lp-chat-tool${showMasterIndex ? ' lp-chat-tool--active' : ''}`}
                onClick={() => setShowMasterIndex(true)}
                disabled={chatBusy || lessonHelpIndex.length === 0}
              >
                Master Index
              </button>
            </div>
            {showLessonHelp && lessonHelp.length > 0 && (
              <div className="lp-help-list" aria-label="Lesson help questions">
                <p className="lp-help-title">Hot topics for this lesson</p>
                <p className="lp-help-objective">Objective: {lesson.help?.objective}</p>
                <div className="lp-help-items">
                  {lessonHelp.map((scenario, index) => (
                    <button
                      key={`${scenario.topic}-${index}`}
                      type="button"
                      className="lp-help-question"
                      onClick={() => applyHelpScenario(scenario)}
                    >
                      <span className="lp-help-topic">{scenario.topic}</span>
                      <span>{scenario.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="lp-chat-messages">
              {chatMessages.length === 0 && (
                <p className="lp-chat-empty">Ask anything about this lesson, or use Help for common trouble spots.</p>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'lp-chat-msg-user' : 'lp-chat-msg-assistant'}>
                  <span className="lp-chat-role">{m.role === 'user' ? 'You' : agent.name}</span>
                  <p className="lp-chat-content">{m.content}</p>
                </div>
              ))}
              {chatBusy && (
                <div className="lp-chat-msg-assistant">
                  <span className="lp-chat-role">{agent.name}</span>
                  <p className="lp-chat-content">…</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="lp-chat-input-row">
              <input
                className="lp-chat-input"
                value={chatPrompt}
                onChange={e => setChatPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitChat(); }}
                placeholder="Ask about this concept…"
                aria-label="Ask a lesson question"
                title="Ask a lesson question"
                disabled={chatBusy}
              />
              <button
                onClick={submitChat}
                disabled={chatBusy || !chatPrompt.trim()}
                className="lp-chat-send"
              >
                {chatBusy ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showMasterIndex && (
        <div
          className="lp-help-modal-backdrop"
          onClick={() => setShowMasterIndex(false)}
        >
          <dialog
            open
            className="lp-help-modal"
            aria-label="Master help index"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lp-help-modal-head">
              <div>
                <p className="lp-help-modal-title">Master Help Index</p>
                <p className="lp-help-modal-subtitle">Ordered by lesson availability and broken down by code objective.</p>
              </div>
              <button
                type="button"
                className="lp-help-modal-close"
                onClick={() => setShowMasterIndex(false)}
                aria-label="Close master help index"
              >
                ×
              </button>
            </div>
            <div className="lp-help-modal-body">
              {lessonHelpIndex.map((entry) => (
                <section key={entry.lessonId} className="lp-help-index-section">
                  <p className="lp-help-index-lesson">{entry.orderLabel}</p>
                  <p className="lp-help-index-objective">Code objective: {entry.objective}</p>
                  <div className="lp-help-index-items">
                    {entry.scenarios.map((scenario, index) => (
                      <div key={`${entry.lessonId}-${scenario.topic}-${index}`} className="lp-help-index-item">
                        <button
                          type="button"
                          className="lp-help-question lp-help-question--index"
                          onClick={() => applyHelpScenario(scenario, entry.lessonPosition)}
                        >
                          <span className="lp-help-topic">{scenario.topic}</span>
                          <span>{scenario.question}</span>
                        </button>
                        <p className="lp-help-index-answer">{scenario.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}

function HarbingerAvatar({ size, canRenderImage }: { size: 'small' | 'medium' | 'tiny'; canRenderImage: boolean }) {
  const avatarClass = `lp-harbinger-avatar lp-harbinger-avatar--${size}`;

  if (!canRenderImage) {
    return (
      <div className={avatarClass} aria-label="Harbinger avatar fallback" role="img">
        H
      </div>
    );
  }

  return (
    <img
      src={HARBINGER_IMAGE_PATH}
      alt="Harbinger"
      className={avatarClass}
      loading="lazy"
    />
  );
}

// ─── ParamControl ─────────────────────────────────────────
function ParamControl({ param, shadow, onApply }: {
  param: LessonParam;
  shadow: ShadowState;
  onApply: (p: LessonParam, v: string) => void;
}) {
  const isShadow = 'shadow_component' in param && param.shadow_component;
  const currentVal = isShadow
    ? (param.shadow_component === 'color' ? shadow.color : String(shadow[param.shadow_component as 'x' | 'y' | 'blur' | 'spread']))
    : String(param.default);

  if (param.type === 'slider') {
    const p = param as SliderParam;
    const [val, setVal] = useState(isShadow ? currentVal : String(p.default));
    return (
      <div className="lp-param-group">
        <label className="lp-param-label">{p.label}</label>
        <div className="lp-slider-row">
          <input
            type="range"
            min={p.min}
            max={p.max}
            value={val}
            className="lp-slider"
            aria-label={p.label}
            title={p.label}
            onChange={e => { setVal(e.target.value); onApply(param, e.target.value); }}
          />
          <span className="lp-slider-val">{val}{p.unit || ''}</span>
        </div>
      </div>
    );
  }

  if (param.type === 'color') {
    const p = param as ColorParam;
    const [val, setVal] = useState(isShadow ? currentVal : p.default);
    return (
      <div className="lp-param-group">
        <label className="lp-param-label">{p.label}</label>
        <div className="lp-color-row">
          <input
            type="color"
            value={val}
            className="lp-color-input"
            aria-label={p.label}
            title={p.label}
            onChange={e => { setVal(e.target.value); onApply(param, e.target.value); }}
          />
          <span className="lp-color-val">{val}</span>
        </div>
      </div>
    );
  }

  if (param.type === 'select') {
    const p = param as SelectParam;
    const [val, setVal] = useState(p.default);
    return (
      <div className="lp-param-group">
        <label className="lp-param-label">{p.label}</label>
        <select
          value={val}
          className="lp-select"
          aria-label={p.label}
          title={p.label}
          onChange={e => { setVal(e.target.value); onApply(param, e.target.value); }}
        >
          {p.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  return null;
}

