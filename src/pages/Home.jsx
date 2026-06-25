import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, Bot, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, PartyPopper, Settings, 
  Search, Star, Bell, History, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const APPS = [
  { id: 'notes', label: 'Notes', path: '/notes', icon: StickyNote, color: 'bg-amber-500', category: 'Productivity' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare, color: 'bg-blue-500', category: 'Productivity' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar, color: 'bg-green-500', category: 'Productivity' },
  { id: 'habits', label: 'Habito', path: '/habits', icon: Target, color: 'bg-rose-500', category: 'Productivity' },
  { id: 'finance', label: 'Finance', path: '/finance', icon: Wallet, color: 'bg-emerald-500', category: 'Utilities' },
  { id: 'files', label: 'Files', path: '/files', icon: FolderOpen, color: 'bg-cyan-500', category: 'Utilities' },
  { id: 'vault', label: 'Vault', path: '/vault', icon: Lock, color: 'bg-slate-700', category: 'Utilities' },
  { id: 'scanner', label: 'Scanner', path: '/scanner', icon: ScanLine, color: 'bg-indigo-500', category: 'Utilities' },
  { id: 'oradocs', label: 'Documents', path: '/oradocs', icon: FileText, color: 'bg-orange-500', category: 'Utilities' },
  { id: 'assistant', label: 'AI Chat', path: '/assistant', icon: Bot, color: 'bg-violet-500', category: 'AI & Media', badge: 'New' },
  { id: 'climora', label: 'Weather', path: '/climora', icon: CloudSun, color: 'bg-sky-500', category: 'Travel' },
  { id: 'routo', label: 'ROUTO', path: '/routo', icon: Map, color: 'bg-teal-500', category: 'Travel' },
  { id: 'news', label: 'News', path: '/news', icon: Globe, color: 'bg-red-500', category: 'AI & Media' },
  { id: 'festo', label: 'FESTO', path: '/festo', icon: PartyPopper, color: 'bg-fuchsia-500', category: 'Travel' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, color: 'bg-zinc-500', category: 'System' }
];

const RECENT_KEY = 'oras_recent_apps';
const FAVORITES_KEY = 'oras_favorite_apps';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [search, setSearch] = useState('');
  const [recents, setRecents] = useState(() => JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
  const [isSearching, setIsSearching] = useState(false);

  // Greeting
  const today = new Date();
  const hour = today.getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'Guest';

  // Persistence
  useEffect(() => { localStorage.setItem(RECENT_KEY, JSON.stringify(recents)); }, [recents]);
  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);

  const handleAppLaunch = (app) => {
    setRecents(prev => {
      const filtered = prev.filter(id => id !== app.id);
      return [app.id, ...filtered].slice(0, 6);
    });
    navigate(app.path);
  };

  const toggleFavorite = (e, appId) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]);
  };

  // Filter Apps
  const filteredApps = useMemo(() => {
    if (!search.trim()) return APPS;
    const lower = search.toLowerCase();
    return APPS.filter(a => a.label.toLowerCase().includes(lower) || a.category.toLowerCase().includes(lower));
  }, [search]);

  const pinnedApps = APPS.filter(a => favorites.includes(a.id));
  const recentApps = recents.map(id => APPS.find(a => a.id === id)).filter(Boolean);

  const AppIcon = ({ app, isSmall = false }) => (
    <motion.button
      layoutId={`app-${app.id}-${isSmall ? 'small' : 'large'}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => handleAppLaunch(app)}
      className="flex flex-col items-center gap-2 relative group focus:outline-none"
    >
      <div className={cn(
        "relative rounded-full flex items-center justify-center text-white shadow-lg transition-shadow group-hover:shadow-xl",
        app.color,
        isSmall ? "w-14 h-14" : "w-[72px] h-[72px]"
      )}>
        <app.icon className={isSmall ? "w-6 h-6" : "w-8 h-8"} strokeWidth={1.5} />
        
        {/* Badge */}
        {app.badge && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border-2 border-background">
            {app.badge}
          </div>
        )}

        {/* Favorite Star (Hover) */}
        <button 
          onClick={(e) => toggleFavorite(e, app.id)}
          className={cn(
            "absolute -bottom-1 -right-1 p-1 rounded-full bg-background border shadow-sm transition-opacity",
            favorites.includes(app.id) ? "opacity-100 text-amber-400" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-400"
          )}
        >
          <Star className="w-3 h-3" fill={favorites.includes(app.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <span className={cn(
        "font-medium text-foreground tracking-tight truncate w-full text-center px-1",
        isSmall ? "text-[11px]" : "text-xs"
      )}>
        {app.label}
      </span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Home Header */}
      <div className="px-5 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{greetingTime}, {firstName}</h1>
          <p className="text-sm font-medium text-muted-foreground">{format(today, 'EEEE, MMMM d')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center relative hover:bg-accent transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-background"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {firstName.charAt(0)}
          </div>
        </div>
      </div>

      <div className="px-5 max-w-4xl mx-auto space-y-10">
        {/* Universal Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearching(true)}
            placeholder="Search apps, tools, or settings..." 
            className="w-full h-14 pl-12 pr-12 rounded-2xl bg-card border-border/50 shadow-sm focus:ring-2 focus:ring-primary/20 text-base font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {isSearching || search ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Search Results</h2>
              {filteredApps.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No apps found for "{search}"</div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-8 gap-x-2">
                  {filteredApps.map(app => <AppIcon key={app.id} app={app} />)}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="home-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {/* Favorites & Recents Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pinned / Favorites */}
                {pinnedApps.length > 0 && (
                  <div className="space-y-4 bg-card/30 p-5 rounded-3xl border border-border/40">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      <Star className="w-4 h-4" /> Pinned
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar mask-edges">
                      {pinnedApps.map(app => <AppIcon key={`pin-${app.id}`} app={app} isSmall />)}
                    </div>
                  </div>
                )}

                {/* Recently Opened */}
                {recentApps.length > 0 && (
                  <div className="space-y-4 bg-card/30 p-5 rounded-3xl border border-border/40">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      <History className="w-4 h-4" /> Recent
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar mask-edges">
                      {recentApps.map(app => <AppIcon key={`rec-${app.id}`} app={app} isSmall />)}
                    </div>
                  </div>
                )}
              </div>

              {/* All Apps Grid - Categorized */}
              <div className="space-y-8">
                {Object.entries(
                  APPS.reduce((acc, app) => {
                    (acc[app.category] = acc[app.category] || []).push(app);
                    return acc;
                  }, {})
                ).map(([category, categoryApps]) => (
                  <div key={category} className="space-y-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-2">{category}</h2>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-8 gap-x-2 place-items-center">
                      {categoryApps.map(app => <AppIcon key={app.id} app={app} />)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}