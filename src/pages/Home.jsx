import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion 
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  StickyNote, CheckSquare, Calendar, Wallet, Target, FolderOpen, 
  Lock, CloudSun, Map, FileText, ScanLine, Globe, Settings, 
  Music, Image as ImageIcon, Languages, Compass, Key, Calculator, Clock, PartyPopper, Sparkles, Search, X, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationCenter from '@/components/shared/NotificationCenter';

const APPS = [
  { id: 'notes', label: 'Notes', desc: 'Write ideas quickly', path: '/notes', icon: StickyNote, gradient: 'from-amber-500/25 via-orange-500/10 to-transparent border-amber-500/35 text-amber-400', glow: 'rgba(245, 158, 11, 0.28)' },
  { id: 'tasks', label: 'Tasks', desc: 'Manage daily goals', path: '/tasks', icon: CheckSquare, gradient: 'from-blue-500/25 via-indigo-500/10 to-transparent border-blue-500/35 text-blue-400', glow: 'rgba(59, 130, 246, 0.28)' },
  { id: 'calendar', label: 'Calendar', desc: 'Plan your schedule', path: '/calendar', icon: Calendar, gradient: 'from-green-500/25 via-emerald-500/10 to-transparent border-green-500/35 text-green-400', glow: 'rgba(34, 197, 94, 0.28)' },
  { id: 'scanner', label: 'Scanner', desc: 'Scan docs instantly', path: '/scanner', icon: ScanLine, gradient: 'from-purple-500/25 via-violet-500/10 to-transparent border-purple-500/35 text-purple-400', glow: 'rgba(168, 85, 247, 0.28)' },
  { id: 'finance', label: 'Finance', desc: 'Track expenses', path: '/finance', icon: Wallet, gradient: 'from-emerald-500/25 via-teal-500/10 to-transparent border-emerald-500/35 text-emerald-400', glow: 'rgba(16, 185, 129, 0.28)' },
  { id: 'files', label: 'Files', desc: 'Organize documents', path: '/files', icon: FolderOpen, gradient: 'from-cyan-500/25 via-sky-500/10 to-transparent border-cyan-500/35 text-cyan-400', glow: 'rgba(6, 182, 212, 0.28)' },
  { id: 'vault', label: 'Vault', desc: 'Secure passwords', path: '/vault', icon: Lock, gradient: 'from-slate-500/30 via-zinc-500/15 to-transparent border-slate-500/35 text-slate-300', glow: 'rgba(148, 163, 184, 0.28)' },
  { id: 'oradocs', label: 'Documents', desc: 'Edit rich text', path: '/oradocs', icon: FileText, gradient: 'from-orange-500/25 via-amber-500/10 to-transparent border-orange-500/35 text-orange-400', glow: 'rgba(249, 115, 22, 0.28)' },
  { id: 'news', label: 'News', desc: 'Live global updates', path: '/news', icon: Globe, gradient: 'from-red-500/25 via-rose-500/10 to-transparent border-red-500/35 text-red-400', glow: 'rgba(239, 68, 68, 0.28)' },
  { id: 'climora', label: 'Weather', desc: 'Live atmospheric radar', path: '/climora', icon: CloudSun, gradient: 'from-sky-500/25 via-blue-500/10 to-transparent border-sky-500/35 text-sky-400', glow: 'rgba(14, 165, 233, 0.28)' },
  { id: 'assistant', label: 'AI', desc: 'Ask ORA AI', path: '/assistant', icon: Sparkles, gradient: 'from-violet-500/35 via-fuchsia-500/20 to-transparent border-violet-500/45 text-violet-300', glow: 'rgba(139, 92, 246, 0.42)' },
  { id: 'browser', label: 'Browser', desc: 'Fast & Secure', path: '/browser', icon: Compass, gradient: 'from-indigo-500/25 via-purple-500/10 to-transparent border-indigo-400/35 text-indigo-300', glow: 'rgba(99, 102, 241, 0.28)' },
  { id: 'routo', label: 'Maps', desc: 'Explore routes', path: '/routo', icon: Map, gradient: 'from-teal-500/25 via-emerald-500/10 to-transparent border-teal-500/35 text-teal-400', glow: 'rgba(20, 184, 166, 0.28)' },
  { id: 'festo', label: 'FESTO', desc: 'Celebrate moments', path: '/festo', icon: PartyPopper, gradient: 'from-orange-500/25 via-yellow-500/10 to-transparent border-orange-500/35 text-orange-400', glow: 'rgba(249, 115, 22, 0.28)' },
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

// ─── THEME MODE DETECTOR HOOK ────────────────────────────────────────────────
const useThemeMode = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

// ─── NORMALIZED CENTERPIECE FLOOR-STANDING CHARACTER ENGINE (Dynamic Resolution) ──
import { resolveBannerAsset, getCharacterPositionClass } from '@/lib/bannerResolver';

const CharacterImage = React.memo(({ appId, label, shouldReduceMotion }) => {
  const assetConfig = useMemo(() => resolveBannerAsset(appId || label), [appId, label]);
  const [src, setSrc] = useState(assetConfig.char);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSrc(assetConfig.char);
    setFailed(false);
    setLoaded(false);
  }, [assetConfig]);

  if (failed) return null;

  return (
    <>
      {!loaded && (
        <div className="absolute bottom-2 right-4 w-24 h-32 rounded-lg bg-white/5 animate-pulse pointer-events-none z-0" />
      )}
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: loaded ? 1 : 0, 
          y: shouldReduceMotion || !loaded ? 0 : [0, -1.2, 0] 
        }}
        transition={{ 
          opacity: { duration: 0.5 },
          y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }}
        src={src}
        alt={`${label} Character`}
        width="300"
        height="300"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (src === assetConfig.char && assetConfig.banner) {
            setSrc(assetConfig.banner);
          } else if (src !== './Banner/Calendo.png') {
            setSrc('./Banner/Calendo.png');
          } else {
            setFailed(true);
          }
        }}
        className={cn(
          "absolute bottom-0 z-0 h-[82%] sm:h-[90%] xl:h-[95%] w-auto object-contain pointer-events-none select-none drop-shadow-[0_12px_22px_rgba(0,0,0,0.55)] group-hover:scale-[1.03] transition-transform duration-300 transform-gpu will-change-transform",
          getCharacterPositionClass(assetConfig.orientation),
          assetConfig.scale
        )}
      />
    </>
  );
});

// ─── MEMOIZED WIDGET CARD (aspect-[4/3] + CENTERPIECE CHARACTERS ONLY) ───────
const AppCard = React.memo(({ app, onNavigate, shouldReduceMotion }) => {
  const isAI = app.id === 'assistant';
  const isSettings = app.id === 'settings';

  return (
    <motion.button
      layoutId={`module-card-${app.id}`}
      style={{ viewTransitionName: `module-card-${app.id}` }}
      whileHover={shouldReduceMotion ? {} : { y: -5, scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      onClick={() => onNavigate(app.path)}
      className="group relative w-full aspect-[4/3] text-left focus:outline-none select-none gpu-accelerated flex"
    >
      {!shouldReduceMotion && (
        <div 
          className="absolute -inset-1 rounded-[30px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
          style={{ backgroundColor: app.glow }}
        />
      )}

      <div className={cn(
        "relative overflow-hidden rounded-[26px] p-4 sm:p-4.5 bg-gradient-to-br backdrop-blur-2xl border flex flex-col justify-between transition-all duration-300 w-full h-full shadow-[0_8px_24px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] group-hover:shadow-[0_16px_38px_rgba(0,0,0,0.6)]",
        app.gradient,
        "border-white/20 dark:border-white/[0.12]"
      )}>
        {/* Crisp Inner Top Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/25 to-transparent pointer-events-none" />

        {isAI && !shouldReduceMotion && (
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.65, 0.25] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -right-8 -top-8 w-32 h-32 bg-fuchsia-500/30 rounded-full blur-2xl pointer-events-none z-0"
          />
        )}

        {/* ─── RIGHT-SIDE CENTERPIECE FLOOR-STANDING CHARACTER (z-0) ──────── */}
        <CharacterImage 
          appId={app.id} 
          label={app.label} 
          shouldReduceMotion={shouldReduceMotion} 
        />

        {/* ─── LEFT-SIDE PROTECTED TEXT & ICON HIERARCHY (z-10) ───────────── */}
        <div className="relative z-10 max-w-[56%] sm:max-w-[60%] flex flex-col justify-between h-full pointer-events-none">
          
          {/* Top: Small Lucide Vector App Icon Only */}
          <div className="flex items-start justify-between w-full">
            <div className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-[18px] bg-white/15 dark:bg-black/35 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <motion.div
                animate={isSettings && !shouldReduceMotion ? { rotate: 0 } : {}}
                whileHover={isSettings && !shouldReduceMotion ? { rotate: 45 } : {}}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center justify-center w-full h-full"
              >
                <app.icon className="w-6 h-6 sm:w-7 sm:h-7 text-current drop-shadow-md" strokeWidth={1.5} />
              </motion.div>
            </div>
          </div>

          {/* Bottom: App Name & Subtitle */}
          <div className="flex flex-col min-w-0 pt-2">
            <span className="font-bold text-foreground tracking-tight text-sm sm:text-base truncate drop-shadow-sm font-sans">
              {app.label}
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground/90 truncate mt-0.5 group-hover:text-foreground transition-colors">
              {app.desc}
            </span>
          </div>

        </div>

        {/* Active Ripple Overlay */}
        <div className="absolute inset-0 rounded-[26px] bg-white/0 group-active:bg-white/10 dark:group-active:bg-white/[0.08] transition-colors pointer-events-none z-20" />
      </div>
    </motion.button>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const isDark = useThemeMode();
  const [searchQ, setSearchQ] = useState('');
  const [videoFailed, setVideoFailed] = useState(false);
  
  // Notification modal state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(3);

  // Stable Navigation Lock
  const handleNavigate = useCallback((path) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(path));
    } else {
      navigate(path);
    }
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

  // Weather Telemetry
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
    mouseX.set(x * 12);
    mouseY.set(y * 12);
  }, [shouldReduceMotion, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Real-time local search filtering
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
        staggerChildren: shouldReduceMotion ? 0 : 0.025,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      }
    }
  };

  // Verified 200-OK Pixabay Direct MP4 Download CDNs
  const darkVideoUrl = "https://pixabay.com/videos/download/video-169951_medium.mp4";
  const lightVideoUrl = "https://pixabay.com/videos/download/video-212102_medium.mp4";
  const currentVid = isDark ? darkVideoUrl : lightVideoUrl;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden w-full max-w-[100vw] font-sans selection:bg-primary/30 pt-4 sm:pt-6 pb-24">
      
      <div className="relative z-10 px-4 sm:px-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 w-full">
        
        {/* ─── LOOPING VIDEO HERO BANNER WITH 14px FROSTED BLUR & OVERLAYS ── */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative mx-auto max-w-2xl select-none w-full"
        >
          <motion.div 
            style={shouldReduceMotion ? {} : { x: parallaxX, y: parallaxY }}
            className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] p-8 sm:p-10 bg-indigo-950/80 dark:bg-black/60 backdrop-blur-[24px] border border-white/15 dark:border-white/[0.12] shadow-[0_15px_45px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-center min-h-[220px]"
          >
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-30">
              <motion.button
                onClick={() => setNotifOpen(!notifOpen)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                title="Notifications"
                className="w-10 h-10 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/25 transition-all flex items-center justify-center text-white shadow-sm relative cursor-pointer"
              >
                <Bell className="w-5 h-5 text-white drop-shadow-sm" />
                <AnimatePresence>
                  {notifCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-md border border-white/30"
                    >
                      {notifCount > 8 ? '8+' : notifCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} onCountChange={setNotifCount} />
            </div>

            {/* Hardware-Accelerated Video Engine (Direct src attribute mounting) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
              {!videoFailed && (
                <video 
                  key={currentVid}
                  src={currentVid}
                  autoPlay loop muted playsInline 
                  onError={() => setVideoFailed(true)}
                  className="w-full h-full object-cover scale-105 filter blur-[14px] brightness-80 opacity-95 transition-opacity duration-1000 pointer-events-none transform-gpu"
                />
              )}
              {/* Premium Theme Overlays */}
              <div className={cn(
                "absolute inset-0 transition-colors duration-700 pointer-events-none",
                isDark ? "bg-black/55" : "bg-indigo-950/25"
              )} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45 pointer-events-none" />
            </div>

            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/25 to-transparent" />

            <div className="relative z-20 space-y-4 sm:space-y-5 w-full text-white pt-1">
              
              <div className="inline-flex items-center justify-center gap-2 px-4.5 py-1.5 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-md border border-white/20 text-sm sm:text-base font-semibold tracking-wide shadow-sm max-w-[75%] sm:max-w-[80%] mx-auto">
                <Map className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="truncate">{weather.shortCity}</span>
              </div>

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

        {/* ─── SEARCH BAR + 52-54px AI FAB ────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative max-w-2xl mx-auto flex items-center gap-3 sm:gap-3.5 w-full"
        >
          <div className="relative flex-1 group">
            <div className="relative flex items-center justify-between w-full h-[52px] sm:h-[54px] rounded-full px-6 backdrop-blur-2xl bg-white/25 dark:bg-white/[0.07] border border-white/30 dark:border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all duration-300 group-focus-within:border-primary/60 group-focus-within:shadow-[0_0_25px_rgba(139,92,246,0.35)]">
              <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-muted-foreground mr-3 shrink-0 group-focus-within:text-primary transition-colors" />
              <input 
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search apps, tools, settings..." 
                className="w-full h-full bg-transparent border-none outline-none text-foreground font-medium text-sm sm:text-base placeholder:text-muted-foreground/75 select-text" 
              />
              {searchQ && (
                <button type="button" onClick={() => setSearchQ('')} title="Clear" className="p-1 hover:text-foreground active:scale-95 transition-all shrink-0 ml-2"><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigate('/assistant')}
            title="Ask ORA AI Assistant"
            className="relative shrink-0 w-[52px] h-[52px] sm:w-[54px] sm:h-[54px] rounded-full p-[1.5px] bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 shadow-md group cursor-pointer flex items-center justify-center focus:outline-none"
          >
            {!shouldReduceMotion && (
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.65, 0.3] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 blur-sm pointer-events-none -z-10"
              />
            )}
            
            <div className="w-full h-full rounded-full bg-black/65 dark:bg-black/75 backdrop-blur-2xl flex items-center justify-center border border-white/20 group-hover:bg-black/45 transition-colors overflow-hidden">
              <Sparkles className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-fuchsia-300 drop-shadow group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </motion.button>
        </motion.div>

        {/* ─── RESPONSIVE APP GRID WITH MASSIVE CENTERPIECE CHARACTERS ────── */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full pt-1"
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