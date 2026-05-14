import { useNavigate } from 'react-router-dom';
import { AGENT_PROFILES } from '../../shared/agents';
import { useAppContext } from '../context/AppContext';
import LearnPanel from '../LearnPanel';

export function SchoolPage() {
  const { agentId, model } = useAppContext();
  const navigate = useNavigate();
  const agent = AGENT_PROFILES.find((p) => p.id === agentId) ?? AGENT_PROFILES[0];

  return (
    <div className="school-page">
      <LearnPanel
        agent={agent}
        model={model}
        onClose={() => navigate('/')}
      />
    </div>
  );
}
