import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronLeft, Bookmark, MoreHorizontal, Bell, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchNewsArticles } from '@/api/newsClient';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/* ─── Constants ─────────────────────────────────────────────────────── */

const CATEGORIES = ["All", "Technology", "Business", "Design", "Politics", "Science", "Health"];

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
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=400&h=400',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400&h=400',
];

const getFallbackImage = (index) => FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

const BANNER_COUNT = 5;
const DISCOVER_DEFAULT = 15;
const CAROUSEL_INTERVAL = 4000;

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

/* ─── Safe Image ────────────────────────────────────────────────────── */

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

/* ─── Banner Carousel ───────────────────────────────────────────────── */

function BannerCarousel({ items, onArticleClick }) {
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
            <button onClick={goPrev} className="w-7 h-7 rounded-full bg-card/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goNext} className="w-7 h-7 rounded-full bg-card/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-[2rem] aspect-[16/10] sm:aspect-[21/9] cursor-pointer group"
        onClick={() => onArticleClick(current.link)}
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
            <ExternalLink className="w-4 h-4 text-white/50" />
          </div>
        </div>

        {/* Dot indicators */}
        {items.length > 1 && (
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
        )}
      </div>
    </section>
  );
}

/* ─── Main Component ────────────────────────────────────────────────── */

export default function News() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // "See all" expand states
  const [showAllDiscover, setShowAllDiscover] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);

  // Pull to refresh
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const countryDropdownRef = useRef(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) setStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e) => {
    if (startY === 0) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0 && window.scrollY === 0) {
      setIsPulling(true);
      setPullProgress(Math.min(diff / 100, 1));
    }
  };
  const handleTouchEnd = () => {
    if (pullProgress > 0.8) fetchNews(true);
    setStartY(0);
    setIsPulling(false);
    setPullProgress(0);
  };

  /* ── Fetch ── */
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchNews = useCallback(async (pageNum = 1, force = false, signal = null) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const { articles: liveArticles } = await fetchNewsArticles({
        category: activeCategory,
        query: searchQuery,
        country: selectedCountry,
        size: 10,
        page: pageNum,
        force,
        signal,
      });

      if (!isMounted.current) return;

      if (liveArticles.length > 0) {
        const formatted = liveArticles.map((art, idx) => ({
          id: art.link || String(Date.now() + Math.random()),
          title: art.title,
          source: art.source_name || 'News Source',
          pubDate: art.pubDate,
          image: art.image_url || getFallbackImage(idx + (pageNum-1)*10),
          category: art.category || (activeCategory === 'All' ? 'General' : activeCategory),
          url: art.link,
          description: art.description || '',
          link: art.link,
        }));

        setArticles(prev => {
          if (pageNum === 1) return formatted;
          // Filter out duplicates based on title or link
          const newArticles = formatted.filter(f => !prev.some(p => p.title === f.title || p.link === f.link));
          return [...prev, ...newArticles];
        });
        
        if (liveArticles.length < 10) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        if (pageNum === 1) {
          setArticles(prev => force || prev.length === 0 ? [] : prev);
        }
        setHasMore(false);
      }
    } catch (err) {
      if (!isMounted.current) return;
      if (err.name === 'AbortError' || err.message === 'Aborted') return;
      console.error("News API Error:", err);
      if (pageNum === 1) {
        setError(err.message || "Unable to load latest news. Please try again later.");
        setArticles(prev => prev.length === 0 ? [] : prev);
      }
    } finally {
      if (isMounted.current) {
        if (pageNum === 1) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    }
  }, [activeCategory, searchQuery, selectedCountry]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setShowAllDiscover(false);
    setShowAllRecommended(false);
    const controller = new AbortController();
    const timer = setTimeout(() => fetchNews(1, false, controller.signal), 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchNews]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage, false);
  };

  /* ── Derived data ── */
  const bannerItems = articles.slice(0, BANNER_COUNT);
  const discoverAll = articles.slice(BANNER_COUNT, BANNER_COUNT + DISCOVER_DEFAULT);
  const discoverStories = showAllDiscover ? discoverAll : discoverAll.slice(0, 6);
  const recommendedAll = articles.slice(BANNER_COUNT + DISCOVER_DEFAULT);
  const recommendedStories = showAllRecommended ? recommendedAll : recommendedAll.slice(0, 6);

  const handleArticleClick = (url) => {
    if (url) window.open(url, '_blank');
  };

  const currentCountryLabel = COUNTRIES.find(c => c.code === selectedCountry)?.label || 'Global';

  return (
    <div
      className="space-y-8 pb-24 max-w-5xl mx-auto relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isPulling && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: pullProgress, y: pullProgress * 40 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-card shadow-lg border border-border/50 text-primary"
          >
            <RefreshCw className={cn("w-5 h-5", pullProgress > 0.8 && "animate-spin")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header & Search ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              NEORA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Your daily editorial digest</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Country filter */}
            <div className="relative" ref={countryDropdownRef}>
              <motion.button
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "h-10 px-3 rounded-full bg-card/60 backdrop-blur-md border border-border/50 flex items-center gap-2 text-sm font-medium transition-colors",
                  selectedCountry ? "text-primary border-primary/30" : "text-foreground hover:bg-card"
                )}
                title="Filter by country"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentCountryLabel}</span>
              </motion.button>

              <AnimatePresence>
                {showCountryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-52 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {COUNTRIES.map(({ code, label }) => (
                      <button
                        key={code}
                        onClick={() => { setSelectedCountry(code); setShowCountryDropdown(false); }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors",
                          selectedCountry === code
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reload */}
            <motion.button
              onClick={() => fetchNews(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-card/60 backdrop-blur-md border border-border/50 flex items-center justify-center text-foreground hover:bg-card relative"
              title="Reload News"
            >
              <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin text-primary")} />
              {isLoading && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                </span>
              )}
            </motion.button>

            {/* Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-card/60 backdrop-blur-md border border-border/50 flex items-center justify-center text-foreground hover:bg-card"
            >
              <Bell className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search stories, topics, or sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-card/40 backdrop-blur-md border border-border/50 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all hover:bg-card/60 shadow-sm"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
                activeCategory === category
                  ? "bg-foreground text-background shadow-md shadow-foreground/10"
                  : "bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + selectedCountry}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={cn("space-y-8 transition-opacity duration-300", isLoading && articles.length > 0 ? "opacity-60 pointer-events-none" : "opacity-100")}
        >
          {/* Loading */}
          {isLoading && articles.length === 0 && (
            <LoadingSpinner className="py-20" label="Fetching the latest global stories..." size="md" />
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-red-500/10 rounded-3xl border border-red-500/20 p-8">
              <p className="text-red-500 font-medium">{error}</p>
              <button
                onClick={() => fetchNews(true)}
                className="px-6 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && articles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/50 p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold">No stories found</h3>
              <p className="text-muted-foreground">We couldn't find any news matching your criteria.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); setSelectedCountry(''); }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* ── Breaking News Banner Carousel ── */}
          {!isLoading && !error && bannerItems.length > 0 && (
            <BannerCarousel items={bannerItems} onArticleClick={handleArticleClick} />
          )}

          {/* ── Discover ── */}
          {!isLoading && !error && discoverAll.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold tracking-tight">Discover</h2>
                <button
                  onClick={() => setShowAllDiscover(!showAllDiscover)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {showAllDiscover ? 'Show less' : `See all (${discoverAll.length})`}
                  <ChevronRight className={cn("w-4 h-4 transition-transform", showAllDiscover && "rotate-90")} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <AnimatePresence>
                  {discoverStories.map((story, i) => (
                    <motion.div
                      key={story.id + i}
                      onClick={() => handleArticleClick(story.url)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.05 }}
                      className="group cursor-pointer flex flex-col gap-3"
                      layout
                    >
                      <div className="relative overflow-hidden rounded-[1.5rem] aspect-[4/3] shadow-sm">
                        <SafeImage
                          src={story.image}
                          fallback={getFallbackImage(BANNER_COUNT + i)}
                          alt={story.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Bookmark className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="px-1">
                        <div className="flex items-center gap-2 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <span className="text-primary">{story.category || 'News'}</span>
                          <span>•</span>
                          <RelativeTime pubDate={story.pubDate} />
                        </div>
                        <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {story.title}
                        </h3>
                        {story.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{story.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1.5">{story.source}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* ── Recommended ── */}
          {!isLoading && !error && recommendedAll.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold tracking-tight">Recommended for you</h2>
                <button
                  onClick={() => setShowAllRecommended(!showAllRecommended)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {showAllRecommended ? 'Show less' : `See all (${recommendedAll.length})`}
                  <ChevronRight className={cn("w-4 h-4 transition-transform", showAllRecommended && "rotate-90")} />
                </button>
              </div>

              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-[2rem] p-4 sm:p-6 space-y-6">
                <AnimatePresence>
                  {recommendedStories.map((story, i) => (
                    <motion.div
                      key={story.id + i}
                      onClick={() => handleArticleClick(story.url)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "group flex gap-4 cursor-pointer items-center",
                        i !== recommendedStories.length - 1 && "border-b border-border/50 pb-6"
                      )}
                      layout
                    >
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-[1.2rem] overflow-hidden">
                        <SafeImage
                          src={story.image}
                          fallback={getFallbackImage(BANNER_COUNT + DISCOVER_DEFAULT + i)}
                          alt={story.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <span>{story.category || 'News'}</span>
                          <span>•</span>
                          <RelativeTime pubDate={story.pubDate} />
                        </div>
                        <h3 className="font-bold text-sm sm:text-lg leading-snug line-clamp-2 mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                          {story.title}
                        </h3>
                        {story.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 hidden sm:block">{story.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm text-muted-foreground">{story.source}</p>
                          <button className="text-muted-foreground hover:text-foreground transition-colors p-1" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* ── Load More Button ── */}
          {!isLoading && !error && articles.length > 0 && (
            <div className="flex justify-center pt-4 pb-8">
              {hasMore ? (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="relative group overflow-hidden rounded-full bg-card/60 backdrop-blur-md border border-border/50 px-8 py-3 font-medium shadow-sm transition-all hover:bg-card hover:shadow-md hover:border-primary/30 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    </div>
                  ) : (
                    <span className="text-sm font-medium">Show More</span>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-muted/30 border border-border/50">
                  <span className="flex h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">You're up to date</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
