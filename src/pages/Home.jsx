import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, Bot, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, Settings, 
  Search, Bell, Edit3, Mic, Sparkles, Music, Image as ImageIcon, Languages, Compass, Key, Calculator, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const APPS = [
  { id: 'notes', label: 'Notes', path: '/notes', icon: StickyNote, gradient: 'from-amber-400 to-orange-600', shadow: 'shadow-orange-500/20' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare, gradient: 'from-blue-400 to-indigo-600', shadow: 'shadow-blue-500/20' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar, gradient: 'from-green-400 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  { id: 'scanner', label: 'Scanner', path: '/scanner', icon: ScanLine, gradient: 'from-indigo-400 to-purple-600', shadow: 'shadow-indigo-500/20' },
  { id: 'finance', label: 'Finance', path: '/finance', icon: Wallet, gradient: 'from-emerald-400 to-teal-600', shadow: 'shadow-teal-500/20' },
  { id: 'vault', label: 'Vault', path: '/vault', icon: Lock, gradient: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' },
  { id: 'files', label: 'Files', path: '/files', icon: FolderOpen, gradient: 'from-cyan-400 to-blue-600', shadow: 'shadow-cyan-500/20' },
  { id: 'oradocs', label: 'Documents', path: '/oradocs', icon: FileText, gradient: 'from-orange-400 to-red-600', shadow: 'shadow-orange-500/20' },
  { id: 'news', label: 'News', path: '/news', icon: Globe, gradient: 'from-red-400 to-rose-600', shadow: 'shadow-red-500/20' },
  { id: 'climora', label: 'Weather', path: '/climora', icon: CloudSun, gradient: 'from-sky-400 to-blue-600', shadow: 'shadow-sky-500/20' },
  { id: 'music', label: 'Music', path: '/music', icon: Music, gradient: 'from-pink-400 to-rose-600', shadow: 'shadow-pink-500/20' },
  { id: 'gallery', label: 'Gallery', path: '/gallery', icon: ImageIcon, gradient: 'from-fuchsia-400 to-purple-600', shadow: 'shadow-fuchsia-500/20' },
  { id: 'assistant', label: 'AI', path: '/assistant', icon: Bot, gradient: 'from-violet-400 to-fuchsia-600', shadow: 'shadow-violet-500/20' },
  { id: 'routo', label: 'Maps', path: '/routo', icon: Map, gradient: 'from-teal-400 to-emerald-600', shadow: 'shadow-teal-500/20' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, gradient: 'from-zinc-500 to-zinc-700', shadow: 'shadow-zinc-500/20' },
  { id: 'translator', label: 'Translator', path: '/translator', icon: Languages, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
  { id: 'browser', label: 'Browser', path: '/browser', icon: Compass, gradient: 'from-sky-500 to-indigo-600', shadow: 'shadow-sky-500/20' },
  { id: 'habits', label: 'Habito', path: '/habits', icon: Target, gradient: 'from-rose-400 to-pink-600', shadow: 'shadow-rose-500/20' },
  { id: 'passwords', label: 'Password Manager', path: '/passwords', icon: Key, gradient: 'from-slate-700 to-zinc-900', shadow: 'shadow-slate-500/20' },
  { id: 'calculator', label: 'Calculator', path: '/calculator', icon: Calculator, gradient: 'from-orange-500 to-amber-700', shadow: 'shadow-orange-500/20' },
  { id: 'clock', label: 'Clock', path: '/clock', icon: Clock, gradient: 'from-indigo-500 to-violet-700', shadow: 'shadow-indigo-500/20' },
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
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(app.path)}
      className="flex flex-col items-center gap-3 relative group focus:outline-none w-[72px] sm:w-[84px]"
    >
      <div className={cn(
        "relative rounded-[20px] flex items-center justify-center text-white transition-all duration-300 w-full aspect-square",
        "bg-gradient-to-br", app.gradient,
        "shadow-lg group-hover:shadow-xl group-hover:shadow-current/30",
        app.shadow
      )}>
        {/* Inner Glass Highlight */}
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-white/30 to-transparent mix-blend-overlay pointer-events-none" />
        
        <app.icon className="w-8 h-8 sm:w-10 sm:h-10 relative z-10 drop-shadow-md" strokeWidth={1.5} />
        
        {/* Touch Ripple Layer */}
        <div className="absolute inset-0 rounded-[20px] bg-black/0 group-active:bg-black/10 transition-colors" />
      </div>
      <span className="font-semibold text-white/90 tracking-wide text-xs sm:text-sm drop-shadow-sm truncate w-full text-center px-1">
        {app.label}
      </span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-[#050505] pb-32 relative overflow-hidden text-white font-sans selection:bg-primary/30">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 px-5 max-w-4xl mx-auto pt-12 space-y-10">
        
        {/* Premium Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="text-3xl font-black tracking-tight"
            >
              Heyy, Yokii <span className="inline-block origin-bottom-right animate-wave">👋</span>
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-2 text-white/70 font-medium text-sm"
            >
              <span>{format(time, "MMM do")}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{format(time, "EEEE")}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{format(time, "h:mm a")}</span>
            </motion.div>
            
            {/* Live Weather */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center gap-2 mt-3 text-white/90 text-sm font-semibold bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full w-fit border border-white/10"
            >
              {weather.loading ? (
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin"/> Locating...</div>
              ) : (
                <>
                  <CloudSun className="w-4 h-4 text-sky-400" />
                  <span>{weather.temp !== null ? `${weather.temp}°C` : '--'}</span>
                  <span className="text-white/60 mx-1">|</span>
                  <span>{weather.desc}</span>
                  <span className="text-white/60 mx-1">|</span>
                  <span className="flex items-center gap-1 text-emerald-400"><Map className="w-3.5 h-3.5" /> Current Location</span>
                </>
              )}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="flex flex-col items-end gap-3"
          >
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors">
                <Edit3 className="w-4 h-4 text-white/80" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors">
                <Bot className="w-4 h-4 text-fuchsia-400" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell className="w-4 h-4 text-white/80" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-[#050505]"></span>
              </button>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/20 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="font-bold text-white text-lg">Y</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Global Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative group z-20"
        >
          <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-xl transition-all duration-500 group-focus-within:bg-primary/20 opacity-0 group-focus-within:opacity-100" />
          <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden transition-all duration-300 group-focus-within:border-white/30 group-focus-within:bg-white/10 shadow-2xl">
            <Search className="w-6 h-6 text-white/40 ml-5 group-focus-within:text-white transition-colors shrink-0" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearching(true)}
              placeholder="Search apps, tools or settings..." 
              className="w-full h-16 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/40 text-lg px-4"
            />
            {search && (
              <button onClick={() => setSearch('')} className="mr-2 p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5 text-white/60" />
              </button>
            )}
            <div className="flex items-center gap-1 pr-3 shrink-0">
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <Mic className="w-5 h-5 text-white/70" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <ScanLine className="w-5 h-5 text-white/70" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Dynamic App Grid */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10"
        >
          <AnimatePresence mode="popLayout">
            {filteredApps.length === 0 ? (
              <motion.div 
                key="no-results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20 text-white/40 font-medium"
              >
                No apps found for "{search}"
              </motion.div>
            ) : (
              <motion.div 
                key="app-grid"
                layout
                className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-8 gap-x-2 sm:gap-x-4 place-items-center"
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