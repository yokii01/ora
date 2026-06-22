import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Bookmark, Share2, Map as MapIcon, CornerUpRight, Copy, Car, Footprints, Bike, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { useRouto } from '../../context/RoutoContext';
import { useMapRouting } from '../../hooks/useMapRouting';
import { mapApi } from '../../services/mapApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const PlaceDetails = () => {
  const { selectedPlace, setSelectedPlace, savedPlaces, toggleSavedPlace, userLocation, mapTheme, routingMode, setRoutingMode, setWaypoints } = useRouto();
  const { calculateRoute, clearRoute, isRouting, routingError } = useMapRouting();
  const [placeImage, setPlaceImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isSaved = savedPlaces.some(p => p.place_id === selectedPlace?.place_id);

  useEffect(() => {
    if (selectedPlace) {
      setPlaceImage(null);
      setIsImageLoading(true);
      mapApi.fetchPlaceImage(selectedPlace.name).then(img => {
        setPlaceImage(img);
        setIsImageLoading(false);
      });
    }
  }, [selectedPlace]);

  const handleClose = () => {
    setSelectedPlace(null);
    clearRoute();
  };

  const handleRoute = () => {
    if (!userLocation) {
      toast.promise(
        new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                heading: pos.coords.heading,
                accuracy: pos.coords.accuracy,
              };
              setWaypoints([loc, selectedPlace]);
              calculateRoute([loc, selectedPlace], routingMode);
              resolve();
            },
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }),
        {
          loading: 'Acquiring your location...',
          success: 'Location found, calculating route...',
          error: 'Could not get location. Please allow GPS access.'
        }
      );
      return;
    }
    setWaypoints([userLocation, selectedPlace]);
    calculateRoute([userLocation, selectedPlace], routingMode);
  };

  const copyCoords = () => {
    if (selectedPlace) {
      navigator.clipboard.writeText(`${selectedPlace.lat}, ${selectedPlace.lon}`);
      toast.success('Coordinates copied!');
    }
  };

  const shareLocation = () => {
    if (navigator.share && selectedPlace) {
      navigator.share({
        title: selectedPlace.name,
        text: selectedPlace.address,
        url: `https://maps.google.com/?q=${selectedPlace.lat},${selectedPlace.lon}`
      }).catch(console.error);
    } else {
      copyCoords();
    }
  };

  return (
    <AnimatePresence>
      {selectedPlace && (
        <motion.div
          layout
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "absolute bottom-0 left-0 right-0 lg:bottom-4 lg:left-4 lg:right-auto lg:w-[400px] z-50 rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] border pointer-events-auto overflow-hidden",
            mapTheme === 'dark' ? "bg-[#1c1c1e]/85 border-white/10" : "bg-white/95 border-black/5"
          )}
          style={{ backdropFilter: 'blur(40px) saturate(2)' }}
        >
          {/* Hero Image Section */}
          <motion.div 
            layout
            animate={{ height: isMinimized ? '4rem' : '14rem' }}
            className="relative w-full bg-gradient-to-b from-transparent to-black/50 overflow-hidden shrink-0"
          >
            {isImageLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                <ImageIcon className="w-8 h-8 opacity-20" />
              </div>
            ) : placeImage ? (
              <motion.img 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                src={placeImage} 
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <MapIcon className="w-12 h-12 mb-2 text-primary" />
                <span className="text-xs uppercase tracking-widest font-semibold">Map Location</span>
              </div>
            )}
            
            {/* Gradient Overlay for text readability */}
            <div className={cn("absolute inset-0 bg-gradient-to-t from-10%", mapTheme === 'dark' ? "from-[#0f172a] via-[#0f172a]/80" : "from-white via-white/80")} />

            {/* Drag Handle and Close */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
               <button 
                 onClick={() => setIsMinimized(!isMinimized)}
                 className="absolute left-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-transform"
                 style={{ transform: isMinimized ? 'rotate(180deg)' : 'rotate(0deg)' }}
               >
                 <ChevronDown className="w-5 h-5" />
               </button>
               <div className="flex-1 flex justify-center">
                 <div className="w-10 h-1.5 rounded-full bg-white/40 backdrop-blur-md shadow-sm" />
               </div>
               <button 
                onClick={handleClose}
                className="absolute right-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
          </motion.div>

          <motion.div layout className={cn("p-6 relative z-10", !isMinimized ? "pt-0 -mt-8 space-y-6" : "pt-4 space-y-4")}>
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className={cn("text-2xl font-bold tracking-tight line-clamp-1", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>
                  {selectedPlace.name}
                </h2>
                <p className={cn("text-sm mt-1 line-clamp-2", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  {selectedPlace.address}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("text-xs font-mono px-2 py-1 rounded-md backdrop-blur-md border", mapTheme === 'dark' ? "bg-[#2c2c2e]/80 text-gray-300 border-white/5" : "bg-black/5 text-gray-600 border-black/5")}>
                    {selectedPlace.lat.toFixed(5)}, {selectedPlace.lon.toFixed(5)}
                  </span>
                  <button onClick={copyCoords} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  {/* Actions */}
            <div className="flex items-center gap-3">
              {isRouting ? (
                <div className={cn("flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-1.5 border shadow-inner", mapTheme === 'dark' ? "bg-[#2c2c2e]/80 border-white/5" : "bg-black/5 border-black/5")}>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                </div>
              ) : (
                <button 
                  onClick={handleRoute}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/30"
                >
                  <Navigation className="w-5 h-5" />
                  <span>Directions</span>
                </button>
              )}
              
              <button 
                onClick={() => toggleSavedPlace(selectedPlace)}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all active:scale-95",
                  mapTheme === 'dark' ? "bg-[#2c2c2e]/60 border-white/5 hover:bg-[#2c2c2e]" : "bg-white border-black/5 hover:bg-black/5",
                  isSaved && "text-primary border-primary/30 bg-primary/10"
                )}
              >
                <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
              </button>

              <button 
                onClick={shareLocation}
                className={cn("p-3.5 rounded-2xl border transition-all active:scale-95", mapTheme === 'dark' ? "bg-[#2c2c2e]/60 border-white/5 hover:bg-[#2c2c2e] text-white" : "bg-white border-black/5 hover:bg-black/5 text-black")}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Transport Mode Selector */}
            <div className="flex gap-2">
              {[
                { id: 'driving', icon: Car, label: 'Car' },
                { id: 'walking', icon: Footprints, label: 'Walk' },
                { id: 'cycling', icon: Bike, label: 'Bike' }
              ].map(mode => {
                const Icon = mode.icon;
                const isActive = routingMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setRoutingMode(mode.id);
                      if (userLocation && selectedPlace) {
                        setWaypoints([userLocation, selectedPlace]);
                        calculateRoute([userLocation, selectedPlace], mode.id);
                      }
                    }}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition-all active:scale-95",
                      isActive 
                        ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]" 
                        : mapTheme === 'dark' ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10" : "bg-black/5 border-black/5 text-gray-600 hover:bg-black/10"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{mode.label}</span>
                  </button>
                )
              })}
            </div>
                  {/* Routing Options (if route active) */}
                  <AnimatePresence>
                    {routingError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-sm p-3 bg-red-400/10 rounded-xl">
                        {routingError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
