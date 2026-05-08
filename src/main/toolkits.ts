import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ToolkitCapability, ToolkitCategory, ToolkitSource, ToolkitStatus, ToolkitSummary, ToolchainCommand } from '../shared/types';

const DEFAULT_TOOLCHAIN_ROOT = '/Volumes/DJMT/FABLEDHARBINGER/toolchains';
const HOLOGRAIM_SERVER_PATH = process.env.HOLOGRAIM_MCP_SERVER
  ?? '/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/holograim-mcp/server.py';
const HOLOGRAIM_COMMAND = process.env.HOLOGRAIM_MCP_COMMAND
  ?? '/Volumes/DJMT/FABLEDHARBINGER/GIT_REPOS/Holograim-mcp/.venv/bin/python';

type ToolkitDefinition = {
  id: string;
  name: string;
  category: ToolkitCategory;
  commandNames: string[];
  configFiles: string[];
  extensionHints: string[];
  notes: string[];
};

const definitions: ToolkitDefinition[] = [
  {
    id: 'local-ai',
    name: 'Local AI Agents',
    category: 'ai',
    commandNames: ['ollama'],
    configFiles: ['.env', '.env.example', 'Modelfile'],
    extensionHints: ['github.copilot', 'ms-toolsai', 'gemini', 'claude', 'continue'],
    notes: ['Routes chat through local Ollama models and can include toolkit context in prompts.']
  },
  {
    id: 'holograim',
    name: 'Holograim MCP Persistence',
    category: 'ai',
    commandNames: [],
    configFiles: [],
    extensionHints: ['mcp', 'holograim'],
    notes: ['Stores and queries session memory through the Holograim MCP server when available.']
  },
  {
    id: 'conda-python',
    name: 'Conda and Python',
    category: 'runtime',
    commandNames: ['conda', 'mamba', 'python', 'python3', 'pip', 'pip3'],
    configFiles: ['environment.yml', 'requirements.txt', 'pyproject.toml', 'setup.py'],
    extensionHints: ['ms-python', 'conda'],
    notes: ['Useful for environment activation, notebook kernels, Python tooling, and MCP server runtimes.']
  },
  {
    id: 'node-typescript',
    name: 'Node and TypeScript',
    category: 'runtime',
    commandNames: ['node', 'npm', 'pnpm', 'yarn', 'tsc', 'vite'],
    configFiles: ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vite.config.ts'],
    extensionHints: ['typescript', 'eslint', 'npm'],
    notes: ['Supports renderer builds, package scripts, TypeScript checks, and Vite app workflows.']
  },
  {
    id: 'dotnet-csharp',
    name: '.NET and C#',
    category: 'runtime',
    commandNames: ['dotnet', 'csharp-ls'],
    configFiles: ['global.json', 'Directory.Build.props', 'Scaffold.csproj', 'Scaffold.sln'],
    extensionHints: ['ms-dotnettools', 'csharp'],
    notes: ['Can support C# project inspection, build commands, and language-server backed review.']
  },
  {
    id: 'java-gradle',
    name: 'Java and Gradle',
    category: 'runtime',
    commandNames: ['java', 'javac', 'mvn', 'gradle'],
    configFiles: ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle'],
    extensionHints: ['redhat.java', 'gradle'],
    notes: ['Covers Java build/test/debug flows and Gradle project discovery.']
  },
  {
    id: 'go',
    name: 'Go',
    category: 'runtime',
    commandNames: ['go', 'gofmt', 'golangci-lint'],
    configFiles: ['go.mod', 'go.sum'],
    extensionHints: ['golang.go'],
    notes: ['Provides Go tests, formatting, module inspection, and compile checks.']
  },
  {
    id: 'containers',
    name: 'Docker and Containers',
    category: 'container',
    commandNames: ['docker', 'docker-compose', 'podman', 'kubectl'],
    configFiles: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.dockerignore'],
    extensionHints: ['ms-azuretools.vscode-docker', 'container-tools', 'devcontainers'],
    notes: ['Ready for container status checks, build orchestration, compose workflows, and devcontainer detection.']
  },
  {
    id: 'azure',
    name: 'Azure',
    category: 'cloud',
    commandNames: ['az', 'func'],
    configFiles: ['azure.yaml', 'host.json', 'local.settings.json'],
    extensionHints: ['ms-azuretools', 'azure', 'azurerm'],
    notes: ['Can surface Azure auth, Functions, resources, and deployment context once execution is enabled.']
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud',
    category: 'cloud',
    commandNames: ['gcloud', 'gsutil', 'bq'],
    configFiles: ['app.yaml', 'cloudbuild.yaml'],
    extensionHints: ['googlecloudtools', 'google-cloud'],
    notes: ['Can expose project context, Cloud Build configs, and deployment checks.']
  },
  {
    id: 'git-github',
    name: 'Git and GitHub',
    category: 'git',
    commandNames: ['git', 'gh'],
    configFiles: ['.git', '.github'],
    extensionHints: ['github', 'gitlens'],
    notes: ['Supports repo state, pull requests, issue context, branch summaries, and release notes.']
  },
  {
    id: 'code-quality',
    name: 'Code Quality',
    category: 'quality',
    commandNames: ['eslint', 'prettier', 'stylelint', 'tsc', 'sonar-scanner'],
    configFiles: ['eslint.config.js', '.eslintrc', '.eslintrc.json', '.prettierrc', 'sonar-project.properties'],
    extensionHints: ['eslint', 'prettier', 'sonarlint', 'streetsidesoftware.code-spell-checker'],
    notes: ['Feeds lint, format, spell-check, static analysis, and review signals into agent context.']
  },
  {
    id: 'tests',
    name: 'Tests and Browser Automation',
    category: 'quality',
    commandNames: ['vitest', 'jest', 'playwright', 'cypress'],
    configFiles: ['vitest.config.ts', 'jest.config.js', 'playwright.config.ts', 'cypress.config.ts'],
    extensionHints: ['test-adapter', 'playwright', 'cypress'],
    notes: ['Targets test discovery, focused verification, screenshots, and regression checks.']
  },
  {
    id: 'databases',
    name: 'Database Tooling',
    category: 'data',
    commandNames: ['sqlite3', 'psql', 'mysql', 'mongosh', 'redis-cli'],
    configFiles: ['schema.sql', 'prisma.schema', 'drizzle.config.ts'],
    extensionHints: ['database-client', 'sqltools', 'mongodb', 'prisma'],
    notes: ['Can expose schema browsing, query helpers, migration files, and local database status.']
  },
  {
    id: 'figma-design',
    name: 'Figma and Design Context',
    category: 'design',
    commandNames: [],
    configFiles: ['design-tokens.json', 'tokens.json'],
    extensionHints: ['figma'],
    notes: ['Useful for design reference capture, tokens, UI audits, and frontend implementation context.']
  },
  {
    id: 'cmake-build',
    name: 'CMake and Native Build',
    category: 'build',
    commandNames: ['cmake', 'make', 'ninja'],
    configFiles: ['CMakeLists.txt', 'Makefile'],
    extensionHints: ['cmake-tools', 'cpptools'],
    notes: ['Supports native build graph inspection and C/C++ compile workflows.']
  }
];

export async function inspectToolkits(workspacePath = '', toolchainRoot = DEFAULT_TOOLCHAIN_ROOT): Promise<ToolkitSummary> {
  const rootPath = toolchainRoot.trim() || DEFAULT_TOOLCHAIN_ROOT;
  const workspaceRoot = workspacePath.trim();
  const allCommandNames = Array.from(new Set(definitions.flatMap((definition) => definition.commandNames)));
  const [toolchainCommands, systemCommands, workspaceFiles, extensionFolders, holograimRefs] = await Promise.all([
    listToolchainCommands(rootPath),
    listSystemCommands(allCommandNames),
    listWorkspaceConfigFiles(workspaceRoot),
    listVsCodeExtensionFolders(),
    getHolograimReferences()
  ]);
  const commands = [...toolchainCommands, ...systemCommands];
  const capabilities = definitions.map((definition) => buildCapability(
    definition,
    commands,
    workspaceFiles,
    extensionFolders,
    holograimRefs
  ));

  return {
    checkedAt: new Date().toISOString(),
    workspacePath: workspaceRoot,
    toolchainRoot: rootPath,
    availableCount: capabilities.filter((capability) => capability.status === 'available').length,
    partialCount: capabilities.filter((capability) => capability.status === 'partial').length,
    missingCount: capabilities.filter((capability) => capability.status === 'missing').length,
    capabilities
  };
}

function buildCapability(
  definition: ToolkitDefinition,
  commands: ToolchainCommand[],
  workspaceFiles: string[],
  extensionFolders: string[],
  holograimRefs: string[]
): ToolkitCapability {
  const matchedCommands = commands.filter((command) => definition.commandNames.includes(command.name));
  const matchedConfigs = workspaceFiles.filter((file) => definition.configFiles.includes(file));
  const extensionMatches = extensionFolders.filter((extension) =>
    definition.extensionHints.some((hint) => extension.toLowerCase().includes(hint.toLowerCase()))
  );
  const referencePaths = definition.id === 'holograim' ? holograimRefs : [];
  const sources = getSources(matchedCommands, matchedConfigs, extensionMatches, referencePaths);
  const status = getStatus(definition, matchedCommands, matchedConfigs, extensionMatches, referencePaths);

  return {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    status,
    summary: summarizeCapability(status, matchedCommands, matchedConfigs, extensionMatches, referencePaths),
    commands: matchedCommands,
    configFiles: matchedConfigs,
    extensionMatches,
    referencePaths,
    sources,
    notes: definition.notes
  };
}

function getStatus(
  definition: ToolkitDefinition,
  commands: ToolchainCommand[],
  configFiles: string[],
  extensionMatches: string[],
  referencePaths: string[]
): ToolkitStatus {
  if (definition.id === 'holograim') {
    if (referencePaths.length >= 2) {
      return 'available';
    }

    if (referencePaths.length === 1 || extensionMatches.length > 0) {
      return 'partial';
    }

    return 'missing';
  }

  if (commands.length > 0) {
    return 'available';
  }

  if (configFiles.length > 0 || extensionMatches.length > 0) {
    return 'partial';
  }

  return 'missing';
}

function getSources(
  commands: ToolchainCommand[],
  configFiles: string[],
  extensionMatches: string[],
  referencePaths: string[]
): ToolkitSource[] {
  const sources = new Set<ToolkitSource>();
  for (const command of commands) {
    sources.add(command.source === 'system' ? 'system' : 'djmt');
  }
  if (configFiles.length > 0) {
    sources.add('workspace');
  }
  if (extensionMatches.length > 0) {
    sources.add('vscode');
  }
  if (referencePaths.length > 0) {
    sources.add('mcp');
  }
  return Array.from(sources);
}

function summarizeCapability(
  status: ToolkitStatus,
  commands: ToolchainCommand[],
  configFiles: string[],
  extensionMatches: string[],
  referencePaths: string[]
): string {
  const pieces: string[] = [];

  if (commands.length > 0) {
    pieces.push(`${commands.length} ${pluralize('command', commands.length)}`);
  }

  if (configFiles.length > 0) {
    pieces.push(`${configFiles.length} workspace ${pluralize('config', configFiles.length)}`);
  }

  if (extensionMatches.length > 0) {
    pieces.push(`${extensionMatches.length} VS Code ${extensionMatches.length === 1 ? 'match' : 'matches'}`);
  }

  if (referencePaths.length > 0) {
    pieces.push(`${referencePaths.length} reference ${pluralize('path', referencePaths.length)}`);
  }

  if (pieces.length === 0) {
    return status === 'missing' ? 'No local command, workspace config, or extension signal found.' : 'Detected but not fully configured.';
  }

  return pieces.join(', ');
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

async function listToolchainCommands(root: string): Promise<ToolchainCommand[]> {
  const commandRoots = [
    { source: 'bin', fullPath: path.join(root, 'bin') },
    { source: 'npm-global/bin', fullPath: path.join(root, 'npm-global/bin') },
    { source: 'pnpm', fullPath: path.join(root, 'pnpm') }
  ];
  const commands: ToolchainCommand[] = [];

  for (const commandRoot of commandRoots) {
    try {
      const entries = await fs.readdir(commandRoot.fullPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.name.startsWith('.') && (entry.isFile() || entry.isSymbolicLink())) {
          commands.push({
            name: entry.name,
            path: path.join(commandRoot.fullPath, entry.name),
            source: commandRoot.source
          });
        }
      }
    } catch {
      // Toolchain folders are optional.
    }
  }

  return commands;
}

async function listSystemCommands(commandNames: string[]): Promise<ToolchainCommand[]> {
  const searchRoots = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'];
  const commands: ToolchainCommand[] = [];

  await Promise.all(commandNames.map(async (commandName) => {
    for (const root of searchRoots) {
      const commandPath = path.join(root, commandName);
      try {
        await fs.access(commandPath);
        commands.push({ name: commandName, path: commandPath, source: 'system' });
        return;
      } catch {
        // Try the next conventional command root.
      }
    }
  }));

  return commands;
}

async function listWorkspaceConfigFiles(workspaceRoot: string): Promise<string[]> {
  if (!workspaceRoot) {
    return [];
  }

  try {
    const entries = await fs.readdir(workspaceRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() || entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith('node_modules'));
  } catch {
    return [];
  }
}

async function listVsCodeExtensionFolders(): Promise<string[]> {
  const extensionRoots = [
    path.join(os.homedir(), '.vscode/extensions'),
    path.join(os.homedir(), '.vscode-insiders/extensions')
  ];
  const folders: string[] = [];

  for (const root of extensionRoots) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      folders.push(...entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
    } catch {
      // VS Code extension folders may not exist in every environment.
    }
  }

  return folders;
}

async function getHolograimReferences(): Promise<string[]> {
  const refs = [path.resolve(HOLOGRAIM_SERVER_PATH), HOLOGRAIM_COMMAND];
  const existingRefs: string[] = [];

  for (const ref of refs) {
    try {
      await fs.access(ref);
      existingRefs.push(ref);
    } catch {
      // Reference is not available on this machine.
    }
  }

  return existingRefs;
}