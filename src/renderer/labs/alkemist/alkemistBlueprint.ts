export type AlkemistSandboxProfileId = 'read-only' | 'project-write' | 'container-run' | 'design-preview';

export interface AlkemistSandboxProfile {
  id: AlkemistSandboxProfileId;
  name: string;
  purpose: string;
  allowedActions: string[];
  requiresApproval: string[];
}

export interface AlkemistWorkspaceTemplate {
  id: string;
  name: string;
  stack: string;
  previewMode: 'web' | 'electron' | 'api' | 'hybrid';
  defaultChecks: string[];
}

export const ALKEMIST_SANDBOX_PROFILES: AlkemistSandboxProfile[] = [
  {
    id: 'read-only',
    name: 'Read Only Analysis',
    purpose: 'Inspect files, produce plans, and review risk without changing the workspace.',
    allowedActions: ['read-files', 'scan-tooling', 'summarize-context'],
    requiresApproval: ['write-files', 'run-terminal', 'install-dependencies']
  },
  {
    id: 'project-write',
    name: 'Project Write',
    purpose: 'Apply focused edits after the agent has a bounded implementation plan.',
    allowedActions: ['read-files', 'write-files', 'format-code'],
    requiresApproval: ['delete-files', 'install-dependencies', 'publish-artifacts']
  },
  {
    id: 'container-run',
    name: 'Container Run',
    purpose: 'Run tests, builds, and untrusted code inside an isolated execution environment.',
    allowedActions: ['build-container', 'run-tests', 'capture-logs'],
    requiresApproval: ['mount-host-paths', 'network-access', 'privileged-container']
  },
  {
    id: 'design-preview',
    name: 'Design Preview',
    purpose: 'Bridge implementation work into a preview surface for UI and interaction checks.',
    allowedActions: ['start-preview', 'capture-render-state', 'hand-off-to-tesseract'],
    requiresApproval: ['external-network-preview', 'asset-export']
  }
];

export const ALKEMIST_WORKSPACE_TEMPLATES: AlkemistWorkspaceTemplate[] = [
  {
    id: 'electron-ai-workbench',
    name: 'Electron AI Workbench',
    stack: 'Electron + Vite + React + TypeScript',
    previewMode: 'electron',
    defaultChecks: ['typecheck', 'vite-build', 'electron-smoke']
  },
  {
    id: 'next-agent-ui',
    name: 'Next Agent UI',
    stack: 'Next.js + API routes + local model bridge',
    previewMode: 'web',
    defaultChecks: ['typecheck', 'lint', 'route-smoke']
  },
  {
    id: 'python-tool-server',
    name: 'Python Tool Server',
    stack: 'FastAPI + Docker + local execution sandbox',
    previewMode: 'api',
    defaultChecks: ['pytest', 'ruff', 'container-health']
  }
];

export const ALKEMIST_AGENT_APPENDIX = [
  'You are operating inside FabledLabs: Alkemist.',
  'Prioritize local-first code development, explicit sandbox boundaries, and fast preview feedback.',
  'Before suggesting risky commands, name the sandbox profile that should execute them.',
  'When UI or 3D output matters, produce a preview handoff note for Tesseract.'
].join('\n');

export const ALKEMIST_QUICK_PROMPTS = [
  'Plan the next Alkemist implementation step with sandbox boundaries.',
  'Review this file for risks, missing tests, and preview regressions.',
  'Suggest a minimal refactor that keeps the dev preview stable.',
  'Write a clear handoff summary for Alkemist, Scribe, Tesseract, or Logix.'
];
