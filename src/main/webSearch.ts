/**
 * webSearch.ts — DuckDuckGo Instant Answers bridge for FableCode agents.
 *
 * Uses the DuckDuckGo public JSON API (no key, no rate-limit headers required).
 * Endpoint: https://api.duckduckgo.com/?q=<query>&format=json&no_html=1&skip_disambig=1
 *
 * cleanJsonResponse() is ported from Buggy/buggy-service/prompts.js.
 * It strips markdown code fences before JSON.parse, because Ollama loves wrapping
 * JSON output in triple-backtick blocks even when told not to.
 */

import https from 'node:https';
import type { IncomingMessage } from 'node:http';

export interface WebSearchResult {
  query: string;
  answer: string | null;
  summary: string | null;
  sourceUrl: string | null;
  related: Array<{ text: string; url: string }>;
  error: string | null;
}

// ─── DuckDuckGo raw response shape (partial) ─────────────────────────────────

interface DDGTopic {
  Text?: string;
  FirstURL?: string;
  Topics?: Array<{ Text?: string; FirstURL?: string }>;
}

interface DDGResponse {
  Answer?: string;
  AbstractText?: string;
  AbstractURL?: string;
  RelatedTopics?: DDGTopic[];
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

function fetchJson(url: string): Promise<DDGResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'FableCode/1.0 (educational; local-only)' } },
      (res: IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: string) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as DDGResponse);
          } catch {
            reject(new Error('DuckDuckGo response was not valid JSON.'));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('DuckDuckGo request timed out after 8 s.'));
    });
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function duckduckgoSearch(query: string): Promise<WebSearchResult> {
  if (!query || !query.trim()) {
    return { query, answer: null, summary: null, sourceUrl: null, related: [], error: 'Query is empty.' };
  }

  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query.trim())}&format=json&no_html=1&skip_disambig=1`;

  try {
    const data = await fetchJson(url);

    const answer = data.Answer?.trim() || null;
    const summary = data.AbstractText?.trim() || null;
    const sourceUrl = data.AbstractURL?.trim() || null;

    const related: Array<{ text: string; url: string }> = [];
    for (const topic of (data.RelatedTopics ?? []).slice(0, 6)) {
      if (topic.Text && topic.FirstURL) {
        related.push({ text: topic.Text, url: topic.FirstURL });
      } else if (topic.Topics) {
        // Nested topic groups (e.g. disambiguation pages)
        for (const sub of topic.Topics.slice(0, 3)) {
          if (sub.Text && sub.FirstURL) {
            related.push({ text: sub.Text, url: sub.FirstURL });
          }
        }
      }
    }

    return { query, answer, summary, sourceUrl, related, error: null };
  } catch (err) {
    return {
      query,
      answer: null,
      summary: null,
      sourceUrl: null,
      related: [],
      error: err instanceof Error ? err.message : 'Search failed.'
    };
  }
}

/**
 * cleanJsonResponse — strips markdown code fences from LLM output before parsing.
 * Ported from Buggy/buggy-service/prompts.js.
 *
 * Usage: JSON.parse(cleanJsonResponse(ollamaOutput))
 */
export function cleanJsonResponse(raw: string): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '{}';
  return trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}
