import { getApiConfig } from './config.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const newsCache = new Map();
const NEWS_CACHE_TTL = 5 * 60 * 1000;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getCacheKey(query) {
  return `${String(query.category || 'All').toLowerCase()}::${String(query.q || '').toLowerCase()}`;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractText(provider, data) {
  if (provider.type === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
  }
  return data.choices?.[0]?.message?.content?.trim();
}

function buildGeminiBody(prompt) {
  return {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };
}

function buildOpenAIBody(provider, prompt, requestedModel) {
  return {
    model: provider.model || requestedModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
  };
}

async function callAiProvider(provider, payload, timeoutMs) {
  const prompt = String(payload.prompt || '').trim();
  if (!prompt) throw new Error('Prompt is required');

  if (provider.type === 'gemini') {
    const model = provider.model || payload.model || 'gemini-2.0-flash';
    const endpoint = provider.endpoint.replace('{model}', encodeURIComponent(model));
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': provider.apiKey,
      },
      body: JSON.stringify(buildGeminiBody(prompt)),
    }, timeoutMs);

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`);
    }

    const data = await response.json();
    const text = extractText(provider, data);
    if (!text) throw new Error('Provider returned an empty AI response');
    return text;
  }

  const response = await fetchWithTimeout(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
      ...(provider.headers || {}),
    },
    body: JSON.stringify(buildOpenAIBody(provider, prompt, payload.model)),
  }, timeoutMs);

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`);
  }

  const data = await response.json();
  const text = extractText(provider, data);
  if (!text) throw new Error('Provider returned an empty AI response');
  return text;
}

async function handleAi(req, res) {
  const config = getApiConfig();
  if (config.ai.providers.length === 0) {
    return sendJson(res, 503, { error: 'AI service is not configured on the server.' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  const failures = [];
  for (const provider of config.ai.providers) {
    for (let attempt = 0; attempt <= config.ai.retryAttempts; attempt += 1) {
      try {
        const text = await callAiProvider(provider, body, config.ai.timeoutMs);
        return sendJson(res, 200, { text, provider: provider.name });
      } catch (error) {
        failures.push({ provider: provider.name, attempt: attempt + 1, message: error.message });
        if (attempt < config.ai.retryAttempts) {
          await sleep(500 * 2 ** attempt);
        }
      }
    }
  }

  return sendJson(res, 502, {
    error: 'All AI providers failed. Please retry shortly.',
    failures,
  });
}

const gnewsCategoryMap = {
  all: 'general',
  technology: 'technology',
  business: 'business',
  politics: 'nation',
  science: 'science',
  health: 'health',
};

const newsApiCategoryMap = {
  all: 'general',
  technology: 'technology',
  business: 'business',
  science: 'science',
  health: 'health',
};

function categoryOf(input = 'All') {
  return String(input || 'All').trim().toLowerCase();
}

function ensureImage(article, index) {
  return article.image || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200&sig=${index}`;
}

function normalizeArticles(provider, data) {
  if (provider.id === 'google') {
    return (data.articles || []).map((article, index) => ({
      id: article.url || `${provider.id}-${index}`,
      title: article.title,
      source: article.source?.name || 'Google News',
      publishedAt: article.publishedAt,
      image: ensureImage(article, index),
      category: 'News',
      url: article.url,
      description: article.description || article.content || '',
    }));
  }

  if (provider.id === 'newsdata') {
    return (data.results || []).map((article, index) => ({
      id: article.article_id || article.link || `${provider.id}-${index}`,
      title: article.title,
      source: article.source_id || 'NewsData',
      publishedAt: article.pubDate,
      image: article.image_url || `https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=1200&sig=${index}`,
      category: article.category?.[0] || 'News',
      url: article.link,
      description: article.description || '',
    }));
  }

  return (data.articles || []).map((article, index) => ({
    id: article.url || `${provider.id}-${index}`,
    title: article.title,
    source: article.source?.name || 'NewsAPI',
    publishedAt: article.publishedAt,
    image: article.urlToImage || `https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200&sig=${index}`,
    category: 'News',
    url: article.url,
    description: article.description || '',
  }));
}

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function callGoogleNewsRss(query, timeoutMs) {
  const q = String(query.q || '').trim() || (categoryOf(query.category) === 'all' ? 'world news' : `${query.category} news`);
  const params = new URLSearchParams({ q, hl: 'en-US', gl: 'US', ceid: 'US:en' });
  const response = await fetchWithTimeout(`https://news.google.com/rss/search?${params}`, {
    headers: { Accept: 'application/rss+xml,text/xml', 'User-Agent': 'ORAs/1.0' },
  }, timeoutMs);
  if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20);
  const articles = items.map((match, index) => {
    const block = match[1];
    const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
    const url = decodeXml(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
    const publishedAt = decodeXml(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '');
    const source = decodeXml(block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'Google News');
    const description = decodeXml(block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '').replace(/<[^>]*>/g, '');
    return {
      id: url || `google-rss-${index}`,
      title,
      source,
      publishedAt,
      image: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200&sig=${index}`,
      category: query.category || 'News',
      url,
      description,
    };
  }).filter(article => article.title && article.url);
  if (!articles.length) throw new Error('Google News RSS returned no articles');
  return articles;
}

function buildNewsUrl(provider, query) {
  const params = new URLSearchParams();
  const q = String(query.q || '').trim();
  const category = categoryOf(query.category);

  if (provider.id === 'google') {
    params.set('apikey', provider.apiKey);
    params.set('lang', 'en');
    params.set('max', '20');
    if (q || category === 'design') {
      params.set('q', q || 'design');
      return `${provider.endpoint}/search?${params}`;
    }
    params.set('category', gnewsCategoryMap[category] || 'general');
    return `${provider.endpoint}/top-headlines?${params}`;
  }

  if (provider.id === 'newsdata') {
    params.set('apikey', provider.apiKey);
    params.set('language', 'en');
    if (q || category === 'design') params.set('q', q || 'design');
    if (category !== 'all' && category !== 'design') params.set('category', category);
    return `${provider.endpoint}?${params}`;
  }

  params.set('apiKey', provider.apiKey);
  params.set('language', 'en');
  params.set('pageSize', '20');
  if (q || category === 'design' || category === 'politics') {
    params.set('q', q || (category === 'politics' ? 'politics' : 'design'));
    return `${provider.endpoint}/everything?${params}`;
  }
  params.set('category', newsApiCategoryMap[category] || 'general');
  return `${provider.endpoint}/top-headlines?${params}`;
}

async function callNewsProvider(provider, query, timeoutMs) {
  const response = await fetchWithTimeout(buildNewsUrl(provider, query), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ORAs/1.0',
    },
  }, timeoutMs);

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const data = await response.json();
  const articles = normalizeArticles(provider, data).filter(article => article.title && article.url);
  if (articles.length === 0) throw new Error('Provider returned no articles');
  return articles;
}

async function handleNews(req, res) {
  const config = getApiConfig();
  if (config.news.providers.length === 0) {
    return sendJson(res, 503, { error: 'News service is not configured on the server.' });
  }

  const requestUrl = new URL(req.url, 'http://localhost');
  const query = {
    q: requestUrl.searchParams.get('q') || '',
    category: requestUrl.searchParams.get('category') || 'All',
  };
  const refresh = requestUrl.searchParams.get('refresh') === '1';
  const cacheKey = getCacheKey(query);
  const cached = newsCache.get(cacheKey);
  if (!refresh && cached && Date.now() - cached.timestamp < NEWS_CACHE_TTL) {
    return sendJson(res, 200, { ...cached.payload, cached: true });
  }

  const failures = [];
  for (const provider of config.news.providers) {
    for (let attempt = 0; attempt <= config.news.retryAttempts; attempt += 1) {
      try {
        const articles = await callNewsProvider(provider, query, config.news.timeoutMs);
        const payload = { articles, provider: provider.name };
        newsCache.set(cacheKey, { timestamp: Date.now(), payload });
        return sendJson(res, 200, payload);
      } catch (error) {
        failures.push({ provider: provider.name, attempt: attempt + 1, message: error.message });
        if (attempt < config.news.retryAttempts) {
          await sleep(400 * 2 ** attempt);
        }
      }
    }
  }

  try {
    const articles = await callGoogleNewsRss(query, Math.min(config.news.timeoutMs, 8000));
    const payload = { articles, provider: 'Google News RSS' };
    newsCache.set(cacheKey, { timestamp: Date.now(), payload });
    return sendJson(res, 200, payload);
  } catch (error) {
    failures.push({ provider: 'Google News RSS', attempt: 1, message: error.message });
  }

  if (cached?.payload?.articles?.length) {
    return sendJson(res, 200, { ...cached.payload, cached: true, stale: true });
  }

  return sendJson(res, 502, {
    error: 'All news providers failed. Please retry shortly.',
    failures,
  });
}

export function createApiProxyPlugin() {
  const handler = async (req, res, next) => {
    try {
      if (req.url?.startsWith('/api/ai') && req.method === 'POST') {
        return await handleAi(req, res);
      }
      if (req.url?.startsWith('/api/news') && req.method === 'GET') {
        return await handleNews(req, res);
      }
      return next();
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Unexpected API proxy error' });
    }
  };

  return {
    name: 'oras-api-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
