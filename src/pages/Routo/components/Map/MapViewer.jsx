import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouto } from '../../context/RoutoContext';
import { cn } from '@/lib/utils';
import { LiveLocationMarker } from './LiveLocationMarker';
import { SearchMarker } from './SearchMarker';
import { RouteLayer } from './RouteLayer';

// Map sync component to sync the leaflet map instance with context
const MapSync = () => {
  const map = useMap();
  const { setMapInstance, isNavigating, userLocation } = useRouto();

  useEffect(() => {
    setMapInstance(map);
    // Remove leaflet attribution prefix for cleaner UI
    map.attributionControl?.setPrefix('');
    return () => setMapInstance(null);
  }, [map, setMapInstance]);

  useEffect(() => {
    if (isNavigating && userLocation && map) {
      map.setView([userLocation.lat, userLocation.lon], 18, { animate: true, duration: 1 });
    }
  }, [isNavigating, userLocation, map]);

  return null;
};

// Theme configurations
const THEMES = {
  default: {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO'
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO'
    }
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri'
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', // We would need a separate labels layer for true hybrid, simplified for demo
    attribution: 'Esri'
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri'
  }
};

const FallbackTileLayer = ({ activeStyle }) => {
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [activeStyle]);

  const getLayerData = () => {
    if (attempt === 0) {
      if (activeStyle === 'light' || activeStyle === 'dark') {
        return THEMES.default[activeStyle];
      }
      return THEMES[activeStyle] || THEMES.default.dark;
    }

    // Fallback priority: OpenStreetMap -> CARTO Dark -> CARTO Positron -> Esri
    const fallbacks = [
      THEMES.default.dark,
      { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
      THEMES.default.light,
      THEMES.satellite
    ];

    return fallbacks[Math.min(attempt - 1, fallbacks.length - 1)];
  };

  const layer = getLayerData();

  return (
    <TileLayer
      key={`${activeStyle}-${attempt}`}
      url={layer.url}
      attribution={layer.attribution}
      maxZoom={19}
      updateWhenZooming={false}
      keepBuffer={2}
      eventHandlers={{
        tileerror: () => {
          if (attempt < 6) {
            console.warn('Map tile failed to load, switching to fallback provider...', attempt + 1);
            setAttempt(a => a + 1);
          }
        }
      }}
    />
  );
};

export const MapViewer = () => {
  const { mapTheme, mapStyle } = useRouto();

  const activeStyle = mapStyle === 'default' || !mapStyle ? mapTheme : mapStyle;

  return (
    <div className="absolute inset-0 z-0 bg-transparent">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        zoomControl={false}
        attributionControl={false}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={80}
        fadeAnimation={true}
        markerZoomAnimation={true}
        preferCanvas={true}
        className="w-full h-full bg-transparent"
        style={{ background: mapTheme === 'dark' ? '#1c1c1e' : '#f8fafc' }}
      >
        <MapSync />
        
        <FallbackTileLayer activeStyle={activeStyle} />

        <LiveLocationMarker />
        <SearchMarker />
        <RouteLayer />
      </MapContainer>
    </div>
  );
};
