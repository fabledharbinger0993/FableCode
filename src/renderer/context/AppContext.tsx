import React, { createContext, useContext, useState } from 'react';
import type { AgentId, AnthropicModel } from '../../shared/types';
import { DEFAULT_AGENT_ID } from '../../shared/agents';

interface AppContextValue {
  agentId: AgentId;
  setAgentId: (id: AgentId) => void;
  model: string;
  setModel: (m: string) => void;
  models: AnthropicModel[];
  setModels: (m: AnthropicModel[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [agentId, setAgentId] = useState<AgentId>(DEFAULT_AGENT_ID);
  const [model, setModel] = useState('');
  const [models, setModels] = useState<AnthropicModel[]>([]);

  return (
    <AppContext.Provider value={{ agentId, setAgentId, model, setModel, models, setModels }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return ctx;
}
