import React, { createContext, useContext, useState, useEffect } from 'react';

const RoutoContext = createContext();

export const useRouto = () => useContext(RoutoContext);

export const RoutoProvider = ({ children }) => {
  const [mapInstance, setMapInstance] = useState(null);
  
  // Location
  const [mapTheme, setMapTheme] = useState(() => {
    return localStorage.getItem('routo_theme') || 'dark';
  });
  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem('routo_style') || 'default';
  });
  const [userLocation, setUserLocation] = useState(null); // { lat, lon, heading, accuracy }
  const [isLocating, setIsLocating] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);

  // Search & Places
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null); // { name, lat, lon, address, ... }
  
  // Routing
  const [routeData, setRouteData] = useState(null);
  const [routingMode, setRoutingMode] = useState('driving'); // driving, walking, cycling
  const [isNavigating, setIsNavigating] = useState(false);
  const [waypoints, setWaypoints] = useState([]); // array of { lat, lon, name }

  // Storage
  const [savedPlaces, setSavedPlaces] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('routo_saved_places')) || [];
    } catch {
      return [];
    }
  });
  
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('routo_recent_searches')) || [];
    } catch {
      return [];
    }
  });

  // Effects to persist data
  useEffect(() => {
    localStorage.setItem('routo_saved_places', JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  useEffect(() => {
    localStorage.setItem('routo_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem('routo_theme', mapTheme);
  }, [mapTheme]);

  useEffect(() => {
    localStorage.setItem('routo_style', mapStyle);
  }, [mapStyle]);

  const addRecentSearch = (place) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.place_id !== place.place_id);
      return [place, ...filtered].slice(0, 10);
    });
  };

  const toggleSavedPlace = (place) => {
    setSavedPlaces(prev => {
      const exists = prev.find(p => p.place_id === place.place_id);
      if (exists) return prev.filter(p => p.place_id !== place.place_id);
      return [{ ...place, savedAt: Date.now() }, ...prev];
    });
  };

  const value = {
    mapInstance, setMapInstance,
    userLocation, setUserLocation,
    isLocating, setIsLocating,
    autoCenter, setAutoCenter,
    searchResults, setSearchResults,
    selectedPlace, setSelectedPlace,
    routeData, setRouteData,
    routingMode, setRoutingMode,
    isNavigating, setIsNavigating,
    waypoints, setWaypoints,
    savedPlaces, toggleSavedPlace,
    recentSearches, addRecentSearch, setRecentSearches,
    mapTheme, setMapTheme,
    mapStyle, setMapStyle
  };

  return (
    <RoutoContext.Provider value={value}>
      {children}
    </RoutoContext.Provider>
  );
};
