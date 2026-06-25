import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer, MapPin, Search } from 'lucide-react';
import { safeFetch } from '@/lib/safeFetch';
import { FeatureState } from '@/components/shared/FeatureState';

const THEMES = {
  clear: { bg: 'from-blue-400 to-blue-600', text: 'text-blue-100', icon: Sun },
  clearNight: { bg: 'from-slate-800 to-indigo-950', text: 'text-indigo-100', icon: Moon },
  cloudy: { bg: 'from-slate-400 to-slate-600', text: 'text-slate-100', icon: Cloud },
  rain: { bg: 'from-blue-600 to-slate-700', text: 'text-blue-100', icon: CloudRain },
  snow: { bg: 'from-blue-100 to-slate-300', text: 'text-slate-700', icon: CloudSnow },
  thunder: { bg: 'from-slate-800 to-purple-900', text: 'text-purple-100', icon: CloudLightning },
};

function getWeatherTheme(code, isDay) {
  if (code <= 1) return isDay ? THEMES.clear : THEMES.clearNight;
  if (code <= 3) return THEMES.cloudy;
  if (code <= 69) return THEMES.rain;
  if (code <= 79) return THEMES.snow;
  if (code <= 99) return THEMES.thunder;
  return THEMES.clear;
}

import { useApiQuery } from '@/hooks/useApi';

export default function ClimoraUltra() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState({ lat: 51.5085, lon: -0.1257, name: 'London' });

  // 1. Geocoding Query (Triggers only when `search` is submitted)
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    data: geoData, 
    isFetching: isGeoFetching 
  } = useApiQuery({
    queryKey: ['weather-geocode', searchQuery],
    url: `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1`,
    enabled: !!searchQuery,
  });

  // Automatically update location when geoData arrives
  useEffect(() => {
    if (geoData?.results?.[0]) {
      const { latitude, longitude, name } = geoData.results[0];
      setLocation({ lat: latitude, lon: longitude, name });
    }
  }, [geoData]);

  // 2. Weather Query (Triggers automatically on location change)
  const { 
    data: weatherData, 
    isLoading: isWeatherLoading, 
    isError: isWeatherError,
    error: weatherError,
    refetch: refetchWeather,
    isOffline
  } = useApiQuery({
    queryKey: ['weather', location.lat, location.lon],
    url: `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
  });

  // Calculate Screen State
  const screenState = isOffline ? 'error' : isWeatherError ? 'error' : isWeatherLoading || isGeoFetching ? 'loading' : 'ready';

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearchQuery(search.trim());
  };

  const current = weatherData?.current || {};
  const theme = getWeatherTheme(current.weather_code || 0, current.is_day ?? 1);
  const WeatherIcon = theme.icon;

  return (
    <FeatureState state={screenState} onRetry={() => refetchWeather()}>
      <div className={`min-h-screen bg-gradient-to-br ${theme.bg} text-white transition-colors duration-1000 p-4 lg:p-8 flex flex-col items-center`}>
      <div className="w-full max-w-4xl flex-1 flex flex-col gap-8 pt-safe">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto mt-4">
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search city..." 
            className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-full py-3 px-6 pl-12 text-white placeholder-white/50 outline-none focus:bg-black/30 transition-all shadow-xl"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        </form>

        {/* Current Weather */}
        <div className="flex flex-col items-center text-center mt-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 mb-4 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md">
            <MapPin className="w-4 h-4" />
            <span className="font-medium tracking-wide">{weatherData?.name || 'Unknown'}</span>
          </motion.div>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-6">
            <WeatherIcon className="w-24 h-24 drop-shadow-2xl" />
            <h1 className="text-8xl font-black tracking-tighter drop-shadow-2xl">{Math.round(current.temperature_2m || 0)}°</h1>
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: Wind, label: 'Wind', value: `${current.wind_speed_10m || 0} km/h` },
            { icon: Droplets, label: 'Humidity', value: `${current.relative_humidity_2m || 0}%` },
            { icon: Thermometer, label: 'High', value: `${Math.round(weatherData?.daily?.temperature_2m_max?.[0] || 0)}°` },
            { icon: Thermometer, label: 'Low', value: `${Math.round(weatherData?.daily?.temperature_2m_min?.[0] || 0)}°` }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-2 shadow-2xl">
              <stat.icon className="w-6 h-6 text-white/80" />
              <span className="text-sm font-medium text-white/60">{stat.label}</span>
              <span className="text-xl font-bold">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
      </div>
    </FeatureState>
  );
}