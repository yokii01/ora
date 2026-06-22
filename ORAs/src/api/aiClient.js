/**
 * ORAs Intelligence — Direct AI Provider Client
 *
 * Calls external LLM APIs directly from the browser in a cascading
 * fallback order:  OpenRouter → NVIDIA → AQ API.
 *
 * Each provider uses the standard OpenAI-compatible chat completions format.
 */

const AI_TIMEOUT_MS = 45_000;

// ─── System prompt (shared across providers) ────────────────────────────────
const SYSTEM_PROMPT = `You are ORAs Intelligence, an incredibly powerful AI operating system embedded within the ORAs personal productivity app. You are warm, smart, proactive, and deeply integrated with ORAs. Always respond helpfully and concisely. Never reveal that you are running on a third-party API — you are ORAs Intelligence.`;

// ─── Provider definitions ───────────────────────────────────────────────────
function getProviders() {
  return [
    {
      name: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      model:
        import.meta.env.VITE_OPENROUTER_MODEL ||
        'meta-llama/llama-3.1-8b-instruct',
      headers: (key) => ({
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'http://localhost:5173',
        'X-Title': 'ORAs Intelligence',
      }),
    },
    {
      name: 'NVIDIA',
      endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_NVIDIA_API_KEY,
      model:
        import.meta.env.VITE_NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct',
      headers: (key) => ({
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      }),
    },
    {
      name: 'AQ',
      endpoint: 'https://api.aq.ai/v1/chat/completions',
      apiKey: import.meta.env.VITE_AQ_API_KEY,
      model: import.meta.env.VITE_AQ_MODEL || 'gemini-2.0-flash',
      headers: (key) => ({
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      }),
    },
  ];
}

// ─── Single-provider call ───────────────────────────────────────────────────
async function callProvider(provider, messages, signal) {
  const res = await fetch(provider.endpoint, {
    method: 'POST',
    headers: provider.headers(provider.apiKey),
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `${provider.name} returned ${res.status}: ${body.slice(0, 200)}`
    );
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`${provider.name} returned an empty response`);
  }

  return { text: text.trim(), provider: provider.name };
}

// ─── Public API ─────────────────────────────────────────────────────────────
/**
 * Send a chat completion request with cascading provider fallback.
 *
 * @param {Object}        opts
 * @param {Array<Object>} opts.messages  — OpenAI-format messages array
 *                                         [{ role, content }, …]
 * @param {AbortSignal}   [opts.signal]  — optional external abort signal
 * @returns {{ text: string, provider: string }}
 */
export async function invokeAI({ messages, signal }) {
  // ── Merge caller signal with our own timeout ──────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  // Forward external abort into our controller
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  // Ensure the system prompt is always the first message
  const callerSystem = messages.find((m) => m.role === 'system')?.content;
  const mergedSystemPrompt = callerSystem ? `${SYSTEM_PROMPT}\n\n${callerSystem}` : SYSTEM_PROMPT;

  const fullMessages = [
    { role: 'system', content: mergedSystemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  const providers = getProviders().filter((p) => p.apiKey);
  const errors = [];

  try {
    if (providers.length === 0) {
      throw new Error(
        'No AI provider API keys configured. Please add at least one VITE_OPENROUTER_API_KEY, VITE_NVIDIA_API_KEY, or VITE_AQ_API_KEY to your .env file.'
      );
    }

    for (const provider of providers) {
      try {
        const result = await callProvider(
          provider,
          fullMessages,
          controller.signal
        );
        return result;
      } catch (err) {
        // If the user or timeout aborted, stop immediately
        if (controller.signal.aborted) throw err;
        errors.push({ provider: provider.name, error: err.message });
        // Otherwise fall through to the next provider
      }
    }

    // All providers exhausted
    const summary = errors
      .map((e) => `• ${e.provider}: ${e.error}`)
      .join('\n');
    throw new Error(
      `All AI providers failed:\n${summary}\n\nPlease check your API keys and try again.`
    );
  } catch (err) {
    if (err.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(
        signal?.aborted
          ? 'Request cancelled.'
          : 'AI request timed out after 45 seconds. Please try again.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
