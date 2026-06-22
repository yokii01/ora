import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Compass, Locate, Plus, Minus, Maximize, Minimize, Car, Navigation } from 'lucide-react';
import { useRouto } from '../../context/RoutoContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { cn } from '@/lib/utils';

export const FloatingActions = () => {
  const { mapInstance, mapTheme, setMapTheme, isLocating, routeData, isNavigating, setIsNavigating } = useRouto();
  const { startTracking } = useGeolocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trafficEnabled, setTrafficEnabled] = useState(false);

  const handleZoomIn = () => mapInstance?.zoomIn();
  const handleZoomOut = () => mapInstance?.zoomOut();
  const handleLocate = () => startTracking();
  const handleThemeToggle = () => {
    setMapTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const btnClass = cn(
    "flex items-center justify-center w-12 h-12 rounded-full shadow-lg backdrop-blur-md border transition-all active:scale-95",
    mapTheme === 'dark' 
      ? "bg-black/60 border-white/10 text-white hover:bg-white/10" 
      : "bg-white/80 border-black/5 text-gray-800 hover:bg-gray-100"
  );

  const activeBtnClass = cn(
    "flex items-center justify-center w-12 h-12 rounded-full shadow-lg backdrop-blur-md border transition-all active:scale-95 text-primary",
    mapTheme === 'dark' 
      ? "bg-primary/20 border-primary/50" 
      : "bg-primary/10 border-primary/30"
  );

  return (
    <div className="absolute right-4 bottom-28 lg:bottom-12 z-40 flex flex-col gap-4 pointer-events-auto">
      
      {/* Zoom Controls */}
      <div className={cn(
        "flex flex-col rounded-full shadow-lg backdrop-blur-md border overflow-hidden",
        mapTheme === 'dark' ? "bg-black/60 border-white/10" : "bg-white/80 border-black/5"
      )}>
        <button onClick={handleZoomIn} className={cn("w-12 h-12 flex items-center justify-center transition-colors", mapTheme === 'dark' ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-800")}>
          <Plus className="w-5 h-5" />
        </button>
        <div className={cn("h-px w-full", mapTheme === 'dark' ? "bg-white/10" : "bg-black/5")} />
        <button onClick={handleZoomOut} className={cn("w-12 h-12 flex items-center justify-center transition-colors", mapTheme === 'dark' ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-800")}>
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Fullscreen Toggle */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={toggleFullscreen} 
        className={btnClass}
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </motion.button>

      {/* Layers Toggle (Placeholder logic for future layer switcher) */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          // Future layer switcher logic
          setMapTheme(prev => prev === 'dark' ? 'light' : 'dark');
        }} 
        className={btnClass}
        title="Map Layers"
      >
        <Layers className="w-5 h-5" />
      </motion.button>

      {/* Compass */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          mapInstance?.setBearing?.(0);
        }} 
        className={btnClass}
        title="Compass North"
      >
        <Compass className="w-5 h-5 text-red-500" />
      </motion.button>

      {/* Locate Button */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={handleLocate} 
        className={isLocating ? activeBtnClass : btnClass}
        title="My Location"
      >
        <Locate className={cn("w-5 h-5", isLocating && "animate-pulse")} />
      </motion.button>
      
    </div>
  );
};
