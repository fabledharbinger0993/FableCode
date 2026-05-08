# Holograim Persistence

FableCode connects to the local HologrA.I.m MCP server for cross-session recall while keeping a local JSON snapshot as the reliable restore path.

## Default MCP Server

The discovered server path is:

```bash
/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/server.py
```

FableCode launches it over stdio with the discovered Holograim virtual environment:

```bash
/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/.venv/bin/python /Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/server.py
```

The server persists data under:

```bash
/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/data
```

Its SQLite database is:

```bash
/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/data/holograim.db
```

## Environment Overrides

Set these before launching FableCode if the server moves or you want a different Python command:

```bash
HOLOGRAIM_MCP_SERVER=/path/to/server.py
HOLOGRAIM_MCP_COMMAND=/path/to/.venv/bin/python
```

## What Gets Remembered

FableCode saves a session snapshot containing:

- session ID and save time
- active agent and model
- workspace root and selected file
- file filter, debug focus, and toolchain root
- toolchain context toggle
- conversation history

The local snapshot is written below Electron's app data directory at `persistence/fablecode-session.json`. On startup, the app restores this snapshot first. Holograim writes are queued in the background so autosave stays responsive, and the Recall panel can query related memories on demand.

## MCP Tools Used

FableCode uses the Holograim server's existing tools:

- `store_memory` for confidence-weighted session snapshots
- `query_memory` for semantic and holographic recall

If Holograim cannot be launched, the app continues with local snapshot restore and marks the Recall panel as fallback mode.

## Reference Paths

Each agent prompt can include a reference block with:

- FableCode session ID
- workspace root
- selected file
- DJMT toolchain root
- Holograim MCP server path
- Holograim database path
- local snapshot path

This gives the selected local model concrete paths to reason from across restarts and toolchain-heavy workflows.
