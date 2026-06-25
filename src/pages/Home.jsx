import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion 
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, Bot, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, Settings, 
  Music, Image as ImageIcon, Languages, Compass, Key, Calculator, Clock, PartyPopper, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APPS = [
  { id: 'notes', label: 'Notes', path: '/notes', icon: StickyNote, gradient: 'bg-amber-500/20 text-amber-400 border-amber-500/30', glow: 'rgba(245, 158, 11, 0.25)' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare, gradient: 'bg-blue-500/20 text-blue-400 border-blue-500/30', glow: 'rgba(59, 130, 246, 0.25)' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar, gradient: 'bg-green-500/20 text-green-400 border-green-500/30', glow: 'rgba(34, 197, 94, 0.25)' },
  { id: 'scanner', label: 'Scanner', path: '/scanner', icon: ScanLine, gradient: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', glow: 'rgba(99, 102, 241, 0.25)' },
  { id: 'finance', label: 'Finance', path: '/finance', icon: Wallet, gradient: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', glow: 'rgba(16, 185, 129, 0.25)' },
  { id: 'files', label: 'Files', path: '/files', icon: FolderOpen, gradient: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', glow: 'rgba(6, 182, 212, 0.25)' },
  { id: 'vault', label: 'Vault', path: '/vault', icon: Lock, gradient: 'bg-slate-500/20 text-slate-300 border-slate-500/30', glow: 'rgba(148, 163, 184, 0.25)' },
  { id: 'oradocs', label: 'Documents', path: '/oradocs', icon: FileText, gradient: 'bg-orange-500/20 text-orange-400 border-orange-500/30', glow: 'rgba(249, 115, 22, 0.25)' },
  { id: 'news', label: 'News', path: '/news', icon: Globe, logo: '/logo/NEORA.png', gradient: 'bg-red-500/20 text-red-400 border-red-500/30', glow: 'rgba(239, 68, 68, 0.25)' },
  { id: 'climora', label: 'Weather', path: '/climora', icon: CloudSun, gradient: 'bg-sky-500/20 text-sky-400 border-sky-500/30', glow: 'rgba(14, 165, 233, 0.25)' },
  { id: 'assistant', label: 'AI', path: '/assistant', icon: Bot, logo: '/logo/Ora AI.png', gradient: 'bg-violet-500/20 text-violet-400 border-violet-500/30', glow: 'rgba(139, 92, 246, 0.35)' },
  { id: 'browser', label: 'Browser', path: '/browser', icon: Compass, gradient: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30', glow: 'rgba(129, 140, 248, 0.25)' },
  { id: 'routo', label: 'Maps', path: '/routo', icon: Map, logo: '/logo/Routo.jpg', gradient: 'bg-teal-500/20 text-teal-400 border-teal-500/30', glow: 'rgba(20, 184, 166, 0.25)' },
  { id: 'festo', label: 'FESTO', path: '/festo', icon: PartyPopper, logo: '/logo/FESTA.png', gradient: 'bg-orange-500/20 text-orange-400 border-orange-500/30', glow: 'rgba(249, 115, 22, 0.25)' },
  { id: 'music', label: 'Music', path: '/music', icon: Music, gradient: 'bg-pink-500/20 text-pink-400 border-pink-500/30', glow: 'rgba(236, 72, 153, 0.25)' },
  { id: 'gallery', label: 'Gallery', path: '/gallery', icon: ImageIcon, gradient: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30', glow: 'rgba(217, 70, 239, 0.25)' },
  { id: 'translator', label: 'Translator', path: '/translator', icon: Languages, gradient: 'bg-blue-400/20 text-blue-300 border-blue-400/30', glow: 'rgba(96, 165, 250, 0.25)' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, gradient: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', glow: 'rgba(161, 161, 170, 0.25)' },
  { id: 'calculator', label: 'Calculator', path: '/calculator', icon: Calculator, gradient: 'bg-orange-600/20 text-orange-500 border-orange-600/30', glow: 'rgba(234, 88, 12, 0.25)' },
  { id: 'clock', label: 'Clock', path: '/clock', icon: Clock, gradient: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30', glow: 'rgba(79, 70, 229, 0.25)' },
  { id: 'habits', label: 'Habito', path: '/habits', icon: Target, gradient: 'bg-rose-500/20 text-rose-400 border-rose-500/30', glow: 'rgba(244, 63, 94, 0.25)' },
  { id: 'passwords', label: 'Passwords', path: '/passwords', icon: Key, gradient: 'bg-slate-700/30 text-slate-300 border-slate-600/40', glow: 'rgba(100, 116, 139, 0.25)' },
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
  const shouldReduceMotion = useReducedMotion();
  
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
          
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
          const data = await res.json();
          
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
    }, 500);
  };

  // Parallax Logic for Desktop
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 20 };
  const parallaxX = useSpring(mouseX, springConfig);
  const parallaxY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || window.innerWidth < 1024) return;
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x * 24);
    mouseY.set(y * 24);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Stagger Animations for App Grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
        delayChildren: shouldReduceMotion ? 0 : 0.15,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15, scale: shouldReduceMotion ? 1 : 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 350, damping: 25 }
    }
  };

  const AppIcon = ({ app }) => {
    const isAI = app.id === 'assistant';
    const isSettings = app.id === 'settings';

    return (
      <motion.button
        variants={itemVariants}
        whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -4 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
        onClick={() => handleNavigate(app.path)}
        className="flex flex-col items-center gap-3 relative group focus:outline-none w-full select-none"
      >
        {/* Ambient Glow on Hover */}
        {!shouldReduceMotion && (
          <div 
            className="absolute top-1 w-16 h-16 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
            style={{ backgroundColor: app.glow }}
          />
        )}

        <div className={cn(
          "relative rounded-[24px] flex items-center justify-center transition-all duration-300 w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]",
          app.gradient,
          "shadow-[0_8px_20px_rgba(0,0,0,0.12)] group-hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)] backdrop-blur-xl border border-white/10 dark:border-white/[0.08] overflow-hidden"
        )}>
          {/* AI Breathing Ambient Background */}
          {isAI && !shouldReduceMotion && (
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 bg-violet-500/30 rounded-[24px] blur-md pointer-events-none"
            />
          )}

          {app.logo ? (
            <img src={app.logo} alt={app.label} className="w-full h-full object-cover rounded-[24px] z-10 pointer-events-none" />
          ) : (
            <motion.div
              animate={isSettings && !shouldReduceMotion ? { rotate: 0 } : {}}
              whileHover={isSettings && !shouldReduceMotion ? { rotate: 45 } : {}}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative z-10 flex items-center justify-center w-full h-full"
            >
              <app.icon className="w-8 h-8 sm:w-10 sm:h-10 text-current drop-shadow-sm" strokeWidth={1.5} />
            </motion.div>
          )}

          {/* AI Sparkle Overlay */}
          {isAI && !shouldReduceMotion && (
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 0.7] }}
              transition={{ repeat: Infinity, repeatDelay: 3, duration: 1.2, ease: "easeInOut" }}
              className="absolute top-2 right-2 pointer-events-none z-30"
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
            </motion.div>
          )}

          {/* Touch Ripple Highlight */}
          <div className="absolute inset-0 rounded-[24px] bg-white/0 group-active:bg-white/10 dark:group-active:bg-white/[0.08] transition-colors z-20 pointer-events-none" />
        </div>

        <span className="font-medium text-foreground/90 tracking-wide text-xs sm:text-sm drop-shadow-sm truncate w-full text-center px-1">
          {app.label}
        </span>
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/30 pt-10 pb-20">
      
      {/* Flagship Ambient Edge Vignette & Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(120,119,198,0.08)_0%,_transparent_75%)]" />
        
        {!shouldReduceMotion && (
          <>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -30, 0] }}
              transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
              className="absolute top-10 -left-20 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/[0.07] rounded-full blur-[100px]"
            />
            <motion.div 
              animate={{ scale: [1, 1.25, 1], x: [0, -40, 0], y: [0, 40, 0] }}
              transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
              className="absolute top-40 -right-20 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/[0.07] rounded-full blur-[100px]"
            />
          </>
        )}
      </div>

      <div className="relative z-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-10">
        
        {/* FLAGSHIP GLASSMORPHISM BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative mx-auto max-w-2xl group cursor-default select-none"
        >
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-1 rounded-[34px] bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-blue-500/15 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

          {/* Frosted Glass Main Card */}
          <motion.div 
            style={shouldReduceMotion ? {} : { x: parallaxX, y: parallaxY }}
            animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
            transition={{ y: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
            className="relative overflow-hidden rounded-[30px] p-8 sm:p-10 bg-white/[0.12] dark:bg-white/[0.07] backdrop-blur-[32px] border border-white/[0.18] dark:border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center text-center"
          >
            {/* Animated Background Gradient Inside Glass */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-purple-500/[0.05] pointer-events-none" />

            {/* Glowing Blobs Layer Inside Glass */}
            {!shouldReduceMotion && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], x: [-20, 20, -20] }}
                  transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
                  className="absolute -top-12 left-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-[50px]"
                />
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], y: [-15, 15, -15] }}
                  transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                  className="absolute -bottom-12 right-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-[50px]"
                />
              </div>
            )}

            {/* Periodic Shimmer Sweep Effect */}
            {!shouldReduceMotion && (
              <motion.div 
                animate={{ x: ['-100%', '250%'] }}
                transition={{ repeat: Infinity, repeatDelay: 14, duration: 2.8, ease: "easeInOut" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.1] dark:via-white/[0.14] to-transparent skew-x-12 pointer-events-none z-10"
              />
            )}

            {/* Soft Inner Highlight Top Border */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent" />

            {/* Content Layer */}
            <div className="relative z-20 space-y-4">
              <div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-[68px] sm:text-[76px] font-bold tracking-tighter text-foreground leading-none drop-shadow-sm font-sans">
                    {format(time, "h:mm")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-semibold text-muted-foreground/80 tracking-normal">
                    {format(time, "a")}
                  </span>
                </div>
                <div className="text-base sm:text-lg font-medium text-muted-foreground/90 mt-2 tracking-wide">
                  {format(time, "EEEE, MMMM d")}
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
                {weather.loading ? (
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground/80 bg-background/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5">
                    <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin"/> Locating...
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 bg-background/40 dark:bg-black/20 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 shadow-inner">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-base sm:text-lg">
                      <motion.div animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                        <CloudSun className="w-5 h-5 text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                      </motion.div>
                      <span>{weather.temp !== null ? `${weather.temp}°C` : '--'}</span>
                      <span className="text-foreground/30 font-normal">|</span>
                      <span className="text-sm sm:text-base font-medium">{weather.desc}</span>
                    </div>
                    
                    <span className="hidden sm:inline text-foreground/20">•</span>

                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm font-medium">
                      <Map className="w-3.5 h-3.5 text-primary" /> 
                      <span>{weather.locationName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Dynamic Flagship App Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full pt-2"
        >
          <div className="grid grid-cols-4 gap-y-8 gap-x-2 sm:gap-x-6 place-items-center w-full">
            {APPS.map(app => (
              <AppIcon key={app.id} app={app} />
            ))}
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}