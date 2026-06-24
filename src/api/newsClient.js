import { safeFetch } from '@/lib/safeFetch';

const NEWSDATA_BASE = 'https://newsdata.io/api/1/latest';
const NEWSAPI_BASE = 'https://newsapi.org/v2/top-headlines';

const CATEGORY_MAP_NEWSDATA = {
  All: '', Trending: 'top', Technology: 'technology', Business: 'business',
  Entertainment: 'entertainment', Politics: 'politics', Science: 'science', Health: 'health',
  Finance: 'business', Games: 'entertainment', Sports: 'sports', World: 'world', Lifestyle: 'lifestyle'
};

const CATEGORY_MAP_NEWSAPI = {
  All: 'general', Trending: 'general', Technology: 'technology', Business: 'business',
  Entertainment: 'entertainment', Politics: 'politics', Science: 'science', Health: 'health',
  Finance: 'business', Games: 'entertainment', Sports: 'sports', World: 'general', Lifestyle: 'health'
};

const CATEGORY_MAP_GNEWS = {
  All: 'general', Trending: 'breaking-news', Technology: 'technology', Business: 'business', 
  Entertainment: 'entertainment', Politics: 'nation', Science: 'science', Health: 'health',
  Finance: 'business', Games: 'entertainment', Sports: 'sports', World: 'world', Lifestyle: 'health'
};

// In-memory cache: { cacheKey: { data, timestamp } }
const newsCache = new Map();
// Active requests map for deduplication
const activeRequests = new Map();

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
    // If not forced, return cached data if it's within TTL, or if it's our only fallback
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return { articles: cached.data };
    }
  }

  // Deduplication: If a request for this exact query is already in flight, wait for it
  if (activeRequests.has(cacheKey)) {
    return activeRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    let articles = null;
    let lastError = null;

  // 1. Primary API: GNews.io (Extremely CORS friendly, allows IP addresses)
  try {
    const gKey = import.meta.env.VITE_GOOGLE_NEWS_API_KEY || '0168db77d25132d0541568d7fda567c5';
    if (gKey) {
      const params = new URLSearchParams({ apikey: gKey, lang: 'en', max: String(size), page: String(page) });
      if (category && CATEGORY_MAP_GNEWS[category]) params.set('category', CATEGORY_MAP_GNEWS[category]);
      if (query && query.trim()) params.set('q', query.trim());
      if (country && country.trim()) params.set('country', country.trim().toLowerCase());

      const data = await safeFetch(`https://gnews.io/api/v4/top-headlines?${params}`, { signal }, 12000);
      
      if (!data.errors) {
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
        throw new Error(data?.errors?.[0] || `GNews API Error`);
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

        let data;
        try {
          data = await safeFetch(`${NEWSDATA_BASE}?${params}`, { signal }, 12000);
        } catch (netErr) {
          if (netErr.name === 'AbortError') throw netErr;
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${NEWSDATA_BASE}?${params}`)}`;
          data = await safeFetch(proxyUrl, { signal }, 12000);
        }
        
        if (data && data.status !== 'error') {
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
          throw new Error(data?.results?.message || data?.message || `NewsData API Error`);
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

        let data;
        try {
          data = await safeFetch(`${NEWSAPI_BASE}?${params}`, { signal }, 12000);
        } catch (netErr) {
          if (netErr.name === 'AbortError') throw netErr;
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${NEWSAPI_BASE}?${params}`)}`;
          data = await safeFetch(proxyUrl, { signal }, 12000);
        }
        
        if (data && data.status !== 'error') {
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
          throw new Error(data?.message || `NewsAPI API Error`);
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

  // 4. Filtering & Deduplication & Sort
  if (articles && articles.length > 0) {
    const now = Date.now();
    const MIN_AGE = 30 * 60 * 1000; // 30 minutes
    const MAX_AGE = 48 * 60 * 60 * 1000; // 2 days

    // Filter by time (30m to 2d)
    let filtered = articles.filter(a => {
      if (!a.pubDate) return false;
      const pubTime = new Date(a.pubDate).getTime();
      const age = now - pubTime;
      return age >= MIN_AGE && age <= MAX_AGE;
    });

    // Fallback: If filtering removes everything, we keep the original sorted list to avoid an empty screen
    if (filtered.length === 0) {
      filtered = articles;
    }

    // Sort by recency
    filtered.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Deduplicate by headline
    const uniqueMap = new Map();
    filtered.forEach(a => {
      const key = a.title.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, a);
      }
    });

    articles = Array.from(uniqueMap.values());
  }

  // 5. Update Cache & Return
  if (articles && articles.length > 0) {
    newsCache.set(cacheKey, { data: articles, timestamp: Date.now() });
  } else if (newsCache.has(cacheKey)) {
    // If all failed, but we have a cache (even expired), return it gracefully
    return { articles: newsCache.get(cacheKey).data };
  }

  return { articles: articles || [] };
  })();

  activeRequests.set(cacheKey, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    activeRequests.delete(cacheKey);
  }
}
