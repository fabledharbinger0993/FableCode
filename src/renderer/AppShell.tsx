import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Box, Code2, Eye, Home, Sparkles, Workflow } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import { AGENT_PROFILES } from '../shared/agents';

const NAV_ITEMS = [
  { to: '/',        icon: Home,     label: 'Hub',     exact: true },
  { to: '/build',   icon: Code2,    label: 'Build',   exact: false },
  { to: '/preview', icon: Eye,      label: 'Preview', exact: false },
  { to: '/blocks',  icon: Workflow, label: 'Blocks',  exact: false },
  { to: '/school',  icon: BookOpen, label: 'School',  exact: false },
  { to: '/design',  icon: Box,      label: 'Design',  exact: false }
];

export function AppShell() {
  const { agentId } = useAppContext();
  const agent = AGENT_PROFILES.find((p) => p.id === agentId) ?? AGENT_PROFILES[0];

  return (
    <div className="shell-root">
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
