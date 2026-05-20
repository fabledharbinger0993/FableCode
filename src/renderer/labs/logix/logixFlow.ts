import type { FlowBlock, FlowBlockKind, FlowDefinition, FlowRoute, FlowRouteKind } from '../../../shared/types';

export type LogixBlockTemplate = Omit<FlowBlock, 'id' | 'position' | 'suggestedBy'> & {
  accent: string;
  category: 'entry' | 'reasoning' | 'action' | 'control' | 'memory' | 'delivery';
};

export interface LogixValidationIssue {
  id: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  detail: string;
}

const makeFlowId = () => `logix-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const makeBlockId = (kind: FlowBlockKind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const port = (id: string, name: string, kind: 'input' | 'output', dataType: FlowBlock['inputs'][number]['dataType']) => ({
  id,
  name,
  kind,
  dataType
});

export const LOGIX_BLOCK_TEMPLATES: LogixBlockTemplate[] = [
  {
    kind: 'trigger',
    title: 'Intent Trigger',
    description: 'Starts a logic chain from a user goal, event, schedule, or manual run.',
    instructions: 'Capture the trigger and normalize it into a compact logic brief.',
    tags: ['entry', 'goal'],
    accent: '#31caff',
    category: 'entry',
    inputs: [],
    outputs: [port('brief', 'Brief', 'output', 'text')]
  },
  {
    kind: 'agent',
    title: 'Reasoning Node',
    description: 'Delegates planning, review, or synthesis to the selected FabledLabs agent.',
    instructions: 'Use the active agent profile and current chain context to produce the next decision.',
    tags: ['agent', 'reasoning'],
    accent: '#e05a47',
    category: 'reasoning',
    inputs: [port('context', 'Context', 'input', 'text')],
    outputs: [port('decision', 'Decision', 'output', 'decision')]
  },
  {
    kind: 'tool',
    title: 'Tool Action',
    description: 'Calls into local tools, APIs, browser automation, databases, or test systems.',
    instructions: 'Choose the least risky local tool and report exact inputs and outputs.',
    tags: ['toolchain', 'action'],
    accent: '#2f8f83',
    category: 'action',
    inputs: [port('request', 'Request', 'input', 'text')],
    outputs: [port('result', 'Result', 'output', 'json')]
  },
  {
    kind: 'condition',
    title: 'Decision Gate',
    description: 'Branches the logic chain by pass/fail checks, confidence, missing context, or user choice.',
    instructions: 'Evaluate the prior result and choose one clearly labeled route.',
    tags: ['branch', 'decision'],
    accent: '#b66a1f',
    category: 'control',
    inputs: [port('signal', 'Signal', 'input', 'decision')],
    outputs: [port('pass', 'Pass', 'output', 'decision'), port('fallback', 'Fallback', 'output', 'decision')]
  },
  {
    kind: 'function',
    title: 'Function Node',
    description: 'Defines a reusable function, command wrapper, schema transform, or prompt utility.',
    instructions: 'Draft the signature, input contract, output contract, and verification notes.',
    tags: ['code', 'function'],
    accent: '#4f6bed',
    category: 'action',
    inputs: [port('spec', 'Spec', 'input', 'text')],
    outputs: [port('function', 'Function', 'output', 'text')]
  },
  {
    kind: 'memory',
    title: 'Memory Recall',
    description: 'Pulls session memory, durable references, and prior decisions into the active chain.',
    instructions: 'Query memory for constraints, previous decisions, and relevant reference paths.',
    tags: ['memory', 'context'],
    accent: '#b45cff',
    category: 'memory',
    inputs: [port('query', 'Query', 'input', 'text')],
    outputs: [port('memory', 'Memory', 'output', 'memory')]
  },
  {
    kind: 'terminal',
    title: 'Verification Check',
    description: 'Runs a build, test, lint, setup command, or simulation check.',
    instructions: 'Specify command, working directory, expected signal, and failure recovery path.',
    tags: ['verify', 'terminal'],
    accent: '#c6f36d',
    category: 'control',
    inputs: [port('command', 'Command', 'input', 'command')],
    outputs: [port('output', 'Output', 'output', 'text')]
  },
  {
    kind: 'approval',
    title: 'Human Approval',
    description: 'Pauses the logic chain before risky edits, deletes, deploys, or commits.',
    instructions: 'Ask one concise approval question and list the concrete action that will follow.',
    tags: ['gate', 'human'],
    accent: '#ffd166',
    category: 'control',
    inputs: [port('request', 'Request', 'input', 'text')],
    outputs: [port('approved', 'Approved', 'output', 'decision')]
  },
  {
    kind: 'output',
    title: 'Delivery Output',
    description: 'Packages the final answer, artifact, summary, deployment handoff, or lesson output.',
    instructions: 'Produce the final user-facing result and include verification status.',
    tags: ['finish', 'handoff'],
    accent: '#ff6b9e',
    category: 'delivery',
    inputs: [port('result', 'Result', 'input', 'any')],
    outputs: []
  }
];

export function templateForLogixKind(kind: FlowBlockKind): LogixBlockTemplate {
  return LOGIX_BLOCK_TEMPLATES.find((template) => template.kind === kind) ?? LOGIX_BLOCK_TEMPLATES[0];
}

export function createLogixBlock(
  template: LogixBlockTemplate,
  position: FlowBlock['position'],
  suggestedBy: FlowBlock['suggestedBy'] = 'user'
): FlowBlock {
  return {
    id: makeBlockId(template.kind),
    kind: template.kind,
    title: template.title,
    description: template.description,
    instructions: template.instructions,
    position,
    inputs: template.inputs,
    outputs: template.outputs,
    tags: [...template.tags, `category:${template.category}`],
    suggestedBy
  };
}

function route(from: FlowBlock, fromPortId: string, to: FlowBlock, toPortId: string, label: string, kind: FlowRouteKind): FlowRoute {
  return {
    id: `route-${from.id}-${to.id}`,
    fromBlockId: from.id,
    fromPortId,
    toBlockId: to.id,
    toPortId,
    label,
    kind
  };
}

export function createLogixStarterFlow(): FlowDefinition {
  const trigger = createLogixBlock(templateForLogixKind('trigger'), { x: 54, y: 96 }, 'system');
  const reasoning = createLogixBlock(templateForLogixKind('agent'), { x: 330, y: 84 }, 'system');
  const approval = createLogixBlock(templateForLogixKind('approval'), { x: 622, y: 150 }, 'system');
  const verification = createLogixBlock(templateForLogixKind('terminal'), { x: 914, y: 94 }, 'system');
  const output = createLogixBlock(templateForLogixKind('output'), { x: 914, y: 300 }, 'system');

  return {
    id: makeFlowId(),
    name: 'Logix Logic Chain',
    goal: 'Turn an idea into a validated chain with reasoning, approval, verification, and delivery nodes.',
    blocks: [trigger, reasoning, approval, verification, output],
    routes: [
      route(trigger, 'brief', reasoning, 'context', 'brief to reasoning', 'default'),
      route(reasoning, 'decision', approval, 'request', 'decision approval', 'manual-approval'),
      route(approval, 'approved', verification, 'command', 'approved check', 'success'),
      route(verification, 'output', output, 'result', 'verified delivery', 'success')
    ],
    suggestions: [
      {
        id: 'suggest-memory',
        title: 'Add recall before reasoning',
        detail: 'Pull memory into the chain before the reasoning node.',
        blockKind: 'memory',
        routeKind: 'default'
      },
      {
        id: 'suggest-condition',
        title: 'Branch after verification',
        detail: 'Split success and fallback routes from a test or build check.',
        blockKind: 'condition',
        routeKind: 'condition'
      },
      {
        id: 'suggest-function',
        title: 'Package reusable logic',
        detail: 'Turn repeated instructions into a named function node.',
        blockKind: 'function',
        routeKind: 'default'
      }
    ],
    updatedAt: new Date().toISOString()
  };
}

export function validateLogixFlow(flow: FlowDefinition): LogixValidationIssue[] {
  const issues: LogixValidationIssue[] = [];
  const connectedTargets = new Set(flow.routes.map((routeItem) => routeItem.toBlockId));
  const connectedSources = new Set(flow.routes.map((routeItem) => routeItem.fromBlockId));
  const blocksById = new Map(flow.blocks.map((block) => [block.id, block]));

  if (!flow.blocks.some((block) => block.kind === 'trigger')) {
    issues.push({
      id: 'missing-trigger',
      severity: 'error',
      title: 'Missing trigger',
      detail: 'Every Logix chain needs a trigger node so execution has a clear start.'
    });
  }

  if (!flow.blocks.some((block) => block.kind === 'output')) {
    issues.push({
      id: 'missing-output',
      severity: 'warning',
      title: 'Missing output',
      detail: 'Add a delivery output so the chain has an explicit endpoint.'
    });
  }

  for (const block of flow.blocks) {
    if (block.kind !== 'trigger' && !connectedTargets.has(block.id)) {
      issues.push({
        id: `unreached-${block.id}`,
        severity: 'warning',
        title: `${block.title} is not reached`,
        detail: 'Connect an upstream route into this node before relying on it.'
      });
    }
    if (block.outputs.length > 0 && !connectedSources.has(block.id)) {
      issues.push({
        id: `dead-end-${block.id}`,
        severity: 'info',
        title: `${block.title} has no outgoing route`,
        detail: 'This may be intentional, but most executable chains should continue or deliver output.'
      });
    }
  }

  for (const routeItem of flow.routes) {
    if (!blocksById.has(routeItem.fromBlockId) || !blocksById.has(routeItem.toBlockId)) {
      issues.push({
        id: `broken-route-${routeItem.id}`,
        severity: 'error',
        title: 'Broken route reference',
        detail: `${routeItem.label} points to a node that no longer exists.`
      });
    }
  }

  return issues;
}
