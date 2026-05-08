# Toolchain And Toolkit Integration

FableCode connects to the DJMT toolchain depot at `/Volumes/DJMT/FABLEDHARBINGER/toolchains`.

The Electron main process inspects the depot and exposes a safe summary to the renderer:

- top-level depot directories
- command shims from `bin/`, `npm-global/bin/`, and `pnpm/`
- config files in `config/`
- the activation command for terminal use
- the depot README when present

The renderer shows these commands in the Toolchain panel. Clicking a command seeds the agent composer with a tool-aware prompt. The `Include toolchain in agent context` toggle appends the depot summary to chat and debug requests so local Ollama agents can reason about available tooling.

The Toolkits section expands this into a capability registry. It checks conventional system command locations, DJMT command shims, root workspace config files, VS Code extension folders, and MCP reference paths. Capabilities are grouped into local AI, Holograim persistence, Conda/Python, Node/TypeScript, .NET/C#, Java/Gradle, Go, containers, Azure, Google Cloud, Git/GitHub, code quality, tests/browser automation, databases, Figma/design context, and CMake/native build.

Each capability is marked `available`, `partial`, or `missing`. Available and partial capabilities can seed the composer with a focused prompt and are included in agent/debug context when the context toggle is enabled.

FableCode does not execute arbitrary toolchain commands from the UI yet. Execution should be added behind an explicit confirmation flow with argument validation, output capture, cancellation, and workspace scoping.