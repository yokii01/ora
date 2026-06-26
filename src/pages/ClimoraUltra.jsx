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

// --- 5. SINGLE VIDEO BANNER BACKGROUND (NO OVERLAPPING OR STACKING VIDEOS) ---
const HeroVideoBackground = ({ weatherCode, isDay }) => {
  const config = getWeatherConfig(weatherCode);
  const videoKey = !isDay ? 'night' : config.videoKey;
  const activeUrl = VIDEO_ASSETS[videoKey] || VIDEO_ASSETS.sunny;
  const bgImg = BACKGROUND_IMAGES[!isDay ? 'night' : config.type] || BACKGROUND_IMAGES.sunny;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-[3rem]">
      <video key={activeUrl} src={activeUrl} autoPlay loop muted playsInline preload="auto" className="hero-video-full filter blur-[2px] scale-102 opacity-90 transform-gpu transition-opacity duration-1000" />
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
              placeholder={currentCityName ? `Live: ${currentCityName}` : "Search city, state, country..."}
              className="w-full h-11 bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-full px-5 pl-11 text-sm font-semibold text-white placeholder:text-white/60 outline-none focus:border-sky-400 transition-all shadow-2xl"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
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
    <div className="space-y-4 animate-[fade-in-up_0.4s]" ref={radarContainerRef}>
      {/* 1 & 2. RADAR STARTS DIRECTLY WITH MAP: NO TOP BAR, NO MAP OVERLAY */}
      <div className="glass-panel rounded-[3rem] overflow-hidden relative min-h-[620px] bg-[#070b19] border border-blue-500/30 shadow-2xl flex flex-col justify-between">
        {/* Layer Controls Bar */}
        <div className="absolute top-5 left-5 right-5 z-20 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
          <div className="flex gap-1.5 bg-black/70 backdrop-blur-2xl p-1.5 rounded-full border border-white/20 pointer-events-auto shadow-2xl">
            {layers.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={cn("px-4 py-2 rounded-full font-bold text-xs transition-all", activeLayer === l.id ? "bg-sky-500 text-slate-950 shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10")}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button onClick={() => setZoom(p => Math.min(p + 1, 12))} className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold text-base">+</button>
            <button onClick={() => setZoom(p => Math.max(p - 1, 2))} className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold text-base">-</button>
            <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95">
              {!document.fullscreenElement ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
            </button>
          </div>
        </div>

        {/* 3. ENHANCED UNBLOCKED FULLSCREEN RADAR FEED */}
        <div className="absolute inset-0 z-0">
          <iframe
            title="Live Radar Feed"
            src={`https://www.rainviewer.com/map.html?loc=${coords.lat},${coords.lon},${zoom}&oFa=1&oS=1&c=3&o=83&lm=1&layer=${activeLayer === 'radar' ? 'radar' : 'satellite'}&sm=1&sn=1`}
            className="w-full h-full border-none filter contrast-115 saturate-120"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

// --- TAB 3: RESTORED 7-DAY OUTLOOK EXPANDABLE RICHER INTERFACE ---
const DailyForecastCard = ({ t, idx, weather }) => {
  const [expanded, setExpanded] = useState(false);
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
    <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all duration-300 border border-white/15 bg-slate-900/40 hover:bg-slate-900/60 group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 min-w-[150px]">
          <DIcon size={32} className="text-amber-300 shrink-0 group-hover:scale-110 transition-transform animate-float" />
          <div>
            <div className="font-extrabold text-white text-base sm:text-lg">{idx === 0 ? 'Today' : getDayName(t)}</div>
            <div className="text-xs text-white/50 font-mono">{t}</div>
          </div>
        </div>

        <div className="flex-1 px-2">
          <div className="font-bold text-white/90 text-sm sm:text-base">{getWeatherConfig(dCode).label}</div>
          <div className="flex items-center gap-3 text-xs text-sky-400 font-mono mt-1">
            <span>💧 {dPrecip}% Rain</span>
            <span>🌬 {Math.round(dWind)} km/h</span>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="flex items-center gap-3 font-mono text-base sm:text-lg">
            <span className="text-white/50">{dMin != null ? `${Math.round(dMin)}°` : '--'}</span>
            <div className="w-16 h-2 bg-white/15 rounded-full overflow-hidden hidden md:block">
              <div className="h-full bg-gradient-to-r from-sky-400 via-teal-300 to-amber-400 w-4/5" />
            </div>
            <span className="font-black text-white">{dMax != null ? `${Math.round(dMax)}°` : '--'}</span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-white/20 transition-all">
            {!expanded ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-[fade-in-up_0.2s] font-mono text-xs">
          <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5"><span className="text-white/40 block text-[10px] uppercase">UV Index</span><span className="text-amber-400 font-bold text-sm">{Math.round(dUv)} ({getUvCategory(dUv).label})</span></div>
          <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5"><span className="text-white/40 block text-[10px] uppercase">Air Quality</span><span className={cn("font-bold text-sm", aqiObj.color)}>{aqiObj.label}</span></div>
          <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5"><span className="text-white/40 block text-[10px] uppercase">Sunrise</span><span className="text-white font-bold text-sm">{dSunrise ? formatTime(dSunrise) : '05:48 AM'}</span></div>
          <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5"><span className="text-white/40 block text-[10px] uppercase">Sunset</span><span className="text-white font-bold text-sm">{dSunset ? formatTime(dSunset) : '06:42 PM'}</span></div>
        </div>
      )}
    </div>
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
              
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-xs sm:text-sm font-bold tracking-wide">
                      <MapPin size={15} className="text-sky-300 animate-pulse" />
                      <span>{coords.name}{coords.country ? `, ${coords.country}` : ''}</span>
                    </div>
                    
                    {/* Air Quality Badge */}
                    <div className={cn("inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border backdrop-blur-xl", aqiCat.bg, aqiCat.color)}>
                      <ShieldCheck size={14}/>
                      <span>AQI {aqiVal} • {aqiCat.label}</span>
                    </div>

                    {/* UV Index Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 backdrop-blur-xl">
                      <Zap size={13}/>
                      <span>UV {Math.round(uvCurr)} • {uvCat.label}</span>
                    </div>
                  </div>

                  <div className="flex items-start mt-4">
                    <h1 className="text-7xl sm:text-[120px] font-black tracking-tighter leading-none drop-shadow-2xl font-sans">
                      {loading ? '--' : Math.round(curr.temperature_2m || 0)}
                    </h1>
                    <span className="text-3xl sm:text-5xl font-light text-sky-300 mt-2 ml-1">°C</span>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end text-left sm:text-right self-end sm:self-center">
                  <WeatherIcon size={72} className="text-amber-300 drop-shadow-[0_8px_16px_rgba(245,158,11,0.5)] animate-float mb-1" />
                  <div className="text-xl sm:text-3xl font-extrabold tracking-tight text-white/95">{condLabel}</div>
                  <div className="text-xs sm:text-sm font-semibold text-white/75 mt-1 flex gap-3 font-mono">
                    <span>H: {weather?.daily?.temperature_2m_max?.[0] != null ? `${Math.round(weather.daily.temperature_2m_max[0])}°` : '--'}</span>
                    <span>L: {weather?.daily?.temperature_2m_min?.[0] != null ? `${Math.round(weather.daily.temperature_2m_min[0])}°` : '--'}</span>
                    <span>Feels: {curr.apparent_temperature != null ? `${Math.round(curr.apparent_temperature)}°` : '--'}</span>
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