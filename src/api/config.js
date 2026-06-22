export const API_ENDPOINTS = {
  // AI providers — called directly from the frontend via aiClient.js
  ai: {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
    aq: 'https://api.aq.ai/v1/chat/completions',
  },
  news: '/api/news',
  weather: {
    forecast: 'https://api.open-meteo.com/v1/forecast',
    geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
    airQuality: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  },
};

export const API_TIMEOUTS = {
  ai: 45000,
  news: 20000,
  weather: 15000,
};
