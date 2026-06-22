export const mapApi = {
  // Nominatim Search (OSM) - Reliable and no CORS issues
  async search(query, bounds = null) {
    try {
      let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=8`;

      if (bounds) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        // Nominatim viewbox=left,top,right,bottom
        url += `&viewbox=${sw.lng},${ne.lat},${ne.lng},${sw.lat}&bounded=1`;
      }

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'ORAs-Routo-App/2.0'
        }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      
      return data.map(p => ({
        place_id: p.place_id || Math.random().toString(),
        display_name: p.display_name,
        name: p.name || p.display_name.split(',')[0],
        lat: p.lat,
        lon: p.lon,
        address: p.address,
        type: p.type,
        class: p.class
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  // Nominatim Reverse Geocoding
  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'ORAs-Routo-App/2.0'
          }
        }
      );
      if (!response.ok) throw new Error('Reverse geocoding failed');
      return await response.json();
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  },

  // OSRM Routing
  async getRoute(points, profile = 'driving') {
    // profile options: 'driving', 'walking', 'cycling'
    // points: array of {lat, lon}
    try {
      if (!points || points.length < 2) return null;
      const coords = points.map(p => `${p.lon},${p.lat}`).join(';');
      
      let baseUrl = 'https://router.project-osrm.org/route/v1/driving';
      if (profile === 'walking') {
        baseUrl = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';
      } else if (profile === 'cycling') {
        baseUrl = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving';
      }

      const response = await fetch(
        `${baseUrl}/${coords}?overview=full&geometries=geojson&steps=true`
      );
      if (!response.ok) throw new Error('Routing failed');
      return await response.json();
    } catch (error) {
      console.error('Routing error:', error);
      return null;
    }
  },

  // Simple Memory Cache for images
  imageCache: new Map(),

  // Wikipedia Image Fetcher
  async fetchPlaceImage(placeName) {
    if (!placeName) return null;
    
    // Check cache
    if (this.imageCache.has(placeName)) {
      return this.imageCache.get(placeName);
    }

    try {
      // Clean up place name for better search
      const cleanName = placeName.split(',')[0].replace(/ \b(City|Town|Village)\b/gi, '').trim();
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(cleanName)}&origin=*`
      );
      const data = await response.json();
      const pages = data?.query?.pages;
      
      let imageUrl = null;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId && pageId !== '-1' && pages[pageId].original) {
          imageUrl = pages[pageId].original.source;
        }
      }
      
      // Fallback
      if (!imageUrl) {
        // Premium fallback illustrations for places with no images
        const fallbacks = [
          'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?auto=format&fit=crop&w=800&q=80'
        ];
        // Pick one deterministically based on place name length so it stays consistent per place
        const hash = placeName.length % fallbacks.length;
        imageUrl = fallbacks[hash];
      }

      // Cap cache size to 50
      if (this.imageCache.size > 50) {
        const firstKey = this.imageCache.keys().next().value;
        this.imageCache.delete(firstKey);
      }
      this.imageCache.set(placeName, imageUrl);

      return imageUrl;
    } catch (error) {
      console.error('Image fetch error:', error);
      return 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80';
    }
  }
};
