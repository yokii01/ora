import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion 
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, Bot, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, Settings, 
  Music, Image as ImageIcon, Languages, Compass, Key, Calculator, Clock, PartyPopper, Sparkles, Search, Mic, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APPS = [
  { id: 'notes', label: 'Notes', desc: 'Write ideas quickly', path: '/notes', icon: StickyNote, gradient: 'from-amber-500/25 via-orange-500/10 to-transparent border-amber-500/35 text-amber-400', glow: 'rgba(245, 158, 11, 0.28)' },
  { id: 'tasks', label: 'Tasks', desc: 'Manage daily goals', path: '/tasks', icon: CheckSquare, gradient: 'from-blue-500/25 via-indigo-500/10 to-transparent border-blue-500/35 text-blue-400', glow: 'rgba(59, 130, 246, 0.28)' },
  { id: 'calendar', label: 'Calendar', desc: 'Plan your schedule', path: '/calendar', icon: Calendar, gradient: 'from-green-500/25 via-emerald-500/10 to-transparent border-green-500/35 text-green-400', glow: 'rgba(34, 197, 94, 0.28)' },
  { id: 'scanner', label: 'Scanner', desc: 'Scan docs instantly', path: '/scanner', icon: ScanLine, gradient: 'from-purple-500/25 via-violet-500/10 to-transparent border-purple-500/35 text-purple-400', glow: 'rgba(168, 85, 247, 0.28)' },
  { id: 'finance', label: 'Finance', desc: 'Track expenses', path: '/finance', icon: Wallet, gradient: 'from-emerald-500/25 via-teal-500/10 to-transparent border-emerald-500/35 text-emerald-400', glow: 'rgba(16, 185, 129, 0.28)' },
  { id: 'files', label: 'Files', desc: 'Organize documents', path: '/files', icon: FolderOpen, gradient: 'from-cyan-500/25 via-sky-500/10 to-transparent border-cyan-500/35 text-cyan-400', glow: 'rgba(6, 182, 212, 0.28)' },
  { id: 'vault', label: 'Vault', desc: 'Secure passwords', path: '/vault', icon: Lock, gradient: 'from-slate-500/30 via-zinc-500/15 to-transparent border-slate-500/35 text-slate-300', glow: 'rgba(148, 163, 184, 0.28)' },
  { id: 'oradocs', label: 'Documents', desc: 'Edit rich text', path: '/oradocs', icon: FileText, gradient: 'from-orange-500/25 via-amber-500/10 to-transparent border-orange-500/35 text-orange-400', glow: 'rgba(249, 115, 22, 0.28)' },
  { id: 'news', label: 'News', desc: 'Live global updates', path: '/news', icon: Globe, logo: './logo/NEORA.png', gradient: 'from-red-500/25 via-rose-500/10 to-transparent border-red-500/35 text-red-400', glow: 'rgba(239, 68, 68, 0.28)' },
  { id: 'climora', label: 'Weather', desc: 'Live atmospheric radar', path: '/climora', icon: CloudSun, gradient: 'from-sky-500/25 via-blue-500/10 to-transparent border-sky-500/35 text-sky-400', glow: 'rgba(14, 165, 233, 0.28)' },
  { id: 'assistant', label: 'AI', desc: 'Ask ORA AI', path: '/assistant', icon: Bot, logo: './logo/Ora AI.png', gradient: 'from-violet-500/35 via-fuchsia-500/20 to-transparent border-violet-500/45 text-violet-300', glow: 'rgba(139, 92, 246, 0.42)' },
  { id: 'browser', label: 'Browser', desc: 'Fast & Secure', path: '/browser', icon: Compass, gradient: 'from-indigo-500/25 via-purple-500/10 to-transparent border-indigo-400/35 text-indigo-300', glow: 'rgba(99, 102, 241, 0.28)' },
  { id: 'routo', label: 'Maps', desc: 'Explore routes', path: '/routo', icon: Map, logo: './logo/Routo.jpg', gradient: 'from-teal-500/25 via-emerald-500/10 to-transparent border-teal-500/35 text-teal-400', glow: 'rgba(20, 184, 166, 0.28)' },
  { id: 'festo', label: 'FESTO', desc: 'Celebrate moments', path: '/festo', icon: PartyPopper, logo: './logo/FESTA.png', gradient: 'from-orange-500/25 via-yellow-500/10 to-transparent border-orange-500/35 text-orange-400', glow: 'rgba(249, 115, 22, 0.28)' },
  { id: 'music', label: 'Music', desc: 'Listen to beats', path: '/music', icon: Music, gradient: 'from-pink-500/25 via-rose-500/10 to-transparent border-pink-500/35 text-pink-400', glow: 'rgba(236, 72, 153, 0.28)' },
  { id: 'gallery', label: 'Gallery', desc: 'View memories', path: '/gallery', icon: ImageIcon, gradient: 'from-fuchsia-500/25 via-purple-500/10 to-transparent border-fuchsia-500/35 text-fuchsia-400', glow: 'rgba(217, 70, 239, 0.28)' },
  { id: 'translator', label: 'Translator', desc: 'Break barriers', path: '/translator', icon: Languages, gradient: 'from-blue-400/25 via-cyan-400/10 to-transparent border-blue-400/35 text-blue-300', glow: 'rgba(96, 165, 250, 0.28)' },
  { id: 'settings', label: 'Settings', desc: 'System preferences', path: '/settings', icon: Settings, gradient: 'from-zinc-500/25 via-slate-500/10 to-transparent border-zinc-500/35 text-zinc-300', glow: 'rgba(161, 161, 170, 0.28)' },
  { id: 'calculator', label: 'Calculator', desc: 'Quick math', path: '/calculator', icon: Calculator, gradient: 'from-orange-600/25 via-amber-600/10 to-transparent border-orange-600/35 text-orange-500', glow: 'rgba(234, 88, 12, 0.28)' },
  { id: 'clock', label: 'Clock', desc: 'Timers & alarms', path: '/clock', icon: Clock, gradient: 'from-indigo-600/25 via-blue-600/10 to-transparent border-indigo-600/35 text-indigo-400', glow: 'rgba(79, 70, 229, 0.28)' },
  { id: 'habits', label: 'Habito', desc: 'Build routines', path: '/habits', icon: Target, gradient: 'from-rose-500/25 via-pink-500/10 to-transparent border-rose-500/35 text-rose-400', glow: 'rgba(244, 63, 94, 0.28)' },
  { id: 'passwords', label: 'Passwords', desc: 'Vault keys', path: '/passwords', icon: Key, gradient: 'from-slate-700/40 via-zinc-700/25 to-transparent border-slate-600/45 text-slate-300', glow: 'rgba(100, 116, 139, 0.28)' },
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

// ─── MEMOIZED COMPACT WIDGET CARD (aspect-[4/3] - exactly 25% shorter) ─────
const AppCard = React.memo(({ app, onNavigate, shouldReduceMotion }) => {
  const isAI = app.id === 'assistant';
  const isSettings = app.id === 'settings';

  return (
    <motion.button
      whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      onClick={() => onNavigate(app.path)}
      className="group relative w-full aspect-[4/3] text-left focus:outline-none select-none gpu-accelerated flex"
    >
      {/* Ambient Outer Glow on Hover */}
      {!shouldReduceMotion && (
        <div 
          className="absolute -inset-1 rounded-[26px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
          style={{ backgroundColor: app.glow }}
        />
      )}

      <div className={cn(
        "relative overflow-hidden rounded-[22px] p-4 sm:p-4.5 bg-gradient-to-br backdrop-blur-2xl border flex flex-col justify-between transition-all duration-300 w-full h-full shadow-[0_8px_24px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] group-hover:shadow-[0_16px_38px_rgba(0,0,0,0.6)]",
        app.gradient,
        "border-white/20 dark:border-white/[0.12]"
      )}>
        {/* Gloss Top Border Reflection */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent pointer-events-none" />

        {/* AI Royal Ambient Aura */}
        {isAI && !shouldReduceMotion && (
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.65, 0.25] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -right-8 -top-8 w-32 h-32 bg-fuchsia-500/30 rounded-full blur-2xl pointer-events-none"
          />
        )}

        {/* Top Row: Floating App Illustration / Logo */}
        <div className="flex items-start justify-between w-full z-10">
          <div className="relative shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-[18px] bg-white/15 dark:bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md overflow-hidden group-hover:scale-105 transition-transform duration-300">
            {app.logo ? (
              <img src={app.logo} alt={app.label} className="w-full h-full object-cover rounded-[18px] pointer-events-none" />
            ) : (
              <motion.div
                animate={isSettings && !shouldReduceMotion ? { rotate: 0 } : {}}
                whileHover={isSettings && !shouldReduceMotion ? { rotate: 45 } : {}}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center justify-center w-full h-full"
              >
                <app.icon className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 text-current drop-shadow-md" strokeWidth={1.5} />
              </motion.div>
            )}
          </div>

          {/* Optional Shortcut Icon / AI Sparkle */}
          {isAI && !shouldReduceMotion && (
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.9)]" />
            </motion.div>
          )}
        </div>

        {/* Bottom Row: App Title & Subtitle */}
        <div className="flex flex-col min-w-0 z-10 pt-1.5">
          <span className="font-bold text-foreground tracking-tight text-sm sm:text-base truncate drop-shadow-sm font-sans">
            {app.label}
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-muted-foreground/85 truncate mt-0.5 group-hover:text-foreground/90 transition-colors">
            {app.desc}
          </span>
        </div>

        {/* Touch Ripple Highlight */}
        <div className="absolute inset-0 rounded-[22px] bg-white/0 group-active:bg-white/10 dark:group-active:bg-white/[0.08] transition-colors pointer-events-none" />
      </div>
    </motion.button>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const [searchQ, setSearchQ] = useState('');
  const [videoFailed, setVideoFailed] = useState(false);
  
  // Stable Navigation Lock
  const handleNavigate = useCallback((path) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigate(path);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);
  }, [navigate]);

  // Clock Telemetry
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleaner Weather Telemetry (Temp, Condition, Short City)
  const [weather, setWeather] = useState({ 
    temp: null, desc: 'Loading radar...', shortCity: 'Locating...', loading: true 
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather({ temp: '--', desc: 'Radar offline', shortCity: 'Earth', loading: false });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
          const data = await res.json();
          
          let cityName = 'Live City';
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.address) {
              const raw = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || 'Live City';
              cityName = raw.split(',')[0].trim();
            }
          } catch (e) {
            console.error('Reverse geocoding failed', e);
          }

          if (data && data.current) {
            setWeather({
              temp: Math.round(data.current.temperature_2m),
              desc: getWeatherCodeLabel(data.current.weather_code),
              shortCity: cityName,
              loading: false
            });
          }
        } catch (e) {
          setWeather({ temp: '--', desc: 'Radar offline', shortCity: 'Satellite', loading: false });
        }
      },
      () => {
        setWeather({ temp: '--', desc: 'Radar unavailable', shortCity: 'Location Denied', loading: false });
      }
    );
  }, []);

  // Parallax Logic for Desktop Banner
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 20 };
  const parallaxX = useSpring(mouseX, springConfig);
  const parallaxY = useSpring(mouseY, springConfig);

  const handleMouseMove = useCallback((e) => {
    if (shouldReduceMotion || window.innerWidth < 1024) return;
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x * 20);
    mouseY.set(y * 20);
  }, [shouldReduceMotion, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Real-time local instant inline search filtering
  const filteredApps = APPS.filter(app => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return app.label.toLowerCase().includes(q) || app.desc.toLowerCase().includes(q) || app.id.toLowerCase().includes(q);
  });

  // Stagger Animations for App Grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.03,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden w-full max-w-[100vw] font-sans selection:bg-primary/30 pt-20 sm:pt-24 pb-24">
      
      {/* ─── LUXURY ANIMATED AURORA BACKGROUND & PARTICLES ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full max-w-[100vw]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,119,198,0.14)_0%,_transparent_75%)]" />
        
        {!shouldReduceMotion && (
          <>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
              transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 w-[550px] h-[550px] bg-purple-600/15 dark:bg-purple-600/[0.08] rounded-full blur-[140px]"
            />
            <motion.div 
              animate={{ scale: [1, 1.25, 1], x: [0, -50, 0], y: [0, 50, 0] }}
              transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
              className="absolute top-32 -right-20 w-[550px] h-[550px] bg-indigo-600/15 dark:bg-blue-600/[0.08] rounded-full blur-[140px]"
            />
          </>
        )}
      </div>

      <div className="relative z-10 px-4 sm:px-8 max-w-6xl mx-auto space-y-8 sm:space-y-10 w-full">
        
        {/* ─── 1 & 3. COMPACT HERO BANNER WITH BULLETPROOF VIDEO BACKGROUND ── */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative mx-auto max-w-2xl group cursor-default select-none w-full"
        >
          {/* Royal Outer Glow */}
          <div className="absolute -inset-2 rounded-[38px] bg-gradient-to-r from-purple-500/25 via-indigo-500/25 to-cyan-500/25 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

          {/* Frosted Glass Hero Card */}
          <motion.div 
            style={shouldReduceMotion ? {} : { x: parallaxX, y: parallaxY }}
            animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
            transition={{ y: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
            className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] p-8 sm:p-10 bg-indigo-950/80 dark:bg-black/60 backdrop-blur-[24px] border border-white/20 dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center min-h-[220px]"
          >
            {/* Bulletproof Open CDN Looping Video Engine with Fallback Backdrop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
              {!videoFailed && (
                <video 
                  autoPlay loop muted playsInline 
                  onError={() => setVideoFailed(true)}
                  className="w-full h-full object-cover scale-105 filter blur-[12px] brightness-75 opacity-90 transition-opacity duration-700 pointer-events-none"
                >
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4" type="video/mp4" />
                </video>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
            </div>

            {/* Periodic Shimmer Light Sweep */}
            {!shouldReduceMotion && (
              <motion.div 
                animate={{ x: ['-100%', '300%'] }}
                transition={{ repeat: Infinity, repeatDelay: 10, duration: 2.8, ease: "easeInOut" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.15] dark:via-white/[0.22] to-transparent skew-x-12 pointer-events-none z-10"
              />
            )}

            {/* Crisp Inner Top Border Reflection */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/35 to-transparent" />

            {/* Cleaner Centered Content Layer */}
            <div className="relative z-20 space-y-5 w-full text-white">
              
              {/* Short City Capsule Chip */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold tracking-wide shadow-sm">
                <Map className="w-3.5 h-3.5 text-sky-300" />
                <span>{weather.shortCity}</span>
              </div>

              {/* Luxury Digital Clock & Date */}
              <div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-[68px] sm:text-[84px] font-extrabold tracking-tighter leading-none drop-shadow-lg font-sans">
                    {format(time, "h:mm")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-white/80 tracking-normal">
                    {format(time, "a")}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-medium text-white/85 mt-1 tracking-wider">
                  {format(time, "EEEE, MMMM d")}
                </div>
              </div>
              
              {/* Compact Meteorological Capsule */}
              <div className="flex items-center justify-center pt-1">
                {weather.loading ? (
                  <div className="text-xs sm:text-sm text-white/70">Locating live radar...</div>
                ) : (
                  <div className="inline-flex items-center justify-center gap-2.5 bg-white/15 dark:bg-black/40 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/20 shadow-sm text-xs sm:text-sm font-semibold text-white">
                    <CloudSun className="w-4 h-4 text-amber-300 drop-shadow" />
                    <span>{weather.temp !== null ? `${weather.temp}°C` : '--'}</span>
                    <span className="text-white/30">•</span>
                    <span>{weather.desc}</span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </motion.div>

        {/* ─── 5 & 6. OVAL FLOATING GLASS INLINE SEARCH BAR ────────────────── */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="relative max-w-2xl mx-auto group w-full"
        >
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500/35 via-primary/35 to-blue-500/35 blur-xl opacity-45 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />
          
          <div className="relative flex items-center justify-between w-full rounded-full py-3.5 px-6 backdrop-blur-2xl bg-white/25 dark:bg-white/[0.07] border border-white/30 dark:border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all duration-300 group-focus-within:border-primary/60 group-focus-within:shadow-[0_0_25px_rgba(139,92,246,0.35)]">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-3 shrink-0 group-focus-within:text-primary transition-colors" />
            <input 
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search apps, tools, settings..." 
              className="w-full bg-transparent border-none outline-none text-foreground font-medium text-sm sm:text-base placeholder:text-muted-foreground/75 select-text" 
            />
            <div className="flex items-center gap-2 ml-3 shrink-0 text-muted-foreground">
              {searchQ && (
                <button type="button" onClick={() => setSearchQ('')} title="Clear" className="p-1 hover:text-foreground active:scale-95 transition-all"><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
              )}
              <button type="button" onClick={() => handleNavigate('/assistant')} title="Ask ORA AI" className="p-1 hover:text-primary active:scale-95 transition-all"><Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-violet-400" /></button>
              <button type="button" onClick={() => handleNavigate('/assistant')} title="Voice AI" className="p-1 hover:text-primary active:scale-95 transition-all"><Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" /></button>
            </div>
          </div>
        </motion.div>

        {/* ─── 4 & 7 & 8. RESPONSIVE COMPACT APP GRID (aspect-[4/3]) ───────── */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full pt-2"
        >
          {filteredApps.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-4 bg-card/30 backdrop-blur-xl rounded-[28px] border border-border/40 max-w-md mx-auto">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3 animate-bounce" />
              <p className="text-base font-semibold text-foreground">No matching tools found</p>
              <p className="text-xs text-muted-foreground mt-1">We couldn't find any app matching "{searchQ}"</p>
              <button onClick={() => setSearchQ('')} className="mt-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">Reset Search</button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5 place-items-stretch w-full">
              {filteredApps.map(app => (
                <AppCard 
                  key={app.id} 
                  app={app} 
                  onNavigate={handleNavigate}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ))}
            </div>
          )}
        </motion.div>
        
      </div>
    </div>
  );
}