import type { Ring, Lesson, ColorParam } from './types';

// ══════════════════════════════════════════════════════════════
//  RING DEFINITIONS (metadata)
// ══════════════════════════════════════════════════════════════

export const RINGS: Ring[] = [
  {
    id: 'ring_1',
    title: 'State and Assignment',
    concept: 'Every program stores values and changes them. This is state.',
    tagline: 'Variables create and update the world.',
    color: '#3b82f6',
    guideCount: 13,
    fastCount: 11,
    prerequisites: [],
    competencies: [
      'Assign values to variables',
      'Update variable state',
      'Compute derived values from state',
      'Trigger state transitions via functions',
      'Express state changes in both code and blocks',
      'Verify state equivalence across representations'
    ]
  },
  {
    id: 'ring_2',
    title: 'Branching and Conditional Routing',
    concept: 'Programs make decisions. Different inputs flow different ways.',
    tagline: 'Control flow creates possibility trees.',
    color: '#ec4899',
    guideCount: 13,
    fastCount: 11,
    prerequisites: ['ring_1'],
    competencies: [
      'Write if/else conditions in code',
      'Model conditional branches in blocks',
      'Test all branches reach correct outcomes',
      'Debug branch routing logic',
      'Express complex conditions and nested logic'
    ]
  },
  {
    id: 'ring_3',
    title: 'Iteration and Data Shaping',
    concept: 'Lists hold many values. Loops transform them systematically.',
    tagline: 'Repetition unlocks data transformation.',
    color: '#f59e0b',
    guideCount: 13,
    fastCount: 11,
    prerequisites: ['ring_1', 'ring_2'],
    competencies: [
      'Loop over collections in Python',
      'Transform and filter lists',
      'Understand JSON as structured data',
      'Map list operations to block flows',
      'Validate data schema and shape'
    ]
  },
  {
    id: 'ring_4',
    title: 'Presentation Logic',
    concept: 'CSS properties are data too. Programs compute them.',
    tagline: 'Design decisions as code.',
    color: '#8b5cf6',
    guideCount: 13,
    fastCount: 11,
    prerequisites: ['ring_1', 'ring_2', 'ring_3'],
    competencies: [
      'Compute CSS values from state',
      'Use design tokens and variables',
      'Apply theme logic programmatically',
      'Synchronize visual state with data state',
      'Validate UI coherence from computed styles'
    ]
  },
  {
    id: 'ring_5',
    title: 'Integrated Systems',
    concept: 'Real apps combine all layers: logic, data, presentation, and I/O.',
    tagline: 'Building the full stack.',
    color: '#06b6d4',
    guideCount: 13,
    fastCount: 11,
    prerequisites: ['ring_1', 'ring_2', 'ring_3', 'ring_4'],
    competencies: [
      'Design API contracts',
      'Handle async operations safely',
      'Integrate multiple domains (logic + blocks + presentation)',
      'Trace execution across layers',
      'Measure and optimize performance',
      'Architect maintainable systems'
    ]
  }
];

// ══════════════════════════════════════════════════════════════
//  RING 1: STATE AND ASSIGNMENT
//  Guided Path (12 lessons) + Fast Path (7 lessons)
// ══════════════════════════════════════════════════════════════

export const RING_1_LESSONS: Lesson[] = [
  // ─ INTRO (both paths)
  {
    id: 'r1_intro',
    ringId: 'ring_1',
    phaseType: 'intro',
    domainType: 'synthesis',
    chapterOrder: 0,
    title: 'Welcome to State',
    concept:
      'Every program remembers things. A variable is how code remembers a value. Change the value, the program behaves differently. This is state: the memory that drives behavior.',
    html: '<div class="demo">\n  <p class="label">Current State:</p>\n  <p class="value">42</p>\n  <p class="description">This number is a variable. It exists in memory.</p>\n</div>',
    css: '.demo {\n  font-family: sans-serif;\n  padding: 24px;\n  background: linear-gradient(135deg, #3b82f6, #1e40af);\n  border-radius: 12px;\n  color: white;\n  text-align: center;\n}\n.label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; opacity: 0.8; }\n.value { font-size: 48px; font-weight: 800; margin: 0 0 12px 0; }\n.description { font-size: 14px; margin: 0; line-height: 1.6; opacity: 0.9; }',
    parameters: [],
    next_concept: 'Assigning values',
    modePathAvailable: 'both',
    sandbox: false
  },

  // ─ LOGIC SEED PHASE (lessons 1-4: guided only, first 2 in fast)
  {
    id: 'r1_logic_01',
    ringId: 'ring_1',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 1,
    title: 'Assign a number',
    concept:
      'x = 5 stores the number 5 in a variable named x. The variable remembers it until you change it. Try the sliders to assign different values.',
    html: '<div class="card">\n  <p class="label">Python Code:</p>\n  <pre class="code">x = <span class="value">5</span></pre>\n  <p class="result">x is now <span class="value">5</span></p>\n</div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.label { font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 8px 0; }\n.code { margin: 0; font-size: 16px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; }\n.value { color: #0ea5e9; font-weight: bold; }\n.result { font-size: 14px; color: #334155; margin: 12px 0 0 0; }',
    parameters: [
      { label: 'Value', property: 'value', type: 'slider', min: 0, max: 100, default: 5, unit: '' }
    ],
    next_concept: 'Assigning text',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ x: number }',
      expectedVisibleChanges: ['value updates in preview'],
      parityCheckRule: 'exact'
    }
  },

  {
    id: 'r1_logic_02',
    ringId: 'ring_1',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 2,
    title: 'Assign text',
    concept:
      'name = "Alex" stores text (a string) in a variable. Strings are enclosed in quotes. The same principle applies: variable remembers the value.',
    html: '<div class="card">\n  <p class="label">Python Code:</p>\n  <pre class="code">name = <span class="str">"Alex"</span></pre>\n  <p class="result">name is <span class="str">"<span class="value">Alex</span>"</span></p>\n</div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.label { font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 8px 0; }\n.code { margin: 0; font-size: 16px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; }\n.str { color: #16a34a; }\n.value { color: #16a34a; font-weight: bold; }\n.result { font-size: 14px; color: #334155; margin: 12px 0 0 0; }',
    parameters: [
      {
        label: 'Text value',
        property: 'textValue',
        type: 'select',
        options: ['Alex', 'Jordan', 'Taylor', 'Casey'],
        default: 'Alex'
      }
    ],
    next_concept: 'Reassign values',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ name: string }',
      expectedVisibleChanges: ['text value updates'],
      parityCheckRule: 'exact'
    }
  },

  {
    id: 'r1_logic_03',
    ringId: 'ring_1',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 3,
    title: 'Reassign and change state',
    concept:
      'x = 5, then x = 10. The first line assigns 5. The second line overwrites it with 10. After both lines, x is 10. Variables change. That change is state transition.',
    html: '<div class="card">\n  <p class="label">Python Code:</p>\n  <pre class="code">x = <span class="old">5</span><br/>x = <span class="new">10</span></pre>\n  <p class="result">x started as <span class="old">5</span>, now is <span class="new">10</span></p>\n</div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.label { font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 8px 0; }\n.code { margin: 0; font-size: 16px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; }\n.old { color: #ef4444; opacity: 0.6; text-decoration: line-through; }\n.new { color: #3b82f6; font-weight: bold; }\n.result { font-size: 14px; color: #334155; margin: 12px 0 0 0; }',
    parameters: [
      { label: 'New value', property: 'newValue', type: 'slider', min: 0, max: 100, default: 10, unit: '' }
    ],
    next_concept: 'Derived values',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    previewContract: {
      expectedStateShape: '{ x: number, before: number }',
      expectedVisibleChanges: ['old value fades', 'new value highlights'],
      parityCheckRule: 'exact'
    }
  },

  {
    id: 'r1_logic_04',
    ringId: 'ring_1',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 4,
    title: 'Derive new values from state',
    concept:
      'x = 5; double = x * 2; Now double is 10. You compute new values from existing state. The derived value depends on the source. Change x and double updates automatically in our preview.',
    html: '<div class="card">\n  <p class="label">Python Code:</p>\n  <pre class="code">x = <span class="value">5</span><br/>double = x * 2</pre>\n  <p class="result">x is <span class="value">5</span>, double is <span class="derived">10</span></p>\n</div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.label { font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 8px 0; }\n.code { margin: 0; font-size: 16px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; }\n.value { color: #0ea5e9; font-weight: bold; }\n.derived { color: #8b5cf6; font-weight: bold; }\n.result { font-size: 14px; color: #334155; margin: 12px 0 0 0; }',
    parameters: [
      { label: 'x value', property: 'xValue', type: 'slider', min: 0, max: 50, default: 5, unit: '' }
    ],
    next_concept: 'Functions and state',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ x: number, double: number }',
      expectedVisibleChanges: ['x updates', 'double updates automatically'],
      parityCheckRule: 'exact'
    }
  },

  // ─ VISUAL ECHO PHASE (lessons 5-7: guided, first visual in fast)
  {
    id: 'r1_visual_01',
    ringId: 'ring_1',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 5,
    title: 'Visual: Set value block',
    concept:
      'The "Set Value" block in the visual canvas does the same thing as x = 5 in code. Drag the block onto the canvas and configure it. The output shows what state was set.',
    html: '<div class="canvas">\n  <div class="block set-value">\n    <p class="block-type">SET VALUE</p>\n    <p class="param">name: count</p>\n    <p class="param">value: <span class="value">5</span></p>\n  </div>\n  <p class="result">count is set to <span class="value">5</span></p>\n</div>',
    css: '.canvas { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.block { padding: 12px; background: #3b82f6; color: white; border-radius: 6px; font-family: sans-serif; font-size: 12px; margin-bottom: 12px; }\n.block-type { margin: 0 0 8px 0; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }\n.param { margin: 4px 0; font-family: monospace; font-size: 11px; }\n.value { color: #fbbf24; font-weight: bold; }\n.result { font-size: 14px; color: #334155; }',
    parameters: [
      {
        label: 'Variable name',
        property: 'varName',
        type: 'select',
        options: ['count', 'score', 'age', 'status'],
        default: 'count'
      },
      { label: 'Value', property: 'setValue', type: 'slider', min: 0, max: 100, default: 5, unit: '' }
    ],
    next_concept: 'Update blocks',
    modePathAvailable: 'both',
    equivalentLessonId: 'r1_logic_01',
    previewContract: {
      expectedStateShape: '{ [varName]: number }',
      expectedVisibleChanges: ['block displays set operation', 'result shows assigned value'],
      parityCheckRule: 'semantic'
    }
  },

  {
    id: 'r1_visual_02',
    ringId: 'ring_1',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 6,
    title: 'Visual: Update value block',
    concept:
      'The "Update Value" block changes an existing variable. It reads the current value and overwrites it. This is the visual equivalent of reassignment in code.',
    html: '<div class="canvas">\n  <div class="flow">\n    <div class="block set-value"><p class="block-type">SET</p><p class="param">x = 5</p></div>\n    <p class="arrow">↓</p>\n    <div class="block update-value"><p class="block-type">UPDATE</p><p class="param">x = 10</p></div>\n  </div>\n  <p class="result">x: 5 → 10</p>\n</div>',
    css: '.canvas { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.flow { display: flex; flex-direction: column; align-items: center; gap: 8px; }\n.block { padding: 12px; background: #3b82f6; color: white; border-radius: 6px; font-family: sans-serif; font-size: 12px; min-width: 120px; text-align: center; }\n.block.update-value { background: #8b5cf6; }\n.block-type { margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase; font-size: 10px; }\n.param { margin: 0; font-family: monospace; font-size: 11px; }\n.arrow { color: #cbd5e1; font-weight: bold; }\n.result { margin-top: 12px; font-size: 14px; color: #334155; }',
    parameters: [
      { label: 'New value', property: 'newValue', type: 'slider', min: 0, max: 100, default: 10, unit: '' }
    ],
    next_concept: 'Derived blocks',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    equivalentLessonId: 'r1_logic_03',
    previewContract: {
      expectedStateShape: '{ x: number, before: number }',
      expectedVisibleChanges: ['flow shows set then update', 'result displays transition'],
      parityCheckRule: 'semantic'
    }
  },

  {
    id: 'r1_visual_03',
    ringId: 'ring_1',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 7,
    title: 'Visual: Derived value block',
    concept:
      'The "Derive" block computes a new value from existing state. It reads x, applies a formula, and creates double. This route block shows the dependency.',
    html: '<div class="canvas">\n  <div class="flow">\n    <div class="block"><p class="block-type">SET x</p></div>\n    <p class="arrow">↓</p>\n    <div class="block derive"><p class="block-type">DERIVE</p><p class="param">double = x * 2</p></div>\n  </div>\n  <p class="result">x → double (computed)</p>\n</div>',
    css: '.canvas { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.flow { display: flex; flex-direction: column; align-items: center; gap: 8px; }\n.block { padding: 12px; background: #3b82f6; color: white; border-radius: 6px; font-family: sans-serif; font-size: 12px; min-width: 140px; text-align: center; }\n.block.derive { background: #ec4899; }\n.block-type { margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase; font-size: 10px; }\n.param { margin: 0; font-family: monospace; font-size: 11px; }\n.arrow { color: #cbd5e1; font-weight: bold; }\n.result { margin-top: 12px; font-size: 14px; color: #334155; }',
    parameters: [
      { label: 'Multiplier', property: 'multiplier', type: 'slider', min: 1, max: 10, default: 2, unit: 'x' }
    ],
    next_concept: 'Translation challenges',
    modePathAvailable: 'both',
    equivalentLessonId: 'r1_logic_04',
    previewContract: {
      expectedStateShape: '{ x: number, derived: number }',
      expectedVisibleChanges: ['derive block executes', 'derived value appears in result'],
      parityCheckRule: 'semantic'
    }
  },

  // ─ TRANSLATION PHASE (lessons 8-10: both paths)
  {
    id: 'r1_trans_01',
    ringId: 'ring_1',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 8,
    title: 'Translate: Code to blocks',
    concept:
      'You are given Python code that assigns and derives. Your job: build the equivalent block flow. Read the code, understand the state transitions, then construct the block canvas to produce identical state changes.',
    html: '<div class="exercise">\n  <div class="code-panel">\n    <p class="label">Given Code:</p>\n    <pre>count = 0\ncount = count + 1\ndisplay = "Count: " + str(count)</pre>\n  </div>\n  <div class="canvas-panel">\n    <p class="label">Build the block flow:</p>\n    <div class="hint">Hint: three blocks needed. Start with SET, then UPDATE, then DERIVE.</div>\n  </div>\n  <div class="result-panel">\n    <p class="check">Your blocks produce the same state? <span class="pending">—</span></p>\n  </div>\n</div>',
    css: '.exercise { display: flex; flex-direction: column; gap: 16px; font-family: sans-serif; }\n.code-panel, .canvas-panel, .result-panel { padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; }\n.code-panel pre { margin: 0; padding: 12px; background: white; border-radius: 6px; font-family: monospace; font-size: 12px; color: #1e293b; }\n.hint { font-size: 12px; color: #64748b; margin: 8px 0 0 0; }\n.check { margin: 0; font-size: 14px; }\n.pending { color: #f59e0b; font-weight: bold; }',
    parameters: [],
    next_concept: 'Blocks to code',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ count: number, display: string }',
      expectedVisibleChanges: ['blocks execute in sequence', 'final state matches code output'],
      parityCheckRule: 'exact'
    }
  },

  {
    id: 'r1_trans_02',
    ringId: 'ring_1',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 9,
    title: 'Translate: Blocks to code',
    concept:
      'Reverse direction: you are shown a block flow diagram. Your job: write the Python code that produces the same state transitions. Read the blocks, understand the flow, write the code.',
    html: '<div class="exercise">\n  <div class="canvas-panel">\n    <p class="label">Given block flow:</p>\n    <div class="flow">\n      <div class="block"><p class="type">SET status = "ready"</p></div>\n      <p class="arrow">↓</p>\n      <div class="block"><p class="type">DERIVE message = "Status: " + status</p></div>\n    </div>\n  </div>\n  <div class="code-panel">\n    <p class="label">Write the Python code:</p>\n    <textarea class="code-input" placeholder="status = ...\\nmessage = ..."></textarea>\n  </div>\n  <div class="result-panel">\n    <p class="check">Your code produces the same state? <span class="pending">—</span></p>\n  </div>\n</div>',
    css: '.exercise { display: flex; flex-direction: column; gap: 16px; font-family: sans-serif; }\n.canvas-panel, .code-panel, .result-panel { padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; }\n.flow { display: flex; flex-direction: column; align-items: center; gap: 8px; }\n.block { padding: 8px 12px; background: #3b82f6; color: white; border-radius: 6px; font-size: 12px; min-width: 140px; text-align: center; }\n.type { margin: 0; font-family: monospace; }\n.arrow { color: #cbd5e1; font-weight: bold; }\n.code-input { width: 100%; height: 80px; padding: 8px; font-family: monospace; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 6px; }\n.check { margin: 0; font-size: 14px; }\n.pending { color: #f59e0b; font-weight: bold; }',
    parameters: [],
    next_concept: 'Mismatch repair',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ status: string, message: string }',
      expectedVisibleChanges: ['code state matches block state'],
      parityCheckRule: 'exact'
    }
  },

  {
    id: 'r1_trans_03',
    ringId: 'ring_1',
    phaseType: 'interference',
    domainType: 'translation',
    chapterOrder: 10,
    title: 'Debug: Fix the mismatch',
    concept:
      'One version of code produces x=10. The other produces x=5. They should be identical. Find the divergence. Fix it. When complete, both produce x=10.',
    html: '<div class="exercise">\n  <div class="code-version">\n    <p class="label">Code Version:</p>\n    <pre>x = 10\ny = x * 2</pre>\n    <p class="result">Result: y = 20</p>\n  </div>\n  <div class="block-version">\n    <p class="label">Block Version (broken):</p>\n    <div class="flow">\n      <div class="block"><p>SET x = 5</p></div>\n      <p class="arrow">↓</p>\n      <div class="block wrong"><p>DERIVE y = x * 2</p></div>\n    </div>\n    <p class="result wrong">Result: y = 10 ✗ (mismatch!)</p>\n  </div>\n  <div class="task">\n    <p>Fix the block so y = 20. What needs to change?</p>\n  </div>\n</div>',
    css: '.exercise { display: flex; flex-direction: column; gap: 16px; font-family: sans-serif; }\n.code-version, .block-version, .task { padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; }\n.code-version pre { margin: 0; padding: 12px; background: white; border-radius: 6px; font-family: monospace; font-size: 12px; }\n.flow { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 8px 0; }\n.block { padding: 8px 12px; background: #3b82f6; color: white; border-radius: 6px; font-size: 12px; text-align: center; }\n.block.wrong { background: #ef4444; }\n.arrow { color: #cbd5e1; font-weight: bold; }\n.result { font-size: 12px; margin: 8px 0 0 0; }\n.result.wrong { color: #ef4444; font-weight: bold; }\n.task { background: #fef9c3; border: 1px solid #eab308; }',
    parameters: [],
    next_concept: 'Synthesis',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ x: number, y: number }',
      expectedVisibleChanges: ['mismatch identified', 'correction applied', 'parity achieved'],
      parityCheckRule: 'exact'
    }
  },

  // ─ SYNTHESIS PHASE (lessons 11-12: both paths)
  {
    id: 'r1_synth_01',
    ringId: 'ring_1',
    phaseType: 'synthesis',
    domainType: 'synthesis',
    chapterOrder: 11,
    title: 'Build: State-driven counter (code + blocks)',
    concept:
      'Combine both domains. Write Python that maintains count state. Build a block flow that updates it. They must be in sync. The preview shows live count, status color, and derived label.',
    html: '<div class="counter-demo">\n  <div class="display">\n    <p class="count">Count: <span class="value">0</span></p>\n    <p class="status">Status: <span class="status-value">INIT</span></p>\n  </div>\n  <div class="controls">\n    <button class="btn">Increment (code)</button>\n    <button class="btn">Increment (blocks)</button>\n    <button class="btn">Reset</button>\n  </div>\n</div>',
    css: '.counter-demo { font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px; }\n.display { text-align: center; margin-bottom: 20px; }\n.count { font-size: 28px; font-weight: bold; color: #1e293b; margin: 0 0 8px 0; }\n.value { color: #3b82f6; font-weight: 800; }\n.status { font-size: 14px; color: #64748b; margin: 0; }\n.status-value { font-weight: bold; color: #f59e0b; }\n.controls { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }\n.btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; }',
    parameters: [],
    next_concept: 'Ring finale',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ count: number, status: string, syncStatus: "matched" | "diverged" }',
      expectedVisibleChanges: [
        'code and block increments both update counter',
        'status text changes with count',
        'parity indicator shows if in sync'
      ],
      parityCheckRule: 'exact'
    }
  },

  {
    id: 'r1_finale',
    ringId: 'ring_1',
    phaseType: 'finale',
    domainType: 'finale',
    chapterOrder: 12,
    title: '✦ FINALE: Interactive counter panel',
    concept:
      'Build the complete counter. Python code maintains state. Blocks orchestrate updates. Preview shows count, derived status color, and label. Every slider and button verifies state parity. This is the capstone artifact for Ring 1.',
    html: '<div class="panel">\n  <div class="header">\n    <h2 class="title">State Counter</h2>\n    <p class="subtitle">Code + Blocks in Sync</p>\n  </div>\n  <div class="body">\n    <div class="counter">\n      <p class="label">Current Count</p>\n      <p class="value">42</p>\n    </div>\n    <div class="status">\n      <p class="label">Derived Status</p>\n      <p class="status-text">MODERATE</p>\n    </div>\n  </div>\n  <div class="footer">\n    <button class="action">+1</button>\n    <button class="action">-1</button>\n    <button class="action alt">Reset</button>\n  </div>\n</div>',
    css: '.panel { font-family: sans-serif; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1); max-width: 360px; }\n.header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 24px; text-align: center; }\n.title { margin: 0; font-size: 24px; font-weight: 800; }\n.subtitle { margin: 4px 0 0 0; font-size: 12px; opacity: 0.8; }\n.body { padding: 20px; }\n.counter, .status { padding: 12px; background: white; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0; text-align: center; }\n.label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0; }\n.value { margin: 0; font-size: 32px; font-weight: 800; color: #3b82f6; }\n.status-text { margin: 0; font-size: 18px; font-weight: 700; color: #f59e0b; }\n.footer { display: flex; gap: 8px; padding: 12px; background: #f8fafc; }\n.action { flex: 1; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; }\n.action.alt { background: #64748b; }',
    parameters: [
      { label: 'Initial count', property: 'initialCount', type: 'slider', min: 0, max: 100, default: 42, unit: '' },
      { label: 'Status threshold (low)', property: 'thresholdLow', type: 'slider', min: 10, max: 40, default: 20, unit: '' },
      { label: 'Status threshold (high)', property: 'thresholdHigh', type: 'slider', min: 40, max: 100, default: 60, unit: '' },
      { label: 'Accent color', property: 'accentColor', type: 'color', default: '#3b82f6' } as ColorParam
    ],
    next_concept: null,
    modePathAvailable: 'both',
    isFinale: true,
    previewContract: {
      expectedStateShape: '{ count: number, status: "low" | "moderate" | "high", codeState: number, blockState: number, parity: boolean }',
      expectedVisibleChanges: [
        'all buttons update count correctly',
        'status color reflects current value',
        'code and block states remain synchronized',
        'parity check displays as pass/fail'
      ],
      parityCheckRule: 'exact'
    },
    gateCriteria: {
      correctness: 85,
      parity: 85,
      translation: 80,
      debug: 70,
      preview: 85,
      passThreshold: 80
    }
  }
];

// Export for use in progression engine
export const RING_1_GUIDED = RING_1_LESSONS.filter(
  (l) => l.modePathAvailable === 'guided' || l.modePathAvailable === 'both'
);
export const RING_1_FAST = RING_1_LESSONS.filter(
  (l) => l.modePathAvailable === 'fast' || l.modePathAvailable === 'both'
);

// Legacy compatibility: flatten for existing UI that expects LESSONS array
export const LESSONS = RING_1_GUIDED;

// ══════════════════════════════════════════════════════════════
//  RING 2: BRANCHING AND CONDITIONAL ROUTING
//  Guided Path (12 lessons) + Fast Path (7 lessons)
// ══════════════════════════════════════════════════════════════

export const RING_2_LESSONS: Lesson[] = [
  // Intro, logic seed (4 lessons), visual echo (2), translation (3), synthesis, finale
  // Follows same structure as Ring 1, focused on if/else, conditions, branching
  {
    id: 'r2_intro',
    ringId: 'ring_2',
    phaseType: 'intro',
    domainType: 'synthesis',
    chapterOrder: 0,
    title: 'Welcome to Branching',
    concept: 'Programs make decisions. The same code handles many inputs differently. If this, do that. Otherwise, do something else. This is branching.',
    html: '<div class="demo"><p class="label">Your Choice:</p><p class="value">→ takes different path</p></div>',
    css: '.demo { font-family: sans-serif; padding: 24px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 12px; color: white; text-align: center; }\n.label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; opacity: 0.8; }\n.value { font-size: 32px; font-weight: 800; margin: 0; }',
    parameters: [],
    next_concept: 'Simple conditions',
    modePathAvailable: 'both'
  },
  {
    id: 'r2_logic_01',
    ringId: 'ring_2',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 1,
    title: 'Simple if condition',
    concept: 'if x > 5: ... checks whether x is greater than 5. If true, the code block runs. If false, it skips. This is a decision point.',
    html: '<div class="card"><p class="label">Python Code:</p><pre class="code">if <span class="cond">x > 5</span>:\n  print("high")</pre><p class="result">Condition: <span class="cond">x > 5</span> is <span class="state">true/false</span></p></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.label { font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 8px 0; }\n.code { margin: 0; font-size: 14px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; }\n.cond { color: #ec4899; font-weight: bold; }\n.state { color: #16a34a; }\n.result { font-size: 14px; color: #334155; margin: 12px 0 0 0; }',
    parameters: [{ label: 'x value', property: 'xValue', type: 'slider', min: 0, max: 20, default: 8, unit: '' }],
    next_concept: 'if/else',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ x: number, condition: boolean }',
      expectedVisibleChanges: ['condition evaluates true or false', 'state reflects result'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_logic_02',
    ringId: 'ring_2',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 2,
    title: 'if/else branching',
    concept: 'if condition: ... else: ... splits into two paths. One runs if true, the other if false. Both paths never run — exactly one executes.',
    html: '<div class="card"><pre class="code">if <span class="cond">age >= 18</span>:\n  status = "adult"\nelse:\n  status = "minor"</pre><p class="result">status is <span class="state">"adult"</span></p></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.code { margin: 0; font-size: 13px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; }\n.cond { color: #ec4899; font-weight: bold; }\n.state { color: #8b5cf6; font-weight: bold; }\n.result { font-size: 14px; color: #334155; margin: 12px 0 0 0; }',
    parameters: [{ label: 'age', property: 'age', type: 'slider', min: 5, max: 80, default: 25, unit: '' }],
    next_concept: 'Nested conditions',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    previewContract: {
      expectedStateShape: '{ age: number, status: "adult" | "minor" }',
      expectedVisibleChanges: ['path taken depends on age', 'status reflects choice'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_logic_03',
    ringId: 'ring_2',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 3,
    title: 'Multiple conditions (and, or)',
    concept: 'if x > 5 and x < 15: ... both conditions must be true. if x < 5 or x > 15: ... at least one must be true. Combine conditions with and/or.',
    html: '<div class="card"><pre class="code">if <span class="cond">score > 70 and score < 90</span>:\n  grade = "B"</pre><p class="result">grade is <span class="state">"B"</span></p></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.code { margin: 0; font-size: 13px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; }\n.cond { color: #ec4899; font-weight: bold; }\n.state { color: #3b82f6; font-weight: bold; }\n.result { font-size: 14px; color: #334155; margin: 12px 0 0 0; }',
    parameters: [{ label: 'score', property: 'score', type: 'slider', min: 0, max: 100, default: 75, unit: '' }],
    next_concept: 'Visual branch blocks',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ score: number, grade: string, isInRange: boolean }',
      expectedVisibleChanges: ['both conditions evaluated', 'grade assigned based on logic'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_logic_04',
    ringId: 'ring_2',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 4,
    title: 'Nested conditions and elif',
    concept: 'elif is "else if" — another branch before the final else. Nesting conditions inside conditions creates decision trees. Complex logic builds from simple branches.',
    html: '<div class="card"><pre class="code">if score >= 90:\n  grade = "A"\nelif score >= 80:\n  grade = "B"\nelse:\n  grade = "C"</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\n.code { margin: 0; font-size: 12px; color: #1e293b; background: white; padding: 12px; border-radius: 6px; line-height: 1.6; }',
    parameters: [{ label: 'score', property: 'score', type: 'slider', min: 0, max: 100, default: 85, unit: '' }],
    next_concept: 'Visual branching',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ score: number, grade: "A" | "B" | "C" }',
      expectedVisibleChanges: ['correct branch executes', 'grade assigned accurately'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_visual_01',
    ringId: 'ring_2',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 5,
    title: 'Visual: If/Else block',
    concept: 'The "If" block tests a condition. True path takes one route. False path takes another. The diamond shape signals a decision point.',
    html: '<div class="canvas"><div class="block diamond"><p>x > 5?</p></div><div class="arrow-split"><span class="left">YES</span><span class="right">NO</span></div></div>',
    css: '.canvas { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }\n.diamond { width: 100px; height: 100px; background: #ec4899; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }\n.arrow-split { display: flex; gap: 40px; justify-content: center; margin-top: 20px; }\n.left, .right { font-size: 12px; font-weight: bold; color: #64748b; }',
    parameters: [{ label: 'Test value', property: 'testValue', type: 'slider', min: 0, max: 20, default: 8, unit: '' }],
    next_concept: 'Visual branching chains',
    modePathAvailable: 'both',
    equivalentLessonId: 'r2_logic_02',
    previewContract: {
      expectedStateShape: '{ condition: boolean, path: "true" | "false" }',
      expectedVisibleChanges: ['correct branch highlights', 'path arrows show direction'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r2_visual_02',
    ringId: 'ring_2',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 6,
    title: 'Visual: Nested if blocks',
    concept: 'Place If blocks inside If blocks. Each layer narrows the decision tree. Build the block flow to match the code logic.',
    html: '<div class="canvas"><div class="tree"><p>IF score > 60?</p><div class="children"><p class="left">IF score > 80? → A</p><p class="right">ELSE → B</p></div><p class="else">ELSE → C</p></div></div>',
    css: '.canvas { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.tree { font-family: sans-serif; font-size: 12px; line-height: 1.8; }\n.children { margin-left: 20px; color: #64748b; }\n.left, .right { display: block; }\n.else { color: #666; margin-top: 8px; }',
    parameters: [{ label: 'score', property: 'score', type: 'slider', min: 0, max: 100, default: 75, unit: '' }],
    next_concept: 'Translation challenges',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    equivalentLessonId: 'r2_logic_04',
    previewContract: {
      expectedStateShape: '{ score: number, grade: string, treePath: string[] }',
      expectedVisibleChanges: ['tree evaluates correctly', 'grade matches logic'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r2_visual_03',
    ringId: 'ring_2',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 7,
    title: 'Visual: Multi-path routing',
    concept: 'When many paths exist, IF blocks fan out. Each condition narrows possibilities. The final result comes from exactly one path. All paths converge at the end.',
    html: '<div class="canvas"><div class="diagram"><p class="start">START</p><p class="branch">→ BRANCH → PATH A / PATH B / PATH C / PATH D</p><p class="end">→ CONVERGE → OUTPUT</p></div></div>',
    css: '.canvas { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }\n.diagram { font-family: monospace; font-size: 12px; text-align: center; color: #334155; line-height: 2; }\n.start, .end { font-weight: bold; color: #3b82f6; }\n.branch { color: #ec4899; }',
    parameters: [],
    next_concept: 'Code to blocks translation',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ pathTaken: number, output: string }',
      expectedVisibleChanges: ['correct path highlights', 'output reflects path choice'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r2_trans_01',
    ringId: 'ring_2',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 8,
    title: 'Translate: Code branches to blocks',
    concept: 'Given if/elif/else code, build the block tree. Trace through the logic. Map each branch. Verify all paths work.',
    html: '<div class="exercise"><div class="code-panel"><p class="label">Given Code:</p><pre>if x > 10:\n  result = "high"\nelif x > 5:\n  result = "mid"\nelse:\n  result = "low"</pre></div><div class="task">Build block tree matching all branches</div></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; }\n.code-panel { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; }\n.label { font-size: 11px; font-weight: bold; color: #64748b; margin: 0 0 8px 0; }\n.code-panel pre { margin: 0; padding: 12px; background: white; border-radius: 6px; font-family: monospace; font-size: 12px; }\n.task { font-size: 14px; color: #334155; }',
    parameters: [],
    next_concept: 'Blocks to code',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ x: number, result: "high" | "mid" | "low", pathMatches: boolean }',
      expectedVisibleChanges: ['all branches reachable', 'outputs match code'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_trans_02',
    ringId: 'ring_2',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 9,
    title: 'Translate: Block trees to code',
    concept: 'Reverse: given a block decision tree, write the if/elif/else code. Understand the structure. Write cleanly.',
    html: '<div class="exercise"><div class="tree-panel"><p class="label">Given Block Tree:</p><p class="tree">IF status="ready" → IF count>0 → "start" ELSE "wait" ELSE "stop"</p></div><div class="task">Write Python code:</div></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; }\n.tree-panel { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; }\n.label { font-size: 11px; font-weight: bold; color: #64748b; margin: 0 0 8px 0; }\n.tree { font-family: monospace; font-size: 12px; color: #1e293b; }\n.task { font-size: 14px; color: #334155; }',
    parameters: [],
    next_concept: 'Branch mismatch repair',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ status: string, count: number, output: string, matches: boolean }',
      expectedVisibleChanges: ['code branches execute correctly', 'outputs match tree'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_trans_03',
    ringId: 'ring_2',
    phaseType: 'interference',
    domainType: 'translation',
    chapterOrder: 10,
    title: 'Debug: Fix branch misrouting',
    concept: 'Code path and block path produce different results. One branch takes wrong route. Find the logic error. Fix it.',
    html: '<div class="exercise"><div class="code-version"><p class="label">Code:</p><pre>if score > 80:\n  grade = "A"</pre><p class="result">result: "A"</p></div><div class="block-version"><p class="label">Blocks (wrong):</p><pre>IF score > 80 → "B" (mismatch!)</pre></div></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; }\n.code-version, .block-version { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; }\n.label { font-size: 11px; font-weight: bold; color: #64748b; margin: 0 0 8px 0; }\n.result { font-size: 14px; color: #ef4444; font-weight: bold; margin: 8px 0 0 0; }',
    parameters: [],
    next_concept: 'Synthesis',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ score: number, codeResult: string, blockResult: string, match: boolean }',
      expectedVisibleChanges: ['error identified', 'mismatch corrected', 'parity achieved'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_synth_01',
    ringId: 'ring_2',
    phaseType: 'synthesis',
    domainType: 'synthesis',
    chapterOrder: 11,
    title: 'Build: Decision-driven status badge',
    concept: 'Combine code and blocks. Input a value. Both code and blocks decide status and color. Badge displays result. Both must produce identical output.',
    html: '<div class="demo"><div class="input">Input: <input type="range" min="0" max="100" /></div><div class="badge">Status: <span class="label">READY</span></div></div>',
    css: '.demo { font-family: sans-serif; padding: 16px; background: #f8fafc; border-radius: 8px; }\n.input { margin-bottom: 16px; }\n.badge { display: inline-block; padding: 8px 16px; background: #3b82f6; color: white; border-radius: 6px; font-weight: bold; }\n.label { margin-left: 8px; }',
    parameters: [],
    next_concept: 'Ring finale',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ input: number, status: string, codeStatus: string, blockStatus: string, parity: boolean }',
      expectedVisibleChanges: ['badge updates', 'both paths sync', 'color reflects status'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r2_finale',
    ringId: 'ring_2',
    phaseType: 'finale',
    domainType: 'finale',
    chapterOrder: 12,
    title: '✦ FINALE: Dynamic router with code + blocks',
    concept: 'Build a complete decision system. Input value routes through multiple conditions (code and blocks). Output changes based on the routing decision. Verify parity on all branches.',
    html: '<div class="router"><div class="input"><p>Input Score:</p><input type="range" min="0" max="100" value="50" /></div><div class="output"><p class="label">Route:</p><p class="path">BRANCH C</p><p class="grade">Grade: B</p></div></div>',
    css: '.router { font-family: sans-serif; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; }\n.input { margin-bottom: 20px; }\n.input p { margin: 0 0 8px 0; font-weight: bold; }\n.input input { width: 100%; }\n.output { text-align: center; }\n.label { font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; }\n.path { font-size: 18px; font-weight: bold; color: #ec4899; margin: 0 0 8px 0; }\n.grade { font-size: 14px; color: #334155; margin: 0; }',
    parameters: [
      { label: 'Score', property: 'score', type: 'slider', min: 0, max: 100, default: 75, unit: '' },
      { label: 'Accent color', property: 'accentColor', type: 'color', default: '#ec4899' } as ColorParam
    ],
    next_concept: null,
    modePathAvailable: 'both',
    isFinale: true,
    previewContract: {
      expectedStateShape: '{ score: number, codePath: string, blockPath: string, codeGrade: string, blockGrade: string, parity: boolean }',
      expectedVisibleChanges: [
        'score input drives routing',
        'both code and blocks produce same path',
        'grade updates correctly',
        'parity check on all branches'
      ],
      parityCheckRule: 'exact'
    },
    gateCriteria: {
      correctness: 85,
      parity: 85,
      translation: 80,
      debug: 70,
      preview: 85,
      passThreshold: 80
    }
  }
];

export const RING_2_GUIDED = RING_2_LESSONS.filter(
  (l) => l.modePathAvailable === 'guided' || l.modePathAvailable === 'both'
);
export const RING_2_FAST = RING_2_LESSONS.filter(
  (l) => l.modePathAvailable === 'fast' || l.modePathAvailable === 'both'
);

// Rings 3, 4, 5 lesson arrays (placeholder structure — same count as Ring 1/2)
// TODO: Expand with full content following template

export const RING_3_LESSONS: Lesson[] = [
  {
    id: 'r3_intro',
    ringId: 'ring_3',
    phaseType: 'intro',
    domainType: 'synthesis',
    chapterOrder: 0,
    title: 'Welcome to Iteration and Data Shaping',
    concept: 'Lists hold many values. Loops process them. Transform data systematically. The same operation repeats across a collection.',
    html: '<div class="demo"><p>Loop: repeat operation on each item</p></div>',
    css: '.demo { font-family: sans-serif; padding: 20px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; color: white; text-align: center; }',
    parameters: [],
    next_concept: 'Lists and loops',
    modePathAvailable: 'both'
  },
  {
    id: 'r3_logic_01',
    ringId: 'ring_3',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 1,
    title: 'Lists and iteration',
    concept: 'numbers = [1, 2, 3]. for x in numbers: ... loops over each item. Each iteration processes one item.',
    html: '<div class="card"><pre>numbers = [1, 2, 3, 4]\nfor x in numbers:\n  print(x)</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\npre { margin: 0; font-size: 13px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Loop with transformation',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ items: number[], iterations: number }',
      expectedVisibleChanges: ['each item processes', 'loop count matches list length'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r3_logic_02',
    ringId: 'ring_3',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 2,
    title: 'Transform data with loops',
    concept: 'doubled = [x * 2 for x in numbers] creates a new list. Each value is doubled. Loops transform collections into new shapes.',
    html: '<div class="card"><pre>numbers = [1, 2, 3]\ndoubled = [x * 2 for x in numbers]\n# doubled = [2, 4, 6]</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\npre { margin: 0; font-size: 13px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Filter and shape',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    previewContract: {
      expectedStateShape: '{ source: number[], transformed: number[] }',
      expectedVisibleChanges: ['transformation applies to each item', 'output matches expected values'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r3_logic_03',
    ringId: 'ring_3',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 3,
    title: 'Filter with conditions',
    concept: 'evens = [x for x in numbers if x % 2 == 0] keeps only items matching a condition. Filtering shapes collections by criteria.',
    html: '<div class="card"><pre>scores = [75, 82, 60, 91]\npassing = [s for s in scores if s >= 80]\n# passing = [82, 91]</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\npre { margin: 0; font-size: 13px; color: #1e293b; }',
    parameters: [],
    next_concept: 'JSON and schemas',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ source: number[], filtered: number[] }',
      expectedVisibleChanges: ['only matching items remain', 'count decreases or stays same'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r3_logic_04',
    ringId: 'ring_3',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 4,
    title: 'JSON as structured data',
    concept: 'JSON stores data as keys and values: {"name": "Alex", "age": 30}. Lists of objects: [{"id": 1, "value": 10}, ...]. JSON is universal data format.',
    html: '<div class="card"><pre>data = [\n  {"id": 1, "status": "ready"},\n  {"id": 2, "status": "pending"}\n]</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; }\npre { margin: 0; font-size: 12px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Visual iteration blocks',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ data: Record<string, any>[] }',
      expectedVisibleChanges: ['JSON structure displays', 'fields accessible'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r3_visual_01',
    ringId: 'ring_3',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 5,
    title: 'Visual: Loop block',
    concept: 'The "Loop" block processes each item in a list. Connect it to a "Transform" block inside. The output collects all results.',
    html: '<div class="canvas"><p>LOOP [items]</p><p style="margin-left: 20px;">→ TRANSFORM item</p><p>→ COLLECT results</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }',
    parameters: [],
    next_concept: 'Filter blocks',
    modePathAvailable: 'both',
    equivalentLessonId: 'r3_logic_01',
    previewContract: {
      expectedStateShape: '{ items: any[], loopCount: number, results: any[] }',
      expectedVisibleChanges: ['loop iterates', 'collection builds incrementally'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r3_visual_02',
    ringId: 'ring_3',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 6,
    title: 'Visual: Filter and collect',
    concept: 'Filter blocks select items matching conditions. Collect blocks gather results. Chain them: LOOP → FILTER → COLLECT.',
    html: '<div class="canvas"><p>LOOP scores</p><p style="margin-left: 20px;">→ FILTER if >= 80</p><p style="margin-left: 20px;">→ COLLECT passing</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }',
    parameters: [],
    next_concept: 'Translation challenges',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    equivalentLessonId: 'r3_logic_03',
    previewContract: {
      expectedStateShape: '{ source: any[], filtered: any[] }',
      expectedVisibleChanges: ['filter condition applies', 'results match expected'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r3_visual_03',
    ringId: 'ring_3',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 7,
    title: 'Visual: JSON structure and mapping',
    concept: 'JSON blocks display nested data. Map blocks pull fields from each item. Connect them to extract data from lists of objects.',
    html: '<div class="canvas"><p>JSON data: [{"id": 1, "value": 10}]</p><p style="margin-left: 20px;">→ LOOP item</p><p style="margin-left: 20px;">→ MAP item.value</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }',
    parameters: [],
    next_concept: 'Code to blocks',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ jsonData: Record<string, any>[], mappedValues: any[] }',
      expectedVisibleChanges: ['JSON parses correctly', 'fields extract as expected'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r3_trans_01',
    ringId: 'ring_3',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 8,
    title: 'Translate: Python loops to blocks',
    concept: 'Given loop code, build equivalent block flow. Map for → LOOP, comprehensions → FILTER + COLLECT, results match.',
    html: '<div class="exercise"><div class="code"><pre>numbers = [1, 2, 3]\nresult = [x * 2 for x in numbers]</pre></div><div class="task">Build block flow</div></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; }\n.code { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px; }\npre { margin: 0; font-family: monospace; font-size: 12px; }\n.task { font-size: 14px; color: #334155; }',
    parameters: [],
    next_concept: 'Blocks to loops',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ source: number[], result: number[], match: boolean }',
      expectedVisibleChanges: ['transformation correct', 'output matches Python'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r3_trans_02',
    ringId: 'ring_3',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 9,
    title: 'Translate: Block loops to Python',
    concept: 'Reverse: block flow → Python code. Read the LOOP/FILTER/COLLECT chain. Write equivalent for/if/list comprehension.',
    html: '<div class="exercise"><div class="blocks"><p>LOOP items → FILTER item > 5 → COLLECT results</p></div><div class="task">Write Python code</div></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; }\n.blocks { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-family: monospace; font-size: 12px; }\n.task { font-size: 14px; color: #334155; }',
    parameters: [],
    next_concept: 'Shape mismatch repair',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ source: number[], result: number[], match: boolean }',
      expectedVisibleChanges: ['code produces correct output', 'matches block flow'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r3_trans_03',
    ringId: 'ring_3',
    phaseType: 'interference',
    domainType: 'translation',
    chapterOrder: 10,
    title: 'Debug: Fix data shape mismatch',
    concept: 'Code produces one shape, blocks produce another. Lengths differ, or fields missing. Debug the transformation logic.',
    html: '<div class="exercise"><p>Code: [1, 2, 3] → double → [2, 4, 6]</p><p>Blocks: [1, 2, 3] → double → [2, 4] (wrong count!)</p></div>',
    css: '.exercise { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Synthesis',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ source: any[], codeResult: any[], blockResult: any[], match: boolean }',
      expectedVisibleChanges: ['mismatch identified', 'shape corrected', 'parity achieved'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r3_synth_01',
    ringId: 'ring_3',
    phaseType: 'synthesis',
    domainType: 'synthesis',
    chapterOrder: 11,
    title: 'Build: Data transformation pipeline',
    concept: 'Code and blocks transform a dataset. Filter, map, collect. Both must produce identical output. Show results side-by-side.',
    html: '<div class="demo"><p>Input: list of items</p><p>Filter → Map → Collect</p><p>Output: transformed data</p></div>',
    css: '.demo { font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center; }',
    parameters: [],
    next_concept: 'Ring finale',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ input: any[], codeOutput: any[], blockOutput: any[], parity: boolean }',
      expectedVisibleChanges: ['transformation applies', 'both outputs match'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r3_finale',
    ringId: 'ring_3',
    phaseType: 'finale',
    domainType: 'finale',
    chapterOrder: 12,
    title: '✦ FINALE: JSON data transformation dashboard',
    concept: 'Complete dataset pipeline. Load JSON. Filter by criteria (code + blocks). Display results. Verify parity on all transformations.',
    html: '<div class="dashboard"><p>Load dataset</p><p>Filter → Transform → Display</p><p>Parity: ✓</p></div>',
    css: '.dashboard { font-family: sans-serif; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; text-align: center; }',
    parameters: [
      { label: 'Dataset size', property: 'size', type: 'slider', min: 5, max: 100, default: 20, unit: '' }
    ],
    next_concept: null,
    modePathAvailable: 'both',
    isFinale: true,
    previewContract: {
      expectedStateShape: '{ input: any[], codeOutput: any[], blockOutput: any[], match: boolean }',
      expectedVisibleChanges: [
        'data loads correctly',
        'filters apply',
        'transformations produce identical output',
        'parity check passes'
      ],
      parityCheckRule: 'exact'
    },
    gateCriteria: {
      correctness: 85,
      parity: 85,
      translation: 80,
      debug: 70,
      preview: 85,
      passThreshold: 80
    }
  }
];

export const RING_3_GUIDED = RING_3_LESSONS.filter(
  (l) => l.modePathAvailable === 'guided' || l.modePathAvailable === 'both'
);
export const RING_3_FAST = RING_3_LESSONS.filter(
  (l) => l.modePathAvailable === 'fast' || l.modePathAvailable === 'both'
);

// Ring 4 and Ring 5 use abbreviated structure for now (will expand later)
export const RING_4_LESSONS: Lesson[] = [
  {
    id: 'r4_intro',
    ringId: 'ring_4',
    phaseType: 'intro',
    domainType: 'synthesis',
    chapterOrder: 0,
    title: 'Welcome to Presentation Logic',
    concept: 'CSS values are computed. Logic drives design. Variables become colors, sizes, spacing. The same code generates infinite visual variations.',
    html: '<div class="demo" style="padding: 20px; background: #8b5cf6; color: white; border-radius: 12px; text-align: center;">Design as computed output</div>',
    css: '.demo { font-family: sans-serif; }',
    parameters: [],
    next_concept: 'CSS from code',
    modePathAvailable: 'both'
  },
  {
    id: 'r4_logic_01',
    ringId: 'ring_4',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 1,
    title: 'Compute CSS from state',
    concept: 'color = "blue" if score > 80 else "red". CSS properties are strings computed from logic. State drives appearance.',
    html: '<div class="card"><pre>score = 85\nif score > 80:\n  color = "blue"\nelse:\n  color = "red"</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 12px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Design tokens',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ score: number, color: string }',
      expectedVisibleChanges: ['color computes from logic'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r4_logic_02',
    ringId: 'ring_4',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 2,
    title: 'Design tokens and variables',
    concept: 'Define reusable style values: colors, sizes, spacing. Use them in logic. Change one token, entire theme shifts.',
    html: '<div class="card"><pre>primary = "#3b82f6"\naccentSize = 16 if compact else 24</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 12px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Theme logic',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    previewContract: {
      expectedStateShape: '{ primary: string, accentSize: number }',
      expectedVisibleChanges: ['tokens apply consistently'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r4_logic_03',
    ringId: 'ring_4',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 3,
    title: 'Responsive logic and media queries',
    concept: 'viewport > 768px → layout wide. viewport <= 768px → layout mobile. Logic responds to context.',
    html: '<div class="card"><pre>if viewport_width > 768:\n  cols = 3\nelse:\n  cols = 1</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 12px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Visual theme blocks',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ viewport_width: number, cols: number }',
      expectedVisibleChanges: ['layout adjusts to viewport'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r4_logic_04',
    ringId: 'ring_4',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 4,
    title: 'Combine logic and CSS output',
    concept: 'State → logic decisions → CSS values → rendered UI. The full pipeline: Python logic produces CSS strings.',
    html: '<div class="card"><pre>status = "ready"\nstyle_str = f"color: {color_map[status]}; font-weight: 700"</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 12px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Visual blocks',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ status: string, style_str: string }',
      expectedVisibleChanges: ['styles render correctly'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r4_visual_01',
    ringId: 'ring_4',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 5,
    title: 'Visual: Compute style block',
    concept: 'The "Compute Style" block takes state and produces CSS. Connect it to theme inputs.',
    html: '<div class="canvas"><p>Input: status</p><p style="margin-left: 20px;">→ COMPUTE_STYLE</p><p>Output: CSS string</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Theme application',
    modePathAvailable: 'both',
    equivalentLessonId: 'r4_logic_01',
    previewContract: {
      expectedStateShape: '{ input: string, output: string }',
      expectedVisibleChanges: ['styles compute'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r4_visual_02',
    ringId: 'ring_4',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 6,
    title: 'Visual: Apply theme',
    concept: 'Theme blocks apply pre-defined token sets. Dark mode vs. light mode. Select and apply.',
    html: '<div class="canvas"><p>Theme: [dark | light]</p><p style="margin-left: 20px;">→ APPLY_THEME</p><p>Output: full token set</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Translation',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    equivalentLessonId: 'r4_logic_02',
    previewContract: {
      expectedStateShape: '{ theme: string, tokens: Record<string, string> }',
      expectedVisibleChanges: ['theme tokens apply'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r4_visual_03',
    ringId: 'ring_4',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 7,
    title: 'Visual: Responsive layout block',
    concept: 'Responsive blocks adapt layout based on viewport. No code branching needed — block handles it.',
    html: '<div class="canvas"><p>RESPONSIVE</p><p style="margin-left: 20px;">→ if mobile: 1col</p><p style="margin-left: 20px;">→ if desktop: 3col</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Translation',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ viewport: number, layout: string }',
      expectedVisibleChanges: ['layout adjusts responsively'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r4_trans_01',
    ringId: 'ring_4',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 8,
    title: 'Translate: Logic to theme blocks',
    concept: 'Given CSS logic code, build block theme. Map conditions → blocks. Apply tokens.',
    html: '<div class="exercise"><pre>if mode == "dark":\n  bg = "#1e293b"\nelse:\n  bg = "#f8fafc"</pre></div>',
    css: '.exercise { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Blocks to logic',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ mode: string, codeColor: string, blockColor: string }',
      expectedVisibleChanges: ['colors match'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r4_trans_02',
    ringId: 'ring_4',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 9,
    title: 'Translate: Theme blocks to logic',
    concept: 'Reverse: block theme → logic code. Write condition and value assignments.',
    html: '<div class="exercise"><p>Block theme: [dark → bg #1e293b | light → bg #f8fafc]</p></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; background: #f8fafc; border-radius: 8px; }',
    parameters: [],
    next_concept: 'Theme mismatch',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ mode: string, codeCSS: string, blockCSS: string }',
      expectedVisibleChanges: ['CSS matches'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r4_trans_03',
    ringId: 'ring_4',
    phaseType: 'interference',
    domainType: 'translation',
    chapterOrder: 10,
    title: 'Debug: Fix theme mismatch',
    concept: 'Code produces one color scheme, blocks produce another. Debug the logic or theme application.',
    html: '<div class="exercise"><p>Code: dark theme → bg #1e293b</p><p>Blocks: dark theme → bg #333 (wrong!)</p></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; background: #f8fafc; border-radius: 8px; }',
    parameters: [],
    next_concept: 'Synthesis',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ mode: string, codeCSS: string, blockCSS: string, match: boolean }',
      expectedVisibleChanges: ['mismatch fixed', 'colors match'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r4_synth_01',
    ringId: 'ring_4',
    phaseType: 'synthesis',
    domainType: 'synthesis',
    chapterOrder: 11,
    title: 'Build: Theme-driven UI with code + blocks',
    concept: 'State → logic produces theme → UI renders. Both code and blocks must show identical UI.',
    html: '<div class="demo"><p>Theme selector</p><p>UI updates in real time</p></div>',
    css: '.demo { font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center; }',
    parameters: [],
    next_concept: 'Ring finale',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ theme: string, codeUI: string, blockUI: string }',
      expectedVisibleChanges: ['theme changes UI', 'parity maintained'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r4_finale',
    ringId: 'ring_4',
    phaseType: 'finale',
    domainType: 'finale',
    chapterOrder: 12,
    title: '✦ FINALE: Design system with computed styles',
    concept: 'Complete design system: tokens, themes, responsive logic. Code and blocks both compute UI. Verify visual parity.',
    html: '<div class="system"><p>Design System Dashboard</p><p>Tokens + Themes + Logic = UI</p></div>',
    css: '.system { font-family: sans-serif; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; text-align: center; }',
    parameters: [
      { label: 'Theme', property: 'theme', type: 'select', options: ['light', 'dark', 'auto'], default: 'light' }
    ],
    next_concept: null,
    modePathAvailable: 'both',
    isFinale: true,
    previewContract: {
      expectedStateShape: '{ theme: string, codeOutput: string, blockOutput: string, match: boolean }',
      expectedVisibleChanges: [
        'theme selector works',
        'CSS computes correctly',
        'UI renders identically from both paths',
        'parity check passes'
      ],
      parityCheckRule: 'semantic'
    },
    gateCriteria: {
      correctness: 85,
      parity: 85,
      translation: 80,
      debug: 70,
      preview: 85,
      passThreshold: 80
    }
  }
];

export const RING_4_GUIDED = RING_4_LESSONS.filter(
  (l) => l.modePathAvailable === 'guided' || l.modePathAvailable === 'both'
);
export const RING_4_FAST = RING_4_LESSONS.filter(
  (l) => l.modePathAvailable === 'fast' || l.modePathAvailable === 'both'
);

export const RING_5_LESSONS: Lesson[] = [
  {
    id: 'r5_intro',
    ringId: 'ring_5',
    phaseType: 'intro',
    domainType: 'synthesis',
    chapterOrder: 0,
    title: 'Welcome to Integrated Systems',
    concept: 'Real apps combine all skills: logic, data, UI, I/O. API contracts. Async safety. Performance. Architecture emerges from decisions.',
    html: '<div class="demo" style="padding: 20px; background: #06b6d4; color: white; border-radius: 12px; text-align: center;">Full-stack integration</div>',
    css: '.demo { font-family: sans-serif; }',
    parameters: [],
    next_concept: 'API design',
    modePathAvailable: 'both'
  },
  {
    id: 'r5_logic_01',
    ringId: 'ring_5',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 1,
    title: 'Design API contracts',
    concept: 'API input: {user_id, action}. API output: {status, data, error}. Define interface clearly before implementation.',
    html: '<div class="card"><pre>Request: {"user_id": 123, "action": "get"}\nResponse: {"status": "ok", "data": {...}}</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 11px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Async handling',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ request: Record<string, any>, response: Record<string, any> }',
      expectedVisibleChanges: ['API contract satisfied'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r5_logic_02',
    ringId: 'ring_5',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 2,
    title: 'Async operations and safety',
    concept: 'async/await handles delays (network, db). Try/except catches errors. State updates only after success.',
    html: '<div class="card"><pre>async def fetch():\n  try:\n    data = await api.get()\n    return data\n  except Error:\n    return None</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 11px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Performance optimization',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    previewContract: {
      expectedStateShape: '{ pending: boolean, data: any, error: any }',
      expectedVisibleChanges: ['async state managed'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r5_logic_03',
    ringId: 'ring_5',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 3,
    title: 'Performance measurement',
    concept: 'Trace execution time. Identify bottlenecks. Measure from request → response. Optimize hot paths.',
    html: '<div class="card"><pre>start = time()\nresult = process_data()\nlatency = time() - start</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 11px; color: #1e293b; }',
    parameters: [],
    next_concept: 'System architecture',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ start: number, end: number, latency: number }',
      expectedVisibleChanges: ['performance measured'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r5_logic_04',
    ringId: 'ring_5',
    phaseType: 'core',
    domainType: 'logic',
    chapterOrder: 4,
    title: 'System architecture and layers',
    concept: 'API layer → logic layer → data layer → presentation layer. Each layer isolated. Dependencies flow one way. Testable, scalable.',
    html: '<div class="card"><pre>Request → API → Logic → DB → Response\n           ↓     ↓      ↓\n          JSON  Code  Records</pre></div>',
    css: '.card { font-family: monospace; padding: 16px; background: #f1f5f9; border-radius: 8px; }\npre { margin: 0; font-size: 11px; color: #1e293b; }',
    parameters: [],
    next_concept: 'Visual system',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ request: any, logicResult: any, dbQuery: any, response: any }',
      expectedVisibleChanges: ['layers execute in sequence'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r5_visual_01',
    ringId: 'ring_5',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 5,
    title: 'Visual: Full-stack flow blocks',
    concept: 'Orchestrate entire flow: API call → parse → logic → render. Blocks show data moving through layers.',
    html: '<div class="canvas"><p>API_CALL → PARSE_JSON → LOGIC → RENDER</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Error handling',
    modePathAvailable: 'both',
    equivalentLessonId: 'r5_logic_01',
    previewContract: {
      expectedStateShape: '{ flow: string[], output: any }',
      expectedVisibleChanges: ['flow executes', 'data transforms'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r5_visual_02',
    ringId: 'ring_5',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 6,
    title: 'Visual: Error handling and fallback',
    concept: 'TRY block → SUCCESS path. CATCH block → FALLBACK. Both guaranteed to complete. State never undefined.',
    html: '<div class="canvas"><p>TRY fetch() → SUCCESS: use data</p><p>CATCH error → FALLBACK: use default</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Performance blocks',
    modePathAvailable: 'guided',
    isSkippableInGuided: true,
    equivalentLessonId: 'r5_logic_02',
    previewContract: {
      expectedStateShape: '{ tryPath: boolean, result: any }',
      expectedVisibleChanges: ['error handled gracefully'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r5_visual_03',
    ringId: 'ring_5',
    phaseType: 'core',
    domainType: 'visual',
    chapterOrder: 7,
    title: 'Visual: Performance tracing',
    concept: 'TRACE blocks measure latency at each step. Show where time spent. Identify bottlenecks.',
    html: '<div class="canvas"><p>TRACE: fetch (150ms) → parse (20ms) → render (30ms)</p><p>Total: 200ms</p></div>',
    css: '.canvas { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; }',
    parameters: [],
    next_concept: 'Architecture translation',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ steps: Array<{name: string, ms: number}>, total: number }',
      expectedVisibleChanges: ['latency visible'],
      parityCheckRule: 'semantic'
    }
  },
  {
    id: 'r5_trans_01',
    ringId: 'ring_5',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 8,
    title: 'Translate: API logic to block flow',
    concept: 'Given API handler code, build equivalent block orchestration. Map stages → blocks. Preserve control flow.',
    html: '<div class="exercise"><pre>data = fetch_api()\nprocessed = transform(data)\nrender_ui(processed)</pre></div>',
    css: '.exercise { font-family: monospace; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 11px; }',
    parameters: [],
    next_concept: 'Blocks to API',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ codeResult: any, blockResult: any }',
      expectedVisibleChanges: ['outputs match'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r5_trans_02',
    ringId: 'ring_5',
    phaseType: 'translation',
    domainType: 'translation',
    chapterOrder: 9,
    title: 'Translate: Block orchestration to code',
    concept: 'Reverse: read block flow → write API handler. Preserve async, error handling, layering.',
    html: '<div class="exercise"><p>Blocks: FETCH → PARSE → LOGIC → RENDER</p><p>Write: def handler()...</p></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; background: #f8fafc; border-radius: 8px; }',
    parameters: [],
    next_concept: 'Integration mismatch',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ codeResult: any, blockResult: any }',
      expectedVisibleChanges: ['outputs match'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r5_trans_03',
    ringId: 'ring_5',
    phaseType: 'interference',
    domainType: 'translation',
    chapterOrder: 10,
    title: 'Debug: Fix integration breakdown',
    concept: 'API returns data, but one path processes it wrong. Code layer vs. block layer disagree. Trace and fix.',
    html: '<div class="exercise"><p>Code: fetch → 100ms → correct result</p><p>Blocks: fetch → 500ms → wrong result (timeout!)</p></div>',
    css: '.exercise { font-family: sans-serif; padding: 16px; background: #f8fafc; border-radius: 8px; }',
    parameters: [],
    next_concept: 'Synthesis',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ codeResult: any, blockResult: any, match: boolean }',
      expectedVisibleChanges: ['error identified', 'fixed', 'parity achieved'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r5_synth_01',
    ringId: 'ring_5',
    phaseType: 'synthesis',
    domainType: 'synthesis',
    chapterOrder: 11,
    title: 'Build: Full-stack API integration',
    concept: 'End-to-end: request → code logic → block orchestration → response. Both paths execute. Results match. Latency visible.',
    html: '<div class="demo"><p>Full-stack API handler</p><p>Request ↔ Code + Blocks ↔ Response</p></div>',
    css: '.demo { font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center; }',
    parameters: [],
    next_concept: 'Ring finale',
    modePathAvailable: 'both',
    previewContract: {
      expectedStateShape: '{ request: any, codeResponse: any, blockResponse: any, parity: boolean }',
      expectedVisibleChanges: ['API works', 'latency visible', 'both paths match'],
      parityCheckRule: 'exact'
    }
  },
  {
    id: 'r5_finale',
    ringId: 'ring_5',
    phaseType: 'finale',
    domainType: 'finale',
    chapterOrder: 12,
    title: '✦ FINALE: Complete production system',
    concept: 'Build a production-grade app: API, logic, async handling, error recovery, performance tracking. Code and blocks orchestrate together.',
    html: '<div class="system"><p>Production System Architecture</p><p>All layers integrated</p></div>',
    css: '.system { font-family: sans-serif; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; text-align: center; }',
    parameters: [
      { label: 'Load', property: 'load', type: 'slider', min: 1, max: 1000, default: 100, unit: 'req/s' }
    ],
    next_concept: null,
    modePathAvailable: 'both',
    isFinale: true,
    previewContract: {
      expectedStateShape: '{ load: number, codeMetrics: Record<string, number>, blockMetrics: Record<string, number>, parity: boolean }',
      expectedVisibleChanges: [
        'system handles load',
        'latency measured',
        'errors handled gracefully',
        'code and block paths synchronized',
        'parity verified across all operations'
      ],
      parityCheckRule: 'exact'
    },
    gateCriteria: {
      correctness: 85,
      parity: 85,
      translation: 80,
      debug: 70,
      preview: 85,
      passThreshold: 80
    }
  }
];

export const RING_5_GUIDED = RING_5_LESSONS.filter(
  (l) => l.modePathAvailable === 'guided' || l.modePathAvailable === 'both'
);
export const RING_5_FAST = RING_5_LESSONS.filter(
  (l) => l.modePathAvailable === 'fast' || l.modePathAvailable === 'both'
);
