import { useNavigate } from 'react-router-dom';
import { BookOpen, Code2, Eye, Sparkles, Workflow } from 'lucide-react';
import { AGENT_PROFILES } from '../../shared/agents';
import type { AgentId } from '../../shared/types';
import { useAppContext } from '../context/AppContext';

const MODES = [
  {
    to: '/build',
    icon: Code2,
    label: 'Build',
    description: 'Plan and build with the agent. File-aware chat with workspace, toolchain, and debug tools.'
  },
  {
    to: '/preview',
    icon: Eye,
    label: 'Preview',
    description: 'Test and troubleshoot. Live preview of your running code with dedicated agent chat.'
  },
  {
    to: '/blocks',
    icon: Workflow,
    label: 'Blocks',
    description: 'Visual block coding. Drag-and-drop flow builder with an AI copilot to guide routing.'
  },
  {
    to: '/school',
    icon: BookOpen,
    label: 'School',
    description: 'Learn by doing. Split-screen lessons with a live CSS preview as you write.'
  }
];

export function HubPage() {
  const { agentId, setAgentId } = useAppContext();
  const navigate = useNavigate();

  function pickMode(to: string) {
    navigate(to);
  }

  return (
    <main className="hub-root">
      <div className="lava-background" aria-hidden="true">
        <span className="lava-blob lava-blob-a" />
        <span className="lava-blob lava-blob-b" />
        <span className="lava-blob lava-blob-c" />
        <span className="lava-blob lava-blob-d" />
        <span className="lava-blob lava-blob-e" />
        <span className="lava-blob lava-blob-f" />
      </div>

      <div className="hub-content">
        {/* Brand */}
        <header className="hub-brand">
          <div className="brand-mark" aria-hidden="true"><Sparkles size={22} /></div>
          <div>
            <h1>FableCode</h1>
            <p>Local-first AI coding workbench</p>
          </div>
        </header>

        {/* Agent selector */}
        <section className="hub-section" aria-labelledby="hub-agents-heading">
          <h2 id="hub-agents-heading" className="hub-section-title">Choose your agent</h2>
          <div className="hub-agents">
            {AGENT_PROFILES.map((profile) => (
              <button
                key={profile.id}
                className={`hub-agent-card agent-${profile.id}${agentId === profile.id ? ' hub-agent-card--active' : ''}`}
                onClick={() => setAgentId(profile.id as AgentId)}
                style={{ '--agent-color': profile.color } as React.CSSProperties}
              >
                <span className="agent-dot" aria-hidden="true" />
                <div>
                  <strong>{profile.name}</strong>
                  <p>{profile.tagline}</p>
                </div>
                {agentId === profile.id && <span className="hub-agent-check" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Mode cards */}
        <section className="hub-section" aria-labelledby="hub-modes-heading">
          <h2 id="hub-modes-heading" className="hub-section-title">Select a mode</h2>
          <div className="hub-modes">
            {MODES.map(({ to, icon: Icon, label, description }) => (
              <button
                key={to}
                className="hub-mode-card"
                onClick={() => pickMode(to)}
              >
                <span className="hub-mode-icon" aria-hidden="true"><Icon size={28} /></span>
                <strong className="hub-mode-label">{label}</strong>
                <p className="hub-mode-desc">{description}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
