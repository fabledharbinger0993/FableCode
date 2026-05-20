# FabledLabs (formerly FableCode)

FabledLabs is a local-first desktop platform built with Electron, React, TypeScript, Conda, and Ollama. The existing FableCode app is being split into four focused products:

- FabledLabs: Alkemist
- FabledLabs: Scribe
- FabledLabs: Tesseract
- FabledLabs: Logix

This migration keeps current functionality live while establishing clearer product boundaries for faster iteration.

## What It Includes

- Product split plan and migration backlog:
	- `docs/fabledlabs-split-plan.md`
	- `docs/fabledlabs-migration-backlog.md`

- Electron webview-style desktop shell with a Vite React renderer.
- Ollama HTTP integration through the Electron main process.
- Agent profiles based on the requested VS Code designs: Mojo-Dojo, Sovern, Bool, and Bane.
- Workspace folder picker, text-file browser, and file-context chat injection.
- Sourcery-inspired debug panel with local heuristic findings plus optional Ollama model review.
- DJMT toolchain depot discovery with command browsing and optional agent/debug context injection.
- Toolkit capability mapping for local AI, runtimes, cloud CLIs, containers, Git/GitHub, databases, quality tools, build systems, design extensions, VS Code extension signals, workspace configs, and MCP paths.
- Holograim MCP-backed session recall with a local snapshot fallback.
- Conda environment file for reproducible local setup.

## Requirements

- Conda or Miniconda/Mambaforge.
- Node.js 20 or newer. The Conda environment provides this if your system does not.
- Ollama running locally at `http://127.0.0.1:11434`.
- A local Llama-family model, for example `llama3.1:8b`.

## Setup

```bash
conda env create -f environment.yml
conda activate fablecode
npm install
```

Start Ollama and pull a model if needed:

```bash
ollama serve
ollama pull llama3.1:8b
npm run check:ollama
```

Run the app:

```bash
npm run dev
```

Build the app assets:

```bash
npm run build
npm run start
```

## Environment

Copy `.env.example` to `.env` if you need to point FableCode at a non-default Ollama server.

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
FABLECODE_DEFAULT_MODEL=llama3.1:8b
HOLOGRAIM_MCP_SERVER=/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/server.py
HOLOGRAIM_MCP_COMMAND=/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/.venv/bin/python
```

## Toolkits And DJMT Toolchain

FableCode automatically inspects the DJMT toolchain depot at:

```bash
/Volumes/DJMT/FABLEDHARBINGER/toolchains
```

The in-app Toolchain panel exposes command shims from `bin/`, `npm-global/bin/`, and `pnpm/`, shows the activation command, and can include the toolchain summary in agent and debug prompts. The Toolkits section also maps broader local capabilities from system commands, DJMT command shims, workspace config files, VS Code extension folders, and MCP reference paths.

Mapped capability families include local AI, Holograim MCP persistence, Conda/Python, Node/TypeScript, .NET/C#, Java/Gradle, Go, Docker/containers, Azure, Google Cloud, Git/GitHub, code quality, tests/browser automation, databases, Figma/design context, and CMake/native build.

To activate the same depot in a terminal:

```bash
source /Volumes/DJMT/FABLEDHARBINGER/toolchains/config/djmt-toolchains.zsh
```

## Holograim Persistence

FableCode discovers the local HologrA.I.m MCP server and its adjacent virtual environment at:

```bash
/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/server.py
/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/.venv/bin/python
```

The Recall panel restores the last local session snapshot, shows Holograim MCP/database reference paths, and can query the server's `query_memory` tool. Session saves use `store_memory` when the server is available and fall back to Electron app data when it is not.

Details are in [docs/holograim-persistence.md](docs/holograim-persistence.md).

## GitHub

This scaffold is prepared for the GitHub repository:

```bash
git remote add origin git@github.com:fabledharbinger0993/FableCode.git
```

If the remote repository does not exist yet, create it in GitHub or install the GitHub CLI and run:

```bash
gh repo create fabledharbinger0993/FableCode --private --source=. --remote=origin --push
```

## Notes

This is the first repo scaffold, not a full Windsurf replacement. The next high-value steps are real code-edit application, terminal/task orchestration, Git integration, and richer debug rules with test generation.
