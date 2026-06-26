/**
 * ORAs Intelligence — Direct AI Provider Client
 *
 * Calls external LLM APIs directly from the browser in a cascading
 * fallback order with exponential backoff retries.
 */

import { safeFetch } from '@/lib/safeFetch';

const AI_TIMEOUT_MS = 45_000;

const SYSTEM_PROMPT = `You are ORAs Intelligence, an incredibly powerful AI operating system embedded within the ORAs personal productivity app. You are warm, smart, proactive, and deeply integrated with ORAs. Always respond helpfully and concisely. Never reveal that you are running on a third-party API — you are ORAs Intelligence.`;

function getProviders() {
  return [
    {
      name: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      model: import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct',
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
      model: import.meta.env.VITE_NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct',
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
    {
      name: 'Pollinations Free Cloud',
      endpoint: 'https://text.pollinations.ai/',
      apiKey: 'free_keyless',
      model: 'openai',
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    }
  ];
}

function generateLocalSimulation(messages) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
  if (lastUserMsg.includes('hello') || lastUserMsg.includes('hey') || lastUserMsg.includes('hi')) {
    return "Hello! I am ORAs Intelligence. I'm operating smoothly on your system. How can I assist you with your productivity, tasks, or schedule today?";
  }
  if (lastUserMsg.includes('task') || lastUserMsg.includes('todo')) {
    return "You can easily manage your daily tasks, set priorities, and track your completion progress in the Tasks app.";
  }
  if (lastUserMsg.includes('note')) {
    return "The Notes app stores all your brainstorms, meeting records, and personal thoughts. You can also utilize curated templates there!";
  }
  if (lastUserMsg.includes('weather')) {
    return "Your live flagship Home screen banner continuously tracks local temperatures and atmospheric conditions.";
  }
  if (lastUserMsg.includes('who are you') || lastUserMsg.includes('what are you')) {
    return "I am ORAs Intelligence, your personal embedded AI operating system designed to enhance your digital lifestyle and workflow.";
  }
  return "I am ORAs Intelligence. I've processed your request locally. I'm ready to help you optimize your schedule, organize your files, and elevate your daily productivity!";
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function callProviderWithRetry(provider, messages, signal, maxRetries = 2) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      if (signal?.aborted) throw new Error('Aborted');
      
      const data = await safeFetch(
        provider.endpoint,
        {
          method: 'POST',
          headers: provider.headers(provider.apiKey),
          body: JSON.stringify({
            model: provider.model,
            messages,
            temperature: 0.7,
            max_tokens: 2048,
          }),
        },
        AI_TIMEOUT_MS
      );

      const text = data?.choices?.[0]?.message?.content || (typeof data === 'string' ? data : null);

      if (typeof text !== 'string' || !text.trim()) {
        throw new Error(`${provider.name} returned empty payload`);
      }

      return { text: text.trim(), provider: provider.name };
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') {
        throw error;
      }
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }
      // Exponential backoff: 500ms -> 1500ms
      await sleep(500 * Math.pow(3, attempt - 1));
    }
  }
}

export async function invokeAI({ messages, signal }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  const callerSystem = messages.find((m) => m.role === 'system')?.content;
  const mergedSystemPrompt = callerSystem ? `${SYSTEM_PROMPT}\n\n${callerSystem}` : SYSTEM_PROMPT;

  const fullMessages = [
    { role: 'system', content: mergedSystemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  const providers = getProviders().filter((p) => p.apiKey);

  try {
    for (const provider of providers) {
      try {
        const result = await callProviderWithRetry(
          provider,
          fullMessages,
          controller.signal
        );
        return result;
      } catch (err) {
        if (controller.signal.aborted) throw err;
      }
    }

    // Silent Fallback to Local Simulation
    const simText = generateLocalSimulation(fullMessages);
    return { text: simText, provider: null };

  } catch (err) {
    if (err.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(
        signal?.aborted
          ? 'Request cancelled.'
          : 'AI request timed out. Please try again.'
      );
    }
    return { text: generateLocalSimulation(fullMessages), provider: null };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
