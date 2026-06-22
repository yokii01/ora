const numberFromEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function getApiConfig(env = process.env) {
  return {
    ai: {
      timeoutMs: numberFromEnv(env.AI_TIMEOUT_MS, 45000),
      retryAttempts: numberFromEnv(env.AI_RETRY_ATTEMPTS, 2),
      providers: [
        {
          id: 'aq',
          name: 'AQ',
          type: 'gemini',
          apiKey: env.AQ_API_KEY,
          model: env.AQ_MODEL || 'gemini-2.0-flash',
          endpoint:
            env.AQ_API_URL ||
            'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        },
        {
          id: 'nvidia',
          name: 'NVIDIA',
          type: 'openai',
          apiKey: env.NVIDIA_API_KEY,
          model: env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct',
          endpoint: env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions',
        },
        {
          id: 'openrouter',
          name: 'OpenRouter',
          type: 'openai',
          apiKey: env.OPENROUTER_API_KEY,
          model: env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct',
          endpoint: env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
          headers: {
            'HTTP-Referer': env.OPENROUTER_REFERER || env.APP_BASE_URL || 'http://localhost:5173',
            'X-Title': env.OPENROUTER_APP_TITLE || 'ORAs',
          },
        },
      ].filter(provider => Boolean(provider.apiKey)),
    },
    news: {
      timeoutMs: numberFromEnv(env.NEWS_TIMEOUT_MS, 15000),
      retryAttempts: numberFromEnv(env.NEWS_RETRY_ATTEMPTS, 1),
      providers: [
        {
          id: 'google',
          name: 'Google News',
          apiKey: env.GOOGLE_NEWS_API_KEY,
          endpoint: env.GOOGLE_NEWS_API_URL || 'https://gnews.io/api/v4',
        },
        {
          id: 'newsdata',
          name: 'NewsData',
          apiKey: env.NEWSDATA_API_KEY,
          endpoint: env.NEWSDATA_API_URL || 'https://newsdata.io/api/1/news',
        },
        {
          id: 'newsapi',
          name: 'NewsAPI',
          apiKey: env.NEWSAPI_API_KEY,
          endpoint: env.NEWSAPI_API_URL || 'https://newsapi.org/v2',
        },
      ].filter(provider => Boolean(provider.apiKey)),
    },
    weather: {
      forecastUrl: env.OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast',
      geocodingUrl: env.OPEN_METEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1/search',
      airQualityUrl: env.OPEN_METEO_AIR_QUALITY_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality',
    },
  };
}
