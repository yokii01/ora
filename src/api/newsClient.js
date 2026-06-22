const NEWSDATA_BASE = 'https://newsdata.io/api/1/latest';
const NEWSAPI_BASE = 'https://newsapi.org/v2/top-headlines';

const CATEGORY_MAP_NEWSDATA = {
  All: '', Technology: 'technology', Business: 'business',
  Design: 'entertainment', Politics: 'politics', Science: 'science', Health: 'health'
};

const CATEGORY_MAP_NEWSAPI = {
  All: 'general', Technology: 'technology', Business: 'business',
  Design: 'entertainment', Politics: 'politics', Science: 'science', Health: 'health'
};

// In-memory cache: { cacheKey: { data, timestamp } }
const newsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchNewsArticles({
  category = 'All',
  query = '',
  country = '',
  size = 10,
  page = 1,
  force = false,
  signal,
} = {}) {
  const cacheKey = `${category}-${query}-${country}-${size}-${page}`;

  // 1. Check cache (instantly returns if data is fresh)
  if (!force && newsCache.has(cacheKey)) {
    const cached = newsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return { articles: cached.data };
    }
  }

  // Helper for strict timeouts
  const fetchJsonWithTimeout = async (url, options, timeoutMs = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const onCallerAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onCallerAbort);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    } finally {
      clearTimeout(id);
      if (signal) signal.removeEventListener('abort', onCallerAbort);
    }
  };

  let articles = null;
  let lastError = null;

  // 1. Primary API: GNews.io (Extremely CORS friendly, allows IP addresses)
  try {
    const gKey = import.meta.env.VITE_GOOGLE_NEWS_API_KEY || '0168db77d25132d0541568d7fda567c5';
    if (gKey) {
      const params = new URLSearchParams({ apikey: gKey, lang: 'en', max: String(size), page: String(page) });
      const GNEWS_MAP = { All: 'general', Technology: 'technology', Business: 'business', Design: 'entertainment', Politics: 'nation', Science: 'science', Health: 'health' };
      if (category && GNEWS_MAP[category]) params.set('category', GNEWS_MAP[category]);
      if (query && query.trim()) params.set('q', query.trim());
      if (country && country.trim()) params.set('country', country.trim().toLowerCase());

      const { res, data } = await fetchJsonWithTimeout(`https://gnews.io/api/v4/top-headlines?${params}`, { signal });
      
      if (res.ok && !data.errors) {
        const rawResults = Array.isArray(data.articles) ? data.articles : [];
        articles = rawResults.filter(r => r.title).map(r => ({
          title: r.title,
          description: r.description || '',
          image_url: r.image || null,
          source_name: r.source?.name || 'GNews',
          pubDate: r.publishedAt || null,
          link: r.url || '',
          category: category,
        }));
      } else {
        throw new Error(data?.errors?.[0] || `GNews HTTP ${res.status}`);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    lastError = err;
  }

  // 2. Fallback API: NewsData.io
  if (!articles || articles.length === 0) {
    try {
      const ndKey = import.meta.env.VITE_NEWSDATA_API_KEY || 'pub_5ca8cd2511f64108a6a10597ad156768';
      if (ndKey) {
        const params = new URLSearchParams({ apikey: ndKey, language: 'en' });
        if (size) params.set('size', String(Math.min(size, 50)));
        if (page > 1) params.set('page', String(page));
        const cat = CATEGORY_MAP_NEWSDATA[category];
        if (cat) params.set('category', cat);
        if (query && query.trim()) params.set('q', query.trim());
        if (country && country.trim()) params.set('country', country.trim().toLowerCase());
        
        if (!cat && (!query || !query.trim()) && (!country || !country.trim())) {
          params.set('q', 'news');
        }

        let res, data;
        try {
          const result = await fetchJsonWithTimeout(`${NEWSDATA_BASE}?${params}`, { signal });
          res = result.res;
          data = result.data;
        } catch (netErr) {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${NEWSDATA_BASE}?${params}`)}`;
          const result = await fetchJsonWithTimeout(proxyUrl, { signal });
          res = result.res;
          data = result.data;
        }
        
        if (res.ok && data.status !== 'error') {
          const rawResults = Array.isArray(data.results) ? data.results : [];
          articles = rawResults.filter(r => r.title).map(r => ({
            title: r.title,
            description: r.description || '',
            image_url: r.image_url || null,
            source_name: r.source_name || r.source_id || 'Unknown',
            pubDate: r.pubDate || null,
            link: r.link || '',
            category: r.category?.[0] || category,
          }));
        } else {
          throw new Error(data?.results?.message || data?.message || `NewsData HTTP ${res.status}`);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' && signal?.aborted) throw err;
      lastError = err;
    }
  }

  // 3. Ultimate Fallback API: NewsAPI (via direct or proxy)
  if (!articles || articles.length === 0) {
    try {
      const nApiKey = import.meta.env.VITE_NEWSAPI_API_KEY || 'f859baa7ea784fbe9ad08e10f1cb4945';
      if (nApiKey) {
        const params = new URLSearchParams({ apiKey: nApiKey, language: 'en' });
        if (size) params.set('pageSize', String(Math.min(size, 50)));
        if (page) params.set('page', String(page));
        const cat = CATEGORY_MAP_NEWSAPI[category];
        if (cat && !query) params.set('category', cat); 
        if (query && query.trim()) params.set('q', query.trim());
        if (country && country.trim()) params.set('country', country.trim().toLowerCase());

        let res, data;
        try {
          const result = await fetchJsonWithTimeout(`${NEWSAPI_BASE}?${params}`, { signal });
          res = result.res;
          data = result.data;
        } catch (netErr) {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${NEWSAPI_BASE}?${params}`)}`;
          const result = await fetchJsonWithTimeout(proxyUrl, { signal });
          res = result.res;
          data = result.data;
        }
        
        if (res.ok && data.status !== 'error') {
          const rawResults = Array.isArray(data.articles) ? data.articles : [];
          articles = rawResults.filter(r => r.title).map(r => ({
            title: r.title,
            description: r.description || '',
            image_url: r.urlToImage || null,
            source_name: r.source?.name || 'Unknown',
            pubDate: r.publishedAt || null,
            link: r.url || '',
            category: category,
          }));
        } else {
          throw new Error(data?.message || `NewsAPI HTTP ${res.status}`);
        }
      } else {
        throw lastError; 
      }
    } catch (err) {
      if (err.name === 'AbortError' && signal?.aborted) throw err;
      
      // If ALL providers fail strictly due to network blocks, return empty array to show "No Stories" gracefully instead of crashing
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('All news APIs blocked by client network. Returning empty graceful state.');
        return { articles: [] };
      }
      throw new Error(lastError?.message || err.message || 'Unable to fetch news from any provider.');
    }
  }

  // 4. Update Cache & Return
  if (articles && articles.length > 0) {
    newsCache.set(cacheKey, { data: articles, timestamp: Date.now() });
  }

  return { articles: articles || [] };
}
