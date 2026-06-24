import { safeFetch } from '@/lib/safeFetch';

export const fetchTripData = async (destination, fromLocation) => {
  try {
    const results = {};
    
    // Attempt to fetch Hotel data from MakCorps Free API
    if (destination) {
      try {
        const destFormat = destination.split(',')[0].trim().toLowerCase();
        const data = await safeFetch(`https://api.makcorps.com/free/${destFormat}`);
        results.hotels = data;
      } catch (e) {
        console.warn('Hotel API failed:', e);
      }
    }

    // Attempt to fetch Flights from SerpApi Google Flights
    if (fromLocation && destination) {
      try {
        const serpToken = '4c4314782bb1dc1fbf02a45d06fb6b009f4b66df21a2fc7c5eeebfc9e422f281'; // Placeholder or env var
        // In a real scenario we need specific parameters for google_flights like departure_id, arrival_id
        // But for mock/free usage we'll format a basic request
        const params = new URLSearchParams({
          engine: 'google_flights',
          departure_id: fromLocation,
          arrival_id: destination,
          api_key: import.meta.env.VITE_SERPAPI_KEY || serpToken
        });
        const data = await safeFetch(`https://serpapi.com/search?${params.toString()}`);
        results.flights = data;
      } catch (e) {
        console.warn('Flight API failed:', e);
      }
    }

    return results;
  } catch (err) {
    console.error('fetchTripData error:', err);
    return null;
  }
};
