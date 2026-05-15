import { useNavigate } from 'react-router-dom';
import DesignPanel from '../DesignPanel';

export function DesignPage() {
  const navigate = useNavigate();

  return (
    <div className="design-page">
      <DesignPanel onClose={() => navigate('/')} />
    </div>
  );
}
