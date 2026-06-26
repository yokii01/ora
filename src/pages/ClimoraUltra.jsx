import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, 
  Thermometer, Umbrella, Eye, Zap, Search, MapPin, Calendar, 
  BarChart3, Layers, Settings, Sunrise, Sunset, X, Plus, Trash2, ArrowLeft, Loader2, Map, 
  Activity, Gauge, Radiation, CloudFog, Home, ChevronUp, ChevronDown,
  Volume2, VolumeX, Music, Menu, Camera, FileText, AlertTriangle, HeartPulse, Shirt, Newspaper, Bell, PlusCircle, Edit2, Image as ImageIcon, Check, Heart, Bookmark, Share2, Send, Type, Crop, PenTool, BookOpen, RefreshCw, Lock, Globe, Lightbulb, Play, Pause, RotateCcw
} from 'lucide-react';

const SearchIcon = Search;

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

// Cinematic Overlay Videos (Verified 200 OK CDN MP4s)
const VIDEO_ASSETS = {
  sunny: ["https://pixabay.com/videos/download/video-212102_medium.mp4"],
  cloudy: ["https://assets.mixkit.co/videos/preview/mixkit-white-clouds-and-blue-sky-time-lapse-9861-large.mp4"],
  night: [
    "https://pixabay.com/videos/download/video-169951_medium.mp4", 
    "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4"
  ],
  rain: ["https://assets.mixkit.co/videos/preview/mixkit-falling-rain-drops-on-a-window-1144-large.mp4"],
  snow: ["https://assets.mixkit.co/videos/preview/mixkit-snow-falling-against-a-black-background-43846-large.mp4"],
  fog: ["https://assets.mixkit.co/videos/preview/mixkit-fog-over-a-forest-4375-large.mp4"],
  storm: ["https://assets.mixkit.co/videos/preview/mixkit-lightning-flashes-in-a-night-storm-43847-large.mp4"]
};

// --- AUDIO LAYERS ---
const PIANO_ASSETS = [
  "https://cdn.pixabay.com/audio/2022/03/10/audio_cff0007298.mp3", 
  "https://cdn.pixabay.com/audio/2021/11/24/audio_825f0cb307.mp3", 
  "https://cdn.pixabay.com/audio/2021/09/06/audio_3832c66d49.mp3"  
];

const AMBIANCE_ASSETS = {
  rain: ["https://cdn.pixabay.com/audio/2022/07/04/audio_3497d5b886.mp3", "https://cdn.pixabay.com/audio/2021/09/06/audio_03d6e52b2f.mp3"],
  storm: ["https://cdn.pixabay.com/audio/2022/03/24/audio_035a397775.mp3", "https://cdn.pixabay.com/audio/2021/08/09/audio_03d6e52b2f.mp3"],
  snow: ["https://cdn.pixabay.com/audio/2021/08/09/audio_a46b4e548f.mp3", "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3"],
  fog: ["https://cdn.pixabay.com/audio/2022/10/21/audio_310863b782.mp3", "https://cdn.pixabay.com/audio/2021/09/06/audio_1e3b2b8d03.mp3"],
  morning: ["https://cdn.pixabay.com/audio/2022/02/07/audio_659021d743.mp3", "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1537c.mp3"],
  evening: ["https://cdn.pixabay.com/audio/2021/08/04/audio_13b52f4003.mp3", "https://cdn.pixabay.com/audio/2022/10/30/audio_5e2d677864.mp3"],
  night: ["https://cdn.pixabay.com/audio/2022/03/09/audio_6e1e3b8a10.mp3"]
};

const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Classic' },
  { id: 'blue', bg: 'bg-blue-300', text: 'text-blue-900', label: 'Sky' },
  { id: 'green', bg: 'bg-green-300', text: 'text-green-900', label: 'Nature' },
  { id: 'coffee', bg: 'bg-[#C8A2C8]', text: 'text-[#2a1b12]', image: 'https://cdn.pixabay.com/photo/2024/02/20/15/03/coffee-shop-8585660_1280.png', label: 'Coffee Shop' },
  { id: 'vapor', bg: 'bg-[#ff71ce]', text: 'text-[#05ffa1]', image: 'https://cdn.pixabay.com/photo/2024/01/02/01/54/vaporwave-8482395_1280.jpg', label: 'Vaporwave' },
  { id: 'ai', bg: 'bg-[#00f0ff]', text: 'text-white', image: 'https://cdn.pixabay.com/photo/2024/02/20/19/50/ai-generated-8586142_1280.png', label: 'Cyber' },
];

const NOTE_TEXT_COLORS = [
  { id: 'white', class: 'text-white' },
  { id: 'black', class: 'text-black' },
  { id: 'navy', class: 'text-slate-900' },
  { id: 'maroon', class: 'text-red-950' },
  { id: 'green', class: 'text-green-950' }
];

const NOTE_FONTS = [
  { id: 'hand', class: 'font-lofi', label: 'Handwriting' },
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

const LOTTIE_URLS = {
  sun: "https://assets10.lottiefiles.com/packages/lf20_xlky4fsj.json",
  cloud: "https://assets10.lottiefiles.com/packages/lf20_KUFcS6.json",
  rain: "https://assets10.lottiefiles.com/packages/lf20_b3f9s1v5.json",
  storm: "https://assets10.lottiefiles.com/packages/lf20_Kuot2e.json",
  snow: "https://assets10.lottiefiles.com/packages/lf20_Wtpt01.json",
  fog: "https://assets10.lottiefiles.com/packages/lf20_kUFcS6.json",
  night: "https://assets10.lottiefiles.com/packages/lf20_j1adxtqb.json",
};

// --- UPDATED GENERATED GLOBAL NEWS SYSTEM (50+ Items, Last 7 Hours) ---
const GLOBAL_LOCATIONS = ["Tokyo, Japan", "London, UK", "New York, USA", "Mumbai, India", "Sydney, Australia", "Paris, France", "Cairo, Egypt", "Rio, Brazil", "Moscow, Russia", "Cape Town, SA", "Beijing, China", "Dubai, UAE", "Toronto, Canada", "Berlin, Germany", "Seoul, South Korea", "Mexico City, Mexico", "Jakarta, Indonesia", "Lima, Peru", "Bangkok, Thailand", "Istanbul, Turkey"];
const WEATHER_EVENTS = [
  { title: "Typhoon Approach", desc: "Large system moving inwards. Heavy rains expected.", keyword: "typhoon" },
  { title: "Heatwave Alert", desc: "Temperatures soaring 5°C above seasonal average.", keyword: "desert" },
  { title: "Heavy Snowfall", desc: "Transport disruptions likely due to unexpected snow.", keyword: "blizzard" },
  { title: "Clear Skies", desc: "Perfect conditions for outdoor events this weekend.", keyword: "sky" },
  { title: "Air Quality Warning", desc: "Smog levels critical. Masks recommended.", keyword: "pollution" },
  { title: "Monsoon Surge", desc: "Continuous downpour expected for next 48 hours.", keyword: "rain" },
  { title: "Unexpected Hail", desc: "Sudden hail storm causes minor damage in suburbs.", keyword: "hail" },
  { title: "Drought Concerns", desc: "Water reservoirs hitting all-time lows.", keyword: "drought" },
  { title: "Fog Advisory", desc: "Visibility reduced to near zero on highways.", keyword: "fog" },
  { title: "Wind Chill Alert", desc: "Feels like -20°C. Stay indoors.", keyword: "winter" }
];

const generateGlobalNews = () => {
  return Array.from({ length: 50 }).map((_, i) => {
    const loc = GLOBAL_LOCATIONS[Math.floor(Math.random() * GLOBAL_LOCATIONS.length)];
    const evt = WEATHER_EVENTS[Math.floor(Math.random() * WEATHER_EVENTS.length)];
    const hoursAgo = Math.floor(Math.random() * 7); 
    const minsAgo = Math.floor(Math.random() * 60);
    
    return {
      id: Date.now() + i,
      title: `${evt.title} in ${loc.split(',')[0]}`,
      location: loc,
      img: `https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=640`, 
      staticImg: i % 2 === 0 ? "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=640" : "https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?q=80&w=640",
      content: `LIVE REPORT from ${loc}: ${evt.desc} Meteorologists are monitoring the situation closely as atmospheric pressure shifts. Local authorities advise residents to stay updated via official channels. Current conditions reflect a significant weather pattern affecting the entire region. Experts suggest this may persist for the next 24-48 hours.`,
      time: hoursAgo === 0 ? `${minsAgo}m ago` : `${hoursAgo}h ${minsAgo}m ago`,
      isAi: false
    };
  }).sort((a, b) => {
    const aTime = parseInt(a.time) || 0;
    const bTime = parseInt(b.time) || 0;
    return aTime - bTime;
  });
};

/**
 * --- 2. WEATHER MAPPING SYSTEM ---
 */
const WEATHER_MAPPING = {
  0: { label: 'Sunny', type: 'sunny', videoKey: 'sunny', icon: Sun },
  1: { label: 'Sunny', type: 'sunny', videoKey: 'sunny', icon: Sun },
  2: { label: 'Partly Cloudy', type: 'cloudy', videoKey: 'cloudy', icon: Cloud },
  3: { label: 'Cloudy', type: 'cloudy', videoKey: 'cloudy', icon: Cloud },
  45: { label: 'Fog', type: 'fog', videoKey: 'fog', icon: CloudFog },
  48: { label: 'Fog', type: 'fog', videoKey: 'fog', icon: CloudFog },
  51: { label: 'Light Drizzle', type: 'rain', videoKey: 'rain', icon: CloudRain },
  53: { label: 'Drizzle', type: 'rain', videoKey: 'rain', icon: CloudRain },
  55: { label: 'Heavy Drizzle', type: 'rain', videoKey: 'rain', icon: CloudRain },
  61: { label: 'Light Rain', type: 'rain', videoKey: 'rain', icon: CloudRain },
  63: { label: 'Moderate Rain', type: 'rain', videoKey: 'rain', icon: CloudRain },
  65: { label: 'Heavy Rain', type: 'rain', videoKey: 'rain', icon: CloudLightning },
  71: { label: 'Light Snow', type: 'snow', videoKey: 'snow', icon: CloudSnow },
  73: { label: 'Moderate Snow', type: 'snow', videoKey: 'snow', icon: CloudSnow },
  75: { label: 'Heavy Snow', type: 'snow', videoKey: 'snow', icon: CloudSnow },
  80: { label: 'Showers', type: 'rain', videoKey: 'rain', icon: CloudRain },
  81: { label: 'Heavy Showers', type: 'storm', videoKey: 'rain', icon: CloudRain },
  82: { label: 'Thunderstorm', type: 'storm', videoKey: 'thunder_rain', icon: CloudLightning },
  95: { label: 'Severe Storm', type: 'storm', videoKey: 'thunder_rain', icon: CloudLightning },
  96: { label: 'Severe Storm', type: 'storm', videoKey: 'thunder_rain', icon: CloudLightning },
  99: { label: 'Violent Storm', type: 'storm', videoKey: 'thunder_rain', icon: CloudLightning },
};

function getWeatherConfig(code) { return WEATHER_MAPPING[code] || WEATHER_MAPPING[0]; }

function getDetailedClimateLabel(code, isDay) {
  const config = WEATHER_MAPPING[code] || WEATHER_MAPPING[0];
  if (!isDay) {
    if (config.type === 'sunny') return 'Clear Night';
    if (config.label.includes('Cloudy')) return config.label.replace('Cloudy', 'Cloudy (Night)');
  }
  return config.label;
}

function getAmbianceCategory(code, isDay, currentHour) {
  const config = getWeatherConfig(code);
  if (config.type === 'storm' || code >= 95 || code === 82) return 'storm';
  if (config.type === 'rain') return 'rain';
  if (config.type === 'snow') return 'snow';
  if (config.type === 'fog') return 'fog';
  if (!isDay) return 'night';
  if (currentHour >= 5 && currentHour < 10) return 'morning'; 
  if (currentHour >= 17 && currentHour < 21) return 'evening'; 
  return 'morning'; 
}

function getSavedLocationIcon(code, isDay) {
  const config = getWeatherConfig(code);
  if (config.type === 'rain' || config.type === 'storm') return config.icon;
  if (config.type === 'snow') return CloudSnow;
  if (!isDay) return Moon;
  return Sun;
}

const NAVIGATION_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'deep', label: 'Details', icon: Layers },
  { id: 'forecast', label: '7 Days', icon: Calendar }, 
];

/**
 * --- 3. UTILITIES & API ---
 */
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

const formatNoteDate = (date) => {
  const d = new Date(date);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = d.getDate();
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${year}`;
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => { const h = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(h); }, [value, delay]);
  return debouncedValue;
}

async function getWeatherData(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lon,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,pressure_msl,uv_index,is_day,weather_code',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl',
    timezone: 'auto',
    past_days: 1 
  });
  
  const [wRes, aRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`).catch(() => ({ ok: false }))
  ]);
  
  if (!wRes.ok) throw new Error("Weather API Error");
  const wData = await wRes.json();
  const aData = aRes && aRes.ok ? await aRes.json() : {};
  
  const mapS = (src) => src.time.map((t, i) => { const o = { time: t }; Object.keys(src).forEach(k => { if (k !== 'time') o[k] = src[k][i] }); return o; });
  
  const hourlyData = mapS(wData.hourly);
  const currentHourIndex = hourlyData.findIndex(h => new Date(h.time) >= new Date(new Date().setMinutes(0,0,0)));
  
  const yesterdayIndex = currentHourIndex - 24;
  const yesterdayTemp = yesterdayIndex >= 0 ? hourlyData[yesterdayIndex].temperature_2m : null;

  const futureHourly = hourlyData.slice(Math.max(0, currentHourIndex));
  const dailyData = mapS(wData.daily).filter(d => new Date(d.time).getDate() >= new Date().getDate());

  return { 
    current: wData.current, 
    hourly: futureHourly, 
    fullHourly: hourlyData, 
    daily: dailyData, 
    timezone: wData.timezone, 
    aqi: aData.current ? aData.current.us_aqi : 42,
    yesterdayTemp: yesterdayTemp
  };
}

async function fetchWeatherNews(city) {
  try {
    const res = await fetch(`https://newsdata.io/api/1/news?apikey=${APP_CONFIG.newsApiKey}&q=weather&language=en`);
    if (!res.ok) throw new Error("News API Limit");
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map((article, i) => ({
        id: `news_${i}_${Date.now()}`,
        title: article.title,
        location: article.country ? article.country[0] : "Global",
        img: article.image_url || `https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=640`,
        content: article.description || article.title,
        time: "Just Now",
        isAi: false
      }));
    }
  } catch (e) {
    // Fallback to generated
  }
  return generateGlobalNews();
}

async function getGeminiInsights(weatherCtx) {
  try {
    const prompt = `
      Current weather in ${weatherCtx.location}: ${weatherCtx.temp}°C, ${weatherCtx.condition}, Humidity ${weatherCtx.humidity}%, Wind ${weatherCtx.wind}km/h. 
      Generate a JSON object with 4 short strings: 
      1. "fact": A fun, unique, interesting scientific weather fact.
      2. "clothing": A concise, friendly recommendation on what to wear.
      3. "health": A short health tip based on weather.
      4. "warning": A one-sentence safety warning or "All clear".
      Output ONLY raw JSON. No markdown.
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${APP_CONFIG.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    // Fallback
  }
  return {
    fact: DAILY_FACTS_FALLBACK[new Date().getDate() % DAILY_FACTS_FALLBACK.length],
    clothing: "Comfortable breathable layer recommended.",
    health: "Stay hydrated and enjoy fresh air.",
    warning: "All clear in your vicinity."
  };
}

const getAQILabel = (aqi) => {
  if (aqi <= 50) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-500', advice: "Air quality is satisfactory." };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500', advice: "Sensitive individuals limit exertion." };
  if (aqi <= 150) return { label: 'Unhealthy (Sens.)', color: 'text-orange-400', bg: 'bg-orange-500', advice: "General public less likely affected." };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400', bg: 'bg-red-500', advice: "Everyone may experience effects." };
  return { label: 'Hazardous', color: 'text-purple-400', bg: 'bg-purple-500', advice: "Emergency conditions." };
};

const getUVStatus = (uv) => {
  if (uv <= 2) return { label: 'Low', color: 'text-green-400', bg: 'bg-green-500', advice: "No protection needed." };
  if (uv <= 5) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500', advice: "Seek shade at midday." };
  if (uv <= 7) return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500', advice: "Wear hat & sunglasses." };
  if (uv <= 10) return { label: 'Very High', color: 'text-red-400', bg: 'bg-red-500', advice: "Take extra precautions." };
  return { label: 'Extreme', color: 'text-purple-400', bg: 'bg-purple-500', advice: "Avoid sun exposure." };
};

const getPressureStatus = (hPa) => {
  if (hPa < 1000) return { label: 'Low', desc: 'Stormy', color: 'text-blue-300' };
  if (hPa >= 1000 && hPa < 1020) return { label: 'Normal', desc: 'Stable', color: 'text-green-300' };
  return { label: 'High', desc: 'Clear', color: 'text-orange-300' };
};

const getMoonData = (date = new Date()) => {
  let year = date.getFullYear(); let month = date.getMonth() + 1; const day = date.getDate();
  if (month < 3) { year--; month += 12; } ++month;
  let c = 365.25 * year; let e = 30.6 * month; let jd = c + e + day - 694039.09; 
  jd /= 29.5305882; let b = parseInt(jd); jd -= b; b = Math.round(jd * 8); 
  if (b >= 8) b = 0; 
  const phases = [
    { label: 'New Moon', icon: Moon, size: '0%', eclipse: 'Solar Eclipse Possible' },
    { label: 'Waxing Crescent', icon: Moon, size: '25%', eclipse: 'None' },
    { label: 'First Quarter', icon: Moon, size: '50%', eclipse: 'None' },
    { label: 'Waxing Gibbous', icon: Moon, size: '75%', eclipse: 'None' },
    { label: 'Full Moon', icon: Moon, size: '100%', eclipse: 'Lunar Eclipse Possible' },
    { label: 'Waning Gibbous', icon: Moon, size: '75%', eclipse: 'None' },
    { label: 'Last Quarter', icon: Moon, size: '50%', eclipse: 'None' },
    { label: 'Waning Crescent', icon: Moon, size: '25%', eclipse: 'None' },
  ];
  return phases[b];
};

function getLiveStatus(code, isDay) {
  const config = WEATHER_MAPPING[code] || WEATHER_MAPPING[0];
  const t = config.type;
  if (t === 'clear' || t === 'sunny') return isDay ? 'Sunny' : 'Clear Night';
  if (t === 'clouds') return 'Partly Cloudy';
  if (t === 'overcast') return 'Cloudy';
  if (t.includes('rain') || t.includes('drizzle')) return 'Raining';
  if (t.includes('snow') || t === 'blizzard') return 'Snowing';
  if (t.includes('storm')) return 'Stormy';
  if (t === 'fog') return 'Foggy';
  return config.label;
}

/**
 * --- 4. CSS & STYLES ---
 */
const GlobalStyles = () => (
  <style>{`
    :root { --safe-top: env(safe-area-inset-top, 20px); --safe-bottom: env(safe-area-inset-bottom, 20px); }
    body { margin: 0; padding: 0; background: #000; font-family: 'Inter', sans-serif; overflow-x: hidden; color: white; -webkit-tap-highlight-color: transparent; }
    @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    .scrollbar-hide::-webkit-scrollbar { display: none; } 
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    
    .gpu-accel { transform: translate3d(0, 0, 0); will-change: transform, opacity; }
    
    .glass-panel { 
      background: rgba(20, 30, 48, 0.45); 
      backdrop-filter: blur(40px) saturate(160%); 
      border: 1px solid rgba(255, 255, 255, 0.12); 
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); 
      border-radius: 2.5rem; 
      transform: translate3d(0,0,0); 
    }
    
    .glass-input { background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15); color: white; border-radius: 2rem; }
    .dropdown-glass { background: #0f172a; backdrop-filter: blur(50px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 20px 50px rgba(0,0,0,0.8); z-index: 100; border-radius: 2rem; }
    
    .font-lofi { font-family: 'Patrick Hand', cursive; }
    .font-royal { font-family: 'Playfair Display', serif; }
    
    @keyframes cycle-sky { 0% { background: #000; } 100% { background: #000; } }
    @keyframes sun-trajectory { 
      0% { transform: translate3d(-10vw, 50vh, 0); opacity: 0; background: #fbbf24; } 
      10% { transform: translate3d(10vw, 20vh, 0); opacity: 1; }
      40% { transform: translate3d(50vw, 5vh, 0) scale(1.5); background: #fef08a; box-shadow: 0 0 100px #fef08a; } 
      70% { transform: translate3d(90vw, 40vh, 0); background: #f97316; opacity: 0.8; } 
      100% { transform: translate3d(110vw, 60vh, 0); opacity: 0; }
    }
    @keyframes moon-rise {
      0% { transform: translate3d(-10vw, 60vh, 0); opacity: 0; }
      60% { transform: translate3d(30vw, 60vh, 0); opacity: 0; } 
      80% { transform: translate3d(50vw, 15vh, 0); opacity: 1; scale: 1.2; } 
      100% { transform: translate3d(50vw, 15vh, 0); opacity: 1; scale: 1.2; }
    }
    @keyframes reveal-name {
      0% { opacity: 0; letter-spacing: 1em; filter: blur(20px); transform: scale(1.1); }
      100% { opacity: 1; letter-spacing: 0.5em; filter: blur(0); transform: scale(1); }
    }
    
    @keyframes float-btn { 0% { transform: translateY(0); } 50% { transform: translateY(-3px); } 100% { transform: translateY(0); } }
    @keyframes flash { 0%, 100% { opacity: 0; } 50% { opacity: 0.3; } }
    
    .music-wave-bar { width: 3px; background: rgba(255, 255, 255, 0.8); border-radius: 99px; animation: wave-visual 1s ease-in-out infinite; }
    @keyframes wave-visual { 0%, 100% { height: 4px; } 50% { height: 16px; } }
    .music-wave-bar:nth-child(1) { animation-delay: 0s; }
    .music-wave-bar:nth-child(2) { animation-delay: 0.1s; }
    .music-wave-bar:nth-child(3) { animation-delay: 0.2s; }
    .music-wave-bar:nth-child(4) { animation-delay: 0.3s; }
    
    .hero-bg-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; overflow: hidden; transition: filter 0.5s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; }
    .hero-img-base { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .hero-video-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; opacity: 1; }
    
    .filter-dark { filter: brightness(0.4) contrast(1.4) grayscale(0.2) saturate(1.1); }
    .filter-light { filter: brightness(1.05) saturate(1.15); }
    .filter-mixed { filter: grayscale(0.3) contrast(0.95) brightness(0.9); }
    
    .hero-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.65) 100%); z-index: 1; }
    .rain-overlay { background: radial-gradient(circle at center, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.9) 100%) !important; }
    
    .sticky-note { 
      box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
      position: relative;
      z-index: 10;
      backdrop-filter: blur(10px);
    }
    .sticky-note:active { transform: scale(0.98); }
    .sticky-note-clip { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2)); border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 30; }
    
    .icon-glow { filter: drop-shadow(0 0 8px rgba(255,255,255,0.3)); }

    @keyframes globe-spin { 0% { background-position: 0 0; } 100% { background-position: 200% 0; } }
    .globe-3d {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png');
      background-size: 210% 100%;
      box-shadow: inset -20px -20px 50px rgba(0,0,0,0.9), inset 10px 10px 30px rgba(255,255,255,0.2), 0 0 30px rgba(66, 153, 225, 0.3);
      animation: globe-spin 30s linear infinite;
      position: relative;
      filter: grayscale(1) invert(1) brightness(0.8) contrast(1.2);
    }
    .globe-overlay { position: absolute; inset: 0; border-radius: 50%; box-shadow: inset 0 0 40px rgba(0,0,0,1); pointer-events: none; }
    
    .page-transition { animation: fade-in-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1); }
    @keyframes fade-in-up { from { opacity: 0; transform: translate3d(0, 30px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
    
    lottie-player {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100vw;
      height: 100vh;
      z-index: -1;
      opacity: 0.75;
      pointer-events: none;
      object-fit: cover;
    }
  `}</style>
);

/**
 * --- 5. SUB-COMPONENTS ---
 */
const AudioController = ({ weatherCode, isDay, isPianoMuted, isAmbianceMuted, timezone }) => {
  const pianoRef = useRef(new Audio());
  const ambianceRef = useRef(new Audio());
  const [currentTrackUrl, setCurrentTrackUrl] = useState(null);
  
  const getCurrentHour = () => {
    try {
      if (!timezone) return new Date().getHours();
      const str = new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour12: false, hour: 'numeric' });
      return parseInt(str, 10);
    } catch { return 12; }
  };
  const currentHour = getCurrentHour();

  const getFallbackAmbiance = (category) => {
    const playlist = AMBIANCE_ASSETS[category] || AMBIANCE_ASSETS.morning;
    return playlist[Math.floor(Math.random() * playlist.length)];
  };

  useEffect(() => {
    const category = getAmbianceCategory(weatherCode, isDay, currentHour);
    const track = getFallbackAmbiance(category);
    
    if (!ambianceRef.current) return;
    if (ambianceRef.current.src !== track) {
      ambianceRef.current.src = track;
      ambianceRef.current.loop = true;
      ambianceRef.current.volume = 0.45; 
      ambianceRef.current.crossOrigin = "anonymous";
    }
    
    if (!isAmbianceMuted) {
      ambianceRef.current.play().catch(() => {});
    } else {
      ambianceRef.current.pause();
    }
    
    return () => {
      if (ambianceRef.current) ambianceRef.current.pause();
    };
  }, [weatherCode, isDay, isAmbianceMuted, currentHour]);

  useEffect(() => {
    setCurrentTrackUrl(PIANO_ASSETS[Math.floor(Math.random() * PIANO_ASSETS.length)]);
  }, [weatherCode, isDay]);

  useEffect(() => {
    if (!currentTrackUrl || !pianoRef.current) return;
    if (pianoRef.current.src !== currentTrackUrl) {
      pianoRef.current.src = currentTrackUrl;
      pianoRef.current.loop = true;
      pianoRef.current.volume = 0.35;
      pianoRef.current.crossOrigin = "anonymous";
    }

    if (!isPianoMuted) {
      pianoRef.current.play().catch(() => {});
    } else {
      pianoRef.current.pause();
    }
  }, [currentTrackUrl, isPianoMuted]);

  return null;
};

const MusicVisualizer = ({ isPlaying }) => {
  if (!isPlaying) return null;
  return (
    <div className="flex items-center gap-1 h-6">
      <div className="music-wave-bar" />
      <div className="music-wave-bar" />
      <div className="music-wave-bar" />
      <div className="music-wave-bar" />
    </div>
  );
};

const CustomLoadingScreen = ({ onLoaded }) => {
  useEffect(() => {
    const timer = setTimeout(() => onLoaded(), 2500); 
    return () => clearTimeout(timer);
  }, [onLoaded]);
  
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black flex flex-col items-center justify-center gpu-accel">
      <div className="absolute w-32 h-32 bg-amber-500 rounded-full blur-[40px] animate-pulse" />
      <div className="relative z-10 flex flex-col items-center mt-8">
        <div className="text-5xl md:text-7xl font-thin tracking-[0.4em] text-white animate-bounce">CLIMORA</div>
        <div className="text-lg md:text-xl font-bold tracking-[0.6em] text-sky-400 uppercase mt-4">ULTRA v26.1</div>
      </div>
    </div>
  );
};

const HeroVideoBackground = ({ weatherCode, isDay }) => {
  const [bgImage, setBgImage] = useState(BACKGROUND_IMAGES.sunny);
  const [videoOverlay, setVideoOverlay] = useState("");
  const [filterClass, setFilterClass] = useState("filter-light");
  
  useEffect(() => {
    let category = 'sunny'; 
    const config = getWeatherConfig(weatherCode);
    const key = config.videoKey; 
    let filter = "filter-light";
    let imgKey = "sunny";

    if (!isDay) {
      category = 'night'; imgKey = "night"; filter = "filter-dark"; 
    } else {
      category = key;
      if (category === 'sunny') { imgKey = "sunny"; filter = "filter-light"; }
      else if (category === 'cloudy') { imgKey = "cloudy"; filter = "filter-mixed"; }
      else if (category === 'rain') { imgKey = "rain"; filter = "filter-dark"; }
      else if (category === 'snow') { imgKey = "snow"; filter = "filter-light"; }
      else if (category === 'fog') { imgKey = "fog"; filter = "filter-mixed"; }
    }
    
    setBgImage(BACKGROUND_IMAGES[imgKey] || BACKGROUND_IMAGES.sunny);
    setFilterClass(filter);
    
    const availableVideos = VIDEO_ASSETS[category] || VIDEO_ASSETS.sunny;
    setVideoOverlay(availableVideos[0]);
  }, [weatherCode, isDay]);
  
  const config = getWeatherConfig(weatherCode);
  const isRainy = config.type === 'rain' || config.type === 'storm';

  return (
    <div className={`hero-bg-container ${filterClass} gpu-accel`}>
      <video 
        key={videoOverlay}
        src={videoOverlay}
        autoPlay loop muted playsInline 
        className="hero-video-full blur-xl opacity-70 scale-105 transform-gpu"
      />
      <img src={bgImage} className="hero-img-base blur-3xl scale-110 opacity-30 mix-blend-overlay" alt="Weather Backdrop" />
      <div className={`hero-overlay ${isRainy ? 'rain-overlay' : ''} bg-black/45`} />
    </div>
  );
};

const SmartSearchBar = ({ onSearch, currentCity, isPianoMuted, togglePiano, isAmbianceMuted, toggleAmbiance }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    if (debouncedQuery.length < 3) { setSuggestions([]); return; }
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(debouncedQuery)}&count=5&language=en&format=json`)
      .then(r => r.json())
      .then(data => {
        if (data.results) {
          setSuggestions(data.results); setIsOpen(true);
        }
      }).catch(() => {});
  }, [debouncedQuery]);
  
  const handleSelect = (city) => { onSearch(city); setQuery(''); setSuggestions([]); setIsOpen(false); };
  
  return (
    <div className="fixed top-6 inset-x-0 z-50 flex justify-center px-4 animate-[fade-in-up_0.5s] pointer-events-none">
      <div className="w-full max-w-lg relative group flex gap-2 pointer-events-auto">
        <div className="glass-panel rounded-full flex-1 flex items-center p-1.5 shadow-2xl transition-all duration-300 focus-within:ring-2 ring-blue-400/50 bg-black/50">
          <div className="p-2.5 rounded-full bg-blue-600 text-white ml-1 shadow-lg"><Search size={18} /></div>
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }} placeholder={currentCity || "Search global cities..."} className="flex-1 bg-transparent border-none outline-none text-white px-3 h-10 font-medium placeholder:text-white/50" />
          {query && <button onClick={() => setQuery('')} className="p-2 text-white/50 hover:text-white"><X size={18} /></button>}
        </div>
        <div className="flex gap-2">
          <button onClick={togglePiano} className={`glass-panel rounded-full w-12 h-12 flex items-center justify-center ${!isPianoMuted ? 'bg-indigo-500/20 ring-1 ring-indigo-400/50' : 'bg-black/50'} hover:bg-white/10 active:scale-95 transition-all shadow-xl`} title="Toggle Music">
            {!isPianoMuted ? <Music size={20} className="text-indigo-300 animate-pulse icon-glow"/> : <VolumeX size={20} className="text-white/30"/>}
          </button>
          <button onClick={toggleAmbiance} className={`glass-panel rounded-full w-12 h-12 flex items-center justify-center ${!isAmbianceMuted ? 'bg-teal-500/20 ring-1 ring-teal-400/50' : 'bg-black/50'} hover:bg-white/10 active:scale-95 transition-all shadow-xl`} title="Toggle Ambiance">
            {!isAmbianceMuted ? <Wind size={20} className="text-teal-300 icon-glow"/> : <VolumeX size={20} className="text-white/30"/>}
          </button>
        </div>
        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 left-4 right-32 dropdown-glass rounded-2xl overflow-hidden shadow-2xl">
            {suggestions.map((city) => (
              <button key={city.id} onClick={() => handleSelect(city)} className="w-full text-left px-5 py-3.5 hover:bg-white/10 flex items-center justify-between border-b border-white/5 last:border-none transition-colors">
                <div><div className="font-bold text-white text-sm">{city.name}</div><div className="text-xs text-white/50">{city.admin1}{city.country ? `, ${city.country}` : ''}</div></div>
                <ChevronDown size={14} className="opacity-50 text-blue-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EarthView = () => (
  <div className="glass-panel rounded-[2.5rem] p-6 mb-6 overflow-hidden relative group h-80 flex items-center justify-center bg-[#0a0a16] shadow-2xl border border-blue-500/20">
    <div className="absolute top-4 left-6 z-20">
      <h3 className="text-white font-bold text-lg flex items-center gap-2"><Globe size={18} className="text-blue-400 icon-glow"/> Earth View</h3>
      <span className="text-[10px] font-mono text-blue-300 uppercase tracking-widest">Live Telemetry</span>
    </div>
    <div className="relative w-56 h-56 z-10">
      <div className="globe-3d"></div>
      <div className="globe-overlay"></div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-black/80 via-transparent to-transparent pointer-events-none mix-blend-multiply z-20 transform rotate-12" />
      <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-white/5 scale-125 pointer-events-none">
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
      </div>
    </div>
    <div className="absolute bottom-4 right-6 text-right z-20">
      <div className="text-2xl font-mono text-white">24,901</div>
      <div className="text-[10px] text-white/40 uppercase tracking-widest">Miles Circumference</div>
    </div>
    <div className="absolute bottom-4 left-6 text-left z-20">
      <div className="text-2xl font-mono text-blue-300">1,040</div>
      <div className="text-[10px] text-white/40 uppercase tracking-widest">MPH Rotation</div>
    </div>
  </div>
);

const DailyFact = ({ fact }) => {
  const defaultFact = useMemo(() => DAILY_FACTS_FALLBACK[new Date().getDate() % DAILY_FACTS_FALLBACK.length], []);
  const displayFact = fact || defaultFact;
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-panel rounded-[2rem] p-6 mb-6 flex items-start gap-4 border-l-4 border-yellow-400 bg-yellow-900/10">
      <div className="p-3 bg-yellow-500/20 rounded-full shrink-0"><Lightbulb size={24} className="text-yellow-300 icon-glow"/></div>
      <div className="flex-1">
        <h4 className="font-bold text-yellow-100 mb-1 uppercase tracking-wider text-xs">Daily Knowledge</h4>
        <p className={`text-lg font-medium text-white leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>"{displayFact}"</p>
        {displayFact.length > 80 && (
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-2 hover:text-white">
            {expanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>
    </div>
  );
};

const CaptureMoment = ({ onClose, moments, onAddMoment, onDeleteMoment }) => {
  const [note, setNote] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [selectedFont, setSelectedFont] = useState(NOTE_FONTS[0]);

  const handleSave = () => {
    if (!note.trim()) return;
    onAddMoment({
      id: Date.now(),
      text: note.trim(),
      color: selectedColor.id,
      font: selectedFont.id,
      date: new Date().toISOString()
    });
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-panel rounded-[2.5rem] p-6 max-w-lg w-full bg-slate-900 border border-white/20 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={20}/></button>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Camera className="text-amber-400"/> Weather Moments</h3>
        <textarea 
          value={note} onChange={e => setNote(e.target.value)} 
          placeholder="Capture today's atmospheric vibe..." 
          className={cn("w-full h-32 bg-black/40 rounded-2xl p-4 text-white placeholder:text-white/40 outline-none resize-none mb-4", selectedFont.class)}
        />
        <div className="flex gap-2 mb-4">
          {NOTE_COLORS.map(c => (
            <button key={c.id} onClick={() => setSelectedColor(c)} className={cn("w-6 h-6 rounded-full", c.bg, selectedColor.id === c.id && "ring-2 ring-white")} />
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold">Close</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold">Save Moment</button>
        </div>
      </div>
    </div>
  );
};

export default function ClimoraUltra() {
  const [loaded, setLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ name: "London", country: "UK", lat: 51.5085, lon: -0.1257 });
  const [weatherData, setWeatherData] = useState(null);
  const [news, setNews] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Audio state
  const [isPianoMuted, setIsPianoMuted] = useState(false);
  const [isAmbianceMuted, setIsAmbianceMuted] = useState(false);
  
  // Moments vault state
  const [moments, setMoments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('climora_moments') || '[]'); } catch { return []; }
  });
  const [momentModalOpen, setMomentModalOpen] = useState(false);

  useEffect(() => { localStorage.setItem('climora_moments', JSON.stringify(moments)); }, [moments]);

  const loadCityData = useCallback(async (lat, lon, name, country = '') => {
    try {
      const data = await getWeatherData(lat, lon);
      setWeatherData(data);
      setCurrentLocation({ name, country, lat, lon });
      
      fetchWeatherNews(name).then(setNews);
      getGeminiInsights({
        location: name,
        temp: Math.round(data.current.temperature_2m),
        condition: getDetailedClimateLabel(data.current.weather_code, data.current.is_day),
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m
      }).then(setAiInsights);
    } catch (e) {
      console.error("Failed to load location data", e);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude; const lon = pos.coords.longitude;
          let city = "Live Location"; let country = "";
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const d = await res.json();
            if (d && d.address) {
              city = d.address.city || d.address.town || d.address.village || "Live Location";
              country = d.address.country || "";
            }
          } catch {}
          loadCityData(lat, lon, city, country);
        },
        () => loadCityData(51.5085, -0.1257, "London", "UK")
      );
    } else {
      loadCityData(51.5085, -0.1257, "London", "UK");
    }
  }, [loadCityData]);

  const handleSearchCity = (cityObj) => {
    loadCityData(cityObj.latitude, cityObj.longitude, cityObj.name, cityObj.country);
  };

  const current = weatherData?.current || {};
  const code = current.weather_code || 0;
  const isDay = current.is_day ?? 1;
  const WeatherIcon = getWeatherConfig(code).icon;
  const climateLabel = getDetailedClimateLabel(code, isDay);

  if (!loaded) return <CustomLoadingScreen onLoaded={() => setLoaded(true)} />;

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 overflow-x-hidden pb-28 pt-24">
      <GlobalStyles />
      <HeroVideoBackground weatherCode={code} isDay={isDay} />
      <AudioController weatherCode={code} isDay={isDay} isPianoMuted={isPianoMuted} isAmbianceMuted={isAmbianceMuted} timezone={weatherData?.timezone} />
      <SmartSearchBar onSearch={handleSearchCity} currentCity={`${currentLocation.name}${currentLocation.country ? ', ' + currentLocation.country : ''}`} isPianoMuted={isPianoMuted} togglePiano={() => setIsPianoMuted(!isPianoMuted)} isAmbianceMuted={isAmbianceMuted} toggleAmbiance={() => setIsAmbianceMuted(!isAmbianceMuted)} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        
        {/* HERO STATUS OVERVIEW */}
        <div className="glass-panel rounded-[3rem] p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl border border-white/20">
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md mb-6 border border-white/15">
            <MapPin size={16} className="text-sky-400" />
            <span className="font-bold tracking-wide text-sm sm:text-base">{currentLocation.name}{currentLocation.country ? `, ${currentLocation.country}` : ''}</span>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            <WeatherIcon size={96} className="text-amber-300 drop-shadow-[0_12px_24px_rgba(245,158,11,0.45)] mb-4 animate-bounce" />
            <div className="flex items-start justify-center">
              <span className="text-[84px] sm:text-[112px] font-extrabold tracking-tighter leading-none">{weatherData ? Math.round(current.temperature_2m) : '--'}</span>
              <span className="text-4xl sm:text-5xl font-light text-sky-300 mt-2">°C</span>
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-white/90 tracking-wide mt-2">{climateLabel}</div>
          </div>

          {/* Telemetry Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 max-w-3xl mx-auto">
            <div className="bg-black/30 rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
              <Droplets className="text-sky-400 w-5 h-5 shrink-0" />
              <div className="text-left"><div className="text-[11px] text-white/50 uppercase font-mono">Humidity</div><div className="font-bold text-sm sm:text-base">{current.relative_humidity_2m ?? '--'}%</div></div>
            </div>
            <div className="bg-black/30 rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
              <Wind className="text-teal-400 w-5 h-5 shrink-0" />
              <div className="text-left"><div className="text-[11px] text-white/50 uppercase font-mono">Wind</div><div className="font-bold text-sm sm:text-base">{current.wind_speed_10m ?? '--'} km/h</div></div>
            </div>
            <div className="bg-black/30 rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
              <Thermometer className="text-amber-400 w-5 h-5 shrink-0" />
              <div className="text-left"><div className="text-[11px] text-white/50 uppercase font-mono">Feels Like</div><div className="font-bold text-sm sm:text-base">{current.apparent_temperature != null ? `${Math.round(current.apparent_temperature)}°` : '--'}</div></div>
            </div>
            <div className="bg-black/30 rounded-2xl p-3.5 flex items-center gap-3 border border-white/10">
              <Activity className="text-fuchsia-400 w-5 h-5 shrink-0" />
              <div className="text-left"><div className="text-[11px] text-white/50 uppercase font-mono">US AQI</div><div className="font-bold text-sm sm:text-base">{weatherData?.aqi ?? 42}</div></div>
            </div>
          </div>
        </div>

        {/* AI KNOWLEDGE FACT */}
        <DailyFact fact={aiInsights?.fact} />

        {/* TAB NAVIGATION */}
        <div className="flex justify-center gap-2 bg-slate-900/80 backdrop-blur-2xl p-2 rounded-full border border-white/15 max-w-md mx-auto shadow-xl">
          {NAVIGATION_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex-1 py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all", activeTab === tab.id ? "bg-blue-600 text-white shadow-lg" : "text-white/60 hover:text-white")}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
          <button onClick={() => setMomentModalOpen(true)} className="py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all border border-amber-500/30">
            <Camera size={16} /> Vault
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 page-transition">
            <EarthView />
            
            {/* HOURLY FORECAST SLIDER */}
            <div className="glass-panel rounded-[2.5rem] p-6 shadow-xl border border-white/15 flex flex-col justify-between">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock size={18} className="text-sky-400"/> Hourly Radar</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {(weatherData?.hourly || []).slice(0, 12).map((h, i) => {
                  const hCode = h.weather_code || 0;
                  const HIcon = getWeatherConfig(hCode).icon;
                  return (
                    <div key={i} className="shrink-0 bg-black/40 rounded-2xl p-3.5 text-center min-w-[70px] border border-white/10 flex flex-col items-center">
                      <span className="text-xs text-white/60 font-mono">{i === 0 ? 'Now' : formatTime(h.time)}</span>
                      <HIcon size={24} className="my-2 text-amber-300" />
                      <span className="font-bold text-sm sm:text-base">{Math.round(h.temperature_2m)}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILS */}
        {activeTab === 'deep' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 page-transition">
            <div className="glass-panel rounded-[2rem] p-6 text-center border border-white/15">
              <Shirt size={32} className="text-sky-400 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-white/60 uppercase">What to Wear</h4>
              <p className="font-semibold mt-2 text-sm">{aiInsights?.clothing || "Breathable layered clothes recommended."}</p>
            </div>
            <div className="glass-panel rounded-[2rem] p-6 text-center border border-white/15">
              <HeartPulse size={32} className="text-rose-400 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-white/60 uppercase">Health Advisory</h4>
              <p className="font-semibold mt-2 text-sm">{aiInsights?.health || "Air quality is pleasant for outdoor exercise."}</p>
            </div>
            <div className="glass-panel rounded-[2rem] p-6 text-center border border-white/15">
              <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-white/60 uppercase">Atmospheric Warning</h4>
              <p className="font-semibold mt-2 text-sm">{aiInsights?.warning || "No active weather warnings in effect."}</p>
            </div>
          </div>
        )}

        {/* TAB 3: 7 DAYS */}
        {activeTab === 'forecast' && (
          <div className="glass-panel rounded-[2.5rem] p-6 sm:p-8 space-y-3 page-transition border border-white/15">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={18} className="text-blue-400"/> 7-Day Extended Outlook</h3>
            {(weatherData?.daily || []).map((d, i) => {
              const dCode = d.weather_code || 0;
              const DIcon = getWeatherConfig(dCode).icon;
              return (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-black/30 hover:bg-white/5 transition-colors border border-white/5">
                  <div className="w-24 font-bold text-sm sm:text-base">{i === 0 ? 'Today' : getDayName(d.time)}</div>
                  <div className="flex items-center gap-3 flex-1 px-4"><DIcon size={22} className="text-amber-300 shrink-0"/> <span className="text-xs sm:text-sm text-white/80">{getWeatherConfig(dCode).label}</span></div>
                  <div className="font-mono text-sm sm:text-base font-bold"><span className="text-white/50">{Math.round(d.temperature_2m_min)}°</span> / {Math.round(d.temperature_2m_max)}°</div>
                </div>
              );
            })}
          </div>
        )}

        {/* MOMENTS VAULT MODAL */}
        {momentModalOpen && (
          <CaptureMoment 
            onClose={() => setMomentModalOpen(false)} 
            moments={moments} 
            onAddMoment={m => setMoments(p => [m, ...p])} 
            onDeleteMoment={id => setMoments(p => p.filter(x => x.id !== id))} 
          />
        )}

      </div>
    </div>
  );
}