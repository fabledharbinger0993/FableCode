import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Code2, Eye, Home, Sparkles, Workflow } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import { AGENT_PROFILES } from '../shared/agents';
import { FABLED_LABS_BY_ID, labForPath } from '../shared/labs';
import { FabledAtmosphere } from './components/FabledAtmosphere';

const NAV_ITEMS = [
  { to: '/',        icon: Home,     label: 'Hub',     exact: true },
  { to: '/alkemist', icon: Code2,    label: FABLED_LABS_BY_ID.alkemist.shortName, exact: false },
  { to: '/scribe',   icon: BookOpen, label: FABLED_LABS_BY_ID.scribe.shortName, exact: false },
  { to: '/tesseract', icon: Eye,     label: FABLED_LABS_BY_ID.tesseract.shortName, exact: false },
  { to: '/logix',    icon: Workflow, label: FABLED_LABS_BY_ID.logix.shortName, exact: false }
];

export function AppShell() {
  const { agentId } = useAppContext();
  const location = useLocation();
  const agent = AGENT_PROFILES.find((p) => p.id === agentId) ?? AGENT_PROFILES[0];
  const activeLab = labForPath(location.pathname);

  return (
    <div className="shell-root" data-lab={activeLab.id}>
      <FabledAtmosphere atmosphere={activeLab.atmosphere} />
      <nav className="app-top-nav" aria-label="Main navigation">
        <span className="top-nav-brand" aria-hidden="true">
          <Sparkles size={15} />
        </span>
        <span className="top-nav-divider" aria-hidden="true" />
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `top-nav-link${isActive ? ' top-nav-link--active' : ''}`}
            title={label}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <span className="top-nav-agent" style={{ color: agent.color }} aria-label={`Active agent: ${agent.name}`}>
          {agent.name}
        </span>
      </nav>
      <div className="shell-content">
        <Outlet />
      </div>
    </div>
  );
}
