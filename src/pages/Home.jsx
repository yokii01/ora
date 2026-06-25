import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, Bot, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, Settings, 
  Search, Bell, Edit3, Mic, Sparkles, Music, Image as ImageIcon, Languages, Compass, Key, Calculator, Clock, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const APPS = [
  { id: 'notes', label: 'Notes', path: '/notes', icon: StickyNote, gradient: 'bg-amber-500/20 text-amber-500' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare, gradient: 'bg-blue-500/20 text-blue-500' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar, gradient: 'bg-green-500/20 text-green-500' },
  { id: 'scanner', label: 'Scanner', path: '/scanner', icon: ScanLine, gradient: 'bg-indigo-500/20 text-indigo-500' },
  { id: 'finance', label: 'Finance', path: '/finance', icon: Wallet, gradient: 'bg-emerald-500/20 text-emerald-500' },
  { id: 'files', label: 'Files', path: '/files', icon: FolderOpen, gradient: 'bg-cyan-500/20 text-cyan-500' },
  { id: 'vault', label: 'Vault', path: '/vault', icon: Lock, gradient: 'bg-slate-500/20 text-slate-500' },
  { id: 'oradocs', label: 'Documents', path: '/oradocs', icon: FileText, gradient: 'bg-orange-500/20 text-orange-500' },
  { id: 'news', label: 'News', path: '/news', icon: Globe, gradient: 'bg-red-500/20 text-red-500' },
  { id: 'climora', label: 'Weather', path: '/climora', icon: CloudSun, gradient: 'bg-sky-500/20 text-sky-500' },
  { id: 'assistant', label: 'AI', path: '/assistant', icon: Bot, gradient: 'bg-violet-500/20 text-violet-500' },
  { id: 'browser', label: 'Browser', path: '/browser', icon: Compass, gradient: 'bg-indigo-400/20 text-indigo-400' },
  { id: 'routo', label: 'Maps', path: '/routo', icon: Map, gradient: 'bg-teal-500/20 text-teal-500' },
  { id: 'music', label: 'Music', path: '/music', icon: Music, gradient: 'bg-pink-500/20 text-pink-500' },
  { id: 'gallery', label: 'Gallery', path: '/gallery', icon: ImageIcon, gradient: 'bg-fuchsia-500/20 text-fuchsia-500' },
  { id: 'translator', label: 'Translator', path: '/translator', icon: Languages, gradient: 'bg-blue-400/20 text-blue-400' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, gradient: 'bg-zinc-500/20 text-zinc-500' },
  { id: 'calculator', label: 'Calculator', path: '/calculator', icon: Calculator, gradient: 'bg-orange-600/20 text-orange-600' },
  { id: 'clock', label: 'Clock', path: '/clock', icon: Clock, gradient: 'bg-indigo-600/20 text-indigo-600' },
  { id: 'habits', label: 'Habito', path: '/habits', icon: Target, gradient: 'bg-rose-500/20 text-rose-500' },
  { id: 'passwords', label: 'Passwords', path: '/passwords', icon: Key, gradient: 'bg-slate-700/20 text-slate-500' },
];

const getWeatherCodeLabel = (code) => {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
  return 'Clear';
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Time and Date
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Weather State
  const [weather, setWeather] = useState({ temp: null, desc: 'Loading...', loading: true });

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather({ temp: '--', desc: 'Location access denied', loading: false });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
          const data = await res.json();
          if (data && data.current_weather) {
            setWeather({
              temp: Math.round(data.current_weather.temperature),
              desc: getWeatherCodeLabel(data.current_weather.weathercode),
              loading: false
            });
          }
        } catch (e) {
          setWeather({ temp: '--', desc: 'Weather unavailable', loading: false });
        }
      },
      () => {
        setWeather({ temp: '--', desc: 'Location access denied', loading: false });
      }
    );
  }, []);

  // Filter Apps
  const filteredApps = useMemo(() => {
    if (!search.trim()) return APPS;
    const lower = search.toLowerCase();
    return APPS.filter(a => a.label.toLowerCase().includes(lower));
  }, [search]);

  const AppIcon = ({ app }) => (
    <motion.button
      layout
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => navigate(app.path)}
      className="flex flex-col items-center gap-3 relative group focus:outline-none w-full"
    >
      <div className={cn(
        "relative rounded-[22px] flex items-center justify-center transition-all duration-300 w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]",
        app.gradient,
        "shadow-lg hover:shadow-xl group-hover:shadow-current/20 backdrop-blur-md border border-white/5"
      )}>
        <app.icon className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" strokeWidth={1.5} />
        {/* Ripple */}
        <div className="absolute inset-0 rounded-[22px] bg-black/0 group-active:bg-black/10 dark:group-active:bg-white/10 transition-colors" />
      </div>
      <span className="font-medium text-foreground/90 tracking-wide text-xs sm:text-sm drop-shadow-sm truncate w-full text-center px-1">
        {app.label}
      </span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/30 pt-12">
      <div className="relative z-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 pb-10">
        
        {/* Floating Top Information Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[28px] p-6 bg-background/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border-0"
        >
          {/* Subtle gradient lighting matching theme */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none mix-blend-screen" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none mix-blend-screen" />
          
          <div className="relative z-10 space-y-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Heyy, Yokii <span className="inline-block origin-bottom-right animate-wave">👋</span>
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm mt-1.5">
                <span className="text-foreground font-bold">{format(time, "hh:mm a")}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{format(time, "EEEE, MMMM d")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-foreground/90 text-sm font-semibold bg-background/50 backdrop-blur-md px-4 py-2.5 rounded-full w-fit border border-border/50 shadow-sm">
              {weather.loading ? (
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin"/> Locating...</div>
              ) : (
                <>
                  <CloudSun className="w-4 h-4 text-sky-500" />
                  <span>{weather.temp !== null ? `${weather.temp}°C` : '--'}</span>
                  <span className="text-border mx-1.5">|</span>
                  <span>{weather.desc}</span>
                  <span className="text-border mx-1.5">|</span>
                  <span className="flex items-center gap-1.5 text-emerald-500"><Map className="w-3.5 h-3.5" /> Current Location</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Global Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative group z-20 mx-auto"
        >
          <div className="absolute inset-0 bg-primary/5 rounded-[24px] blur-xl transition-all duration-500 group-focus-within:bg-primary/20 opacity-0 group-focus-within:opacity-100" />
          <div className="relative flex items-center bg-card/80 backdrop-blur-2xl border border-border/60 rounded-[24px] overflow-hidden transition-all duration-300 group-focus-within:border-primary/50 group-focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)] shadow-xl">
            <Search className="w-6 h-6 text-muted-foreground ml-5 group-focus-within:text-primary transition-colors shrink-0" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearching(true)}
              placeholder="Search apps, tools or settings..." 
              className="w-full h-16 bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground text-base sm:text-lg px-4"
            />
            {search && (
              <button onClick={() => setSearch('')} className="mr-2 p-2 hover:bg-muted rounded-full transition-colors shrink-0">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-1 pr-3 shrink-0">
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <Mic className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <ScanLine className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <Sparkles className="w-5 h-5 text-fuchsia-500" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Dynamic App Grid (4 per row exactly) */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 w-full"
        >
          <AnimatePresence mode="popLayout">
            {filteredApps.length === 0 ? (
              <motion.div 
                key="no-results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20 text-muted-foreground font-medium"
              >
                No apps found for "{search}"
              </motion.div>
            ) : (
              <motion.div 
                key="app-grid"
                layout
                className="grid grid-cols-4 gap-y-8 gap-x-2 sm:gap-x-4 place-items-center w-full"
              >
                {filteredApps.map(app => (
                  <AppIcon key={app.id} app={app} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
      </div>
    </div>
  );
}