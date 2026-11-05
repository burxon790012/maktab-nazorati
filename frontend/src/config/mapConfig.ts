/**
 * Central Map Tile & Geocoding Configuration
 * Uses OpenStreetMap by default (free, no API key required)
 * Supports MapTiler via optional environment variable VITE_MAPTILER_KEY
 */

export interface TileLayerConfig {
  id: string;
  name: string;
  url: string;
  attr: string;
  maxZoom: number;
  subdomains?: string;
}

export const OSM_DEFAULT_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

// Optional MapTiler API Key from Vite env (import.meta.env.VITE_MAPTILER_KEY)
const mapTilerKey: string =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_MAPTILER_KEY) || '';

export const TILE_CONFIG: Record<string, TileLayerConfig> = {
  streets: {
    id: 'streets',
    name: "Standart Ko'cha (OSM)",
    url: mapTilerKey
      ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`
      : OSM_DEFAULT_URL,
    attr: mapTilerKey
      ? '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; OpenStreetMap contributors'
      : OSM_ATTRIBUTION,
    maxZoom: 19,
  },
  satellite: {
    id: 'satellite',
    name: "Sun'iy Yo'ldosh (Esri)",
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    maxZoom: 19,
  },
  topo: {
    id: 'topo',
    name: "Topografik (OpenTopo)",
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    subdomains: 'abc',
  },
};

export type MapTileLayerType = keyof typeof TILE_CONFIG;
export const DEFAULT_TILE_LAYER_ID: MapTileLayerType = 'streets';
