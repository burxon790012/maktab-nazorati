// Map Adapter Factory: Handles automatic selection between Google Maps and OSM Fallback
import { MapAdapter, MapProviderType } from './types';
import { loadGoogleMapsScript, isGoogleMapsAuthFailed } from './googleLoader';
import { GoogleMapAdapter } from './googleMapAdapter';
import { LeafletOsmAdapter } from './leafletOsmAdapter';

export * from './types';
export * from './googleLoader';
export * from './googleMapAdapter';
export * from './leafletOsmAdapter';

export interface MapAdapterInitResult {
  adapter: MapAdapter;
  provider: MapProviderType;
  isFallback: boolean;
  message?: string;
}

export async function createMapAdapter(preferredApiKey?: string): Promise<MapAdapterInitResult> {
  let googleApiKey = preferredApiKey || '';

  // If no key provided directly, try fetching from backend config
  if (!googleApiKey) {
    try {
      const res = await fetch('/api/v1/config');
      const data = await res.json();
      if (data && data.googleMapsApiKey) {
        googleApiKey = data.googleMapsApiKey.trim();
      }
    } catch (_) {
      // Backend config unreachable
    }
  }

  // 1. Try Google Maps if key exists
  if (googleApiKey && !isGoogleMapsAuthFailed()) {
    try {
      const isLoaded = await loadGoogleMapsScript(googleApiKey);
      if (isLoaded && window.google && window.google.maps) {
        return {
          adapter: new GoogleMapAdapter(),
          provider: 'google',
          isFallback: false,
          message: 'Google Maps platformasi faol',
        };
      }
    } catch (err: any) {
      console.warn('Google Maps yuklashda xatolik:', err.message);
    }
  }

  // 2. Automatic Fallback to Esri World Map Leaflet Adapter
  console.info('ℹ️ Google Maps kaliti mavjud emas yoki yuklanmadi. Esri World Map zaxira rejimiga o\'tildi.');
  return {
    adapter: new LeafletOsmAdapter(),
    provider: 'leaflet-osm',
    isFallback: true,
    message: 'Esri World Map zaxira rejimi faol (Kalit talab etilmaydi)',
  };
}

