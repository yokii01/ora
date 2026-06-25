import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, Bot, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, PartyPopper, Settings, 
  Search, Star, Bell, X, Mic, QrCode, Sparkles, MapPin, 
  Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApiQuery } from '@/hooks/useApi';

// Weather theme logic reused from Climora
const getWeatherIcon = (code, isDay) => {
  if (code <= 1) return isDay ? Sun : Moon;
  if (code <= 3) return Cloud;
  if (code <= 69) return CloudRain;
  if (code <= 79) return CloudSnow;
  if (code <= 99) return CloudLightning;
  return Cloud;
};

// Reusing same apps but with new categories
const APPS = [
  { id: 'notes', label: 'Notes', path: '/notes', icon: StickyNote, color: 'text-amber-400', category: 'Productivity' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare, color: 'text-blue-400', category: 'Productivity' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar, color: 'text-emerald-400', category: 'Productivity' },
  { id: 'habits', label: 'Habito', path: '/habits', icon: Target, color: 'text-rose-400', category: 'Productivity' },
  { id: 'finance', label: 'Finance', path: '/finance', icon: Wallet, color: 'text-emerald-400', category: 'Utilities' },
  { id: 'files', label: 'Files', path: '/files', icon: FolderOpen, color: 'text-cyan-400', category: 'Utilities' },
  { id: 'vault', label: 'Vault', path: '/vault', icon: Lock, color: 'text-slate-300', category: 'Utilities' },
  { id: 'scanner', label: 'Scanner', path: '/scanner', icon: ScanLine, color: 'text-indigo-400', category: 'Utilities' },
  { id: 'oradocs', label: 'Docs', path: '/oradocs', icon: FileText, color: 'text-orange-400', category: 'Utilities' },
  { id: 'assistant', label: 'AI Chat', path: '/assistant', icon: Bot, color: 'text-violet-400', category: 'AI', badge: 'New' },
  { id: 'news', label: 'News', path: '/news', icon: Globe, color: 'text-red-400', category: 'AI' },
  { id: 'climora', label: 'Weather', path: '/climora', icon: CloudSun, color: 'text-sky-400', category: 'Entertainment' },
  { id: 'routo', label: 'ROUTO', path: '/routo', icon: Map, color: 'text-teal-400', category: 'Entertainment' },
  { id: 'festo', label: 'FESTO', path: '/festo', icon: PartyPopper, color: 'text-fuchsia-400', category: 'Entertainment' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, color: 'text-zinc-400', category: 'Utilities' }
];

const FAVORITES_KEY = 'oras_favorite_apps';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '["notes", "tasks", "calendar", "assistant"]'));
  
  // Weather state
  const [location, setLocation] = useState(null); // Will hold lat/lon
  const defaultCity = 'Coimbatore'; // Fallback city as requested

  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLocation({ lat: 11.0168, lon: 76.9558 }) // Coimbatore fallback
      );
    } else {
      setLocation({ lat: 11.0168, lon: 76.9558 });
    }
  }, []);

  const { data: weatherData } = useApiQuery({
    queryKey: ['weather', location?.lat, location?.lon],
    url: `https://api.open-meteo.com/v1/forecast?latitude=${location?.lat}&longitude=${location?.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`,
    enabled: !!location,
  });

  const { data: geoData } = useApiQuery({
    queryKey: ['weather-reverse-geocode', location?.lat, location?.lon],
    url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location?.lat}&lon=${location?.lon}&zoom=10`,
    enabled: !!location,
  });

  // Calculate greeting
  const today = new Date();
  const firstName = user?.full_name?.split(' ')[0] || 'yokii'; // Custom requested greeting
  
  const weatherCity = geoData?.address?.city || geoData?.address?.town || geoData?.address?.county || defaultCity;
  const weatherTemp = weatherData?.current?.temperature_2m ? Math.round(weatherData.current.temperature_2m) : '--';
  const WeatherIcon = weatherData?.current ? getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day) : CloudSun;
  
  const conditionMap = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
    45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
    61: 'Rain', 63: 'Rain', 65: 'Heavy Rain', 71: 'Snow', 73: 'Snow', 75: 'Heavy Snow',
    95: 'Thunderstorm'
  };
  const weatherCond = weatherData?.current ? (conditionMap[weatherData.current.weather_code] || 'Cloudy') : 'Loading...';

  const handleAppLaunch = (app) => navigate(app.path);
  
  // App Tile Component
  const AppTile = ({ app }) => (
    <motion.button
      layoutId={`app-${app.id}`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => handleAppLaunch(app)}
      className="flex flex-col items-center gap-3 relative group focus:outline-none w-20 shrink-0"
    >
      <div className={cn(
        "relative flex items-center justify-center transition-all duration-300 w-[72px] h-[72px] rounded-[24px]",
        "bg-white/[0.04] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
        "group-hover:bg-white/[0.08] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
        "after:absolute after:inset-0 after:rounded-[24px] after:border after:border-white/[0.05] after:pointer-events-none"
      )}>
        <app.icon className={cn("w-8 h-8 drop-shadow-lg", app.color)} strokeWidth={1.5} />
      </div>
      <span className="text-[12px] font-medium text-white/80 tracking-wide truncate w-full text-center drop-shadow-sm">
        {app.label}
      </span>
    </motion.button>
  );

  return (
    <div className="min-h-screen relative overflow-hidden text-white" style={{ backgroundColor: '#050505' }}>
      
      {/* Aurora Glassmorphism Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#12163B]/20 to-[#24104F]/30" />
        <motion.div animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-purple-600/15 blur-[120px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[20%] -right-[20%] w-[80vw] h-[80vw] bg-indigo-600/15 blur-[130px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 3, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute -bottom-[10%] left-[10%] w-[60vw] h-[60vw] bg-pink-500/10 blur-[100px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] bg-cyan-500/10 blur-[90px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 px-6 pt-14 pb-32 flex flex-col min-h-screen h-full overflow-y-auto custom-scrollbar">
        
        {/* Top Header Row (Profile, Notifications) */}
        <div className="flex items-center justify-end gap-3 mb-8">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative hover:bg-white/10 transition-colors backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-300" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative hover:bg-white/10 transition-colors backdrop-blur-md shadow-sm">
            <Bell className="w-4 h-4 text-white/90" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,1)]"></span>
          </button>
        </div>

        {/* Greeting & Weather Row */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[34px] leading-[1.1] font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 drop-shadow-[0_2px_10px_rgba(167,139,250,0.2)]">
              Heyy {firstName} <span className="inline-block hover:animate-wave origin-bottom-right cursor-default">👋</span>
            </h1>
            <p className="text-[13px] font-bold text-white/50 tracking-wider uppercase drop-shadow-sm mt-1">
              Today, {format(today, 'EEEE')} • {format(today, 'MMM d')}
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="shrink-0 bg-[#12163B]/40 border border-white/10 backdrop-blur-md rounded-3xl p-3 flex flex-col items-center gap-1 shadow-xl relative overflow-hidden min-w-[80px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-1 text-white/80 z-10">
              <MapPin className="w-3 h-3 text-pink-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{weatherCity}</span>
            </div>
            <div className="flex flex-col items-center z-10 mt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[22px] font-black tracking-tighter text-white drop-shadow-md">{weatherTemp}°</span>
                <WeatherIcon className="w-6 h-6 text-cyan-300 drop-shadow-md" strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 mt-0.5">{weatherCond}</span>
            </div>
          </motion.div>
        </div>

        {/* Universal Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative group mb-10">
          {/* Subtle neon outline glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/50 via-indigo-500/50 to-cyan-500/50 rounded-[28px] opacity-40 blur-[2px] group-focus-within:opacity-100 group-focus-within:blur-[4px] transition duration-500"></div>
          
          <div className="relative flex items-center bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-1.5 pl-5 h-14">
            <Search className="w-5 h-5 text-white/40 mr-3" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps, tools or settings..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-[15px] font-medium"
            />
            <div className="flex items-center gap-1 pr-1">
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/80">
                <Mic className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/80">
                <QrCode className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Categories / Launcher Layout */}
        <div className="space-y-8 flex-1">
          <AnimatePresence mode="popLayout">
            {['Favorites', 'Productivity', 'Utilities', 'AI', 'Entertainment'].map((category, idx) => {
              let categoryApps = [];
              if (category === 'Favorites') {
                categoryApps = APPS.filter(a => favorites.includes(a.id));
                if (categoryApps.length === 0) return null;
              } else {
                categoryApps = APPS.filter(a => a.category === category);
              }
              
              if (search.trim()) {
                categoryApps = categoryApps.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));
              }

              if (categoryApps.length === 0) return null;

              return (
                <motion.div 
                  key={category} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.2 + (idx * 0.05) }}
                  className="space-y-4"
                >
                  <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.25em] pl-2 drop-shadow-sm">{category}</h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-2 custom-scrollbar mask-edges-horizontal snap-x">
                    {categoryApps.map(app => (
                      <div key={app.id} className="snap-start">
                        <AppTile app={app} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {search && APPS.filter(a => a.label.toLowerCase().includes(search.toLowerCase())).length === 0 && (
             <div className="text-center py-10 text-white/40 font-medium">
               No apps found matching "{search}"
             </div>
          )}
        </div>

      </div>
    </div>
  );
}