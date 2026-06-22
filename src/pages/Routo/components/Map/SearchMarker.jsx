import React, { useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useRouto } from '../../context/RoutoContext';

export const SearchMarker = () => {
  const { selectedPlace, routeData } = useRouto();
  const map = useMap();

  useEffect(() => {
    // If a place is selected and there's no active route, center on the place
    if (selectedPlace && !routeData) {
      map.flyTo([selectedPlace.lat, selectedPlace.lon], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedPlace, routeData, map]);

  if (!selectedPlace) return null;

  // Custom marker icon for selected place
  const placeIcon = L.divIcon({
    className: 'custom-place-marker',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] animate-bounce" style="animation-duration: 2s;">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  return (
    <Marker position={[selectedPlace.lat, selectedPlace.lon]} icon={placeIcon} />
  );
};
