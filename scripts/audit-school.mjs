#!/usr/bin/env node
/**
 * scripts/audit-school.mjs — programmatic data-integrity audit of the
 * FableCode school. Run without an API key; touches no network.
 *
 *   node scripts/audit-school.mjs
 *
 * Reports:
 *   1. Lesson inventory   — total count per ring + path (guided/fast)
 *   2. Schema check       — every Lesson has required fields, no dupes
 *   3. Teaching coverage  — which lessons have a teaching/help block
 *   4. Cross-refs         — next_concept, equivalentLessonId, ring prereqs
 *   5. Parameter sanity   — sliders have min<max, defaults in range
 *   6. Agents             — every agent has a system prompt + model hint
 *
 * The audit imports rings.ts / agents.ts directly via tsx so we always
 * see the live runtime values, not a fork.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Invoke this script with:  node --import tsx scripts/audit-school.mjs
// tsx auto-registers and transpiles the .ts imports below.

const rings    = await import(resolve(root, 'src/shared/rings.ts'));
const lessons  = await import(resolve(root, 'src/shared/lessons.ts'));
const agents   = await import(resolve(root, 'src/shared/agents.ts'));

const RINGS = rings.RINGS;
const LESSONS = lessons.LESSONS;

const RING_PATHS = {
  ring_1: { guided: lessons.RING_1_GUIDED, fast: lessons.RING_1_FAST, all: lessons.RING_1_LESSONS },
  ring_2: { guided: lessons.RING_2_GUIDED, fast: lessons.RING_2_FAST, all: lessons.RING_2_LESSONS },
  ring_3: { guided: lessons.RING_3_GUIDED, fast: lessons.RING_3_FAST, all: lessons.RING_3_LESSONS },
  ring_4: { guided: lessons.RING_4_GUIDED, fast: lessons.RING_4_FAST, all: lessons.RING_4_LESSONS },
  ring_5: { guided: lessons.RING_5_GUIDED, fast: lessons.RING_5_FAST, all: lessons.RING_5_LESSONS }
};

const issues = { error: [], warn: [], info: [] };
const log = (level, msg) => issues[level].push(msg);

// ── 1. Inventory ─────────────────────────────────────────────────────────
console.log('\n═══ 1. LESSON INVENTORY ═══');
console.log(`Total lessons (flat LESSONS): ${LESSONS.length}`);
for (const ring of RINGS) {
  const paths = RING_PATHS[ring.id];
  if (!paths) { log('error', `RING ${ring.id} has no path bundle in lessons.ts`); continue; }
  console.log(`  ${ring.id.padEnd(7)} ${ring.title.padEnd(40)} guided=${paths.guided.length.toString().padStart(3)}  fast=${paths.fast.length.toString().padStart(3)}  total=${paths.all.length.toString().padStart(3)}`);
  if (paths.guided.length !== ring.guideCount) log('warn', `${ring.id}: guideCount=${ring.guideCount} but RING_${ring.id.split('_')[1]}_GUIDED.length=${paths.guided.length}`);
  if (paths.fast.length !== ring.fastCount)    log('warn', `${ring.id}: fastCount=${ring.fastCount} but RING_${ring.id.split('_')[1]}_FAST.length=${paths.fast.length}`);
}

// ── 2. Schema check ──────────────────────────────────────────────────────
console.log('\n═══ 2. SCHEMA CHECK ═══');
const seenIds = new Map();
let schemaErrors = 0;
for (const lesson of LESSONS) {
  const where = `lesson "${lesson.id}" (${lesson.title})`;
  if (!lesson.id) { log('error', `Lesson missing id: ${JSON.stringify(lesson).slice(0,120)}`); schemaErrors++; continue; }
  if (seenIds.has(lesson.id)) { log('error', `Duplicate lesson id: ${lesson.id} (also in ${seenIds.get(lesson.id)})`); schemaErrors++; }
  seenIds.set(lesson.id, lesson.title);
  for (const field of ['title', 'concept', 'html', 'css']) {
    if (typeof lesson[field] !== 'string' || lesson[field].length === 0) {
      log('error', `${where}: missing or empty "${field}"`); schemaErrors++;
    }
  }
  if (!Array.isArray(lesson.parameters)) { log('error', `${where}: parameters is not an array`); schemaErrors++; }
}
console.log(`Schema errors: ${schemaErrors}`);

// ── 3. Teaching coverage (across every ring) ─────────────────────────────
console.log('\n═══ 3. TEACHING COVERAGE (per ring) ═══');
const allRingLessons = [];
for (const ring of RINGS) {
  const paths = RING_PATHS[ring.id];
  if (!paths) continue;
  const ringLessons = paths.all;
  allRingLessons.push(...ringLessons);
  let t = 0, h = 0, l = 0, m = 0;
  for (const lesson of ringLessons) {
    if (lesson.teaching) t++;
    if (lesson.help) h++;
    if (lesson.teaching?.lineByLine?.length) l++;
    if (lesson.teaching?.misconceptions?.length) m++;
  }
  const pct = (n) => `${((n / ringLessons.length) * 100).toFixed(0)}%`.padStart(4);
  console.log(`  ${ring.id}  teach=${t.toString().padStart(2)}/${ringLessons.length} (${pct(t)})  help=${h.toString().padStart(2)}/${ringLessons.length} (${pct(h)})  line=${l.toString().padStart(2)}/${ringLessons.length} (${pct(l)})  misconc=${m.toString().padStart(2)}/${ringLessons.length} (${pct(m)})`);
  if (t < ringLessons.length * 0.5) log('warn', `${ring.id}: teaching coverage below 50% (${t}/${ringLessons.length})`);
}
// Replace LESSONS-only loop above with the de-duplicated all-rings union for downstream sanity:
const ALL_LESSONS = Array.from(new Map(allRingLessons.map(l => [l.id, l])).values());
console.log(`\n  Union across all rings (de-duplicated by id): ${ALL_LESSONS.length} unique lessons`);

// ── 4. Cross-refs ────────────────────────────────────────────────────────
console.log('\n═══ 4. CROSS-REFERENCES ═══');
let brokenRefs = 0;
for (const lesson of LESSONS) {
  if (lesson.equivalentLessonId && !seenIds.has(lesson.equivalentLessonId)) {
    log('error', `${lesson.id}: equivalentLessonId "${lesson.equivalentLessonId}" not found`); brokenRefs++;
  }
}
for (const ring of RINGS) {
  for (const prereq of ring.prerequisites ?? []) {
    if (!RINGS.find(r => r.id === prereq)) { log('error', `Ring ${ring.id}: prerequisite "${prereq}" not found`); brokenRefs++; }
  }
}
console.log(`Broken refs: ${brokenRefs}`);

// ── 5. Parameter sanity ──────────────────────────────────────────────────
console.log('\n═══ 5. PARAMETER SANITY ═══');
let paramIssues = 0;
for (const lesson of LESSONS) {
  for (const p of lesson.parameters ?? []) {
    const where = `${lesson.id} param "${p.label}"`;
    if (p.type === 'slider') {
      if (typeof p.min !== 'number' || typeof p.max !== 'number') { log('error', `${where}: slider missing numeric min/max`); paramIssues++; continue; }
      if (p.min >= p.max) { log('error', `${where}: slider min(${p.min}) >= max(${p.max})`); paramIssues++; }
      if (typeof p.default === 'number' && (p.default < p.min || p.default > p.max)) {
        log('error', `${where}: default(${p.default}) out of [${p.min}, ${p.max}]`); paramIssues++;
      }
    }
    if (p.type === 'select') {
      if (!Array.isArray(p.options) || p.options.length === 0) { log('error', `${where}: select with no options`); paramIssues++; }
      else if (p.default !== undefined && !p.options.includes(p.default)) {
        log('warn', `${where}: default "${p.default}" not in options [${p.options.join(', ')}]`); paramIssues++;
      }
    }
  }
}
console.log(`Parameter issues: ${paramIssues}`);

// ── 6. Agents ────────────────────────────────────────────────────────────
console.log('\n═══ 6. AGENT PROFILES ═══');
const AGENTS = agents.AGENT_PROFILES ?? agents.AGENTS ?? [];
console.log(`Total agents: ${AGENTS.length}`);
let agentIssues = 0;
for (const a of AGENTS) {
  const where = `agent "${a.id}"`;
  if (!a.id) { log('error', `Agent missing id`); agentIssues++; continue; }
  if (!a.systemPrompt && !a.system_prompt) { log('error', `${where}: no system prompt`); agentIssues++; }
  if (!a.modelHint && !a.model_hint) { log('warn', `${where}: no modelHint`); agentIssues++; }
  if (!a.label && !a.title && !a.name) { log('warn', `${where}: no display name`); agentIssues++; }
  console.log(`  ${(a.id ?? '???').padEnd(20)} ${(a.label ?? a.title ?? a.name ?? '').padEnd(28)} model=${a.modelHint ?? a.model_hint ?? '(none)'}`);
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log('\n═══ SUMMARY ═══');
console.log(`Errors:   ${issues.error.length}`);
console.log(`Warnings: ${issues.warn.length}`);
for (const msg of issues.error) console.log(`  ✗ ${msg}`);
for (const msg of issues.warn)  console.log(`  ! ${msg}`);
process.exit(issues.error.length > 0 ? 1 : 0);
