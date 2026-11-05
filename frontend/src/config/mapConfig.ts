/**
 * Central Map Tile & Geocoding Configuration
 * 100% Free & Keyless Tile Providers
 * 1. Standart Ko'cha / Topografiya (Xarita): OpenStreetMap
 * 2. Tungi Rejim: OpenStreetMap + CSS filter on .leaflet-tile-pane
 * 3. Sun'iy Yo'ldosh: Esri World Imagery (ArcGIS)
 */

export interface TileLayerConfig {
  id: string;
  name: string;
  url: string;
  attr: string;
  maxZoom: number;
  subdomains?: string;
  isDark?: boolean;
}

export const OSM_DEFAULT_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

export const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Earthstar Geographics';

export const TILE_CONFIG: Record<string, TileLayerConfig> = {
  dark: {
    id: 'dark',
    name: 'Tungi Rejim',
    url: OSM_DEFAULT_URL,
    attr: OSM_ATTRIBUTION,
    maxZoom: 19,
    isDark: true,
  },
  satellite: {
    id: 'satellite',
    name: "Sun'iy Yo'ldosh (Esri)",
    url: ESRI_SATELLITE_URL,
    attr: ESRI_ATTRIBUTION,
    maxZoom: 19,
    isDark: false,
  },
  voyager: {
    id: 'voyager',
    name: 'Topografiya (Xarita)',
    url: OSM_DEFAULT_URL,
    attr: OSM_ATTRIBUTION,
    maxZoom: 19,
    isDark: false,
  },
  streets: {
    id: 'streets',
    name: "Standart Ko'cha",
    url: OSM_DEFAULT_URL,
    attr: OSM_ATTRIBUTION,
    maxZoom: 19,
    isDark: false,
  },
};

export type MapTileLayerType = keyof typeof TILE_CONFIG;
export const DEFAULT_TILE_LAYER_ID: MapTileLayerType = 'dark';
