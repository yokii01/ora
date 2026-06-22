import React from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useRouto } from '../../context/RoutoContext';

export const LiveLocationMarker = () => {
  const { userLocation } = useRouto();

  if (!userLocation) return null;

  // Premium subtle Apple Maps style icon
  const pulsingIcon = L.divIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12">
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20" style="animation-duration: 3s;"></div>
        <div class="relative w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)] border-[4px] border-blue-500 z-10 box-content"></div>
        ${userLocation.heading !== null && userLocation.heading !== undefined ? `
          <div class="absolute w-12 h-12" style="transform: rotate(${userLocation.heading}deg);">
            <div class="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-blue-500 drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)]"></div>
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

  return (
    <>
      <Marker position={[userLocation.lat, userLocation.lon]} icon={pulsingIcon} />
      {userLocation.accuracy && (
        <Circle
          center={[userLocation.lat, userLocation.lon]}
          radius={userLocation.accuracy}
          pathOptions={{ 
            fillColor: '#3b82f6', 
            fillOpacity: 0.15, 
            color: '#3b82f6', 
            weight: 1, 
            opacity: 0.4,
            className: 'animate-pulse'
          }}
        />
      )}
    </>
  );
};
