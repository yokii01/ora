import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, PartyPopper, Calendar, MapPin, Globe, Star, BookOpen,
  Sparkles, ChevronRight, ExternalLink, Clock, Bookmark,
  ArrowLeft, RefreshCw,
  Flame, Music, Gift, Users, Leaf, Snowflake, X,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FESTIVAL_DATABASE } from '@/lib/festivalsData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Star, color: 'text-yellow-400' },
  { key: 'religious', label: 'Religious', icon: Sparkles, color: 'text-purple-400' },
  { key: 'cultural', label: 'Cultural', icon: Music, color: 'text-pink-400' },
  { key: 'harvest', label: 'Harvest', icon: Leaf, color: 'text-green-400' },
  { key: 'art', label: 'Art', icon: Flame, color: 'text-orange-400' },
  { key: 'food', label: 'Food', icon: Gift, color: 'text-red-400' },
  { key: 'film', label: 'Film', icon: Users, color: 'text-indigo-400' },
  { key: 'seasonal', label: 'Seasonal', icon: Snowflake, color: 'text-cyan-400' },
  { key: 'music', label: 'Music', icon: Music, color: 'text-blue-400' }
];

const CONTINENTS = ['All Continents', 'Asia', 'Americas', 'Europe', 'Africa', 'Middle East', 'Oceania', 'Global'];
const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COUNTRIES = ['All Countries', ...Array.from(new Set(FESTIVAL_DATABASE.map(f => f.country))).sort()];
const MONTHS = ['All Months', ...MONTH_ORDER];

const WIKI_CACHE_KEY = 'oras_festival_wiki_cache';
const WIKI_CACHE_TTL = 3600000 * 24; // 24 hours

const loadCache = () => { try { return JSON.parse(localStorage.getItem(WIKI_CACHE_KEY) || '{}'); } catch { return {}; } };
const saveCache = (cache) => localStorage.setItem(WIKI_CACHE_KEY, JSON.stringify(cache));

const SAVED_KEY = 'oras_festival_saved_v2';
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; } };
const saveSaved = (arr) => localStorage.setItem(SAVED_KEY, JSON.stringify(arr));

export default function FestivalInfo() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeContinent, setActiveContinent] = useState('All Continents');
  const [activeMonth, setActiveMonth] = useState('All Months');
  const [activeCountry, setActiveCountry] = useState('All Countries');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [wikiData, setWikiData] = useState(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState(null);
  const [savedFestivals, setSavedFestivals] = useState(loadSaved);
  const [showFilters, setShowFilters] = useState(false);
  const resetFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setActiveContinent('All Continents');
    setActiveMonth('All Months');
    setActiveCountry('All Countries');
    setShowBookmarksOnly(false);
  };
  const activeFilterCount = [
    search,
    activeCategory !== 'all',
    activeContinent !== 'All Continents',
    activeMonth !== 'All Months',
    activeCountry !== 'All Countries',
    showBookmarksOnly,
  ].filter(Boolean).length;

  // Prefetch thumb cache
  const [thumbnails, setThumbnails] = useState({});

  const filtered = FESTIVAL_DATABASE.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()) || f.country?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchContinent = activeContinent === 'All Continents' || f.continent === activeContinent;
    const matchMonth = activeMonth === 'All Months' || f.month === activeMonth;
    const matchCountry = activeCountry === 'All Countries' || f.country === activeCountry;
    const matchBookmarks = !showBookmarksOnly || savedFestivals.includes(f.id);
    return matchSearch && matchCategory && matchContinent && matchMonth && matchCountry && matchBookmarks;
  });

  const groupedByMonth = MONTH_ORDER.reduce((acc, month) => {
    const monthFestivals = filtered.filter(f => f.month === month);
    if (monthFestivals.length > 0) acc.push({ month, festivals: monthFestivals });
    return acc;
  }, []);

  const fetchWikiData = useCallback(async (wikiTitle) => {
    if (!wikiTitle) return;
    const cache = loadCache();
    const cached = cache[wikiTitle];
    if (cached && Date.now() - cached.timestamp < WIKI_CACHE_TTL) {
      setWikiData(cached.data);
      setThumbnails(prev => ({ ...prev, [wikiTitle]: cached.data.thumbnail }));
      return;
    }

    setWikiLoading(true);
    setWikiError(null);
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const result = {
        title: data.title,
        extract: data.extract,
        thumbnail: data.thumbnail?.source,
        originalImage: data.originalimage?.source,
        description: data.description,
        wikiUrl: data.content_urls?.desktop?.page,
        lastModified: data.timestamp,
      };
      setWikiData(result);
      setThumbnails(prev => ({ ...prev, [wikiTitle]: result.thumbnail }));
      cache[wikiTitle] = { data: result, timestamp: Date.now() };
      saveCache(cache);
    } catch (err) {
      setWikiError('Could not load Wikipedia data. Check your connection.');
    } finally {
      setWikiLoading(false);
    }
  }, []);

  // Fetch thumbnail silently for list view if needed, but we rely on explicit open for full data
  // to avoid hitting the API 200+ times.
  const getThumbnail = (wiki) => {
    const cache = loadCache();
    return thumbnails[wiki] || cache[wiki]?.data?.thumbnail;
  };

  const openFestival = (festival) => {
    setSelectedFestival(festival);
    setWikiData(null);
    fetchWikiData(festival.wiki);
  };

  const closeFestival = () => {
    setSelectedFestival(null);
    setWikiData(null);
    setWikiError(null);
  };

  const toggleSave = (festivalId, e) => {
    e?.stopPropagation();
    setSavedFestivals(prev => {
      const next = prev.includes(festivalId) ? prev.filter(id => id !== festivalId) : [...prev, festivalId];
      saveSaved(next);
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;
    const fetchMissingThumbs = async () => {
      const cache = loadCache();
      let updated = false;

      for (const f of filtered) {
        if (!mounted) break;
        if (!f.wiki) continue;
        if (thumbnails[f.wiki] || cache[f.wiki]) continue;

        try {
          const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(f.wiki)}`);
          if (response.ok) {
            const data = await response.json();
            const result = {
              title: data.title,
              extract: data.extract,
              thumbnail: data.thumbnail?.source,
              originalImage: data.originalimage?.source,
              description: data.description,
              wikiUrl: data.content_urls?.desktop?.page,
              lastModified: data.timestamp,
            };
            cache[f.wiki] = { data: result, timestamp: Date.now() };
            updated = true;
            if (mounted) {
              setThumbnails(prev => ({ ...prev, [f.wiki]: result.thumbnail }));
            }
          }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 100)); // Rate limiting
      }
      
      if (updated && mounted) {
        saveCache(cache);
      }
    };
    
    fetchMissingThumbs();
    return () => { mounted = false; };
  }, [filtered]);

  // Detail View
  if (selectedFestival) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6 pb-24"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={closeFestival}
            className="p-2.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate flex items-center gap-2">
              {selectedFestival.emoji} {selectedFestival.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {selectedFestival.continent}
              </span>
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {selectedFestival.country}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => toggleSave(selectedFestival.id, e)}
            className={cn(
              "p-2.5 rounded-full transition-all shadow-sm",
              savedFestivals.includes(selectedFestival.id)
                ? "bg-amber-500/20 text-amber-500"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Bookmark className={cn("w-5 h-5", savedFestivals.includes(selectedFestival.id) && "fill-current")} />
          </button>
        </div>

        {/* Hero Image / Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          className="relative w-full h-72 rounded-[2rem] overflow-hidden bg-muted/30 border border-border/50 group shadow-lg"
        >
          {wikiLoading && !wikiData?.originalImage ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
              <LoadingSpinner inline className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : wikiData?.originalImage ? (
            <img 
              src={wikiData.originalImage} 
              alt={selectedFestival.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center opacity-80", selectedFestival.gradient)}>
              <span className="text-8xl drop-shadow-xl">{selectedFestival.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/20 capitalize flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {selectedFestival.month}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/20 capitalize">
                  {selectedFestival.category}
                </span>
              </div>
              <p className="text-white/90 text-sm font-medium drop-shadow-md max-w-[90%]">
                {wikiData?.description || selectedFestival.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Wikipedia Content */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[2rem] border border-border/50 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-border/40 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold tracking-tight">Wikipedia Summary</h3>
            </div>
            {wikiData?.wikiUrl && (
              <a
                href={wikiData.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Read Article <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="p-5">
            {wikiLoading ? (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="relative">
                  <LoadingSpinner inline size="md" />
                  <Globe className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Fetching global data...</p>
              </div>
            ) : wikiError ? (
              <div className="text-center py-10">
                <Globe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">{wikiError}</p>
                <button
                  onClick={() => fetchWikiData(selectedFestival.wiki)}
                  className="mt-4 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : wikiData ? (
              <div className="space-y-5">
                <p className="text-[15px] text-foreground/90 leading-relaxed font-medium">
                  {wikiData.extract}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No additional information available.</p>
            )}
          </div>
        </motion.div>

        {/* History & Traditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2rem] border border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-foreground">
              <Clock className="w-4 h-4 text-amber-500" /> History & Origins
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedFestival.history}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[2rem] border border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-foreground">
              <PartyPopper className="w-4 h-4 text-pink-500" /> Traditions
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedFestival.traditions}
            </p>
          </motion.div>
        </div>

        {/* Related Festivals */}
        {(() => {
          const related = FESTIVAL_DATABASE.filter(f =>
            f.id !== selectedFestival.id && (f.continent === selectedFestival.continent || f.category === selectedFestival.category)
          ).sort(() => 0.5 - Math.random()).slice(0, 4);
          
          if (!related.length) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2 px-1">
                <Globe className="w-5 h-5 text-primary" /> Explore Similar
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {related.map((f, i) => (
                  <motion.button
                    key={f.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openFestival(f)}
                    className="p-4 rounded-full border border-border/50 bg-card/60 hover:bg-muted/30 text-left transition-all shadow-sm"
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl mb-3 bg-gradient-to-br shadow-inner", f.gradient)}>
                      {f.emoji}
                    </div>
                    <p className="text-sm font-bold truncate">{f.name}</p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {f.country}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          );
        })()}
      </motion.div>
    );
  }

  // List View
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6 pb-24"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl font-extrabold tracking-tight flex items-center gap-3"
        >
          Worldwide
        </motion.h1>
        <p className="text-sm text-muted-foreground font-medium">Explore a curated database of global FESTO.</p>
      </div>

      {/* Search and Advanced Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            placeholder="Search by name, country, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-full bg-card border border-border/50 text-[15px] font-medium shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all hover:bg-muted/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-4 rounded-full border border-border/50 transition-all shadow-sm flex items-center justify-center flex-shrink-0 relative",
            showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-muted/50"
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[2rem] border-t border-border/50 p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Advanced Filters</h3>
                <div className="flex items-center gap-2">
                  <button onClick={resetFilters} className="px-4 py-2 text-xs font-bold rounded-full bg-muted text-muted-foreground hover:text-foreground">
                    Reset
                  </button>
                  <button onClick={() => setShowFilters(false)} className="p-2 bg-muted rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Continent</label>
                  <select
                    value={activeContinent}
                    onChange={e => setActiveContinent(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  >
                    {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Month</label>
                  <select
                    value={activeMonth}
                    onChange={e => setActiveMonth(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Country</label>
                  <select
                    value={activeCountry}
                    onChange={e => setActiveCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Category</label>
                  <select
                    value={activeCategory}
                    onChange={e => setActiveCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none capitalize"
                  >
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto no-scrollbar w-full pb-2">
        <div className="flex gap-2 min-w-max px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border shadow-sm',
                activeCategory === cat.key
                  ? 'bg-muted text-foreground border-border'
                  : 'bg-card text-muted-foreground border-border/50 hover:bg-muted/30'
              )}
            >
              <cat.icon className={cn("w-3.5 h-3.5", activeCategory === cat.key ? '' : cat.color)} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks Tab Section */}
      <div className="flex gap-4 border-b border-border/50 mb-4 px-2">
        <button 
          onClick={() => setShowBookmarksOnly(false)} 
          className={cn("pb-2 text-sm font-bold border-b-2 transition-colors", !showBookmarksOnly ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
        >
          Discover
        </button>
        <button 
          onClick={() => setShowBookmarksOnly(true)} 
          className={cn("pb-2 text-sm font-bold border-b-2 transition-colors", showBookmarksOnly ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
        >
          Bookmarks
        </button>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/50 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Showing {filtered.length} of {FESTIVAL_DATABASE.length} FESTO
          </p>
          <button onClick={resetFilters} className="text-xs font-bold text-primary hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {/* Festival list grouped by month */}
      {groupedByMonth.length === 0 ? (
        <div className="text-center py-20 bg-card/30 rounded-[2rem] border border-border/50 border-dashed">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold">No FESTO found</p>
            <p className="text-sm mt-1 font-medium">Try exploring different continents or categories.</p>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-8 pt-2">
          {groupedByMonth.map(({ month, festivals }, monthIndex) => (
            <div key={month}>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2 px-2">
                <Calendar className="w-3.5 h-3.5" /> {month}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {festivals.map((festival, i) => {
                  const thumb = getThumbnail(festival.wiki);
                  return (
                    <motion.button
                      key={festival.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (monthIndex * 0.05) + (i * 0.02), type: 'spring', stiffness: 400, damping: 30 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => openFestival(festival)}
                      className="w-full flex items-center gap-4 p-3 pr-4 rounded-full border border-border/40 bg-card/50 hover:bg-card hover:border-border/80 hover:shadow-md transition-all group"
                    >
                      {/* Rounded Thumbnail */}
                      <div className={cn(
                        "relative w-16 h-16 rounded-full flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center shadow-inner",
                        !thumb && festival.gradient
                      )}>
                        {thumb ? (
                          <img src={thumb} alt={festival.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl drop-shadow-md">{festival.emoji}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-base font-bold truncate text-foreground/90">{festival.name}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5 line-clamp-1">{festival.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
                            <MapPin className="w-3 h-3" /> {festival.country}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full capitalize">
                            <Star className="w-3 h-3" /> {festival.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => toggleSave(festival.id, e)}
                          className={cn(
                            "p-2 rounded-full transition-all opacity-0 group-hover:opacity-100",
                            savedFestivals.includes(festival.id) ? "text-amber-500 opacity-100 bg-amber-500/10" : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Bookmark className={cn("w-4 h-4", savedFestivals.includes(festival.id) && "fill-current")} />
                        </button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-8 pb-4"
      >
        <p className="text-xs font-medium text-muted-foreground/60 flex items-center justify-center gap-2">
          <Globe className="w-4 h-4" />
          {FESTIVAL_DATABASE.length} FESTO • {new Set(FESTIVAL_DATABASE.map(f => f.country)).size} Countries • Powered by Wikipedia
        </p>
      </motion.div>
    </motion.div>
  );
}
