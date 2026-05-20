import { useNavigate } from 'react-router-dom';
import { BookOpen, Code2, Eye, Sparkles, Workflow } from 'lucide-react';
import { AGENT_PROFILES } from '../../shared/agents';
import { FABLED_LABS_BY_ID } from '../../shared/labs';
import type { AgentId } from '../../shared/types';
import { useAppContext } from '../context/AppContext';
import { FabledAtmosphere } from '../components/FabledAtmosphere';

const MODES = [
  {
    to: '/alkemist',
    icon: Code2,
    label: FABLED_LABS_BY_ID.alkemist.shortName,
    description: FABLED_LABS_BY_ID.alkemist.summary
  },
  {
    to: '/scribe',
    icon: BookOpen,
    label: FABLED_LABS_BY_ID.scribe.shortName,
    description: FABLED_LABS_BY_ID.scribe.summary
  },
  {
    to: '/tesseract',
    icon: Eye,
    label: FABLED_LABS_BY_ID.tesseract.shortName,
    description: FABLED_LABS_BY_ID.tesseract.summary
  },
  {
    to: '/logix',
    icon: Workflow,
    label: FABLED_LABS_BY_ID.logix.shortName,
    description: FABLED_LABS_BY_ID.logix.summary
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
      <FabledAtmosphere atmosphere={FABLED_LABS_BY_ID.alkemist.atmosphere} />

      <div className="hub-content">
        {/* Brand */}
        <header className="hub-brand">
          <div className="brand-mark" aria-hidden="true"><Sparkles size={22} /></div>
          <div>
            <h1>FabledLabs</h1>
            <p>Focused products for code, learning, design, and logic</p>
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
          <h2 id="hub-modes-heading" className="hub-section-title">Launch a lab</h2>
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
