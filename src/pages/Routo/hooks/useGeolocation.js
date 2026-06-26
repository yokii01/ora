import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRouto } from '../context/RoutoContext';

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export function useGeolocation() {
  const { setUserLocation, setIsLocating, autoCenter, mapInstance, isNavigating } = useRouto();
  const watchId = useRef(null);
  const lastValidLoc = useRef(null);
  const lastUpdateMs = useRef(0);

  const startTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        let { latitude, longitude, heading, accuracy, speed } = position.coords;
        
        // 1. Accuracy Filter
        if (accuracy > 30) return; // Ignore updates >30m accuracy
        
        // 2. Frequency Filter
        const now = Date.now();
        if (now - lastUpdateMs.current < 1000) return; // Max 1 update per second
        
        let newHeading = heading;
        let distance = 0;

        if (lastValidLoc.current) {
          distance = getDistance(lastValidLoc.current.lat, lastValidLoc.current.lon, latitude, longitude);
          
          // 3. Minimum Movement Filter (Ignore tiny GPS jitter < 5 meters)
          if (distance < 5 && (!lastValidLoc.current.accuracy || accuracy >= lastValidLoc.current.accuracy * 0.8)) {
             return; 
          }

          // 4. Smooth interpolation (Exponential Smoothing / Simple Kalman)
          const alpha = 0.6; // Trust new reading 60%
          latitude = latitude * alpha + lastValidLoc.current.lat * (1 - alpha);
          longitude = longitude * alpha + lastValidLoc.current.lon * (1 - alpha);

          if (heading === null || isNaN(heading)) {
            const dy = longitude - lastValidLoc.current.lon;
            const dx = Math.cos(Math.PI / 180 * lastValidLoc.current.lat) * (latitude - lastValidLoc.current.lat);
            newHeading = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
          }
        }

        lastUpdateMs.current = now;
        const newLocation = { lat: latitude, lon: longitude, heading: newHeading, accuracy, speed };
        lastValidLoc.current = newLocation;
        setUserLocation(newLocation);
        setIsLocating(false);

        if (autoCenter && mapInstance) {
          mapInstance.setView([latitude, longitude], mapInstance.getZoom() > 14 ? mapInstance.getZoom() : 18, {
            animate: true,
            duration: 1
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location access denied. Please enable it in browser settings or use manual search.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Location information is unavailable.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location request timed out.");
        } else {
          toast.error("An unknown error occurred while locating.");
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  useEffect(() => {
    // Only auto-track if navigating. Otherwise user must explicitly press "Locate Me"
    if (isNavigating) {
      startTracking();
    }
    return stopTracking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating, autoCenter, mapInstance]);

  // Strict unmount cleanup
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, []);

  return { startTracking, stopTracking };
}
