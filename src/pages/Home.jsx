import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, Bot, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, Settings, 
  Music, Image as ImageIcon, Languages, Compass, Key, Calculator, Clock, PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APPS = [
  { id: 'notes', label: 'Notes', path: '/notes', icon: StickyNote, gradient: 'bg-amber-500/20 text-amber-500' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare, gradient: 'bg-blue-500/20 text-blue-500' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar, gradient: 'bg-green-500/20 text-green-500' },
  { id: 'scanner', label: 'Scanner', path: '/scanner', icon: ScanLine, gradient: 'bg-indigo-500/20 text-indigo-500' },
  { id: 'finance', label: 'Finance', path: '/finance', icon: Wallet, gradient: 'bg-emerald-500/20 text-emerald-500' },
  { id: 'files', label: 'Files', path: '/files', icon: FolderOpen, gradient: 'bg-cyan-500/20 text-cyan-500' },
  { id: 'vault', label: 'Vault', path: '/vault', icon: Lock, gradient: 'bg-slate-500/20 text-slate-500' },
  { id: 'oradocs', label: 'Documents', path: '/oradocs', icon: FileText, gradient: 'bg-orange-500/20 text-orange-500' },
  { id: 'news', label: 'News', path: '/news', icon: Globe, logo: '/logo/NEORA.png', gradient: 'bg-red-500/20 text-red-500' },
  { id: 'climora', label: 'Weather', path: '/climora', icon: CloudSun, gradient: 'bg-sky-500/20 text-sky-500' },
  { id: 'assistant', label: 'AI', path: '/assistant', icon: Bot, logo: '/logo/Ora AI.png', gradient: 'bg-violet-500/20 text-violet-500' },
  { id: 'browser', label: 'Browser', path: '/browser', icon: Compass, gradient: 'bg-indigo-400/20 text-indigo-400' },
  { id: 'routo', label: 'Maps', path: '/routo', icon: Map, logo: '/logo/Routo.jpg', gradient: 'bg-teal-500/20 text-teal-500' },
  { id: 'festo', label: 'FESTO', path: '/festo', icon: PartyPopper, logo: '/logo/FESTA.png', gradient: 'bg-orange-500/20 text-orange-500' },
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
  const isNavigating = useRef(false);
  
  // Time and Date
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Weather State
  const [weather, setWeather] = useState({ temp: null, desc: 'Loading...', locationName: 'Locating...', loading: true });

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather({ temp: '--', desc: 'Weather unavailable', locationName: 'Location Denied', loading: false });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Fetch Weather
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
          const data = await res.json();
          
          // Fetch Location Name (Reverse Geocoding via Nominatim)
          let locName = 'Current Location';
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.address) {
              locName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || 'Current Location';
            }
          } catch (e) {
            console.error('Geocoding failed', e);
          }

          if (data && data.current_weather) {
            setWeather({
              temp: Math.round(data.current_weather.temperature),
              desc: getWeatherCodeLabel(data.current_weather.weathercode),
              locationName: locName,
              loading: false
            });
          }
        } catch (e) {
          setWeather({ temp: '--', desc: 'Weather unavailable', locationName: 'Unknown', loading: false });
        }
      },
      () => {
        setWeather({ temp: '--', desc: 'Weather unavailable', locationName: 'Location Denied', loading: false });
      }
    );
  }, []);

  const handleNavigate = (path) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    navigate(path);
    setTimeout(() => {
      isNavigating.current = false;
    }, 500); // Prevent duplicate navigation clicks
  };

  const AppIcon = ({ app }) => (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => handleNavigate(app.path)}
      className="flex flex-col items-center gap-3 relative group focus:outline-none w-full"
    >
      <div className={cn(
        "relative rounded-[22px] flex items-center justify-center transition-all duration-300 w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]",
        app.gradient,
        "shadow-lg hover:shadow-xl group-hover:shadow-current/20 backdrop-blur-md border border-white/5 overflow-hidden"
      )}>
        {app.logo ? (
          <img src={app.logo} alt={app.label} className="w-full h-full object-cover rounded-[22px] z-10" />
        ) : (
          <app.icon className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" strokeWidth={1.5} />
        )}
        {/* Ripple */}
        <div className="absolute inset-0 rounded-[22px] bg-black/0 group-active:bg-black/10 dark:group-active:bg-white/10 transition-colors z-20 pointer-events-none" />
      </div>
      <span className="font-medium text-foreground/90 tracking-wide text-xs sm:text-sm drop-shadow-sm truncate w-full text-center px-1">
        {app.label}
      </span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/30 pt-10">
      <div className="relative z-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 pb-10">
        
        {/* Clock & Weather Banner Redesign */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 bg-background/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border-0 flex flex-col items-center justify-center text-center mx-auto max-w-2xl"
        >
          {/* Subtle gradient lighting matching theme */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
          
          <div className="relative z-10 space-y-5">
            <div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[64px] sm:text-[72px] font-medium tracking-tight text-foreground leading-[1] font-sans">
                  {format(time, "h:mm")}
                </span>
                <span className="text-2xl sm:text-3xl font-medium text-muted-foreground/80">
                  {format(time, "a")}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-medium text-muted-foreground/90 mt-2 tracking-wide">
                {format(time, "EEEE, MMMM d")}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-1.5 mt-2">
              {weather.loading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin"/> Locating...
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-foreground font-medium text-lg">
                    <CloudSun className="w-5 h-5 text-sky-500" />
                    <span>{weather.temp !== null ? `${weather.temp}°C` : '--'}</span>
                    <span className="text-foreground/40 font-normal">|</span>
                    <span>{weather.desc}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium mt-1">
                    <Map className="w-4 h-4 text-primary" /> 
                    <span>{weather.locationName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Dynamic App Grid (4 per row exactly) */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 w-full pt-4"
        >
          <div className="grid grid-cols-4 gap-y-8 gap-x-2 sm:gap-x-4 place-items-center w-full">
            {APPS.map(app => (
              <AppIcon key={app.id} app={app} />
            ))}
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}