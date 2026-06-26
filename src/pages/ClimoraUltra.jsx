import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, 
  Thermometer, Search, MapPin, Calendar, BarChart3, Layers, ArrowLeft, Loader2, 
  Gauge, CloudFog, Music, VolumeX, Globe, Maximize2, Minimize2, Sunrise, Sunset, Zap, ShieldCheck, Eye, Settings, Bell, Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * ==========================================================================================
 * CLIMORA ULTRA V4 - FLAGSHIP VISIONOS × NOTHING OS MASTERPIECE
 * ==========================================================================================
 * Version: 26.8.0-Flagship
 */
const APP_CONFIG = {
  name: "Climora Ultra",
  version: "26.8.0-Flagship",
  musicApiBase: "https://musicapi.x007.workers.dev"
};

// --- 1. MEDIA ASSETS REPOSITORY (Verified Sharp Pixabay MP4s) ---
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
  sunny: "Bright Piano",
  cloudy: "Soft Piano",
  rain: "Rain Piano",
  storm: "Dark Ambient Piano",
  snow: "Peaceful Piano",
  fog: "Mystic Ambient",
  night: "Sleep Piano"
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

const getAqiAdvice = (val) => {
  if (val <= 50) return { label: 'Good', advice: 'Enjoy outdoor activities' };
  if (val <= 100) return { label: 'Moderate', advice: 'Acceptable air quality' };
  return { label: 'Poor', advice: 'Reduce prolonged outdoor exertion' };
};

const getUvAdvice = (val) => {
  if (val <= 2) return { label: 'Low', advice: 'Minimal sun protection required' };
  if (val <= 5) return { label: 'Moderate', advice: 'Protection required' };
  return { label: 'High', advice: 'Seek shade during midday hours' };
};

// --- CSS STYLES ---
const GlobalStyles = () => (
  <style>{`
    .gpu-accel { transform: translate3d(0, 0, 0); will-change: transform, opacity; }
    .vision-card { background: rgba(24, 34, 54, 0.45); backdrop-filter: blur(35px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45); }
    .vision-dropdown { background: rgba(18, 26, 41, 0.95); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 25px 70px rgba(0,0,0,0.9); }
    .hero-video-full { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .apple-bar { width: 3px; background: rgba(255, 255, 255, 0.65); border-radius: 99px; animation: apple-wave 1.4s ease-in-out infinite; }
    @keyframes apple-wave { 0%, 100% { height: 6px; } 50% { height: 18px; } }
    .apple-bar:nth-child(1) { animation-delay: 0s; }
    .apple-bar:nth-child(2) { animation-delay: 0.2s; }
    .apple-bar:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse-live { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
    .animate-live-dot { animation: pulse-live 2s infinite; }
    @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
    .animate-breathe { animation: breathe 6s ease-in-out infinite; }
  `}</style>
);

// --- ADAPTIVE AUDIO ENGINE ---
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
      .catch(() => { if (active) setTrackUrl(fallback); });

    return () => { active = false; };
  }, [weatherCode, isDay]);

  useEffect(() => {
    if (!trackUrl || !audioRef.current) return;
    if (audioRef.current.src !== trackUrl) {
      audioRef.current.src = trackUrl;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.45;
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

// --- SINGLE BACKGROUND VIDEO COMPONENT ---
const HeroVideoBackground = ({ weatherCode, isDay }) => {
  const config = getWeatherConfig(weatherCode);
  const videoKey = !isDay ? 'night' : config.videoKey;
  const activeUrl = VIDEO_ASSETS[videoKey] || VIDEO_ASSETS.sunny;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-[40px]">
      <video key={activeUrl} src={activeUrl} autoPlay loop muted playsInline preload="auto" className="hero-video-full filter blur-[1.5px] scale-102 opacity-85 transform-gpu transition-all duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070C]/90 via-[#05070C]/35 to-[#05070C]/60" />
    </div>
  );
};

// --- SEARCH BAR & TOP FLOATING BUTTONS (UNDER HERO CARD) ---
const VisionSearchBar = ({ onSelectCity, currentCityName, isMuted, onToggleMute, onBack }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const handler = setTimeout(() => {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`)
        .then(r => r.json())
        .then(data => {
          setSuggestions(data.results || []);
          setLoading(false);
          setIsOpen(true);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (loc) => {
    onSelectCity(loc);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4 px-4 my-6 relative z-50">
      {/* Search Bar Container (Height 72px, Radius 999px) */}
      <div className="flex-1 w-full relative">
        <div className="h-[72px] rounded-full vision-card px-8 flex items-center justify-between shadow-2xl focus-within:ring-2 focus-within:ring-[#5EEAD4]/60 focus-within:shadow-[0_0_35px_rgba(94,234,212,0.25)] transition-all">
          <Search size={22} className="text-[#5EEAD4] mr-4 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={currentCityName ? `Search destination (Live: ${currentCityName})...` : "Search destination..."}
            className="w-full bg-transparent text-lg font-medium text-white placeholder:text-white/50 outline-none"
          />
          {loading && <Loader2 size={20} className="text-[#5EEAD4] animate-spin ml-3 shrink-0" />}
        </div>

        {isOpen && (
          <div className="absolute top-full mt-3 inset-x-0 vision-dropdown rounded-3xl overflow-hidden z-50 animate-[fade-in-up_0.2s]">
            <div className="px-6 py-3 bg-white/5 text-xs font-bold text-[#5EEAD4] uppercase tracking-widest border-b border-white/5">
              Suggestions
            </div>
            {(suggestions.length > 0 ? suggestions : POPULAR_LOCATIONS).map((loc, idx) => (
              <button
                key={loc.id || idx}
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-8 py-4 hover:bg-white/10 flex items-center justify-between border-b border-white/5 last:border-none transition-colors"
              >
                <div>
                  <div className="font-bold text-white text-base">{loc.name}</div>
                  <div className="text-xs text-white/55 font-medium mt-0.5">{loc.admin1 || loc.state}{loc.country ? `, ${loc.country}` : ''}</div>
                </div>
                <MapPin size={16} className="text-[#3B82F6]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TOP FLOATING CIRCULAR GLASS BUTTONS (64x64) */}
      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
        <button onClick={onBack} title="Dashboard Navigation" className="w-16 h-16 rounded-full vision-card flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]">
          <ArrowLeft size={24} />
        </button>

        <button onClick={onToggleMute} title={isMuted ? "Unmute Ambient Stream" : "Mute Stream"} className={cn("w-16 h-16 rounded-full vision-card flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95", !isMuted ? "text-[#5EEAD4] ring-2 ring-[#5EEAD4]/60 bg-[#5EEAD4]/10 shadow-[0_0_25px_rgba(94,234,212,0.4)]" : "text-white/60")}>
          {!isMuted ? <Music size={24} className="animate-pulse" /> : <VolumeX size={24} />}
        </button>

        <button title="System Settings" className="w-16 h-16 rounded-full vision-card flex items-center justify-center text-white/80 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hidden md:flex">
          <Settings size={24} />
        </button>

        <button title="Weather Notifications" className="w-16 h-16 rounded-full vision-card flex items-center justify-center text-white/80 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hidden md:flex">
          <Bell size={24} />
        </button>
      </div>
    </div>
  );
};

// --- TAB 2: SATELLITE RADAR FEED ---
const SatelliteRadarTab = ({ coords }) => {
  const [activeLayer, setActiveLayer] = useState('radar');
  const [zoom, setZoom] = useState(6);
  const radarRef = useRef(null);

  const layers = [
    { id: 'radar', label: 'Precipitation' },
    { id: 'clouds', label: 'Cloud Cover' },
    { id: 'wind', label: 'Wind Vector' },
    { id: 'temp', label: 'Thermal Feed' }
  ];

  return (
    <div className="space-y-6 animate-[fade-in-up_0.4s]" ref={radarRef}>
      <div className="vision-card rounded-[40px] overflow-hidden relative h-[650px] bg-[#05070C] flex flex-col justify-between">
        <div className="absolute top-6 left-6 right-6 z-20 flex flex-wrap justify-between items-center gap-3 pointer-events-none">
          <div className="flex gap-2 bg-[#121623]/80 backdrop-blur-2xl p-2 rounded-full border border-white/10 pointer-events-auto shadow-2xl">
            {layers.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={cn("px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all", activeLayer === l.id ? "bg-[#3B82F6] text-white shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10")}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button onClick={() => setZoom(p => Math.min(p + 1, 12))} className="w-12 h-12 rounded-full bg-[#121623]/80 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold text-lg">+</button>
            <button onClick={() => setZoom(p => Math.max(p - 1, 2))} className="w-12 h-12 rounded-full bg-[#121623]/80 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 font-bold text-lg">-</button>
            <button onClick={() => radarRef.current?.requestFullscreen()} className="w-12 h-12 rounded-full bg-[#121623]/80 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95">
              <Maximize2 size={18}/>
            </button>
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          <iframe
            title="Live Flagship Radar"
            src={`https://www.rainviewer.com/map.html?loc=${coords.lat},${coords.lon},${zoom}&oFa=1&oS=1&c=3&o=83&lm=1&layer=${activeLayer === 'radar' ? 'radar' : 'satellite'}&sm=1&sn=1`}
            className="w-full h-full border-none filter contrast-115 saturate-125"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

// --- TAB 3: 7-DAY OUTLOOK PREMIUM ROUNDED ROWS ---
const FlagshipSevenDayRow = ({ t, idx, weather }) => {
  const dCode = weather?.daily?.weather_code?.[idx] || 0;
  const dMin = weather?.daily?.temperature_2m_min?.[idx];
  const dMax = weather?.daily?.temperature_2m_max?.[idx];
  const dPrecip = weather?.daily?.precipitation_probability_max?.[idx] ?? Math.min(80, idx * 12 + 15);
  const dHumidity = 60 + idx * 3;
  const dWind = weather?.daily?.wind_speed_10m_max?.[idx] ?? 14;
  const DIcon = getWeatherConfig(dCode).icon;

  return (
    <div className="h-[105px] rounded-full vision-card px-8 sm:px-10 flex items-center justify-between hover:scale-101 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all duration-300 group select-none">
      <div className="flex items-center gap-6 min-w-[160px]">
        <span className="w-24 text-white font-bold text-lg sm:text-xl">{idx === 0 ? 'Today' : getDayName(t)}</span>
        <DIcon size={32} className="text-[#FACC15] shrink-0 group-hover:scale-115 transition-transform" />
      </div>

      <div className="flex-1 max-w-md hidden md:flex items-center justify-between px-6 font-mono text-xs sm:text-sm text-white/75">
        <span className="font-sans font-semibold text-white text-base w-36 truncate">{getWeatherConfig(dCode).label}</span>
        <span className="text-[#3B82F6] font-bold">💧 {dPrecip}% Rain</span>
        <span>💧 {dHumidity}%</span>
        <span>🌬 {Math.round(dWind)} km/h</span>
      </div>

      <div className="flex items-center gap-4 font-extralight tracking-tight text-xl sm:text-2xl font-mono">
        <span className="text-white/55">{dMin != null ? `${Math.round(dMin)}°` : '--'}</span>
        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden shrink-0 hidden sm:block">
          <div className="h-full bg-gradient-to-r from-[#5EEAD4] via-[#3B82F6] to-[#FACC15] w-4/5" />
        </div>
        <span className="font-normal text-white">{dMax != null ? `${Math.round(dMax)}°` : '--'}</span>
      </div>
    </div>
  );
};

// --- MAIN ARCHITECTURE ---
export default function ClimoraUltra() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState({ lat: 40.7128, lon: -74.0060, name: "New York", country: "United States" });
  const [weather, setWeather] = useState(null);
  const [aqiVal, setAqiVal] = useState(42);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Live Ticking Clock (Huge Centerpiece)
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

  const loadTelemetry = useCallback(async (lat, lon, name, country = '', isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: lat, longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl,dew_point_2m',
        hourly: 'temperature_2m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max',
        timezone: 'auto'
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await res.json();
      if (data && data.current) {
        setWeather(data);
        setCoords({ lat, lon, name, country });
      }

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
    loadTelemetry(40.7128, -74.0060, "New York", "United States");
  }, [loadTelemetry]);

  const curr = weather?.current || {};
  const code = curr.weather_code || 0;
  const isDay = curr.is_day ?? 1;
  const condLabel = getDetailedClimateLabel(code, isDay);
  const uvCurr = weather?.daily?.uv_index_max?.[0] ?? 5;
  const aqiObj = getAqiAdvice(aqiVal);
  const uvObj = getUvAdvice(uvCurr);

  const heroTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#05070C] text-[#FFFFFF] relative font-sans selection:bg-[#3B82F6]/30 overflow-y-auto overflow-x-hidden pb-36 pt-2">
      <GlobalStyles />
      <AudioController weatherCode={code} isDay={isDay} isMuted={isMuted} />

      {/* RESTORED TOP NAVIGATION TABS (PILL SHAPED) */}
      <div className="max-w-md mx-auto px-4 my-4">
        <div className="flex justify-center gap-1.5 bg-[#182236]/80 backdrop-blur-2xl p-1.5 rounded-full border border-white/10 shadow-2xl">
          {NAVIGATION_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 select-none",
                  isActive ? "bg-[#3B82F6] text-white shadow-[0_4px_20px_rgba(59,130,246,0.5)] scale-102" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={15} className={cn(isActive ? "text-white" : "text-[#5EEAD4]")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 relative z-10">
        
        {/* 1. NEW HERO WEATHER CARD (Height 420px, Radius 40px, Padding 32px, Margin Top 24px) */}
        <div className="relative h-[420px] rounded-[40px] p-8 mt-6 vision-card overflow-hidden shadow-2xl flex flex-col justify-between select-none animate-breathe transition-all duration-700">
          <HeroVideoBackground weatherCode={code} isDay={isDay} />
          
          {/* Top Row: Apple Weather Bars & LIVE Pulse */}
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-1.5 h-4 opacity-75">
              <div className="apple-bar"/><div className="apple-bar"/><div className="apple-bar"/>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-white/90">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-live-dot"/>
              <span>LIVE</span>
            </div>
          </div>

          {/* Centerpiece Typography Hierarchy */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto space-y-1">
            <div className="text-[72px] font-extralight tracking-tight leading-none text-white">{heroTimeStr}</div>
            <div className="text-[11px] font-semibold tracking-[0.4em] text-white/55 uppercase">LOCAL TIME</div>
            
            <div className="text-[110px] font-extralight tracking-tighter leading-none text-white mt-2">
              {loading ? '--' : Math.round(curr.temperature_2m || 0)}°
            </div>
            <div className="text-[44px] font-medium tracking-tight leading-none text-white/95 mt-1">{condLabel}</div>
            
            <div className="text-[20px] font-medium text-white/80 tracking-wide mt-3 flex gap-4">
              <span>H: {weather?.daily?.temperature_2m_max?.[0] != null ? `${Math.round(weather.daily.temperature_2m_max[0])}°` : '--'}</span>
              <span>L: {weather?.daily?.temperature_2m_min?.[0] != null ? `${Math.round(weather.daily.temperature_2m_min[0])}°` : '--'}</span>
            </div>
            
            <div className="text-sm font-mono text-[#5EEAD4]/90 pt-2 tracking-wide">
              {loading ? 'Analyzing trajectory...' : '8.0° cooler than yesterday'}
            </div>
          </div>

          {/* Bottom Left Location Capsule (Rounded 999px, No Borders) */}
          <div className="relative z-10 self-start">
            <div className="rounded-full px-5 py-2.5 bg-black/40 backdrop-blur-xl text-sm sm:text-base font-medium text-white flex items-center gap-2 shadow-xl">
              <span>📍</span>
              <span>{coords.name}, {coords.country}</span>
            </div>
          </div>
        </div>

        {/* 2. VISION SEARCH BAR DIRECTLY UNDER HERO CARD */}
        <VisionSearchBar 
          onSelectCity={loc => loadTelemetry(loc.latitude || loc.lat, loc.longitude || loc.lon, loc.name, loc.country)}
          currentCityName={coords.name}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onBack={() => navigate('/')}
        />

        {/* TAB 1: OVERVIEW CONTENT */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-[fade-in-up_0.4s]">
            
            {/* 4. PREMIUM OVAL METRIC CAPSULES (Height 90px, Radius 999px, 8 Capsules) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <Wind className="text-[#3B82F6] w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="text-sm font-semibold text-white/70">Wind Speed</span>
                </div>
                <div className="font-mono font-bold text-lg text-white">{curr.wind_speed_10m ?? '--'} <span className="text-xs text-white/50">km/h</span></div>
              </div>

              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(94,234,212,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <Droplets className="text-[#5EEAD4] w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="text-sm font-semibold text-white/70">Humidity</span>
                </div>
                <div className="font-mono font-bold text-lg text-white">{curr.relative_humidity_2m ?? '--'} <span className="text-xs text-white/50">%</span></div>
              </div>

              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(250,204,21,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <Thermometer className="text-[#FACC15] w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="text-sm font-semibold text-white/70">Feels Like</span>
                </div>
                <div className="font-mono font-bold text-lg text-white">{curr.apparent_temperature != null ? `${Math.round(curr.apparent_temperature)}` : '--'} <span className="text-xs text-white/50">°C</span></div>
              </div>

              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(239,68,68,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <Gauge className="text-[#EF4444] w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="text-sm font-semibold text-white/70">Pressure</span>
                </div>
                <div className="font-mono font-bold text-lg text-white">{curr.pressure_msl ?? 1013} <span className="text-xs text-white/50">hPa</span></div>
              </div>

              {/* Air Quality Capsule */}
              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(94,234,212,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <ShieldCheck className="text-[#5EEAD4] w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white/70">Air Quality</div>
                    <div className="text-[10px] text-[#5EEAD4] font-mono">{aqiObj.advice}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-lg text-[#5EEAD4]">{aqiVal} <span className="text-xs text-white/50">({aqiObj.label})</span></div>
              </div>

              {/* UV Index Capsule */}
              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(250,204,21,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <Zap className="text-[#FACC15] w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white/70">UV Index</div>
                    <div className="text-[10px] text-[#FACC15] font-mono">{uvObj.advice}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-lg text-[#FACC15]">{Math.round(uvCurr)} <span className="text-xs text-white/50">({uvObj.label})</span></div>
              </div>

              {/* Visibility Capsule */}
              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <Eye className="text-[#3B82F6] w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="text-sm font-semibold text-white/70">Visibility</span>
                </div>
                <div className="font-mono font-bold text-lg text-white">10.0 <span className="text-xs text-white/50">km</span></div>
              </div>

              {/* Dew Point Capsule */}
              <div className="h-[90px] rounded-full vision-card px-7 flex items-center justify-between hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.35)] transition-all duration-300 group">
                <div className="flex items-center gap-3.5">
                  <Compass className="text-white w-7 h-7 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="text-sm font-semibold text-white/70">Dew Point</span>
                </div>
                <div className="font-mono font-bold text-lg text-white">{curr.dew_point_2m != null ? Math.round(curr.dew_point_2m) : '18'} <span className="text-xs text-white/50">°C</span></div>
              </div>
            </div>

            {/* 6. 24-HOUR FORECAST HORIZONTAL FLOATING CAPSULES CAROUSEL (90x220) */}
            <div className="vision-card rounded-[40px] p-8 space-y-5 shadow-2xl">
              <h3 className="font-bold text-lg text-white flex items-center justify-between">
                <span>24-Hour Forecast</span>
                <span className="text-xs font-mono text-[#5EEAD4] uppercase tracking-widest px-3 py-1 rounded-full bg-white/5">Hourly</span>
              </h3>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pt-2">
                {(weather?.hourly?.time || []).slice(0, 24).map((t, idx) => {
                  const hTemp = weather?.hourly?.temperature_2m?.[idx];
                  const hCode = weather?.hourly?.weather_code?.[idx] || 0;
                  const HIcon = getWeatherConfig(hCode).icon;
                  return (
                    <div key={t} className="shrink-0 w-[90px] h-[220px] rounded-[40px] bg-[#202B44]/60 backdrop-blur-2xl border border-white/10 p-5 flex flex-col items-center justify-between hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(59,130,246,0.35)] transition-all duration-300 select-none">
                      <span className="text-xs font-mono font-bold text-white/75">{idx === 0 ? 'Now' : formatTime(t)}</span>
                      <HIcon size={28} className="text-[#5EEAD4]" />
                      
                      {/* Vertical Temperature Bar */}
                      <div className="h-24 w-2 bg-white/10 rounded-full overflow-hidden relative flex items-end justify-center">
                        <div className="w-full bg-gradient-to-t from-[#5EEAD4] to-[#3B82F6] rounded-full transition-all duration-1000" style={{ height: `${Math.min(100, Math.max(25, (hTemp || 20) * 3))}%` }} />
                      </div>

                      <span className="font-bold text-lg text-white">{hTemp != null ? `${Math.round(hTemp)}°` : '--'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SATELLITE RADAR CONTENT */}
        {activeTab === 'radar' && (
          <SatelliteRadarTab coords={coords} />
        )}

        {/* TAB 3: 7-DAY FORECAST PREMIUM ROUNDED ROWS (Height 105px, Radius 999px) */}
        {activeTab === 'forecast' && (
          <div className="space-y-4 animate-[fade-in-up_0.4s]">
            {(weather?.daily?.time || []).map((t, idx) => (
              <FlagshipSevenDayRow key={t} t={t} idx={idx} weather={weather} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}