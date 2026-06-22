import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Navigation, History, MapPin, ArrowLeft, Mic, MoreHorizontal } from 'lucide-react';
import { useRouto } from '../../context/RoutoContext';
import { mapApi } from '../../services/mapApi';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

export const FloatingSearchBar = ({ onOpenSettings }) => {
  const { 
    searchResults, setSearchResults,
    selectedPlace, setSelectedPlace, addRecentSearch,
    recentSearches, mapTheme, mapInstance
  } = useRouto();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const performSearch = useRef(
    debounce(async (query, bounds) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const results = await mapApi.search(query, bounds);
      setSearchResults(results || []);
      setIsSearching(false);
    }, 1000)
  ).current;

  useEffect(() => {
    let bounds = null;
    if (mapInstance) {
      try {
        bounds = mapInstance.getBounds();
      } catch (e) {
        // map might not be fully ready
      }
    }
    performSearch(searchQuery, bounds);
  }, [searchQuery, mapInstance, performSearch]);

  useEffect(() => {
    if (selectedPlace) {
      const name = selectedPlace.name || selectedPlace.display_name;
      if (name) {
        setSearchQuery(name);
      }
    } else {
      setSearchQuery('');
    }
  }, [selectedPlace, setSearchQuery]);

  const handleSelectPlace = (place) => {
    setSelectedPlace({
      name: place.name || place.display_name.split(',')[0],
      address: place.display_name,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
      place_id: place.place_id,
      type: place.type,
      class: place.class
    });
    addRecentSearch(place);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-50 lg:left-8 lg:w-96 lg:right-auto pointer-events-auto">
      {/* Floating Back Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/more')}
        className={cn(
          "absolute -left-1 flex items-center justify-center w-14 h-14 rounded-full shadow-lg backdrop-blur-md border transition-all",
          mapTheme === 'dark' 
            ? "bg-black/60 border-white/10 text-white hover:bg-white/10" 
            : "bg-white/80 border-black/5 text-gray-800 hover:bg-gray-100"
        )}
      >
        <ArrowLeft className="w-6 h-6" />
      </motion.button>

      <motion.div
        layout
        className={cn(
          "ml-16 flex flex-col overflow-hidden rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-300",
          mapTheme === 'dark' ? "bg-[#1c1c1e]/85 border border-white/10" : "bg-white/95 border border-black/5"
        )}
        style={{ backdropFilter: 'blur(30px) saturate(2)' }}
      >
        <div className="flex items-center px-4 h-14">
          <Search className={cn("w-5 h-5", mapTheme === 'dark' ? "text-gray-400" : "text-gray-600")} />
          
          <input
            ref={inputRef}
            type="text"
            placeholder="Search here"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="flex-1 bg-transparent border-none outline-none px-4 text-base placeholder:text-gray-400 font-medium w-full"
            style={{ color: mapTheme === 'dark' ? '#fff' : '#000' }}
          />

          <AnimatePresence>
            {searchQuery ? (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={handleClear}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <X className={cn("w-5 h-5", mapTheme === 'dark' ? "text-gray-400" : "text-gray-600")} />
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1"
              >
                <button className="p-2 rounded-full hover:bg-white/10">
                  <Mic className={cn("w-5 h-5", mapTheme === 'dark' ? "text-blue-400" : "text-blue-600")} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-px h-6 bg-gray-500/20 mx-1" />
          <button 
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={onOpenSettings}
          >
            <Menu className={cn("w-5 h-5", mapTheme === 'dark' ? "text-gray-400" : "text-gray-600")} />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {isFocused && (searchQuery || recentSearches.length > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 max-h-[60vh] overflow-y-auto custom-scrollbar"
            >
              {isSearching ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : searchQuery ? (
                searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, idx) => (
                      <motion.button
                        key={result.place_id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSelectPlace(result)}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 text-left transition-colors"
                      >
                        <div className="mt-0.5 p-1.5 rounded-full bg-white/5 shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium text-sm truncate", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>
                            {result.name || result.display_name.split(',')[0]}
                          </p>
                          <p className={cn("text-xs truncate mt-0.5", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                            {result.display_name}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400">No results found</div>
                )
              ) : (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Recent Searches
                  </div>
                  {recentSearches.map((result, idx) => (
                    <motion.button
                      key={result.place_id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSelectPlace(result)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 text-left transition-colors"
                    >
                      <div className="mt-0.5 p-1.5 rounded-full bg-white/5 shrink-0">
                        <History className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm truncate", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>
                          {result.name || result.display_name.split(',')[0]}
                        </p>
                        <p className={cn("text-xs truncate mt-0.5", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                          {result.display_name}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
