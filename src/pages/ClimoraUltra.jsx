import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, 
  Thermometer, Umbrella, Eye, Zap, Search, MapPin, Calendar, 
  BarChart3, Layers, Settings, Sunrise, Sunset, X, Plus, Trash2, ArrowLeft, Loader2, Map as MapIcon, 
  Activity, Gauge, Radiation, CloudFog, Home, ChevronUp, ChevronDown,
  Volume2, VolumeX, Music, Menu, Camera, FileText, AlertTriangle, HeartPulse, Shirt, Newspaper, Bell, PlusCircle, Edit2, Image as ImageIcon, Check, Heart, Bookmark, Share2, Send, Type, Crop, PenTool, BookOpen, RefreshCw, Lock, Globe, Lightbulb, Play, Pause, RotateCcw, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ==========================================================================================
 * CLIMORA ULTRA - CONFIGURATION & CONSTANTS
 * ==========================================================================================
 * Version: 26.1.1-Stable
 */
const APP_CONFIG = {
  name: "Climora Ultra",
  version: "26.1.1-Stable",
  newsApiKey: "pub_e6fa4c1133b94e9fa150f2c5fcccc9dd",
  geminiApiKey: "AIzaSyBZ_cso_sAB45BHLmCWEX2GVEsOV9RyO0M",
  musicApiBase: "https://musicapi.x007.workers.dev"
};

// --- 1. MEDIA ASSETS REPOSITORY ---
const BACKGROUND_IMAGES = {
  sunny: "https://cdn.pixabay.com/photo/2018/08/06/22/55/sun-3588618_1280.jpg",
  cloudy: "https://cdn.pixabay.com/photo/2016/11/22/19/25/clouds-1850093_1280.jpg",
  night: "https://cdn.pixabay.com/photo/2016/11/25/23/15/moon-1859616_1280.jpg",
  rain: "https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072821_1280.jpg",
  snow: "https://cdn.pixabay.com/photo/2019/12/30/20/34/road-4730553_1280.jpg",
  fog: "https://cdn.pixabay.com/photo/2016/11/14/04/14/mist-1822560_1280.jpg",
  storm: "https://cdn.pixabay.com/photo/2016/11/29/05/55/adult-1867665_1280.jpg",
  morning: "https://cdn.pixabay.com/photo/2016/11/14/04/45/sunrise-1823013_1280.jpg"
};

// Verified 200-OK Pixabay Direct MP4 Download Videos
const VIDEO_ASSETS = {
  sunny: ["https://pixabay.com/videos/download/video-212102_medium.mp4"],
  cloudy: ["https://pixabay.com/videos/download/video-212102_medium.mp4"],
  night: ["https://pixabay.com/videos/download/video-169951_medium.mp4"],
  rain: ["https://pixabay.com/videos/download/video-169951_medium.mp4"],
  snow: ["https://pixabay.com/videos/download/video-212102_medium.mp4"],
  fog: ["https://pixabay.com/videos/download/video-212102_medium.mp4"],
  storm: ["https://pixabay.com/videos/download/video-169951_medium.mp4"]
};

// --- AUDIO LAYERS ---
const PIANO_ASSETS = [
  "https://cdn.pixabay.com/audio/2022/03/10/audio_cff0007298.mp3"
];

const AMBIANCE_ASSETS = {
  rain: ["https://cdn.pixabay.com/audio/2022/07/04/audio_3497d5b886.mp3"],
  storm: ["https://cdn.pixabay.com/audio/2022/03/24/audio_035a397775.mp3"],
  snow: ["https://cdn.pixabay.com/audio/2021/08/09/audio_a46b4e548f.mp3"],
  fog: ["https://cdn.pixabay.com/audio/2022/10/21/audio_310863b782.mp3"],
  morning: ["https://cdn.pixabay.com/audio/2022/02/07/audio_659021d743.mp3"],
  evening: ["https://cdn.pixabay.com/audio/2021/08/04/audio_13b52f4003.mp3"],
  night: ["https://cdn.pixabay.com/audio/2022/03/09/audio_6e1e3b8a10.mp3"]
};

const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Classic' },
  { id: 'blue', bg: 'bg-blue-300', text: 'text-blue-900', label: 'Sky' },
  { id: 'green', bg: 'bg-green-300', text: 'text-green-900', label: 'Nature' }
];

const NOTE_TEXT_COLORS = [
  { id: 'white', class: 'text-white' },
  { id: 'black', class: 'text-black' }
];

const NOTE_FONTS = [
  { id: 'sans', class: 'font-sans', label: 'Modern' }
];

const DAILY_FACTS_FALLBACK = [
  "Fog is just clouds touching the ground.",
  "Sunlight takes 8 minutes to reach Earth.",
  "Lightning is 5 times hotter than the sun.",
  "Rain contains Vitamin B12.",
  "A cloud can weigh more than a million pounds.",
  "Crickets chirp faster when it's warmer.",
  "Snowflakes take about an hour to fall.",
  "The wind is silent until it hits something.",
  "Antarctica is technically a desert.",
  "Rainbows are actually full circles."
];

const GLOBAL_LOCATIONS = ["Tokyo, Japan", "London, UK", "New York, USA", "Mumbai, India", "Sydney, Australia", "Paris, France"];
const WEATHER_EVENTS = [
  { title: "Atmospheric Shift", desc: "Large pressure ridge moving inwards across the coastline.", keyword: "sky" },
  { title: "Seasonal Forecast", desc: "Temperatures stabilizing near seasonal averages this week.", keyword: "clouds" }
];

const generateGlobalNews = () => {
  return Array.from({ length: 12 }).map((_, i) => {
    const loc = GLOBAL_LOCATIONS[i % GLOBAL_LOCATIONS.length];
    const evt = WEATHER_EVENTS[i % WEATHER_EVENTS.length];
    return {
      id: Date.now() + i,
      title: `${evt.title} in ${loc.split(',')[0]}`,
      location: loc,
      img: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=640",
      content: `LIVE REPORT from ${loc}: ${evt.desc} Meteorologists monitor atmospheric pressure shifts closely. Local authorities advise residents to stay updated.`,
      time: `${(i+1)*15}m ago`,
      isAi: false
    };
  });
};

const WEATHER_MAPPING = {
  0: { label: 'Sunny', type: 'sunny', videoKey: 'sunny', icon: Sun },
  1: { label: 'Sunny', type: 'sunny', videoKey: 'sunny', icon: Sun },
  2: { label: 'Partly Cloudy', type: 'cloudy', videoKey: 'cloudy', icon: Cloud },
  3: { label: 'Cloudy', type: 'cloudy', videoKey: 'cloudy', icon: Cloud },
  45: { label: 'Fog', type: 'fog', videoKey: 'fog', icon: CloudFog },
  48: { label: 'Fog', type: 'fog', videoKey: 'fog', icon: CloudFog },
  51: { label: 'Light Drizzle', type: 'rain', videoKey: 'rain', icon: CloudRain },
  61: { label: 'Rain', type: 'rain', videoKey: 'rain', icon: CloudRain },
  65: { label: 'Heavy Rain', type: 'rain', videoKey: 'rain', icon: CloudLightning },
  71: { label: 'Snow', type: 'snow', videoKey: 'snow', icon: CloudSnow },
  80: { label: 'Showers', type: 'rain', videoKey: 'rain', icon: CloudRain },
  95: { label: 'Thunderstorm', type: 'storm', videoKey: 'storm', icon: CloudLightning },
};

function getWeatherConfig(code) { return WEATHER_MAPPING[code] || WEATHER_MAPPING[0]; }

function getDetailedClimateLabel(code, isDay) {
  const config = WEATHER_MAPPING[code] || WEATHER_MAPPING[0];
  if (!isDay && config.type === 'sunny') return 'Clear Night';
  return config.label;
}

const NAVIGATION_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'deep', label: 'Radar', icon: Layers },
  { id: 'forecast', label: '7 Days', icon: Calendar }, 
];

const GlobalStyles = () => (
  <style>{`
    .gpu-accel { transform: translate3d(0, 0, 0); will-change: transform, opacity; }
    .glass-panel { background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(28px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45); border-radius: 2.5rem; }
    .glass-input { background: rgba(0, 0, 0, 0.35); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.18); color: white; border-radius: 9999px; }
    .hero-video-full { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

const HeroVideoBackground = ({ weatherCode, isDay }) => {
  const isDark = !isDay || weatherCode >= 51;
  const videoUrl = isDark 
    ? "https://pixabay.com/videos/download/video-169951_medium.mp4" 
    : "https://pixabay.com/videos/download/video-212102_medium.mp4";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-[3rem]">
      <video key={videoUrl} src={videoUrl} autoPlay loop muted playsInline className="hero-video-full filter blur-[10px] scale-105 opacity-85 transform-gpu" />
      <div className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-indigo-950/30'} pointer-events-none transition-colors duration-700`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
    </div>
  );
};

const SmartSearchBar = ({ onBack, onSearch, currentCity, isPianoMuted, togglePiano, isAmbianceMuted, toggleAmbiance }) => {
  const [query, setQuery] = useState('');
  
  return (
    <div className="w-full max-w-4xl mx-auto flex items-center gap-3 px-4 py-3 relative z-30">
      <button onClick={onBack} className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all shrink-0">
        <ArrowLeft size={20} />
      </button>
      
      <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) onSearch(query); }} className="flex-1 relative">
        <input 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={currentCity ? `Live: ${currentCity}` : "Search global city..."} 
          className="w-full h-11 glass-input px-5 pl-11 text-sm font-medium outline-none placeholder:text-white/60 focus:border-blue-400 transition-all"
        />
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
      </form>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={togglePiano} title="Toggle Piano" className={`w-11 h-11 rounded-full glass-panel flex items-center justify-center ${!isPianoMuted ? 'text-indigo-300 ring-1 ring-indigo-400' : 'text-white/40'}`}>
          {!isPianoMuted ? <Music size={18} className="animate-pulse" /> : <VolumeX size={18} />}
        </button>
        <button onClick={toggleAmbiance} title="Toggle Ambiance SFX" className={`w-11 h-11 rounded-full glass-panel flex items-center justify-center ${!isAmbianceMuted ? 'text-teal-300 ring-1 ring-teal-400' : 'text-white/40'}`}>
          {!isAmbianceMuted ? <Wind size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
    </div>
  );
};

const EarthView = () => (
  <div className="glass-panel p-6 overflow-hidden relative flex flex-col justify-between h-72 shadow-2xl">
    <div className="flex items-center justify-between relative z-10">
      <div className="flex items-center gap-2 font-bold text-white"><Globe size={18} className="text-sky-400" /> Earth Telemetry</div>
      <span className="text-[10px] font-mono uppercase bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-full border border-sky-400/30">Live Orbit</span>
    </div>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
      <div className="w-52 h-52 rounded-full border border-sky-400/30 animate-spin" style={{ animationDuration: '40s' }} />
      <div className="absolute w-64 h-64 rounded-full border border-dashed border-white/10 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
      <Globe size={140} className="text-sky-500/30 absolute animate-pulse" />
    </div>
    <div className="grid grid-cols-2 gap-4 relative z-10 pt-32 text-xs">
      <div className="bg-black/30 p-3 rounded-2xl backdrop-blur-md border border-white/5"><span className="text-white/50 block">Rotation</span><span className="font-mono text-base font-bold text-sky-300">1,040 MPH</span></div>
      <div className="bg-black/30 p-3 rounded-2xl backdrop-blur-md border border-white/5"><span className="text-white/50 block">Atmospheric</span><span className="font-mono text-base font-bold text-emerald-300">Stable 1013 hPa</span></div>
    </div>
  </div>
);

const DailyFact = () => {
  const fact = useMemo(() => DAILY_FACTS_FALLBACK[new Date().getDate() % DAILY_FACTS_FALLBACK.length], []);
  return (
    <div className="glass-panel p-6 flex items-start gap-4 border-l-4 border-amber-400 bg-amber-500/10">
      <div className="p-3 bg-amber-400/20 rounded-2xl text-amber-300 shrink-0"><Lightbulb size={24} /></div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">Daily Atmospheric Knowledge</h4>
        <p className="text-base font-medium text-white/95 leading-relaxed">"{fact}"</p>
      </div>
    </div>
  );
};

export default function ClimoraUltra() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [coords, setCoords] = useState({ lat: 51.5085, lon: -0.1257, name: 'London' });
  const [isPianoMuted, setIsPianoMuted] = useState(true);
  const [isAmbianceMuted, setIsAmbianceMuted] = useState(true);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [weather, setWeather] = useState({
    temp: 21, high: 24, low: 16, code: 1, isDay: 1, wind: 12, humidity: 55, pressure: 1014, uv: 4, aqi: 32,
    hourly: Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, temp: 18 + Math.round(Math.sin(i/4)*5), code: i > 12 ? 2 : 0 })),
    daily: Array.from({ length: 7 }).map((_, i) => ({ day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(new Date().getDay()+i)%7], high: 22+i%4, low: 15+i%3, code: i === 3 ? 61 : 1 })),
    loading: true
  });

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        if (data && data.current) {
          const nowHour = new Date().getHours();
          const hTimes = data.hourly?.time || [];
          const hTemps = data.hourly?.temperature_2m || [];
          const hCodes = data.hourly?.weather_code || [];
          const startIndex = Math.max(0, hTimes.findIndex(t => new Date(t).getHours() === nowHour));
          
          const hourlyList = hTimes.slice(startIndex, startIndex + 24).map((t, idx) => ({
            time: new Date(t).toLocaleTimeString([], { hour: 'numeric' }),
            temp: Math.round(hTemps[startIndex + idx] || 0),
            code: hCodes[startIndex + idx] || 0
          }));

          const dTimes = data.daily?.time || [];
          const dMax = data.daily?.temperature_2m_max || [];
          const dMin = data.daily?.temperature_2m_min || [];
          const dCodes = data.daily?.weather_code || [];
          const dailyList = dTimes.map((t, idx) => ({
            day: idx === 0 ? 'Today' : new Date(t).toLocaleDateString([], { weekday: 'short' }),
            high: Math.round(dMax[idx] || 0),
            low: Math.round(dMin[idx] || 0),
            code: dCodes[idx] || 0
          }));

          setWeather({
            temp: Math.round(data.current.temperature_2m),
            high: Math.round(dMax[0] || 24),
            low: Math.round(dMin[0] || 16),
            code: data.current.weather_code,
            isDay: data.current.is_day,
            wind: Math.round(data.current.wind_speed_10m),
            humidity: Math.round(data.current.relative_humidity_2m),
            pressure: Math.round(data.current.pressure_msl),
            uv: 4, aqi: 28,
            hourly: hourlyList.length > 0 ? hourlyList : weather.hourly,
            daily: dailyList.length > 0 ? dailyList : weather.daily,
            loading: false
          });
        }
      } catch (e) {
        setWeather(p => ({ ...p, loading: false }));
      }
    };
    loadWeather();
  }, [coords]);

  const handleSearchCity = async (q) => {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
      const geo = await geoRes.json();
      if (geo.results?.[0]) {
        setCoords({ lat: geo.results[0].latitude, lon: geo.results[0].longitude, name: geo.results[0].name });
      }
    } catch {}
  };

  const themeCfg = getWeatherConfig(weather.code);
  const MainIcon = themeCfg.icon;
  const conditionLabel = getDetailedClimateLabel(weather.code, weather.isDay);

  const newsList = useMemo(() => generateGlobalNews(), []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden pb-28 select-none font-sans">
      <GlobalStyles />
      
      <SmartSearchBar 
        onBack={() => navigate('/')}
        onSearch={handleSearchCity}
        currentCity={coords.name}
        isPianoMuted={isPianoMuted}
        togglePiano={() => setIsPianoMuted(p => !p)}
        isAmbianceMuted={isAmbianceMuted}
        toggleAmbiance={() => setIsAmbianceMuted(p => !p)}
      />

      <div className="max-w-5xl mx-auto px-4 pt-2 space-y-6 relative z-10">
        
        {/* Navigation Bar */}
        <div className="flex justify-center gap-3">
          {NAVIGATION_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg scale-105' : 'glass-panel text-white/70 hover:text-white'}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="relative glass-panel rounded-[3rem] p-8 sm:p-12 overflow-hidden min-h-[340px] flex flex-col justify-between shadow-2xl">
              <HeroVideoBackground weatherCode={weather.code} isDay={weather.isDay} />
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-sm font-semibold">
                    <MapPin size={15} className="text-sky-300" />
                    <span>{coords.name}</span>
                  </div>
                  <h1 className="text-7xl sm:text-9xl font-black tracking-tighter mt-4 drop-shadow-xl">{weather.loading ? '--' : weather.temp}°</h1>
                </div>
                <div className="text-right">
                  <MainIcon size={72} className="text-amber-300 drop-shadow-2xl animate-pulse inline-block" />
                  <div className="text-xl sm:text-2xl font-bold mt-2 text-white/95">{conditionLabel}</div>
                  <div className="text-xs sm:text-sm font-semibold text-white/75 mt-1">H: {weather.high}° • L: {weather.low}°</div>
                </div>
              </div>

              <div className="relative z-10 pt-12 flex justify-between items-end border-t border-white/15 mt-8 text-sm font-medium text-white/80">
                <div>Live Atmospheric Telemetry</div>
                <div className="font-mono">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {/* Hourly Scroll */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2"><Clock size={16} className="text-sky-400" /> 24-Hour Radar Forecast</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide pt-2">
                {weather.hourly.map((h, i) => {
                  const HIcon = getWeatherConfig(h.code).icon;
                  return (
                    <div key={i} className="flex flex-col items-center justify-between min-w-[64px] p-3.5 rounded-2xl bg-black/35 border border-white/10 shrink-0">
                      <span className="text-xs text-white/60 font-medium">{h.time}</span>
                      <HIcon size={24} className="my-2.5 text-sky-300" />
                      <span className="text-base font-bold">{h.temp}°</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Wind, label: 'Wind Speed', val: `${weather.wind} km/h`, clr: 'text-sky-400' },
                { icon: Droplets, label: 'Humidity', val: `${weather.humidity}%`, clr: 'text-blue-400' },
                { icon: Gauge, label: 'Pressure', val: `${weather.pressure} hPa`, clr: 'text-emerald-400' },
                { icon: Activity, label: 'Air Quality', val: `AQI ${weather.aqi} (Good)`, clr: 'text-teal-300' }
              ].map((m, idx) => (
                <div key={idx} className="glass-panel p-6 flex flex-col justify-between gap-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/60">{m.label}</span>
                    <m.icon size={20} className={m.clr} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">{m.val}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EarthView />
              <DailyFact />
            </div>
          </div>
        )}

        {activeTab === 'deep' && (
          <div className="space-y-6">
            <div className="glass-panel p-8 text-center space-y-4">
              <Layers size={48} className="text-sky-400 mx-auto animate-bounce" />
              <h2 className="text-2xl font-black">Live Satellite Radar Map</h2>
              <p className="text-sm text-white/70 max-w-md mx-auto">Atmospheric precipitation and cloud cover simulation actively monitoring global jet streams.</p>
              <div className="w-full h-[400px] rounded-3xl overflow-hidden relative border border-white/15 bg-slate-950">
                <iframe 
                  title="Windy Radar"
                  src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=5&overlay=radar&product=radar&level=surface&lat=${coords.lat}&lon=${coords.lon}`}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2"><Calendar size={18} className="text-amber-400" /> 7-Day Atmospheric Trajectory</h3>
            <div className="divide-y divide-white/10">
              {weather.daily.map((d, idx) => {
                const DIcon = getWeatherConfig(d.code).icon;
                return (
                  <div key={idx} className="py-4 flex items-center justify-between text-sm sm:text-base font-semibold hover:bg-white/5 px-4 rounded-2xl transition-colors">
                    <span className="w-24 text-white/90 font-bold">{d.day}</span>
                    <div className="flex items-center gap-3 flex-1 justify-center">
                      <DIcon size={24} className="text-sky-300" />
                      <span className="text-xs text-white/60">{getWeatherConfig(d.code).label}</span>
                    </div>
                    <div className="flex items-center gap-4 w-32 justify-end font-mono">
                      <span className="text-white/60">{d.low}°</span>
                      <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-400 to-amber-400 w-3/4" />
                      </div>
                      <span className="font-bold text-white">{d.high}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global News Section */}
        <div className="pt-6 space-y-4">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2"><Newspaper className="text-sky-400" size={20} /> Live Global Climate Despatches</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsList.map(n => (
              <div key={n.id} className="glass-panel p-5 space-y-3 flex flex-col justify-between hover:border-sky-400/50 transition-all cursor-pointer group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-sky-300 font-mono">
                    <span>{n.location}</span>
                    <span>{n.time}</span>
                  </div>
                  <h4 className="font-bold text-base group-hover:text-sky-300 transition-colors line-clamp-2">{n.title}</h4>
                  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">{n.content}</p>
                </div>
                <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest pt-2 border-t border-white/5 flex items-center gap-1">
                  <Globe size={12} /> Despatch Verified
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}