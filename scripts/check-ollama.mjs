const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';

try {
  const response = await fetch(`${baseUrl}/api/tags`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const models = data.models ?? [];
  console.log(`Ollama reachable at ${baseUrl}`);
  console.log(models.length === 0 ? 'No models installed yet.' : models.map((model) => `- ${model.name}`).join('\n'));
} catch (error) {
  console.error(`Ollama is not reachable at ${baseUrl}`);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
