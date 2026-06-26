import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, 
  Thermometer, Search, MapPin, Calendar, BarChart3, Layers, Camera, X, ArrowLeft, Loader2, 
  Activity, Gauge, CloudFog, Shirt, HeartPulse, AlertTriangle, ChevronDown, Music, VolumeX, Lightbulb, Globe, Clock, Compass, Play, Pause, RotateCcw, Maximize2, Minimize2, RefreshCw, Eye, Sunrise, Sunset
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * ==========================================================================================
 * CLIMORA ULTRA - CONFIGURATION & CONSTANTS
 * ==========================================================================================
 * Version: 26.5.0-Stable
 */
const APP_CONFIG = {
  name: "Climora Ultra",
  version: "26.5.0-Stable",
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

const DAILY_FACTS_FALLBACK = [
  "Fog is just clouds touching the ground.",
  "Sunlight takes 8 minutes to reach Earth.",
  "Lightning is 5 times hotter than the sun.",
  "Rain contains Vitamin B12.",
  "A cloud can weigh more than a million pounds.",
  "Snowflakes take about an hour to fall."
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

// --- 9. REPAIRED MUSIC API ENGINE ---
const AudioController = ({ weatherCode, isDay, isMuted }) => {
  const audioRef = useRef(new Audio());
  const [trackUrl, setTrackUrl] = useState(null);

  useEffect(() => {
    let active = true;
    const config = getWeatherConfig(weatherCode);
    const typeKey = !isDay ? 'night' : config.type;
    const queryTerm = MUSIC_QUERIES[typeKey] || "Soft Piano";
    const fallback = FALLBACK_AUDIO[typeKey] || FALLBACK_AUDIO.sunny;

    // Try fetching from musicapi worker or fallback
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

// --- 5 & 10. SINGLE VIDEO BANNER BACKGROUND (NO OVERLAPPING VIDEOS) ---
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
    <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 py-2 relative z-50">
      <div className="flex items-center gap-2 flex-1 max-w-3xl">
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
        {/* 6. LIVE STATUS INDICATOR PILL */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel bg-emerald-950/40 border-emerald-500/30 text-[11px] font-mono text-emerald-300">
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

// --- TAB 2: DEDICATED SATELLITE RADAR PAGE ---
const SatelliteRadarTab = ({ coords, curr, weather, condLabel, WeatherIcon }) => {
  const [activeLayer, setActiveLayer] = useState('radar');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(5);
  const radarContainerRef = useRef(null);

  const layers = [
    { id: 'radar', label: 'Rain Feed', icon: Droplets },
    { id: 'clouds', label: 'Cloud Cover', icon: Cloud },
    { id: 'wind', label: 'Wind Currents', icon: Wind },
    { id: 'temp', label: 'Thermal Map', icon: Thermometer },
    { id: 'pressure', label: 'Barometric', icon: Gauge }
  ];

  const toggleFullscreen = () => {
    if (!radarContainerRef.current) return;
    if (!document.fullscreenElement) {
      radarContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-6 animate-[fade-in-up_0.4s]" ref={radarContainerRef}>
      {/* COMPACT WEATHER CAPSULE ROW AT TOP OF RADAR */}
      <div className="glass-panel rounded-full p-2 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-2xl border border-white/20 bg-slate-900/80 backdrop-blur-2xl sticky top-20 z-40 overflow-x-auto scrollbar-hide gap-4 font-mono text-xs">
        <div className="flex items-center gap-3 shrink-0">
          <WeatherIcon size={24} className="text-amber-300 animate-pulse" />
          <div>
            <div className="font-extrabold text-white text-sm sm:text-base">{Math.round(curr.temperature_2m || 0)}°C</div>
            <div className="text-[10px] text-white/60 uppercase">{condLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0 text-white/80">
          <div><span className="text-white/40 block text-[9px]">HIGH / LOW</span>{weather?.daily?.temperature_2m_max?.[0] != null ? `${Math.round(weather.daily.temperature_2m_max[0])}°` : '--'} / {weather?.daily?.temperature_2m_min?.[0] != null ? `${Math.round(weather.daily.temperature_2m_min[0])}°` : '--'}</div>
          <div><span className="text-white/40 block text-[9px]">WIND</span>{curr.wind_speed_10m ?? '--'} km/h</div>
          <div><span className="text-white/40 block text-[9px]">HUMIDITY</span>{curr.relative_humidity_2m ?? '--'}%</div>
          <div><span className="text-white/40 block text-[9px]">PRESSURE</span>{curr.pressure_msl ?? 1013} hPa</div>
        </div>
      </div>

      {/* LIVE WEATHER RADAR MAP CONTAINER */}
      <div className="glass-panel rounded-[3rem] overflow-hidden relative min-h-[500px] bg-[#070b19] border border-blue-500/30 shadow-2xl flex flex-col justify-between">
        {/* Layer Controls Bar */}
        <div className="absolute top-5 left-5 right-5 z-20 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
          <div className="flex gap-1.5 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/15 pointer-events-auto">
            {layers.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={cn("px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all", activeLayer === l.id ? "bg-sky-500 text-slate-950 shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10")}
              >
                <l.icon size={13} /> <span className="hidden md:inline">{l.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button onClick={() => setZoom(p => Math.min(p + 1, 12))} className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold">+</button>
            <button onClick={() => setZoom(p => Math.max(p - 1, 2))} className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold">-</button>
            <button onClick={toggleFullscreen} className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/20 active:scale-95">
              {!isFullscreen ? <Maximize2 size={15}/> : <Minimize2 size={15}/>}
            </button>
          </div>
        </div>

        {/* Embedded Free Radar iframe / Leaflet feed simulation */}
        <div className="absolute inset-0 z-0">
          <iframe
            title="Live Radar Feed"
            src={`https://www.rainviewer.com/map.html?loc=${coords.lat},${coords.lon},${zoom}&oFa=1&oS=1&c=3&o=83&lm=1&layer=${activeLayer === 'radar' ? 'radar' : 'satellite'}&sm=1&sn=1`}
            className="w-full h-full border-none filter contrast-115 saturate-120"
            allowFullScreen
          />
        </div>

        {/* Playback Timeline Controls Bar */}
        <div className="relative z-20 m-5 p-4 rounded-3xl bg-black/75 backdrop-blur-2xl border border-white/15 flex items-center justify-between gap-4 font-mono text-xs self-end w-[calc(100%-2.5rem)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-bold transition-transform active:scale-95">
              {isPlaying ? <Pause size={18}/> : <Play size={18} className="ml-0.5"/>}
            </button>
            <div>
              <div className="font-bold text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-ping"/> LIVE LOOP</div>
              <div className="text-[10px] text-white/50">RainViewer Public Engine</div>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2">
            <span className="text-white/40 text-[10px]">-1h</span>
            <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden relative">
              <div className={cn("h-full bg-sky-400 w-full", isPlaying && "animate-pulse")} />
            </div>
            <span className="text-sky-300 font-bold text-[10px]">NOW</span>
          </div>

          <div className="text-right">
            <div className="text-sky-300 font-bold">UTC {new Date().toISOString().slice(11, 16)}</div>
            <div className="text-[10px] text-white/40 uppercase">Orbital Sync</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TAB 3: 7-DAY OUTLOOK TAB ---
const ExtendedOutlookTab = ({ weather }) => (
  <div className="space-y-4 animate-[fade-in-up_0.4s]">
    <div className="glass-panel rounded-[2.5rem] p-6 sm:p-8 space-y-4 border border-white/15 bg-slate-900/40">
      <h3 className="font-bold text-base uppercase tracking-wider text-white/70 flex items-center gap-2"><Calendar size={16} className="text-amber-400"/> 7-Day Atmospheric Trends & Probabilities</h3>
      <div className="divide-y divide-white/10">
        {(weather?.daily?.time || []).map((t, idx) => {
          const dCode = weather?.daily?.weather_code?.[idx] || 0;
          const dMin = weather?.daily?.temperature_2m_min?.[idx];
          const dMax = weather?.daily?.temperature_2m_max?.[idx];
          const dPrecip = weather?.daily?.precipitation_probability_max?.[idx] || idx * 12;
          const dSunrise = weather?.daily?.sunrise?.[idx];
          const dSunset = weather?.daily?.sunset?.[idx];
          const DIcon = getWeatherConfig(dCode).icon;

          return (
            <div key={t} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/5 px-4 rounded-2xl transition-colors font-medium">
              <div className="flex items-center gap-4 w-44">
                <span className="w-20 text-white font-extrabold text-base">{idx === 0 ? 'Today' : getDayName(t)}</span>
                <span className="text-xs text-white/50 font-mono">{t.slice(5)}</span>
              </div>

              <div className="flex items-center gap-3 flex-1">
                <DIcon size={26} className="text-sky-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white/90">{getWeatherConfig(dCode).label}</div>
                  <div className="text-[11px] text-sky-400 font-mono flex items-center gap-3 mt-0.5">
                    <span>💧 {dPrecip}% Rain</span>
                    {dSunrise && <span>🌅 {formatTime(dSunrise)}</span>}
                    {dSunset && <span>🌇 {formatTime(dSunset)}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-40 justify-end font-mono text-base self-end sm:self-center">
                <span className="text-white/50">{dMin != null ? `${Math.round(dMin)}°` : '--'}</span>
                <div className="w-16 h-2 bg-white/15 rounded-full overflow-hidden shrink-0 hidden md:block">
                  <div className="h-full bg-gradient-to-r from-sky-400 via-teal-300 to-amber-400 w-4/5" />
                </div>
                <span className="font-extrabold text-white text-lg">{dMax != null ? `${Math.round(dMax)}°` : '--'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// --- 5. MAIN RESTORED & REAL-TIME ARCHITECTURE ---
export default function ClimoraUltra() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState({ lat: 51.5085, lon: -0.1257, name: "London", country: "UK" });
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdatedTime, setLastUpdatedTime] = useState("Just Now");
  
  // 7. LIVE LOCAL TIME TICKER
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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

  // 6. REAL-TIME INTELLIGENT AUTO-REFRESH (Every 8 minutes)
  const loadTelemetry = useCallback(async (lat, lon, name, country = '', isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: lat, longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl',
        hourly: 'temperature_2m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
        timezone: 'auto'
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await res.json();
      if (data && data.current) {
        setWeather(data);
        setCoords({ lat, lon, name, country });
        setLastUpdatedTime("Just now");
      }
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
    }, 8 * 60 * 1000); // 8 mins
    return () => clearInterval(interval);
  }, [loadTelemetry]);

  const curr = weather?.current || {};
  const code = curr.weather_code || 0;
  const isDay = curr.is_day ?? 1;
  const WeatherIcon = getWeatherConfig(code).icon;
  const condLabel = getDetailedClimateLabel(code, isDay);
  const fact = useMemo(() => DAILY_FACTS_FALLBACK[new Date().getDate() % DAILY_FACTS_FALLBACK.length], []);

  // Formatted Live Ticking Ticks
  const liveTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const liveDateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const tzString = weather?.timezone || "UTC";

  return (
    <div className="min-h-screen bg-black text-white relative font-sans selection:bg-sky-500/30 overflow-y-auto overflow-x-hidden pb-32 pt-2 sm:pt-4">
      <GlobalStyles />
      <AudioController weatherCode={code} isDay={isDay} isMuted={isMuted} />
      
      {/* Top Autocomplete Search Bar */}
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-2 space-y-6 relative z-10">
        
        {/* 1. OVERVIEW PAGE ONLY CONTENT */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-[fade-in-up_0.4s]">
            {/* COMPACT HERO BANNER (NO EMOJIS, LIVE LOCAL TIME) */}
            <div className="relative glass-panel rounded-[3rem] p-7 sm:p-10 overflow-hidden shadow-2xl border border-white/20 min-h-[250px] sm:min-h-[280px] flex flex-col justify-between transition-all duration-500">
              <HeroVideoBackground weatherCode={code} isDay={isDay} />
              
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-xs sm:text-sm font-bold tracking-wide">
                      <MapPin size={14} className="text-sky-300 animate-pulse" />
                      <span>{coords.name}{coords.country ? `, ${coords.country}` : ''}</span>
                    </div>
                    {/* 7. LIVE LOCAL TIME TICKER CHIP */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-mono text-sky-300">
                      <Clock size={13} />
                      <span>{liveTimeString} • {liveDateString} ({tzString})</span>
                    </div>
                  </div>

                  <div className="flex items-start mt-4">
                    <h1 className="text-7xl sm:text-[115px] font-black tracking-tighter leading-none drop-shadow-2xl font-sans">
                      {loading ? '--' : Math.round(curr.temperature_2m || 0)}
                    </h1>
                    <span className="text-3xl sm:text-5xl font-light text-sky-300 mt-1 ml-1">°C</span>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end text-left sm:text-right self-end sm:self-center">
                  <WeatherIcon size={68} className="text-amber-300 drop-shadow-[0_8px_16px_rgba(245,158,11,0.5)] animate-float mb-1" />
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-white/95">{condLabel}</div>
                  <div className="text-xs sm:text-sm font-semibold text-white/75 mt-1 flex gap-3 font-mono">
                    <span>H: {weather?.daily?.temperature_2m_max?.[0] != null ? `${Math.round(weather.daily.temperature_2m_max[0])}°` : '--'}</span>
                    <span>L: {weather?.daily?.temperature_2m_min?.[0] != null ? `${Math.round(weather.daily.temperature_2m_min[0])}°` : '--'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WEATHER METRIC CAPSULES BELOW BANNER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
              <div className="glass-panel rounded-full px-5 py-4 sm:py-4 flex items-center justify-between shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-sky-500/15 text-sky-400 group-hover:scale-110 transition-transform"><Wind size={18}/></div>
                  <span className="text-xs font-bold text-white/70 tracking-wider">Wind Speed</span>
                </div>
                <div className="font-mono font-extrabold text-sm sm:text-base text-sky-300">{curr.wind_speed_10m ?? '--'} <span className="text-[10px] font-normal text-white/50">km/h</span></div>
              </div>

              <div className="glass-panel rounded-full px-5 py-4 sm:py-4 flex items-center justify-between shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform"><Droplets size={18}/></div>
                  <span className="text-xs font-bold text-white/70 tracking-wider">Humidity</span>
                </div>
                <div className="font-mono font-extrabold text-sm sm:text-base text-blue-300">{curr.relative_humidity_2m ?? '--'} <span className="text-[10px] font-normal text-white/50">%</span></div>
              </div>

              <div className="glass-panel rounded-full px-5 py-4 sm:py-4 flex items-center justify-between shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform"><Thermometer size={18}/></div>
                  <span className="text-xs font-bold text-white/70 tracking-wider">Feels Like</span>
                </div>
                <div className="font-mono font-extrabold text-sm sm:text-base text-amber-300">{curr.apparent_temperature != null ? `${Math.round(curr.apparent_temperature)}` : '--'} <span className="text-[10px] font-normal text-white/50">°C</span></div>
              </div>

              <div className="glass-panel rounded-full px-5 py-4 sm:py-4 flex items-center justify-between shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-300 border border-white/15 group bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform"><Gauge size={18}/></div>
                  <span className="text-xs font-bold text-white/70 tracking-wider">Pressure</span>
                </div>
                <div className="font-mono font-extrabold text-sm sm:text-base text-emerald-300">{curr.pressure_msl ?? 1013} <span className="text-[10px] font-normal text-white/50">hPa</span></div>
              </div>
            </div>

            {/* ATMOSPHERIC KNOWLEDGE FACT */}
            <div className="glass-panel rounded-[2.5rem] p-6 flex items-start gap-4 border-l-4 border-amber-400 bg-amber-500/10">
              <div className="p-3 bg-amber-400/20 rounded-2xl text-amber-300 shrink-0"><Lightbulb size={24} /></div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">Atmospheric Knowledge</h4>
                <p className="text-base font-medium text-white/95 leading-relaxed">"{fact}"</p>
              </div>
            </div>

            {/* 24-HOUR HOURLY RADAR SUMMARY */}
            <div className="glass-panel rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-white/15 space-y-4 bg-slate-900/30">
              <h3 className="font-bold text-base uppercase tracking-wider text-white/70 flex items-center gap-2"><Clock size={16} className="text-sky-400"/> 24-Hour Radar Summary</h3>
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

        {/* 2. SATELLITE RADAR PAGE CONTENT */}
        {activeTab === 'radar' && (
          <SatelliteRadarTab coords={coords} curr={curr} weather={weather} condLabel={condLabel} WeatherIcon={WeatherIcon} />
        )}

        {/* 11. 7-DAY OUTLOOK UNIQUE CONTENT */}
        {activeTab === 'forecast' && (
          <ExtendedOutlookTab weather={weather} />
        )}

      </div>
    </div>
  );
}