# Debug Workflow

FableCode's debug panel follows the spirit of automated code-review tools such as Sourcery without depending on Sourcery itself.

The current workflow has two passes:

1. Local heuristic scan for high-signal issues such as direct HTML injection, dynamic execution, likely hard-coded secrets, empty catch blocks, oversized files, temporary logging, and interval cleanup risks.
2. Optional Ollama review using the selected agent profile and model, with the file content, debug focus, and optional DJMT toolchain context passed as context.

The intended next layer is a rule registry with language-specific analyzers, patch suggestions, test-generation prompts, and saved debug reports per workspace.
