import { useState, useCallback } from 'react';
import { useRouto } from '../context/RoutoContext';
import { mapApi } from '../services/mapApi';

export function useMapRouting() {
  const { setRouteData, routingMode } = useRouto();
  const [isRouting, setIsRouting] = useState(false);
  const [routingError, setRoutingError] = useState(null);

  const calculateRoute = useCallback(async (points, mode = routingMode) => {
    if (!points || points.length < 2) return;
    
    setIsRouting(true);
    setRoutingError(null);
    try {
      const data = await mapApi.getRoute(points, mode);
      if (data && data.routes && data.routes.length > 0) {
        setRouteData(data.routes[0]);
      } else {
        setRouteData(null);
        setRoutingError('No route found between these locations.');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setRouteData(null);
      setRoutingError('Failed to calculate route.');
    } finally {
      setIsRouting(false);
    }
  }, [routingMode, setRouteData]);

  const clearRoute = useCallback(() => {
    setRouteData(null);
    setRoutingError(null);
  }, [setRouteData]);

  return { calculateRoute, clearRoute, isRouting, routingError };
}
