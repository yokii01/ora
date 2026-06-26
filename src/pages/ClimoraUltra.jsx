import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, 
  Thermometer, Search, MapPin, Calendar, BarChart3, Layers, ArrowLeft, Loader2, 
  Gauge, CloudFog, Music, VolumeX, Globe, Maximize2, Minimize2, Sunrise, Sunset, Zap, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * ==========================================================================================
 * CLIMORA ULTRA - CONFIGURATION & CONSTANTS
 * ==========================================================================================
 * Version: 26.6.0-Stable
 */
const APP_CONFIG = {
  name: "Climora Ultra",
  version: "26.6.0-Stable",
  musicApiBase: "https://musicapi.x007.workers.dev"
};

// --- 1. MEDIA ASSETS REPOSITORY (Verified Sharp Pixabay MP4s) ---
const BACKGROUND_IMAGES = {
  sunny: "https://cdn.pixabay.com/photo/2018/08/06/22/55/sun-3588618_1280.jpg",
  cloudy: "https://cdn.pixabay.com/photo/2016/11/22/19/25/clouds-1850093_1280.jpg",
  night: "https://cdn.pixabay.com/photo/2016/11/25/23/15/moon-1859616_1280.jpg",
  rain: "https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072821_1280.jpg",
  snow: "https://cdn.pixabay.com/photo/2019/12/30/20/34/road-4730553_1280.jpg",
  fog: "https://cdn.pixabay.com/photo/2016/11/14/04/14/mist-1822560_1280.jpg",
  storm: "https://cdn.pixabay.com/photo/2016/11/29/05/55/adult-1867665_1280.jpg"
};

const VIDEO_ASSETS = {
  sunny: "https://cdn.pixabay.com/video/2025/10/12/309500_tiny.mp4",
  cloudy: "https://cdn.pixabay.com/video/2023/04/11/158384-816637349_tiny.mp4",
  night: "https://cdn.pixabay.com/video/2024/07/07/219912_large.mp4",
  rain: "https://cdn.pixabay.com/video/2025/04/09/270983_tiny.mp4",
  snow: "https://cdn.pixabay.com/video/2024/12/17/247183_tiny.mp4",
  fog: "https://cdn.pixabay.com/video/2023/04/11/158384-816637349_tiny.mp4",
  storm: "https://cdn.pixabay.com/video/2024/02/12/200245-912370050_tiny.mp4"
};

const MUSIC_QUERIES = {
  sunny: "Soft Piano",
  cloudy: "Ambient Piano",
  rain: "Rain Piano",
  storm: "Dark Ambient",
  snow: "Winter Piano",
  fog: "Atmospheric Ambient",
  night: "Night Piano"
};

const FALLBACK_AUDIO = {
  sunny: "https://cdn.pixabay.com/audio/2022/03/10/audio_cff0007298.mp3",
  cloudy: "https://cdn.pixabay.com/audio/2021/11/24/audio_825f0cb307.mp3",
  night: "https://cdn.pixabay.com/audio/2022/03/09/audio_6e1e3b8a10.mp3",
  rain: "https://cdn.pixabay.com/audio/2022/07/04/audio_3497d5b886.mp3",
  storm: "https://cdn.pixabay.com/audio/2022/03/24/audio_035a397775.mp3",
  snow: "https://cdn.pixabay.com/audio/2021/08/09/audio_a46b4e548f.mp3",
  fog: "https://cdn.pixabay.com/audio/2022/10/21/audio_310863b782.mp3"
};

const POPULAR_LOCATIONS = [
  { name: "Tokyo", country: "Japan", lat: 35.6895, lon: 139.6917 },
  { name: "London", country: "UK", lat: 51.5085, lon: -0.1257 },
  { name: "New York", country: "USA", lat: 40.7128, lon: -74.0060 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 }
];

const NAVIGATION_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'radar', label: 'Satellite Radar', icon: Layers },
  { id: 'forecast', label: '7-Day Outlook', icon: Calendar }
];

const WEATHER_MAPPING = {
  0: { label: 'Sunny', type: 'sunny', videoKey: 'sunny', icon: Sun },
  1: { label: 'Sunny', type: 'sunny', videoKey: 'sunny', icon: Sun },
  2: { label: 'Partly Cloudy', type: 'cloudy', videoKey: 'cloudy', icon: Cloud },
  3: { label: 'Cloudy', type: 'cloudy', videoKey: 'cloudy', icon: Cloud },
  45: { label: 'Fog', type: 'fog', videoKey: 'fog', icon: CloudFog },
  48: { label: 'Fog', type: 'fog', videoKey: 'fog', icon: CloudFog },
  51: { label: 'Light Drizzle', type: 'rain', videoKey: 'rain', icon: CloudRain },
  61: { label: 'Light Rain', type: 'rain', videoKey: 'rain', icon: CloudRain },
  63: { label: 'Moderate Rain', type: 'rain', videoKey: 'rain', icon: CloudRain },
  65: { label: 'Heavy Rain', type: 'rain', videoKey: 'rain', icon: CloudLightning },
  71: { label: 'Snow', type: 'snow', videoKey: 'snow', icon: CloudSnow },
  80: { label: 'Showers', type: 'rain', videoKey: 'rain', icon: CloudRain },
  95: { label: 'Thunderstorm', type: 'storm', videoKey: 'storm', icon: CloudLightning }
};

function getWeatherConfig(code) { return WEATHER_MAPPING[code] || WEATHER_MAPPING[0]; }
function getDetailedClimateLabel(code, isDay) {
  const config = WEATHER_MAPPING[code] || WEATHER_MAPPING[0];
  if (!isDay && config.type === 'sunny') return 'Clear Night';
  return config.label;
}

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDayName = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString([], { weekday: 'short' });
};

const getAqiCategory = (val) => {
  if (val == null) return { label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
  if (val <= 50) return { label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
  if (val <= 100) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
  return { label: 'Poor', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
};

const getUvCategory = (val) => {
  if (val == null) return { label: 'Low', color: 'text-sky-300' };
  if (val <= 2) return { label: 'Low', color: 'text-emerald-400' };
  if (val <= 5) return { label: 'Moderate', color: 'text-amber-400' };
  if (val <= 7) return { label: 'High', color: 'text-orange-400' };
  return { label: 'Very High', color: 'text-rose-400' };
};

// --- CSS STYLES ---
const GlobalStyles = () => (
  <style>{`
    .gpu-accel { transform: translate3d(0, 0, 0); will-change: transform, opacity; }
    .glass-panel { background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(28px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45); }
    .dropdown-glass { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(32px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 25px 60px rgba(0,0,0,0.85); border-radius: 1.75rem; }
    .hero-video-full { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .music-wave-bar { width: 2.5px; background: rgba(56, 189, 248, 0.9); border-radius: 99px; animation: wave-visual 1s ease-in-out infinite; }
    @keyframes wave-visual { 0%, 100% { height: 4px; } 50% { height: 16px; } }
    .music-wave-bar:nth-child(1) { animation-delay: 0s; }
    .music-wave-bar:nth-child(2) { animation-delay: 0.15s; }
    .music-wave-bar:nth-child(3) { animation-delay: 0.3s; }
    @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .animate-float { animation: float-slow 4s ease-in-out infinite; }
  `}</style>
);

// --- 8. ADAPTIVE AUDIO ENGINE ---
const AudioController = ({ weatherCode, isDay, isMuted }) => {
  const audioRef = useRef(new Audio());
  const [trackUrl, setTrackUrl] = useState(null);

  useEffect(() => {
    let active = true;
    const config = getWeatherConfig(weatherCode);
    const typeKey = !isDay ? 'night' : config.type;
    const queryTerm = MUSIC_QUERIES[typeKey] || "Soft Piano";
    const fallback = FALLBACK_AUDIO[typeKey] || FALLBACK_AUDIO.sunny;

    fetch(`${APP_CONFIG.musicApiBase}/search?q=${encodeURIComponent(queryTerm)}`)
      .then(r => r.json())
      .then(d => {
        if (!active) return;
        if (d && d.results && d.results[0]?.id) {
          setTrackUrl(`${APP_CONFIG.musicApiBase}/fetch?id=${d.results[0].id}`);
        } else {
          setTrackUrl(fallback);
        }
      })
      .catch(() => {
        if (active) setTrackUrl(fallback);
      });

    return () => { active = false; };
  }, [weatherCode, isDay]);

  useEffect(() => {
    if (!trackUrl || !audioRef.current) return;
    if (audioRef.current.src !== trackUrl) {
      audioRef.current.src = trackUrl;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
      audioRef.current.crossOrigin = "anonymous";
    }
    if (!isMuted) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [trackUrl, isMuted]);

  return null;
};

// --- 5. SINGLE VIDEO BANNER BACKGROUND (STRICT SINGLETON ENGINE) ---
const HeroVideoBackground = ({ weatherCode, isDay }) => {
  const config = getWeatherConfig(weatherCode);
  const videoKey = !isDay ? 'night' : config.videoKey;
  const activeUrl = VIDEO_ASSETS[videoKey] || VIDEO_ASSETS.sunny;
  const bgImg = BACKGROUND_IMAGES[!isDay ? 'night' : config.type] || BACKGROUND_IMAGES.sunny;

  const videoRef = useRef(null);
  const [opacity, setOpacity] = useState(0.9);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;

    // 1. Pause current video
    video.pause();
    // Hide old video completely before switching
    setOpacity(0);

    const timer = setTimeout(() => {
      if (!isMounted || !video) return;
      // 2. Remove current source & 3. Dispose instance
      video.removeAttribute('src');
      video.load(); // 4. Wait for cleanup

      // 5. Load new source
      video.src = activeUrl;
      video.load();

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (isMounted) setOpacity(0.9); // 6. Fade transition & 7. Playback
          })
          .catch(() => {
            if (isMounted) setOpacity(0.9);
          });
      }
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeUrl]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-[3rem]">
      <video 
        ref={videoRef} 
        autoPlay 
        loop 
        muted 
        playsInline 
        preload="auto" 
        style={{ opacity }}
        className="hero-video-full filter blur-[2px] scale-102 transform-gpu transition-opacity duration-500" 
      />
      <img src={bgImg} className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay" alt="fallback" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />
    </div>
  );
};

// --- TOP BAR AUTOCOMPLETE SEARCH ---
const AutocompleteSearch = ({ onSelectCity, currentCityName, isMuted, onToggleMute, onBack, lastUpdated }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('climora_recent_searches') || '[]'); } catch { return []; }
  });

  const highlightMatch = (text, q) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return parts.map((p, i) => p.toLowerCase() === q.toLowerCase() ? <span key={i} className="text-sky-400 font-extrabold">{p}</span> : p);
  };

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const handler = setTimeout(() => {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`)
        .then(r => r.json())
        .then(data => {
          setSuggestions(data.results || []);
          setLoading(false);
          setIsOpen(true);
          setSelectedIndex(-1);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (loc) => {
    const nextRecents = [loc, ...recents.filter(r => r.name !== loc.name)].slice(0, 4);
    setRecents(nextRecents);
    localStorage.setItem('climora_recent_searches', JSON.stringify(nextRecents));
    onSelectCity(loc);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    const total = suggestions.length > 0 ? suggestions : (query ? [] : (recents.length > 0 ? recents : POPULAR_LOCATIONS));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(p => (p + 1) % total.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(p => (p - 1 + total.length) % total.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && total[selectedIndex]) {
      e.preventDefault();
      handleSelect(total[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const displayList = suggestions.length > 0 ? suggestions : (query ? [] : (recents.length > 0 ? recents : POPULAR_LOCATIONS));
  const listTitle = suggestions.length > 0 ? "Suggestions" : (recents.length > 0 ? "Recent Searches" : "Popular Nearby");

  return (
    <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-2 relative z-50">
      <div className="flex items-center gap-3 flex-1 max-w-4xl">
        {/* 7. SINGLE BACK BUTTON ONLY */}
        <button onClick={onBack} title="Back to OS Dashboard" className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all shrink-0">
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={currentCityName || "Search city, state, country..."}
              className="w-full h-[52px] bg-black/45 backdrop-blur-3xl border border-white/20 rounded-full px-6 pl-13 text-[15px] font-medium tracking-wide text-white placeholder:text-white/65 placeholder:font-normal outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/25 focus:bg-black/60 transition-all duration-300 shadow-2xl"
            />
            <Search size={20} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-cyan-300/80 transition-transform duration-300 group-focus-within:scale-110" />
            {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 animate-spin" />}
          </div>

          {isOpen && (
            <div className="absolute top-full mt-2 inset-x-0 dropdown-glass overflow-hidden shadow-2xl animate-[fade-in-up_0.2s]">
              <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                {listTitle}
              </div>
              {displayList.length === 0 ? (
                <div className="px-5 py-4 text-xs text-white/50 text-center">No matching locations found</div>
              ) : (
                displayList.map((loc, idx) => (
                  <button
                    key={loc.id || idx}
                    onClick={() => handleSelect(loc)}
                    className={cn("w-full text-left px-5 py-3 hover:bg-white/10 flex items-center justify-between border-b border-white/5 last:border-none transition-colors", selectedIndex === idx && "bg-white/15")}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{highlightMatch(loc.name, query)}</div>
                      <div className="text-xs text-white/55 font-medium">{loc.admin1 || loc.state}{loc.country ? `, ${loc.country}` : ''}</div>
                    </div>
                    <MapPin size={14} className="text-sky-400 opacity-70" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel bg-emerald-950/40 border-emerald-500/30 text-[11px] font-mono text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"/>
          <span>LIVE • {lastUpdated}</span>
        </div>

        <button onClick={onToggleMute} title={isMuted ? "Unmute Audio" : "Mute Audio"} className={cn("w-11 h-11 rounded-full glass-panel flex items-center justify-center transition-all shrink-0", !isMuted ? "text-sky-300 ring-2 ring-sky-400/60 bg-sky-500/10" : "text-white/40")}>
          {!isMuted ? (
            <div className="flex items-center gap-1.5">
              <Music size={16} className="animate-pulse text-sky-400" />
              <div className="flex items-center gap-0.5 h-3"><div className="music-wave-bar"/><div className="music-wave-bar"/><div className="music-wave-bar"/></div>
            </div>
          ) : (
            <VolumeX size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

// --- TAB 2: UNBLOCKED SATELLITE RADAR PAGE (NO OVERLAY, NO TOP SUMMARY) ---
const SatelliteRadarTab = ({ coords }) => {
  const [activeLayer, setActiveLayer] = useState('radar');
  const [zoom, setZoom] = useState(6);
  const radarContainerRef = useRef(null);

  const layers = [
    { id: 'radar', label: 'Rain Radar' },
    { id: 'clouds', label: 'Cloud Tile' },
    { id: 'wind', label: 'Wind Layer' },
    { id: 'temp', label: 'Thermal Feed' },
    { id: 'pressure', label: 'Barometric' }
  ];

  const toggleFullscreen = () => {
    if (!radarContainerRef.current) return;
    if (!document.fullscreenElement) {
      radarContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="space-y-5 animate-[fade-in-up_0.4s]" ref={radarContainerRef}>
      {/* Radar Map Container (Reduced Height 15-20%, rounded-[32px]) */}
      <div className="glass-panel rounded-[32px] overflow-hidden relative h-[480px] sm:h-[540px] bg-[#070b19] border border-white/15 shadow-2xl">
        {/* Zoom & Fullscreen Controls Bar (Top Right) */}
        <div className="absolute top-4 right-4 z-20 flex gap-2 pointer-events-auto">
          <button onClick={() => setZoom(p => Math.min(p + 1, 12))} className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold text-lg transition-all">+</button>
          <button onClick={() => setZoom(p => Math.max(p - 1, 2))} className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold text-lg transition-all">-</button>
          <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all">
            {!document.fullscreenElement ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
          </button>
        </div>

        {/* Fullscreen Radar Feed with Dark Tile Filtering */}
        <div className="absolute inset-0 z-0 transition-all duration-500">
          <iframe
            title="Live Radar Feed"
            src={`https://www.rainviewer.com/map.html?loc=${coords.lat},${coords.lon},${zoom}&oFa=1&oS=1&c=3&o=83&lm=1&layer=${activeLayer === 'radar' ? 'radar' : 'satellite'}&sm=1&sn=1`}
            className="w-full h-full border-none filter contrast-125 saturate-110 brightness-95 transition-all duration-500"
            allowFullScreen
          />
        </div>
      </div>

      {/* Weather Layer Selector Directly BELOW Map */}
      <div className="flex justify-center px-2">
        <div className="flex flex-wrap justify-center gap-1.5 bg-slate-900/90 backdrop-blur-2xl p-2 rounded-full border border-white/15 shadow-2xl max-w-2xl w-full">
          {layers.map(l => (
            <button
              key={l.id}
              onClick={() => setActiveLayer(l.id)}
              className={cn(
                "flex-1 min-w-[100px] px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 select-none",
                activeLayer === l.id 
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.45)] scale-102" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- TAB 3: RESTORED 7-DAY OUTLOOK (SLEEK HORIZONTAL OVAL GLASS CARDS) ---
const DailyForecastCard = ({ t, idx, weather }) => {
  const [expanded, setExpanded] = useState(false);
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer(true);
      setTimeout(() => setShimmer(false), 1500);
    }, 15000 + idx * 300);
    return () => clearInterval(interval);
  }, [idx]);

  const dCode = weather?.daily?.weather_code?.[idx] || 0;
  const dMin = weather?.daily?.temperature_2m_min?.[idx];
  const dMax = weather?.daily?.temperature_2m_max?.[idx];
  const dPrecip = weather?.daily?.precipitation_probability_max?.[idx] ?? Math.min(85, idx * 14 + 10);
  const dSunrise = weather?.daily?.sunrise?.[idx];
  const dSunset = weather?.daily?.sunset?.[idx];
  const dWind = weather?.daily?.wind_speed_10m_max?.[idx] ?? 14;
  const dUv = weather?.daily?.uv_index_max?.[idx] ?? 6;
  const DIcon = getWeatherConfig(dCode).icon;
  const aqiObj = getAqiCategory(38 + idx * 5);

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }} 
      transition={{ duration: 0.2 }}
      className={cn(
        "relative glass-panel bg-gradient-to-r from-blue-950/45 via-sky-900/20 to-slate-900/50 backdrop-blur-2xl border border-sky-400/20 p-5 sm:px-8 sm:py-6 overflow-hidden shadow-2xl group transition-all duration-500",
        !expanded ? "rounded-[9999px]" : "rounded-[3rem]"
      )}
    >
      {/* Periodic 15-second Shimmer Micro-Animation Overlay */}
      <AnimatePresence>
        {shimmer && (
          <motion.div 
            initial={{ x: '-100%' }} 
            animate={{ x: '200%' }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent pointer-events-none -skew-x-12 z-0"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-5 min-w-[170px]">
          <DIcon size={36} className="text-amber-300 shrink-0 group-hover:scale-110 transition-transform animate-float drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)]" />
          <div>
            <div className="font-black tracking-tight text-white text-lg sm:text-xl">{idx === 0 ? 'Today' : getDayName(t)}</div>
            <div className="text-xs text-cyan-300/80 font-mono font-medium tracking-wider uppercase">{t}</div>
          </div>
        </div>

        <div className="flex-1 px-2">
          <div className="font-extrabold tracking-wide text-white/95 text-base sm:text-lg">{getWeatherConfig(dCode).label}</div>
          <div className="flex items-center gap-4 text-xs text-cyan-300 font-mono font-bold mt-1">
            <span className="bg-cyan-500/15 border border-cyan-400/30 px-3 py-0.5 rounded-full">💧 {dPrecip}% Rain</span>
            <span className="text-white/60">🌬 {Math.round(dWind)} km/h</span>
          </div>
        </div>

        <div className="flex items-center gap-6 self-end sm:self-center">
          <div className="flex items-center gap-4 font-mono text-lg sm:text-xl">
            <span className="text-white/55 font-semibold">{dMin != null ? `${Math.round(dMin)}°` : '--'}</span>
            <div className="w-20 h-2.5 bg-black/40 border border-white/10 rounded-full overflow-hidden hidden md:block p-0.5">
              <div className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 rounded-full w-4/5 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
            </div>
            <span className="font-black text-white">{dMax != null ? `${Math.round(dMax)}°` : '--'}</span>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-cyan-300 group-hover:text-white group-hover:bg-cyan-500/30 group-hover:border-cyan-400 transition-all shadow-lg">
            {!expanded ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="relative z-10 mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-[fade-in-up_0.3s] font-mono text-xs">
          <div className="bg-black/45 p-4 rounded-2xl border border-white/10 shadow-inner"><span className="text-white/45 block text-[10px] tracking-widest uppercase font-bold mb-1">UV Index</span><span className="text-amber-300 font-black text-sm">{Math.round(dUv)} ({getUvCategory(dUv).label})</span></div>
          <div className="bg-black/45 p-4 rounded-2xl border border-white/10 shadow-inner"><span className="text-white/45 block text-[10px] tracking-widest uppercase font-bold mb-1">Air Quality</span><span className={cn("font-black text-sm", aqiObj.color)}>{aqiObj.label}</span></div>
          <div className="bg-black/45 p-4 rounded-2xl border border-white/10 shadow-inner"><span className="text-white/45 block text-[10px] tracking-widest uppercase font-bold mb-1">Sunrise</span><span className="text-white font-black text-sm">{dSunrise ? formatTime(dSunrise) : '05:48 AM'}</span></div>
          <div className="bg-black/45 p-4 rounded-2xl border border-white/10 shadow-inner"><span className="text-white/45 block text-[10px] tracking-widest uppercase font-bold mb-1">Sunset</span><span className="text-white font-black text-sm">{dSunset ? formatTime(dSunset) : '06:42 PM'}</span></div>
        </div>
      )}
    </motion.div>
  );
};

const ExtendedOutlookTab = ({ weather }) => (
  <div className="space-y-4 animate-[fade-in-up_0.4s]">
    <div className="space-y-3.5">
      {(weather?.daily?.time || []).map((t, idx) => (
        <DailyForecastCard key={t} t={t} idx={idx} weather={weather} />
      ))}
    </div>
  </div>
);

// --- 5. MAIN ARCHITECTURE ---
export default function ClimoraUltra() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState({ lat: 51.5085, lon: -0.1257, name: "London", country: "UK" });
  const [weather, setWeather] = useState(null);
  const [aqiVal, setAqiVal] = useState(44);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdatedTime, setLastUpdatedTime] = useState("Just Now");
  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('climora_audio_muted') !== 'false'; } catch { return true; }
  });

  const toggleMute = () => {
    setIsMuted(p => {
      const next = !p;
      localStorage.setItem('climora_audio_muted', String(next));
      return next;
    });
  };

  const loadTelemetry = useCallback(async (lat, lon, name, country = '', isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: lat, longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl',
        hourly: 'temperature_2m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max',
        timezone: 'auto'
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await res.json();
      if (data && data.current) {
        setWeather(data);
        setCoords({ lat, lon, name, country });
        setLastUpdatedTime("Just now");
      }

      // Parallel AQI fetch
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)
        .then(r => r.json())
        .then(ad => { if (ad?.current?.us_aqi != null) setAqiVal(ad.current.us_aqi); })
        .catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTelemetry(51.5085, -0.1257, "London", "UK");
    const interval = setInterval(() => {
      setCoords(c => {
        loadTelemetry(c.lat, c.lon, c.name, c.country, true);
        return c;
      });
    }, 8 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadTelemetry]);

  const curr = weather?.current || {};
  const code = curr.weather_code || 0;
  const isDay = curr.is_day ?? 1;
  const WeatherIcon = getWeatherConfig(code).icon;
  const condLabel = getDetailedClimateLabel(code, isDay);
  
  const uvCurr = weather?.daily?.uv_index_max?.[0] ?? 5;
  const aqiCat = getAqiCategory(aqiVal);
  const uvCat = getUvCategory(uvCurr);

  return (
    <div className="min-h-screen bg-black text-white relative font-sans selection:bg-sky-500/30 overflow-y-auto overflow-x-hidden pb-32 pt-2 sm:pt-4">
      <GlobalStyles />
      <AudioController weatherCode={code} isDay={isDay} isMuted={isMuted} />
      
      {/* Top Autocomplete Search Bar (Single Back Button Only) */}
      <AutocompleteSearch 
        onSelectCity={loc => loadTelemetry(loc.latitude || loc.lat, loc.longitude || loc.lon, loc.name, loc.country)}
        currentCityName={`${coords.name}${coords.country ? ', ' + coords.country : ''}`}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onBack={() => navigate('/')}
        lastUpdated={lastUpdatedTime}
      />

      {/* RESTORED TOP NAVIGATION TABS */}
      <div className="max-w-md mx-auto px-4 my-4">
        <div className="flex justify-center gap-1.5 bg-slate-900/90 backdrop-blur-2xl p-1.5 rounded-full border border-white/15 shadow-2xl">
          {NAVIGATION_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 select-none",
                  isActive ? "bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.45)] scale-102" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={15} className={cn(isActive ? "text-white" : "text-sky-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* UNCLIPPED SMOOTH SCROLLING CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 space-y-6 relative z-10">
        
        {/* 1. OVERVIEW PAGE ONLY CONTENT */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-[fade-in-up_0.4s]">
            {/* 4. HERO BANNER (NO CLOCK CHIP, ENHANCED AQI & UV BADGES) */}
            <div className="relative glass-panel rounded-[3rem] p-7 sm:p-10 overflow-hidden shadow-2xl border border-white/20 min-h-[250px] sm:min-h-[280px] flex flex-col justify-between transition-all duration-500">
              <HeroVideoBackground weatherCode={code} isDay={isDay} />
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center py-4 sm:py-6 gap-6 sm:gap-8 w-full">
                {/* Location & Date Badge */}
                <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-black/45 backdrop-blur-2xl border border-white/20 text-sm font-bold tracking-wider shadow-xl">
                  <MapPin size={16} className="text-cyan-400 animate-pulse" />
                  <span className="text-white/95">{coords.name}{coords.country ? `, ${coords.country}` : ''}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-cyan-300 font-semibold">{liveTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>

                {/* Large Thin Elegant Centered Live Time Display */}
                <div className="font-sans font-extralight text-6xl sm:text-8xl md:text-[110px] tracking-tight leading-none text-white drop-shadow-[0_12px_35px_rgba(0,0,0,0.85)] select-none py-1">
                  {liveTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>

                {/* Centered Atmosphere & Temperature Summary Row */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 bg-black/35 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-white/15 shadow-2xl max-w-2xl w-full">
                  <div className="flex items-center gap-4">
                    <WeatherIcon size={64} className="text-amber-300 drop-shadow-[0_8px_20px_rgba(245,158,11,0.5)] animate-float shrink-0" />
                    <div className="text-left">
                      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{condLabel}</div>
                      <div className="text-xs font-semibold text-cyan-300/90 tracking-widest uppercase mt-0.5">Live Atmosphere</div>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-14 bg-white/15" />

                  <div className="flex items-center gap-6 font-mono">
                    <div className="flex items-start">
                      <span className="text-5xl sm:text-6xl font-black tracking-tighter leading-none text-white">{loading ? '--' : Math.round(curr.temperature_2m || 0)}</span>
                      <span className="text-2xl font-light text-cyan-300 ml-1">°C</span>
                    </div>

                    <div className="text-left text-xs sm:text-sm text-white/80 space-y-1 font-bold">
                      <div>H: {weather?.daily?.temperature_2m_max?.[0] != null ? `${Math.round(weather.daily.temperature_2m_max[0])}°` : '--'} • L: {weather?.daily?.temperature_2m_min?.[0] != null ? `${Math.round(weather.daily.temperature_2m_min[0])}°` : '--'}</div>
                      <div className="text-amber-300">Feels: {curr.apparent_temperature != null ? `${Math.round(curr.apparent_temperature)}°` : '--'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 & 6. 6 PREMIUM GRADIENT ROUNDED CAPSULES (Wind, Humidity, Feels Like, Pressure, Air Quality, UV Index) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 relative z-10">
              <div className="glass-panel rounded-full px-5 py-4 flex items-center justify-between shadow-xl hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-gradient-to-r from-slate-900/90 to-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-full bg-sky-500/20 text-sky-400 group-hover:scale-110 transition-transform"><Wind size={16}/></div>
                  <span className="text-xs font-extrabold text-white/80 tracking-wide">Wind</span>
                </div>
                <div className="font-mono font-black text-sm sm:text-base text-sky-300">{curr.wind_speed_10m ?? '--'} <span className="text-[10px] font-normal text-white/50">km/h</span></div>
              </div>

              <div className="glass-panel rounded-full px-5 py-4 flex items-center justify-between shadow-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-gradient-to-r from-slate-900/90 to-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-full bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform"><Droplets size={16}/></div>
                  <span className="text-xs font-extrabold text-white/80 tracking-wide">Humidity</span>
                </div>
                <div className="font-mono font-black text-sm sm:text-base text-blue-300">{curr.relative_humidity_2m ?? '--'} <span className="text-[10px] font-normal text-white/50">%</span></div>
              </div>

              <div className="glass-panel rounded-full px-5 py-4 flex items-center justify-between shadow-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-gradient-to-r from-slate-900/90 to-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-full bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform"><Thermometer size={16}/></div>
                  <span className="text-xs font-extrabold text-white/80 tracking-wide">Feels</span>
                </div>
                <div className="font-mono font-black text-sm sm:text-base text-amber-300">{curr.apparent_temperature != null ? `${Math.round(curr.apparent_temperature)}` : '--'} <span className="text-[10px] font-normal text-white/50">°C</span></div>
              </div>

              <div className="glass-panel rounded-full px-5 py-4 flex items-center justify-between shadow-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-gradient-to-r from-slate-900/90 to-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform"><Gauge size={16}/></div>
                  <span className="text-xs font-extrabold text-white/80 tracking-wide">Pressure</span>
                </div>
                <div className="font-mono font-black text-sm sm:text-base text-emerald-300">{curr.pressure_msl ?? 1013} <span className="text-[10px] font-normal text-white/50">hPa</span></div>
              </div>

              {/* NEW CAPSULE 1: AIR QUALITY */}
              <div className="glass-panel rounded-full px-5 py-4 flex items-center justify-between shadow-xl hover:shadow-[0_0_20px_rgba(52,211,153,0.25)] hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-gradient-to-r from-slate-900/90 to-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-full bg-teal-500/20 text-teal-300 group-hover:scale-110 transition-transform"><ShieldCheck size={16}/></div>
                  <span className="text-xs font-extrabold text-white/80 tracking-wide">AQI</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sm sm:text-base text-teal-300 mr-1.5">{aqiVal}</span>
                  <span className="text-[10px] font-bold text-emerald-400">({aqiCat.label})</span>
                </div>
              </div>

              {/* NEW CAPSULE 2: UV INDEX */}
              <div className="glass-panel rounded-full px-5 py-4 flex items-center justify-between shadow-xl hover:shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-gradient-to-r from-slate-900/90 to-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-full bg-amber-500/20 text-amber-300 group-hover:scale-110 transition-transform"><Zap size={16}/></div>
                  <span className="text-xs font-extrabold text-white/80 tracking-wide">UV Index</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sm sm:text-base text-amber-300 mr-1.5">{Math.round(uvCurr)}</span>
                  <span className={cn("text-[10px] font-bold", uvCat.color)}>({uvCat.label})</span>
                </div>
              </div>
            </div>

            {/* 2. ATMOSPHERIC KNOWLEDGE COMPLETELY REMOVED WITH ZERO TRACES */}

            {/* 24-HOUR HOURLY RADAR SUMMARY */}
            <div className="glass-panel rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-white/15 space-y-4 bg-slate-900/30">
              <h3 className="font-bold text-base uppercase tracking-wider text-white/70 flex items-center gap-2 font-mono"><BarChart3 size={16} className="text-sky-400"/> 24-Hour Radar Summary</h3>
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide pt-1">
                {(weather?.hourly?.time || []).slice(0, 24).map((t, idx) => {
                  const hTemp = weather?.hourly?.temperature_2m?.[idx];
                  const hCode = weather?.hourly?.weather_code?.[idx] || 0;
                  const HIcon = getWeatherConfig(hCode).icon;
                  return (
                    <div key={t} className="shrink-0 bg-black/45 rounded-2xl p-4 text-center min-w-[72px] border border-white/10 flex flex-col items-center justify-between hover:bg-white/10 transition-colors">
                      <span className="text-xs text-white/60 font-mono font-semibold">{idx === 0 ? 'Now' : formatTime(t)}</span>
                      <HIcon size={24} className="my-2.5 text-sky-300" />
                      <span className="font-extrabold text-base">{hTemp != null ? `${Math.round(hTemp)}°` : '--'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. SATELLITE RADAR PAGE CONTENT (UNBLOCKED FULL HEIGHT) */}
        {activeTab === 'radar' && (
          <SatelliteRadarTab coords={coords} />
        )}

        {/* 3. 7-DAY OUTLOOK EXPANDABLE RICHER INTERFACE */}
        {activeTab === 'forecast' && (
          <ExtendedOutlookTab weather={weather} />
        )}

      </div>
    </div>
  );
}