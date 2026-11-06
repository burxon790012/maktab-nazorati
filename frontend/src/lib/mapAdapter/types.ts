// Map Adapter Interface for Multi-Engine Architecture (Google Maps Primary, OSM Fallback)
import { School, Student } from '@/types';

export type MapProviderType = 'google' | 'leaflet-osm' | 'yandex';
export type MapLayerType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export interface MarkerClickPayload {
  student: Student;
  lat: number;
  lng: number;
}

export interface MapAdapterEvents {
  onMarkerClick?: (payload: MarkerClickPayload) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onMouseMove?: (lat: number, lng: number) => void;
  onSchoolClick?: (schoolId: string) => void;
  onDrawComplete?: (polygon: [number, number][]) => void;
  onCircleComplete?: (center: [number, number], radius: number) => void;
  onMeasureComplete?: (distanceMeters: number) => void;
}

export interface MapInitOptions {
  center: [number, number];
  zoom: number;
  isDark: boolean;
  mapType?: MapLayerType;
  events?: MapAdapterEvents;
}

export interface MapAdapter {
  init(container: HTMLElement, options: MapInitOptions): Promise<void>;
  getProviderName(): MapProviderType;
  setMapType(type: MapLayerType): void;
  setTheme(isDark: boolean): void;
  flyTo(lat: number, lng: number, zoom?: number): void;
  fitBounds(bounds: [number, number][]): void;
  upsertStudentMarker(student: Student, isSelected: boolean): void;
  removeStudentMarker(studentId: string): void;
  clearStudentMarkers(): void;
  renderSchoolGeofences(schools: School[], selectedSchoolId?: string): void;
  renderTrail(studentId: string, coordinates: [number, number][], color: string): void;
  clearTrails(): void;
  setSearchMarker(lat: number, lng: number, title?: string): void;
  clearSearchMarker(): void;
  startDrawingPolygon(onPointAdded?: (pointsCount: number) => void): void;
  undoLastPolygonPoint?(): number;
  finishDrawingPolygon(): [number, number][] | null;
  startDrawingCircle(center?: [number, number], radius?: number): void;
  setCircleRadius?(radius: number): void;
  finishDrawingCircle(): { center: [number, number]; radius: number } | null;
  cancelDrawing(): void;
  startMeasure(onUpdate?: (distMeters: number) => void): void;
  stopMeasure(): void;
  resize(): void;
  destroy(): void;
}
