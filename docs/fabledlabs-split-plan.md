# FabledLabs Split Plan

## Goal

Decompose the current FableCode surface into four focused products that can evolve independently:

- FabledLabs: Alkemist
- FabledLabs: Scribe
- FabledLabs: Tesseract
- FabledLabs: Logix

This plan keeps the current app running while introducing product boundaries first, then repository/package extraction second.

## Product Definitions

### FabledLabs: Alkemist

Mission:
Electron code development space with AI integration, sandboxed execution, and design previews.

Primary source inspiration:
- Attached repository: Alkemist-copilot-create-alkemist-ide-repo

Current FableCode mapping:
- Build page and agent-driven coding workflows
- Workspace + toolchain + debug workflows

### FabledLabs: Scribe

Mission:
Coursework platform and practical lesson system from existing FableCode School workflows.

Primary source inspiration:
- Native to this repository (existing School mode)

Current FableCode mapping:
- School page and lesson pipeline
- Learn panel + lesson progression data

### FabledLabs: Tesseract

Mission:
3D design space for character development and easy Sims-like floor layout blueprints.

Primary source inspiration:
- Native design direction (no external source repo provided)

Current FableCode mapping:
- Design page (React Three Fiber canvas)
- 3D asset and layout interaction surfaces

### FabledLabs: Logix

Mission:
Block coding and logic chain orchestration.

Primary source inspiration:
- Attached repository: FabledFlow (architectural inspiration only)

Current FableCode mapping:
- Blocks page + flow definition system
- Route/block schema and pathway editor

## Implementation Phases

### Phase 1: Product Boundary Layer (completed in this iteration)

- Add central product registry in src/shared/labs.ts
- Add first-class product routes:
  - /alkemist
  - /scribe
  - /tesseract
  - /logix
- Keep legacy routes alive for compatibility:
  - /build
  - /school
  - /design
  - /blocks
- Reframe Hub and top navigation around the four products

### Phase 2: Module Isolation (completed in follow-up iteration)

- Move each product into dedicated renderer modules:
  - src/renderer/labs/alkemist
  - src/renderer/labs/scribe
  - src/renderer/labs/tesseract
  - src/renderer/labs/logix
- Keep shared dependencies in:
  - src/shared
  - src/platform
  - src/main
- Route first-class and legacy paths through lab entrypoints so each product can evolve independently.

### Phase 2.5: First Product-Specific Deepening (completed in follow-up iteration)

- Alkemist now owns sandbox profile definitions, workspace templates, and product-specific agent guidance.
- Logix now owns block templates, starter chains, node creation, and validation diagnostics.
- Scribe and Tesseract have initial blueprint files that define their next extraction targets.

### Phase 3: Package/Repo Extraction (optional but recommended)

Option A: single monorepo with workspaces
- apps/alkemist
- apps/scribe
- apps/tesseract
- apps/logix
- packages/shared-core
- packages/ui-kit

Option B: independent repositories
- fabledlabs-alkemist
- fabledlabs-scribe
- fabledlabs-tesseract
- fabledlabs-logix

### Phase 4: Product-Specific Hardening

- Alkemist: sandbox execution policy, project templates, AI workflow quality gates
- Scribe: lesson authoring, progress analytics, educator controls
- Tesseract: floor tool interactions, snap/grid logic, character rig presets
- Logix: node catalog, route validation, execution simulator, reusable block packs

## Non-Goals

- No direct code copy from third-party projects.
- No forced breaking change to current route paths during boundary setup.
- No immediate split into 4 repos in a single risky move.

## Success Criteria

- Each product has a distinct route, owner boundary, and roadmap.
- Legacy behavior remains functional during migration.
- Migration can proceed product-by-product without blocking releases.
