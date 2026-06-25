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
  Music, Image as ImageIcon, Languages, Compass, Key, Calculator, Clock, PartyPopper, Sparkles, Droplets, Sunset
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APPS = [
  { id: 'notes', label: 'Notes', desc: 'Write ideas quickly', path: '/notes', icon: StickyNote, gradient: 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30 text-amber-400', glow: 'rgba(245, 158, 11, 0.28)' },
  { id: 'tasks', label: 'Tasks', desc: 'Manage daily goals', path: '/tasks', icon: CheckSquare, gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent border-blue-500/30 text-blue-400', glow: 'rgba(59, 130, 246, 0.28)' },
  { id: 'calendar', label: 'Calendar', desc: 'Plan your schedule', path: '/calendar', icon: Calendar, gradient: 'from-green-500/20 via-emerald-500/10 to-transparent border-green-500/30 text-green-400', glow: 'rgba(34, 197, 94, 0.28)' },
  { id: 'scanner', label: 'Scanner', desc: 'Scan docs instantly', path: '/scanner', icon: ScanLine, gradient: 'from-purple-500/20 via-violet-500/10 to-transparent border-purple-500/30 text-purple-400', glow: 'rgba(168, 85, 247, 0.28)' },
  { id: 'finance', label: 'Finance', desc: 'Track expenses', path: '/finance', icon: Wallet, gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30 text-emerald-400', glow: 'rgba(16, 185, 129, 0.28)' },
  { id: 'files', label: 'Files', desc: 'Organize documents', path: '/files', icon: FolderOpen, gradient: 'from-cyan-500/20 via-sky-500/10 to-transparent border-cyan-500/30 text-cyan-400', glow: 'rgba(6, 182, 212, 0.28)' },
  { id: 'vault', label: 'Vault', desc: 'Secure passwords', path: '/vault', icon: Lock, gradient: 'from-slate-500/25 via-zinc-500/10 to-transparent border-slate-500/30 text-slate-300', glow: 'rgba(148, 163, 184, 0.28)' },
  { id: 'oradocs', label: 'Documents', desc: 'Edit rich text', path: '/oradocs', icon: FileText, gradient: 'from-orange-500/20 via-amber-500/10 to-transparent border-orange-500/30 text-orange-400', glow: 'rgba(249, 115, 22, 0.28)' },
  { id: 'news', label: 'News', desc: 'Live global updates', path: '/news', icon: Globe, logo: './logo/NEORA.png', gradient: 'from-red-500/20 via-rose-500/10 to-transparent border-red-500/30 text-red-400', glow: 'rgba(239, 68, 68, 0.28)' },
  { id: 'climora', label: 'Weather', desc: 'Live atmospheric radar', path: '/climora', icon: CloudSun, gradient: 'from-sky-500/20 via-blue-500/10 to-transparent border-sky-500/30 text-sky-400', glow: 'rgba(14, 165, 233, 0.28)' },
  { id: 'assistant', label: 'AI', desc: 'Ask ORA AI', path: '/assistant', icon: Bot, logo: './logo/Ora AI.png', gradient: 'from-violet-500/30 via-fuchsia-500/15 to-transparent border-violet-500/40 text-violet-300', glow: 'rgba(139, 92, 246, 0.4)' },
  { id: 'browser', label: 'Browser', desc: 'Fast & Secure', path: '/browser', icon: Compass, gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-400/30 text-indigo-300', glow: 'rgba(99, 102, 241, 0.28)' },
  { id: 'routo', label: 'Maps', desc: 'Explore routes', path: '/routo', icon: Map, logo: './logo/Routo.jpg', gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent border-teal-500/30 text-teal-400', glow: 'rgba(20, 184, 166, 0.28)' },
  { id: 'festo', label: 'FESTO', desc: 'Celebrate moments', path: '/festo', icon: PartyPopper, logo: './logo/FESTA.png', gradient: 'from-orange-500/20 via-yellow-500/10 to-transparent border-orange-500/30 text-orange-400', glow: 'rgba(249, 115, 22, 0.28)' },
  { id: 'music', label: 'Music', desc: 'Listen to beats', path: '/music', icon: Music, gradient: 'from-pink-500/20 via-rose-500/10 to-transparent border-pink-500/30 text-pink-400', glow: 'rgba(236, 72, 153, 0.28)' },
  { id: 'gallery', label: 'Gallery', desc: 'View memories', path: '/gallery', icon: ImageIcon, gradient: 'from-fuchsia-500/20 via-purple-500/10 to-transparent border-fuchsia-500/30 text-fuchsia-400', glow: 'rgba(217, 70, 239, 0.28)' },
  { id: 'translator', label: 'Translator', desc: 'Break barriers', path: '/translator', icon: Languages, gradient: 'from-blue-400/20 via-cyan-400/10 to-transparent border-blue-400/30 text-blue-300', glow: 'rgba(96, 165, 250, 0.28)' },
  { id: 'settings', label: 'Settings', desc: 'System preferences', path: '/settings', icon: Settings, gradient: 'from-zinc-500/20 via-slate-500/10 to-transparent border-zinc-500/30 text-zinc-300', glow: 'rgba(161, 161, 170, 0.28)' },
  { id: 'calculator', label: 'Calculator', desc: 'Quick math', path: '/calculator', icon: Calculator, gradient: 'from-orange-600/20 via-amber-600/10 to-transparent border-orange-600/30 text-orange-500', glow: 'rgba(234, 88, 12, 0.28)' },
  { id: 'clock', label: 'Clock', desc: 'Timers & alarms', path: '/clock', icon: Clock, gradient: 'from-indigo-600/20 via-blue-600/10 to-transparent border-indigo-600/30 text-indigo-400', glow: 'rgba(79, 70, 229, 0.28)' },
  { id: 'habits', label: 'Habito', desc: 'Build routines', path: '/habits', icon: Target, gradient: 'from-rose-500/20 via-pink-500/10 to-transparent border-rose-500/30 text-rose-400', glow: 'rgba(244, 63, 94, 0.28)' },
  { id: 'passwords', label: 'Passwords', desc: 'Vault keys', path: '/passwords', icon: Key, gradient: 'from-slate-700/35 via-zinc-700/20 to-transparent border-slate-600/40 text-slate-300', glow: 'rgba(100, 116, 139, 0.28)' },
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

// ─── MEMOIZED LUXURY WIDGET CARD ─────────────────────────────────────────────
const AppCard = React.memo(({ app, onNavigate, shouldReduceMotion }) => {
  const isAI = app.id === 'assistant';
  const isSettings = app.id === 'settings';

  return (
    <motion.button
      whileHover={shouldReduceMotion ? {} : { y: -8, scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
      onClick={() => onNavigate(app.path)}
      className="group relative w-full text-left focus:outline-none select-none gpu-accelerated"
    >
      {/* Ambient Outer Glow on Hover */}
      {!shouldReduceMotion && (
        <div 
          className="absolute -inset-1 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
          style={{ backgroundColor: app.glow }}
        />
      )}

      <div className={cn(
        "relative overflow-hidden rounded-[28px] p-5 sm:p-6 bg-gradient-to-br backdrop-blur-2xl border flex items-center gap-4 sm:gap-5 transition-all duration-300 w-full shadow-[0_12px_32px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)]",
        app.gradient,
        "border-white/15 dark:border-white/[0.1]"
      )}>
        {/* Gloss Top Border Reflection */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 dark:via-white/20 to-transparent pointer-events-none" />

        {/* AI Royal Ambient Aura */}
        {isAI && !shouldReduceMotion && (
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -right-8 -bottom-8 w-36 h-36 bg-fuchsia-500/30 rounded-full blur-2xl pointer-events-none"
          />
        )}

        {/* Floating App Illustration / Widget Layer */}
        <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-white/10 dark:bg-black/25 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
          {app.logo ? (
            <img src={app.logo} alt={app.label} className="w-full h-full object-cover rounded-[22px] pointer-events-none" />
          ) : (
            <motion.div
              animate={isSettings && !shouldReduceMotion ? { rotate: 0 } : {}}
              whileHover={isSettings && !shouldReduceMotion ? { rotate: 45 } : {}}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center justify-center w-full h-full"
            >
              <app.icon className="w-8 h-8 sm:w-9 sm:h-9 text-current drop-shadow-md" strokeWidth={1.5} />
            </motion.div>
          )}

          {/* AI Sparkle Overlay */}
          {isAI && !shouldReduceMotion && (
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.7, 1.25, 0.7] }}
              transition={{ repeat: Infinity, repeatDelay: 2.5, duration: 1.2, ease: "easeInOut" }}
              className="absolute top-1.5 right-1.5 pointer-events-none z-30"
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.9)]" />
            </motion.div>
          )}
        </div>

        {/* App Title & Subtitle */}
        <div className="flex flex-col min-w-0 flex-1 z-10">
          <span className="font-bold text-foreground tracking-tight text-base sm:text-lg truncate drop-shadow-sm font-sans">
            {app.label}
          </span>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground/80 truncate mt-0.5 group-hover:text-foreground/90 transition-colors">
            {app.desc}
          </span>
        </div>

        {/* Touch Ripple Highlight */}
        <div className="absolute inset-0 rounded-[28px] bg-white/0 group-active:bg-white/10 dark:group-active:bg-white/[0.08] transition-colors pointer-events-none" />
      </div>
    </motion.button>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  
  // Stable Synchronous Click Debounce & Navigation Lock
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

  // Weather Telemetry (Temp, Feels Like, Humidity, Sunset)
  const [weather, setWeather] = useState({ 
    temp: null, feelsLike: null, humidity: null, sunset: null, 
    desc: 'Loading satellite...', locationName: 'Locating...', loading: true 
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather({ temp: '--', desc: 'Radar unavailable', locationName: 'Location Denied', loading: false });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Fetch Weather with Luxury Telemetry
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&daily=sunrise,sunset&timezone=auto`);
          const data = await res.json();
          
          let locName = 'Live Location';
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.address) {
              locName = geoData.address.city || geoData.address.town || geoData.address.county || 'Live Location';
            }
          } catch (e) {
            console.error('Reverse geocoding failed', e);
          }

          if (data && data.current) {
            let sunsetStr = null;
            if (data.daily && data.daily.sunset && data.daily.sunset[0]) {
              try {
                sunsetStr = format(new Date(data.daily.sunset[0]), "h:mm a");
              } catch(err) {}
            }

            setWeather({
              temp: Math.round(data.current.temperature_2m),
              feelsLike: Math.round(data.current.apparent_temperature),
              humidity: data.current.relative_humidity_2m,
              sunset: sunsetStr,
              desc: getWeatherCodeLabel(data.current.weather_code),
              locationName: locName,
              loading: false
            });
          }
        } catch (e) {
          setWeather({ temp: '--', desc: 'Radar offline', locationName: 'Live Satellite', loading: false });
        }
      },
      () => {
        setWeather({ temp: '--', desc: 'Radar unavailable', locationName: 'Location Denied', loading: false });
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
    mouseX.set(x * 24);
    mouseY.set(y * 24);
  }, [shouldReduceMotion, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Stagger Animations for App Grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.035,
        delayChildren: shouldReduceMotion ? 0 : 0.12,
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/30 pt-10 pb-24">
      
      {/* ─── LUXURY ANIMATED AURORA BACKGROUND & PARTICLES ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12)_0%,_transparent_75%)]" />
        
        {!shouldReduceMotion && (
          <>
            <motion.div 
              animate={{ scale: [1, 1.25, 1], x: [0, 60, 0], y: [0, -40, 0] }}
              transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-600/15 dark:bg-purple-600/[0.09] rounded-full blur-[140px]"
            />
            <motion.div 
              animate={{ scale: [1, 1.3, 1], x: [0, -60, 0], y: [0, 60, 0] }}
              transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
              className="absolute top-40 -right-20 w-[500px] h-[500px] bg-indigo-600/15 dark:bg-blue-600/[0.09] rounded-full blur-[140px]"
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], x: [-40, 40, -40], y: [30, -30, 30] }}
              transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
              className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-pink-600/10 dark:bg-pink-600/[0.07] rounded-full blur-[120px]"
            />
          </>
        )}
      </div>

      <div className="relative z-10 px-4 sm:px-8 max-w-5xl mx-auto space-y-12">
        
        {/* ─── NEO-GLASS FLOATING CLOCK & TELEMETRY BANNER ─────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative mx-auto max-w-3xl group cursor-default select-none"
        >
          {/* Royal Ambient Outer Glow */}
          <div className="absolute -inset-2 rounded-[40px] bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-blue-500/20 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

          {/* Frosted Glass Flagship Card */}
          <motion.div 
            style={shouldReduceMotion ? {} : { x: parallaxX, y: parallaxY }}
            animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
            transition={{ y: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
            className="relative overflow-hidden rounded-[34px] p-8 sm:p-12 bg-gradient-to-b from-white/[0.18] dark:from-white/[0.09] via-white/[0.08] dark:via-white/[0.05] to-white/[0.03] dark:to-white/[0.02] backdrop-blur-[36px] border border-white/[0.25] dark:border-white/[0.12] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center text-center"
          >
            {/* Ambient Background Aura Inside Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.05] to-transparent pointer-events-none" />

            {/* Periodic Shimmer Light Sweep */}
            {!shouldReduceMotion && (
              <motion.div 
                animate={{ x: ['-100%', '280%'] }}
                transition={{ repeat: Infinity, repeatDelay: 12, duration: 3, ease: "easeInOut" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.12] dark:via-white/[0.18] to-transparent skew-x-12 pointer-events-none z-10"
              />
            )}

            {/* Crisp Inner Top Border Reflection */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 dark:via-white/30 to-transparent" />

            {/* Content Telemetry Layer */}
            <div className="relative z-20 space-y-6 w-full">
              
              {/* Live Location Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-foreground/90 shadow-sm">
                <Map className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>{weather.locationName}</span>
              </div>

              {/* Luxury Digital Clock Display */}
              <div>
                <div className="flex items-baseline justify-center gap-2.5">
                  <span className="text-[76px] sm:text-[92px] font-extrabold tracking-tighter text-foreground leading-none drop-shadow-md font-sans">
                    {format(time, "h:mm")}
                  </span>
                  <span className="text-2xl sm:text-4xl font-bold text-muted-foreground/80 tracking-normal">
                    {format(time, "a")}
                  </span>
                </div>
                <div className="text-base sm:text-xl font-medium text-muted-foreground/90 mt-2 tracking-wide">
                  {format(time, "EEEE, MMMM d")}
                </div>
              </div>
              
              {/* Meteorological Telemetry Bar */}
              <div className="flex flex-col items-center justify-center pt-2">
                {weather.loading ? (
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground/80 bg-background/30 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"/> Locating satellite telemetry...
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 bg-background/45 dark:bg-black/35 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/15 shadow-inner text-xs sm:text-sm font-medium text-foreground/90">
                    
                    {/* Temp & Condition */}
                    <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
                      <motion.div animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                        <CloudSun className="w-5 h-5 text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
                      </motion.div>
                      <span>{weather.temp !== null ? `${weather.temp}°C` : '--'}</span>
                      <span className="text-foreground/30 font-normal">|</span>
                      <span className="font-semibold">{weather.desc}</span>
                    </div>
                    
                    {/* Feels Like */}
                    {weather.feelsLike !== null && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>Feels like</span>
                        <span className="text-foreground font-semibold">{weather.feelsLike}°C</span>
                      </div>
                    )}

                    {/* Humidity */}
                    {weather.humidity !== null && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-foreground font-semibold">{weather.humidity}%</span>
                      </div>
                    )}

                    {/* Sunset */}
                    {weather.sunset && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Sunset className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-foreground font-semibold">{weather.sunset}</span>
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </motion.div>

        {/* ─── 3-COLUMN LUXURY MINI-WIDGET APP GRID ──────────────────────────── */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full pt-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 place-items-stretch w-full">
            {APPS.map(app => (
              <AppCard 
                key={app.id} 
                app={app} 
                onNavigate={handleNavigate}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}