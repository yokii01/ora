import React, { useEffect, useState, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { useRouto } from '../../context/RoutoContext';

export const RouteLayer = () => {
  const { routeData, isNavigating, userLocation } = useRouto();
  const map = useMap();
  const [drawnPositions, setDrawnPositions] = useState([]);
  const [passedIndex, setPassedIndex] = useState(0);
  const animationRef = useRef(null);

  // Refs for direct DOM mutation
  const passedRef = useRef(null);
  const glow1Ref = useRef(null);
  const glow2Ref = useRef(null);
  const coreRef = useRef(null);

  useEffect(() => {
    if (isNavigating && userLocation && drawnPositions.length > 0) {
       let closestIdx = 0;
       let minDist = Infinity;
       for(let i=0; i<drawnPositions.length; i++) {
         const dx = drawnPositions[i][0] - userLocation.lat;
         const dy = drawnPositions[i][1] - userLocation.lon;
         const dist = dx*dx + dy*dy;
         if (dist < minDist) {
           minDist = dist;
           closestIdx = i;
         }
       }
       setPassedIndex(closestIdx);
    } else {
       setPassedIndex(0);
    }
  }, [userLocation, isNavigating, drawnPositions]);

  useEffect(() => {
    if (routeData && routeData.geometry) {
      const coords = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      
      if (coords.length > 0) {
        map.fitBounds(coords, { padding: [50, 50], duration: 1.5 });

        // Progressive Drawing Animation
        setDrawnPositions([]);
        let currentIndex = 0;
        const totalPoints = coords.length;
        // determine points per frame based on total points to ensure reasonable animation time (e.g. 1 sec)
        const pointsPerFrame = Math.max(1, Math.floor(totalPoints / 60));

        const animateRoute = () => {
          if (currentIndex < totalPoints) {
            currentIndex += pointsPerFrame;
            const currentCoords = coords.slice(0, Math.min(currentIndex, totalPoints));
            
            // Bypass React state, mutate Leaflet layer directly for 60fps
            if (glow1Ref.current) glow1Ref.current.setLatLngs(currentCoords);
            if (glow2Ref.current) glow2Ref.current.setLatLngs(currentCoords);
            if (coreRef.current) coreRef.current.setLatLngs(currentCoords);

            animationRef.current = requestAnimationFrame(animateRoute);
          } else {
            setDrawnPositions(coords);
          }
        };

        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(animateRoute);
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [routeData, map]);

  if (!routeData || !routeData.geometry) return null;

  const passedPath = isNavigating ? drawnPositions.slice(0, passedIndex + 1) : [];
  const remainingPath = isNavigating ? drawnPositions.slice(passedIndex) : drawnPositions;

  return (
    <>
      <Polyline
        ref={passedRef}
        positions={passedPath}
        pathOptions={{ color: '#9ca3af', weight: 4, opacity: 0.5, lineCap: 'round', lineJoin: 'round' }}
      />
      <Polyline
        ref={glow1Ref}
        positions={remainingPath}
        pathOptions={{ color: '#3b82f6', weight: 12, opacity: 0.2, lineCap: 'round', lineJoin: 'round', className: 'animate-pulse' }}
      />
      <Polyline
        ref={glow2Ref}
        positions={remainingPath}
        pathOptions={{ color: '#60a5fa', weight: 6, opacity: 0.6, lineCap: 'round', lineJoin: 'round' }}
      />
      <Polyline
        ref={coreRef}
        positions={remainingPath}
        pathOptions={{ color: '#ffffff', weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
      />
    </>
  );
};
