import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronLeft, RefreshCw, Globe, ExternalLink, X, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchNewsArticles } from '@/api/newsClient';

/* ─── Constants ─────────────────────────────────────────────────────── */

const CATEGORIES = [
  "All", "Trending", "Entertainment", "Finance", "Games", "Technology", 
  "Sports", "Politics", "Business", "World", "Health", "Science", "Lifestyle"
];

const COUNTRIES = [
  { code: '',   label: 'Global' },
  { code: 'in', label: '🇮🇳 India' },
  { code: 'us', label: '🇺🇸 United States' },
  { code: 'gb', label: '🇬🇧 United Kingdom' },
  { code: 'au', label: '🇦🇺 Australia' },
  { code: 'ca', label: '🇨🇦 Canada' },
  { code: 'de', label: '🇩🇪 Germany' },
  { code: 'fr', label: '🇫🇷 France' },
  { code: 'jp', label: '🇯🇵 Japan' },
  { code: 'sg', label: '🇸🇬 Singapore' },
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200&h=800',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200&h=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800&h=600',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a2236a0?auto=format&fit=crop&q=80&w=800&h=600',
  'https://images.unsplash.com/photo-1682687982501-1e58f81010b0?auto=format&fit=crop&q=80&w=800&h=600',
  'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=400&h=400',
];

const getFallbackImage = (index) => FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
const BANNER_COUNT = 5;
const CAROUSEL_INTERVAL = 4000;

/* ─── Hooks ─────────────────────────────────────────────────────────── */

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function RelativeTime({ pubDate, className }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!pubDate) {
        setTimeStr('Just now');
        return;
      }
      try {
        const diffMs = new Date(pubDate).getTime() - Date.now();
        const diffMins = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        if (Math.abs(diffMins) < 1) {
          setTimeStr('Just now');
        } else if (Math.abs(diffMins) < 60) {
          setTimeStr(`${Math.abs(diffMins)} min ago`);
        } else if (Math.abs(diffHours) < 24) {
          setTimeStr(`${Math.abs(diffHours)} hr${Math.abs(diffHours) !== 1 ? 's' : ''} ago`);
        } else if (Math.abs(diffDays) === 1) {
          setTimeStr('Yesterday');
        } else {
          setTimeStr(`${Math.abs(diffDays)} days ago`);
        }
      } catch {
        setTimeStr('Just now');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [pubDate]);

  return <span className={className}>{timeStr}</span>;
}

function SafeImage({ src, fallback, alt, className, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  useEffect(() => { setImgSrc(src || fallback); }, [src, fallback]);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
      loading="lazy"
      {...props}
    />
  );
}

/* ─── Components ────────────────────────────────────────────────────── */

const BannerCarousel = React.memo(({ items, onArticleClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, CAROUSEL_INTERVAL);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [items.length, resetTimer]);

  const goTo = (idx) => { setCurrentIndex(idx); resetTimer(); };
  const goPrev = () => goTo((currentIndex - 1 + items.length) % items.length);
  const goNext = () => goTo((currentIndex + 1) % items.length);

  if (!items.length) return null;
  const current = items[currentIndex];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold tracking-tight">Breaking News</h2>
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </div>
        {items.length > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={goPrev} className="w-7 h-7 rounded-full bg-card/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goNext} className="w-7 h-7 rounded-full bg-card/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-[2rem] aspect-[16/10] sm:aspect-[21/9] cursor-pointer group"
        onClick={() => onArticleClick(current)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <SafeImage
              src={current.image}
              fallback={getFallbackImage(currentIndex)}
              alt={current.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-col justify-end z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
              {current.category || 'News'}
            </span>
            <RelativeTime pubDate={current.pubDate} className="text-white/70 text-xs font-medium" />
          </div>

          <AnimatePresence mode="wait">
            <motion.h3
              key={`title-${currentIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2 group-hover:text-red-400 transition-colors"
            >
              {current.title}
            </motion.h3>
          </AnimatePresence>

          {current.description && (
            <p className="text-white/80 text-sm line-clamp-2 mb-3">{current.description}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-white/80 text-sm font-medium">{current.source}</p>
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors group-hover:translate-x-1" />
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

const DiscoverCard = React.memo(({ article, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onClick(article)}
      className="group bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col h-full active:scale-[0.98]"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <SafeImage
          src={article.image}
          fallback={getFallbackImage(index)}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 bg-background/90 backdrop-blur-md text-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            {article.category || 'News'}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-base leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 mt-auto">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
              {article.source.charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-muted-foreground max-w-[100px] truncate">
              {article.source}
            </span>
          </div>
          <RelativeTime pubDate={article.pubDate} className="text-[10px] font-medium text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
});

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="w-full aspect-[21/9] bg-muted/30 rounded-[2rem] animate-pulse" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-[3/4] bg-muted/30 rounded-3xl animate-pulse" />
      ))}
    </div>
  </div>
);

const NewsDetailModal = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="min-h-[85vh] mt-[15vh] bg-card w-full max-w-3xl mx-auto rounded-t-[32px] sm:rounded-[32px] sm:mt-10 sm:min-h-0 sm:mb-10 shadow-2xl overflow-hidden flex flex-col relative"
        >
          {/* Header Image */}
          <div className="relative aspect-video w-full flex-shrink-0 bg-muted">
             <SafeImage 
               src={article.image}
               fallback={getFallbackImage(0)}
               alt={article.title}
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
             <button 
               onClick={onClose}
               className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
             <div className="absolute bottom-6 left-6 flex items-center gap-2">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-full">
                  {article.category}
                </span>
             </div>
          </div>

          <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4 text-foreground">
               {article.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground border-y border-border/50 py-4">
               <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Globe className="w-4 h-4 text-primary" /> {article.source}
               </div>
               <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> <RelativeTime pubDate={article.pubDate} />
               </div>
            </div>

            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/80 leading-relaxed mb-8">
               {article.description ? (
                 <p className="text-lg font-medium">{article.description}</p>
               ) : (
                 <p className="italic text-muted-foreground">No full summary available for this article. Please read the original source for full details.</p>
               )}
            </div>

            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-muted/50 hover:bg-muted text-foreground font-bold transition-colors active:scale-[0.98]"
            >
               Read Original Article <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Main Component ────────────────────────────────────────────────── */

export default function NEORA() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [selectedArticle, setSelectedArticle] = useState(null);
  const countryDropdownRef = useRef(null);

  const debouncedSearch = useDebounce(searchQuery, 600);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNews = useCallback(async (pageNum = 1, isForced = false) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      const res = await fetchNewsArticles({
        category: activeCategory,
        query: debouncedSearch,
        country: selectedCountry,
        size: 15,
        page: pageNum,
        force: isForced
      });

      const fetchedArticles = res.articles || [];
      
      const formatted = fetchedArticles.map((art, idx) => ({
        id: art.link || String(Date.now() + Math.random()),
        title: art.title,
        source: art.source_name || 'News Source',
        pubDate: art.pubDate,
        image: art.image_url || getFallbackImage(idx + (pageNum-1)*15),
        category: art.category || (activeCategory === 'All' ? 'General' : activeCategory),
        url: art.link,
        description: art.description || '',
        link: art.link,
      }));

      setArticles(prev => {
        if (pageNum === 1) return formatted;
        const newArticles = formatted.filter(f => !prev.some(p => p.title === f.title || p.link === f.link));
        return [...prev, ...newArticles];
      });

      setHasMore(fetchedArticles.length >= 5);
      
    } catch (err) {
      console.error("News fetch error:", err);
      if (pageNum === 1) setError(err.message || "Failed to load news");
    } finally {
      if (pageNum === 1) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  }, [activeCategory, debouncedSearch, selectedCountry]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    setPage(1);
    setArticles([]);
    fetchNews(1, false);
  }, [fetchNews]);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchNews(next, false);
  };

  const currentCountryLabel = COUNTRIES.find(c => c.code === selectedCountry)?.label || 'Global';
  const bannerItems = articles.slice(0, BANNER_COUNT);
  const discoverStories = articles.slice(BANNER_COUNT);

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto relative px-2 sm:px-0">
      
      {/* Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              NEORA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Your premium editorial digest</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative" ref={countryDropdownRef}>
              <button
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className={cn(
                  "h-10 px-4 rounded-full bg-card/60 backdrop-blur-md border border-border/50 flex items-center gap-2 text-sm font-medium transition-colors active:scale-95",
                  selectedCountry ? "text-primary border-primary/30" : "text-foreground hover:bg-card"
                )}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentCountryLabel}</span>
              </button>

              <AnimatePresence>
                {showCountryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-12 z-50 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {COUNTRIES.map(({ code, label }) => (
                      <button
                        key={code}
                        onClick={() => { setSelectedCountry(code); setShowCountryDropdown(false); }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors",
                          selectedCountry === code ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => fetchNews(1, true)}
              className="w-10 h-10 rounded-full bg-card/60 border border-border/50 flex items-center justify-center text-foreground hover:bg-card transition-colors active:scale-95"
            >
              <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin text-primary")} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search stories, topics, or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-card/40 backdrop-blur-md border border-border/50 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        {/* Horizontal scrollable Categories */}
        <div className="relative -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x touch-pan-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "snap-start whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95 flex-shrink-0 shadow-sm border",
                  activeCategory === category
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/60 text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/50 shadow-sm">
          <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Stories Available</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">{error}</p>
          <button onClick={() => fetchNews(1, true)} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
            Try Again
          </button>
        </div>
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/50">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No News Found</h3>
          <p className="text-muted-foreground text-sm">We couldn't find any recent articles matching your criteria.</p>
        </div>
      ) : (
        <>
          <BannerCarousel items={bannerItems} onArticleClick={setSelectedArticle} />

          {discoverStories.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-border/30">
              <div className="flex items-center gap-3 px-1">
                <h2 className="text-lg font-bold tracking-tight">Discover More</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoverStories.map((article, index) => (
                  <DiscoverCard 
                    key={article.id + index} 
                    article={article} 
                    index={index} 
                    onClick={setSelectedArticle}
                  />
                ))}
              </div>
              
              {hasMore && (
                <div className="flex justify-center pt-8">
                  <button 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-3 rounded-full bg-card border border-border/50 font-bold text-sm hover:bg-muted transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More News'}
                  </button>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* In-App Summary Modal */}
      {selectedArticle && (
        <NewsDetailModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}
    </div>
  );
}
