// Map Adapter Factory: Handles automatic selection between Yandex Maps, Google Maps, and OSM Fallback
import { MapAdapter, MapProviderType } from './types';
import { loadYandexMapsScript } from './yandexLoader';
import { YandexMapAdapter } from './yandexMapAdapter';
import { loadGoogleMapsScript, isGoogleMapsAuthFailed } from './googleLoader';
import { GoogleMapAdapter } from './googleMapAdapter';
import { LeafletOsmAdapter } from './leafletOsmAdapter';

export * from './types';
export * from './yandexLoader';
export * from './yandexMapAdapter';
export * from './googleLoader';
export * from './googleMapAdapter';
export * from './leafletOsmAdapter';

export interface MapAdapterInitResult {
  adapter: MapAdapter;
  provider: MapProviderType;
  isFallback: boolean;
  message?: string;
}

const DEFAULT_YANDEX_KEY = 'cb994b90-4f91-4056-bcab-31951269103d';

export async function createMapAdapter(preferredApiKey?: string): Promise<MapAdapterInitResult> {
  let googleApiKey = preferredApiKey || '';
  let yandexApiKey = DEFAULT_YANDEX_KEY;

  // Try fetching dynamic keys from backend config
  try {
    const res = await fetch('/api/v1/config');
    const data = await res.json();
    if (data) {
      if (data.yandexMapsApiKey && typeof data.yandexMapsApiKey === 'string') {
        yandexApiKey = data.yandexMapsApiKey.trim();
      }
      if (!googleApiKey && data.googleMapsApiKey) {
        googleApiKey = data.googleMapsApiKey.trim();
      }
    }
  } catch (_) {
    // Backend config unreachable, proceed with default/cached keys
  }

  // 1. Primary Engine: Yandex Maps JS API 2.1 (Highest resolution & house-level accuracy for Uzbekistan)
  if (yandexApiKey) {
    try {
      const isLoaded = await loadYandexMapsScript(yandexApiKey);
      if (isLoaded && (window as any).ymaps && (window as any).ymaps.Map) {
        return {
          adapter: new YandexMapAdapter(),
          provider: 'yandex',
          isFallback: false,
          message: 'Yandex Xaritalar platformasi faol (O\'zbekiston bo\'yicha yuqori aniqlik)',
        };
      }
    } catch (err: any) {
      console.warn('Yandex Maps yuklashda xatolik:', err?.message || err);
    }
  }

  // 2. Secondary Engine: Google Maps if key exists and Yandex did not load
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
      console.warn('Google Maps yuklashda xatolik:', err?.message || err);
    }
  }

  // 3. Fallback: Esri World Map Leaflet Adapter
  console.info('ℹ️ Yandex va Google kalitlari yuklanmadi. Esri World Map zaxira rejimiga o\'tildi.');
  return {
    adapter: new LeafletOsmAdapter(),
    provider: 'leaflet-osm',
    isFallback: true,
    message: 'Esri World Map zaxira rejimi faol (Kalit talab etilmaydi)',
  };
}
