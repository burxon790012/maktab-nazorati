// Leaflet OpenStreetMap Fallback Adapter (100% Keyless, Zero Watermark, Ultra-Reliable)
import L from 'leaflet';
import { School, Student } from '@/types';
import {
  MapAdapter,
  MapInitOptions,
  MapLayerType,
  MapProviderType,
} from './types';
import { haversineDistance } from '@/lib/geoUtils';

// High-availability Keyless Tile URLs (Tested with zero 403/x-blocked on cloud servers)
const OSM_GERMAN_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
const ESRI_STREET_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export class LeafletOsmAdapter implements MapAdapter {
  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private container: HTMLElement | null = null;
  private options!: MapInitOptions;

  private studentMarkers: Map<string, L.Marker> = new Map();
  private schoolPolygons: Map<string, L.Polygon> = new Map();
  private schoolBadges: Map<string, L.Marker> = new Map();
  private trailPolylines: Map<string, L.Polyline> = new Map();
  private searchMarker: L.Marker | null = null;

  // Custom Drawing state
  private activeDrawLayer: L.Polygon | L.Polyline | null = null;
  private isDrawPolygonReady = false;
  private activeDrawCircle: L.Circle | null = null;
  private drawPoints: [number, number][] = [];
  private isDrawing = false; // Guard: prevents tile recovery during drawing
  private currentMapType: MapLayerType = 'roadmap'; // Track active type for recovery
  private hasSwitchedToFallback = false; // Session guard: max 1 fallback attempt per session
  private drawMarkers: L.Marker[] = [];
  private mapClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

  // Measure state
  private measurePoints: [number, number][] = [];
  private measureLine: L.Polyline | null = null;
  private measureMarkers: L.Marker[] = [];

  getProviderName(): MapProviderType {
    return 'leaflet-osm';
  }

  async init(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.container = container;
    this.options = options;

    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Dedicated overlay pane for all drawing tools (above tiles, never triggers tile pane repainting)
    if (!this.map.getPane('drawPane')) {
      const drawPane = this.map.createPane('drawPane');
      drawPane.style.zIndex = '620';
    }

    this.setMapType(options.mapType || 'roadmap');
    this.setTheme(options.isDark);

    if (options.events?.onMapClick) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        // Drawing or measuring handler has priority; do not trigger global onMapClick
        if (this.mapClickHandler) return;
        if (e && e.latlng && isFinite(e.latlng.lat) && isFinite(e.latlng.lng)) {
          options.events?.onMapClick?.(e.latlng.lat, e.latlng.lng);
        }
      });
    }

    // Leaflet initial size recalculation
    setTimeout(() => {
      this.resize();
    }, 200);
  }

  setMapType(type: MapLayerType): void {
    if (!this.map) return;

    // Save current tile URL to track active type
    this.currentMapType = type;

    const isSatellite = type === 'satellite' || type === 'hybrid';
    const oldLayer = this.tileLayer;

    if (isSatellite) {
      this.container?.classList.add('satellite-mode');
      this.container?.classList.remove('dark-tiles');
      this.tileLayer = L.tileLayer(ESRI_SATELLITE_URL, {
        maxZoom: 19,
        keepBuffer: 4,
        updateWhenIdle: false,
        className: 'satellite-tile-layer',
        attribution: 'Tiles © Esri',
      });
    } else {
      this.container?.classList.remove('satellite-mode');
      if (this.options?.isDark) {
        this.container?.classList.add('dark-tiles');
      } else {
        this.container?.classList.remove('dark-tiles');
      }

      // Primary: High-reliability OpenStreetMap German cluster (never blocks Render or cloud IPs)
      this.tileLayer = L.tileLayer(OSM_GERMAN_URL, {
        maxZoom: 19,
        keepBuffer: 4,
        updateWhenIdle: false,
        className: this.options?.isDark ? 'dark-tile-layer' : '',
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      });

      // Safe guarded fallback: runs at most once per session, never during drawing, requires 6 consecutive tile errors
      let consecutiveErrors = 0;
      this.tileLayer.on('tileerror', () => {
        if (this.hasSwitchedToFallback || this.isDrawing || !this.map) return;
        consecutiveErrors++;
        if (consecutiveErrors >= 6) {
          this.hasSwitchedToFallback = true;
          console.warn('⚠️ OSM plitkasi xatosi (6+ xato), Esri World Street Map ga avtomatik o\'tkazilmoqda...');
          const fallbackLayer = L.tileLayer(ESRI_STREET_URL, {
            maxZoom: 19,
            keepBuffer: 4,
            updateWhenIdle: false,
            className: this.options?.isDark ? 'dark-tile-layer' : '',
            attribution: 'Tiles © Esri',
          });

          // Wait for first tile of fallback to load before removing old layer
          fallbackLayer.once('load', () => {
            if (this.tileLayer && this.map?.hasLayer(this.tileLayer)) {
              this.map.removeLayer(this.tileLayer);
            }
            this.tileLayer = fallbackLayer;
          });

          fallbackLayer.addTo(this.map);
        }
      });
    }

    this.tileLayer.addTo(this.map);
    if (oldLayer && this.map.hasLayer(oldLayer)) {
      this.map.removeLayer(oldLayer);
    }
  }

  setTheme(isDark: boolean): void {
    if (!this.container) return;
    if (isDark) {
      this.container.classList.add('dark-tiles');
    } else {
      this.container.classList.remove('dark-tiles');
    }
  }

  flyTo(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;
    if (typeof lat !== 'number' || isNaN(lat) || !isFinite(lat) || typeof lng !== 'number' || isNaN(lng) || !isFinite(lng)) {
      console.warn('flyTo: Noto\'g\'ri koordinatalar:', lat, lng);
      return;
    }
    const targetZoom = typeof zoom === 'number' && isFinite(zoom) && !isNaN(zoom) ? Math.round(zoom) : 16;
    try {
      this.map.flyTo([lat, lng], targetZoom, { duration: 0.8 });
    } catch (e) {
      this.map.setView([lat, lng], targetZoom);
    }
  }

  fitBounds(bounds: [number, number][]): void {
    if (!this.map || !bounds || !Array.isArray(bounds) || bounds.length === 0) return;

    // Filter strictly finite, valid coordinates (supports both [lat, lng] and {lat, lng})
    const valid: [number, number][] = [];
    for (const pt of bounds) {
      if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && isFinite(pt[0]) && typeof pt[1] === 'number' && isFinite(pt[1])) {
        valid.push([pt[0], pt[1]]);
      } else if (pt && typeof (pt as any).lat === 'number' && isFinite((pt as any).lat) && typeof (pt as any).lng === 'number' && isFinite((pt as any).lng)) {
        valid.push([(pt as any).lat, (pt as any).lng]);
      }
    }

    if (valid.length === 0) return;

    if (valid.length === 1) {
      this.map.setView([valid[0][0], valid[0][1]], 16);
      return;
    }

    try {
      const llBounds = L.latLngBounds(valid as any);
      if (llBounds.isValid()) {
        this.map.fitBounds(llBounds, { maxZoom: 18, padding: [40, 40] });
      }
    } catch (e) {
      console.warn('fitBounds xatosi:', e);
    }
  }

  upsertStudentMarker(student: Student, isSelected: boolean): void {
    if (!this.map || !student.telemetry) return;
    const telem = student.telemetry;
    if (telem.latitude == null || telem.longitude == null) return;

    const isInside = telem.geofenceStatus === 'INSIDE';
    const isVerifying = telem.geofenceStatus === 'VERIFYING';
    const isSos = telem.isSos || false;
    const isOffline = telem.deviceStatus === 'OFFLINE' || (telem.lastSeen && Date.now() - telem.lastSeen > 300000);

    let color = '#ff4d5e';
    let statusBadgeText = isInside ? '✓' : isSos ? 'SOS' : '!';
    if (isOffline) {
      color = '#9a9ac0';
      statusBadgeText = 'OFF';
    } else if (isInside) {
      color = '#2ee59d';
    } else if (isVerifying) {
      color = '#ffb020';
      statusBadgeText = '~';
    }

    if (isSos) {
      color = '#ff4d5e';
      statusBadgeText = 'SOS';
    }

    const size = isSelected ? 52 : 44;
    const pulseHtml = isSos
      ? `<div class="radar-ring" style="position: absolute; inset: -10px; border-radius: 9999px; background: rgba(255, 77, 94, 0.45); border: 2px solid #ff4d5e;"></div>`
      : isInside && !isOffline
      ? `<div class="radar-ring" style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(46, 229, 157, 0.25);"></div>`
      : '';

    const iconHtml = `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
        ${pulseHtml}
        <div style="width: ${size - 8}px; height: ${size - 8}px; border-radius: 9999px; border: 3px solid ${color}; overflow: hidden; background: #1b1b33; position: relative; z-index: 2; transition: all 0.2s; ${isOffline ? 'filter: grayscale(80%) opacity(0.85);' : ''}">
          <img src="${student.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${student.name}" />
        </div>
        <div style="position: absolute; bottom: 0; right: 0; z-index: 3; background: ${color}; color: #fff; font-size: 8px; font-weight: 800; border-radius: 9999px; border: 1.5px solid #1b1b33; padding: 1px 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
          ${statusBadgeText}
        </div>
        ${
          isSelected
            ? `<div style="position: absolute; top: -18px; background: #2ee59d; color: #1b1b33; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; z-index: 4;">${student.name}</div>`
            : ''
        }
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'student-fleet-marker',
      html: iconHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    let marker = this.studentMarkers.get(student.id);
    if (marker) {
      marker.setLatLng([telem.latitude, telem.longitude]);
      marker.setIcon(customIcon);
    } else {
      marker = L.marker([telem.latitude, telem.longitude], { icon: customIcon });
      marker.on('click', () => {
        this.options.events?.onMarkerClick?.({
          student,
          lat: telem.latitude,
          lng: telem.longitude,
        });
      });
      marker.addTo(this.map);
      this.studentMarkers.set(student.id, marker);
    }
  }

  removeStudentMarker(studentId: string): void {
    const marker = this.studentMarkers.get(studentId);
    if (marker && this.map) {
      this.map.removeLayer(marker);
      this.studentMarkers.delete(studentId);
    }
  }

  clearStudentMarkers(): void {
    if (!this.map) return;
    this.studentMarkers.forEach((m) => this.map?.removeLayer(m));
    this.studentMarkers.clear();
  }

  renderSchoolGeofences(schools: School[], selectedSchoolId?: string): void {
    if (!this.map) return;

    // Clear old
    this.schoolPolygons.forEach((p) => this.map?.removeLayer(p));
    this.schoolPolygons.clear();
    this.schoolBadges.forEach((b) => this.map?.removeLayer(b));
    this.schoolBadges.clear();

    schools.forEach((sch) => {
      if (sch.polygon && sch.polygon.length > 2) {
        const isSelected = sch.id === selectedSchoolId;
        const poly = L.polygon(sch.polygon, {
          color: sch.color || '#2ee59d',
          weight: isSelected ? 3 : 2,
          fillColor: sch.color || '#2ee59d',
          fillOpacity: 0.16,
        });

        poly.on('click', () => {
          this.options.events?.onSchoolClick?.(sch.id);
        });

        poly.addTo(this.map!);
        this.schoolPolygons.set(sch.id, poly);
      }

      if (sch.lat && sch.lng) {
        const badgeIcon = L.divIcon({
          className: 'school-badge-fleet',
          html: `
            <div style="background: ${sch.color || '#2ee59d'}; color: #1b1b33; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: pointer; white-space: nowrap;">
              🏫 ${sch.name}
            </div>
          `,
          iconSize: [0, 0],
        });

        const badgeMarker = L.marker([sch.lat, sch.lng], { icon: badgeIcon });
        badgeMarker.on('click', () => {
          this.options.events?.onSchoolClick?.(sch.id);
        });
        badgeMarker.addTo(this.map!);
        this.schoolBadges.set(sch.id, badgeMarker);
      }
    });
  }

  renderTrail(studentId: string, coordinates: [number, number][], color: string): void {
    if (!this.map || !coordinates || coordinates.length < 2) return;

    let polyline = this.trailPolylines.get(studentId);
    if (polyline) {
      polyline.setLatLngs(coordinates as any);
      polyline.setStyle({ color });
    } else {
      polyline = L.polyline(coordinates as any, {
        color,
        weight: 3,
        opacity: 0.8,
      }).addTo(this.map);
      this.trailPolylines.set(studentId, polyline);
    }
  }

  clearTrails(): void {
    if (!this.map) return;
    this.trailPolylines.forEach((p) => this.map?.removeLayer(p));
    this.trailPolylines.clear();
  }

  setSearchMarker(lat: number, lng: number, title?: string): void {
    if (!this.map) return;
    if (typeof lat !== 'number' || !isFinite(lat) || typeof lng !== 'number' || !isFinite(lng)) return;
    this.clearSearchMarker();

    const icon = L.divIcon({
      className: 'search-pin-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
          <div style="background: #2ee59d; color: #1b1b33; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); white-space: nowrap; margin-bottom: 3px; border: 1.5px solid #ffffff; max-width: 220px; overflow: hidden; text-overflow: ellipsis;">
            📍 ${title || 'Tanlangan manzil'}
          </div>
          <div style="width: 26px; height: 26px; background: #2ee59d; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 14px rgba(46, 229, 157, 0.7); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; background: #1b1b33; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [0, 0],
    });

    try {
      this.searchMarker = L.marker([lat, lng], { icon, zIndexOffset: 2000 }).addTo(this.map);
    } catch (err) {
      console.warn('Search marker qo\'shishda xato:', err);
    }
  }

  clearSearchMarker(): void {
    if (this.searchMarker && this.map) {
      this.map.removeLayer(this.searchMarker);
      this.searchMarker = null;
    }
  }

  // --- DRAWING TOOLS ---
  startDrawingPolygon(onPointAdded?: (pointsCount: number) => void): void {
    this.cancelDrawing();
    if (!this.map) return;

    this.isDrawing = true;
    this.drawPoints = [];
    this.drawMarkers = [];

    this.mapClickHandler = (e: L.LeafletMouseEvent) => {
      if (!e || !e.latlng || !isFinite(e.latlng.lat) || !isFinite(e.latlng.lng)) return;
      const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
      this.drawPoints.push(pt);

      // Add numbered vertex marker
      const markerIndex = this.drawPoints.length;
      const vertexIcon = L.divIcon({
        className: 'draw-vertex-pin',
        html: `
          <div style="background: #ff2d78; color: #ffffff; width: 22px; height: 22px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.6); transform: translate(-50%, -50%);">
            ${markerIndex}
          </div>
        `,
        iconSize: [0, 0],
      });

      const vertexMarker = L.marker([pt[0], pt[1]], {
        icon: vertexIcon,
        pane: 'drawPane',
        zIndexOffset: 3000,
      }).addTo(this.map!);
      this.drawMarkers.push(vertexMarker);

      // Safe progressive rendering:
      // Point 1: vertex marker only
      // Point 2: guide polyline
      // Point >= 3: closed polygon
      if (this.drawPoints.length === 2) {
        if (this.activeDrawLayer) {
          this.map!.removeLayer(this.activeDrawLayer);
          this.activeDrawLayer = null;
        }
        this.isDrawPolygonReady = false;
        this.activeDrawLayer = L.polyline(this.drawPoints, {
          pane: 'drawPane',
          color: '#ff2d78',
          weight: 3,
          dashArray: '4, 4',
        }).addTo(this.map!);
      } else if (this.drawPoints.length >= 3) {
        if (this.activeDrawLayer && !this.isDrawPolygonReady) {
          this.map!.removeLayer(this.activeDrawLayer);
          this.activeDrawLayer = null;
        }
        if (!this.activeDrawLayer) {
          this.activeDrawLayer = L.polygon(this.drawPoints, {
            pane: 'drawPane',
            color: '#ff2d78',
            weight: 3,
            fillColor: '#ff2d78',
            fillOpacity: 0.25,
            dashArray: '4, 4',
          }).addTo(this.map!);
          this.isDrawPolygonReady = true;
        } else {
          (this.activeDrawLayer as any).setLatLngs(this.drawPoints);
        }
      }
      onPointAdded?.(this.drawPoints.length);
    };

    this.map.on('click', this.mapClickHandler);
  }

  undoLastPolygonPoint(): number {
    if (this.drawPoints.length === 0) return 0;
    this.drawPoints.pop();
    const lastMarker = this.drawMarkers.pop();
    if (lastMarker && this.map) {
      this.map.removeLayer(lastMarker);
    }
    if (this.activeDrawLayer && this.map) {
      if (this.drawPoints.length < 2) {
        this.map.removeLayer(this.activeDrawLayer);
        this.activeDrawLayer = null;
        this.isDrawPolygonReady = false;
      } else if (this.drawPoints.length === 2) {
        this.map.removeLayer(this.activeDrawLayer);
        this.isDrawPolygonReady = false;
        this.activeDrawLayer = L.polyline(this.drawPoints, {
          color: '#ff2d78',
          weight: 3,
          dashArray: '4, 4',
        }).addTo(this.map);
      } else {
        (this.activeDrawLayer as any).setLatLngs(this.drawPoints);
      }
    }
    return this.drawPoints.length;
  }

  finishDrawingPolygon(): [number, number][] | null {
    if (this.mapClickHandler && this.map) {
      this.map.off('click', this.mapClickHandler);
      this.mapClickHandler = null;
    }

    if (this.drawPoints.length < 3) {
      this.cancelDrawing();
      return null;
    }

    const res = [...this.drawPoints];
    this.cancelDrawing();
    return res;
  }

  startDrawingCircle(center?: [number, number], initialRadius = 200): void {
    this.cancelDrawing();
    if (!this.map) return;

    this.isDrawing = true;
    let initialCenter: [number, number] = [41.311081, 69.240562];
    if (center && Array.isArray(center) && isFinite(center[0]) && isFinite(center[1])) {
      initialCenter = center;
    } else {
      const c = this.map.getCenter();
      if (c && isFinite(c.lat) && isFinite(c.lng)) {
        initialCenter = [c.lat, c.lng];
      }
    }

    this.activeDrawCircle = L.circle(initialCenter, {
      pane: 'drawPane',
      radius: initialRadius,
      color: '#2ee59d',
      weight: 3,
      fillColor: '#2ee59d',
      fillOpacity: 0.25,
      dashArray: '6, 6',
    }).addTo(this.map);

    // Clicking anywhere on map relocates the circle center
    this.mapClickHandler = (e: L.LeafletMouseEvent) => {
      if (e && e.latlng && isFinite(e.latlng.lat) && isFinite(e.latlng.lng)) {
        if (this.activeDrawCircle) {
          this.activeDrawCircle.setLatLng(e.latlng);
        }
      }
    };
    this.map.on('click', this.mapClickHandler);
  }

  setCircleRadius(radius: number): void {
    if (this.activeDrawCircle && isFinite(radius)) {
      this.activeDrawCircle.setRadius(radius);
    }
  }

  finishDrawingCircle(): { center: [number, number]; radius: number } | null {
    if (!this.activeDrawCircle) return null;
    const center = this.activeDrawCircle.getLatLng();
    const radius = Math.round(this.activeDrawCircle.getRadius());
    const res = {
      center: [center.lat, center.lng] as [number, number],
      radius,
    };
    this.cancelDrawing();
    return res;
  }

  cancelDrawing(): void {
    this.isDrawing = false;
    if (this.mapClickHandler && this.map) {
      this.map.off('click', this.mapClickHandler);
      this.mapClickHandler = null;
    }
    if (this.activeDrawLayer && this.map) {
      this.map.removeLayer(this.activeDrawLayer);
      this.activeDrawLayer = null;
    }
    this.isDrawPolygonReady = false;
    if (this.activeDrawCircle && this.map) {
      this.map.removeLayer(this.activeDrawCircle);
      this.activeDrawCircle = null;
    }
    if (this.drawMarkers && this.map) {
      this.drawMarkers.forEach((m) => this.map?.removeLayer(m));
      this.drawMarkers = [];
    }
    this.drawPoints = [];
  }

  // --- MEASURE TOOL ---
  startMeasure(onUpdate?: (distMeters: number) => void): void {
    this.stopMeasure();
    if (!this.map) return;

    this.isDrawing = true;
    this.measurePoints = [];
    this.mapClickHandler = (e: L.LeafletMouseEvent) => {
      this.measurePoints.push([e.latlng.lat, e.latlng.lng]);

      const marker = L.marker([e.latlng.lat, e.latlng.lng], {
        pane: 'drawPane',
        icon: L.divIcon({
          className: 'measure-pin',
          html: `<div style="background:#4db5ff;color:#fff;width:18px;height:18px;border-radius:9999px;text-align:center;font-size:11px;font-weight:bold;line-height:18px;">${
            this.measurePoints.length === 1 ? 'A' : 'B'
          }</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      }).addTo(this.map!);
      this.measureMarkers.push(marker);

      if (this.measurePoints.length === 2) {
        this.measureLine = L.polyline(this.measurePoints as any, {
          pane: 'drawPane',
          color: '#4db5ff',
          weight: 3,
          dashArray: '5, 5',
        }).addTo(this.map!);

        const dist = Math.round(
          haversineDistance(
            this.measurePoints[0][0],
            this.measurePoints[0][1],
            this.measurePoints[1][0],
            this.measurePoints[1][1]
          )
        );
        onUpdate?.(dist);
      } else if (this.measurePoints.length > 2) {
        this.stopMeasure();
        this.startMeasure(onUpdate);
      }
    };

    this.map.on('click', this.mapClickHandler);
  }

  stopMeasure(): void {
    this.isDrawing = false;
    if (this.mapClickHandler && this.map) {
      this.map.off('click', this.mapClickHandler);
      this.mapClickHandler = null;
    }
    if (this.measureLine && this.map) {
      this.map.removeLayer(this.measureLine);
      this.measureLine = null;
    }
    this.measureMarkers.forEach((m) => this.map?.removeLayer(m));
    this.measureMarkers = [];
    this.measurePoints = [];
  }

  checkAndRecoverTileLayer(): void {
    if (!this.map) return;

    // Do NOT touch tile layer while user is actively drawing — it would destroy draw state
    if (this.isDrawing) return;

    // 1. Ensure tile layer is active
    if (!this.tileLayer || !this.map.hasLayer(this.tileLayer)) {
      console.warn('⚠️ Xarita plitkasi (tiles) yo\'qolgan, qayta tiklanmoqda...');
      this.setMapType(this.currentMapType);
    }

    // 2. Validate center and zoom
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const isCenterInvalid = !center || !isFinite(center.lat) || !isFinite(center.lng) || isNaN(center.lat) || isNaN(center.lng);
    const isZoomInvalid = typeof zoom !== 'number' || isNaN(zoom) || !isFinite(zoom) || zoom < 1 || zoom > 19;

    if (isCenterInvalid || isZoomInvalid) {
      console.warn('⚠️ Noto\'g\'ri xarita markazi yoki zoom aniqlandi, standart markazga tiklanmoqda');
      const defCenter: [number, number] = this.options?.center && isFinite(this.options.center[0]) && isFinite(this.options.center[1])
        ? this.options.center
        : [41.311081, 69.240562];
      this.map.setView(defCenter, 16);
    }
  }

  resize(): void {
    if (!this.map) return;
    this.checkAndRecoverTileLayer();
    this.map.invalidateSize({ pan: false });
  }

  destroy(): void {
    this.cancelDrawing();
    this.stopMeasure();
    this.clearSearchMarker();
    this.clearStudentMarkers();
    this.clearTrails();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
