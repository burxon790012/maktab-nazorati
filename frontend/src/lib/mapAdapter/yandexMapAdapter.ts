// Yandex Maps JavaScript API 2.1 Adapter (Native High-Accuracy Support for Uzbekistan)
import { School, Student } from '@/types';
import {
  MapAdapter,
  MapInitOptions,
  MapLayerType,
  MapProviderType,
} from './types';
import { haversineDistance } from '@/lib/geoUtils';

export class YandexMapAdapter implements MapAdapter {
  private map: any = null;
  private options!: MapInitOptions;

  private studentMarkers: Map<string, any> = new Map();
  private schoolPolygons: Map<string, any> = new Map();
  private schoolBadges: Map<string, any> = new Map();
  private trailPolylines: Map<string, any> = new Map();
  private searchMarker: any = null;

  // Custom Drawing state
  private activeDrawPolygon: any = null;
  private activeDrawPolyline: any = null;
  private activeDrawCircle: any = null;
  private drawPoints: [number, number][] = [];
  private drawMarkers: any[] = [];
  private mapClickHandler: any = null;

  // Measure state
  private measureLine: any = null;
  private measureMarkers: any[] = [];
  private measurePoints: [number, number][] = [];

  getProviderName(): MapProviderType {
    return 'yandex';
  }

  async init(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.options = options;
    const ymaps = (window as any).ymaps;
    if (!ymaps || !ymaps.Map) {
      throw new Error('Yandex Maps SDK yuklanmadi');
    }

    const typeName =
      options.mapType === 'satellite' || options.mapType === 'hybrid'
        ? 'yandex#hybrid'
        : 'yandex#map';

    this.map = new ymaps.Map(
      container,
      {
        center: [options.center[0], options.center[1]],
        zoom: options.zoom || 16,
        type: typeName,
        controls: [],
      },
      {
        suppressMapOpenBlock: true,
      }
    );

    if (options.events?.onMapClick) {
      this.map.events.add('click', (e: any) => {
        if (this.mapClickHandler) return; // Drawing has priority
        const coords = e.get('coords');
        if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
          options.events?.onMapClick?.(coords[0], coords[1]);
        }
      });
    }

    if (options.events?.onMouseMove) {
      this.map.events.add('mousemove', (e: any) => {
        const coords = e.get('coords');
        if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
          options.events?.onMouseMove?.(coords[0], coords[1]);
        }
      });
    }

    // Initial resize after container layout stabilizes
    setTimeout(() => {
      this.resize();
    }, 200);
  }

  setMapType(type: MapLayerType): void {
    if (!this.map) return;
    if (type === 'satellite' || type === 'hybrid') {
      this.map.setType('yandex#hybrid');
    } else {
      this.map.setType('yandex#map');
    }
  }

  setTheme(_isDark: boolean): void {
    // Yandex Maps vector road styling is managed by native tile engine
  }

  flyTo(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;
    if (typeof lat !== 'number' || isNaN(lat) || !isFinite(lat) || typeof lng !== 'number' || isNaN(lng) || !isFinite(lng)) {
      return;
    }
    const targetZoom = typeof zoom === 'number' && isFinite(zoom) ? Math.min(Math.round(zoom), 18) : 16;
    try {
      this.map.setCenter([lat, lng], targetZoom, { duration: 600, checkZoomRange: true });
    } catch (_) {
      try {
        this.map.panTo([lat, lng], { flying: true });
      } catch (_) {}
    }
  }

  fitBounds(bounds: [number, number][]): void {
    if (!this.map || !bounds || !Array.isArray(bounds) || bounds.length === 0) return;

    const valid: [number, number][] = [];
    for (const pt of bounds) {
      if (Array.isArray(pt) && pt.length >= 2 && isFinite(pt[0]) && isFinite(pt[1])) {
        valid.push([pt[0], pt[1]]);
      }
    }

    if (valid.length === 0) return;
    if (valid.length === 1) {
      this.map.setCenter(valid[0], 16);
      return;
    }

    // In Yandex Maps, setBounds expects [[latMin, lngMin], [latMax, lngMax]]
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    valid.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    try {
      this.map.setBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { checkZoomRange: true, zoomMargin: 35 }
      );
    } catch (e) {
      console.warn('Yandex setBounds xatosi:', e);
    }
  }

  upsertStudentMarker(student: Student, isSelected: boolean): void {
    if (!this.map || !student.telemetry) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    const { latitude, longitude, geofenceStatus, isSos, batteryLevel, heartRate } = student.telemetry;
    if (latitude == null || longitude == null || !isFinite(latitude) || !isFinite(longitude)) return;

    const isInside = geofenceStatus === 'INSIDE';
    const isVerifying = geofenceStatus === 'VERIFYING';
    const isOffline = student.telemetry.deviceStatus === 'OFFLINE' || (student.telemetry.lastSeen && Date.now() - student.telemetry.lastSeen > 300000);

    const statusColor = isSos ? '#ff4d5e' : isInside ? '#2ee59d' : isVerifying ? '#ffb020' : '#ff4d5e';
    const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Remove existing placemark if present
    const existing = this.studentMarkers.get(student.id);
    if (existing) {
      this.map.geoObjects.remove(existing);
      this.studentMarkers.delete(student.id);
    }

    // Custom HTML Layout for Yandex Placemark
    const pinLayout = ymaps.templateLayoutFactory.createClass(
      `<div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
        ${isSos ? '<div style="position:absolute; inset:-8px; border-radius:9999px; background:rgba(255,77,94,0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
        <div style="width: 38px; height: 38px; border-radius: 9999px; background: ${statusColor}; padding: 2px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="width: 100%; height: 100%; border-radius: 9999px; background: #1b1b33; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: bold;">
            ${initials}
          </div>
        </div>
        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: rgba(27,27,51,0.92); border: 1px solid ${statusColor}; color: #e8e8f5; font-size: 10px; font-weight: bold; padding: 1px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
          ${student.name.split(' ')[0]} ${isSos ? '🚨' : ''}
        </div>
      </div>`
    );

    const placemark = new ymaps.Placemark(
      [latitude, longitude],
      {
        hintContent: `${student.name} (${student.className || student.classId || ''})`,
        balloonContent: `
          <div style="padding: 8px; font-family: sans-serif; color: #1b1b33;">
            <div style="font-weight: bold; font-size: 14px;">${student.name}</div>
            <div style="font-size: 12px; color: #666;">Sinf: ${student.className || student.classId || 'N/A'}</div>
            <div style="margin-top: 6px; font-size: 12px;">
              Holati: <strong style="color: ${statusColor}">${isSos ? 'SOS XAVF' : isInside ? 'Maktabda' : isVerifying ? 'Chegarada' : 'Tashqarida'}</strong>
            </div>
            <div style="font-size: 12px; margin-top: 2px;">
              Batareya: <strong>${batteryLevel || '--'}%</strong> | Puls: <strong>${heartRate || '--'} bpm</strong>
            </div>
          </div>
        `,
      },
      {
        iconLayout: pinLayout,
        iconShape: {
          type: 'Circle',
          coordinates: [0, 0],
          radius: 20,
        },
        zIndex: isSelected ? 1000 : 500,
      }
    );

    placemark.events.add('click', () => {
      this.options.events?.onMarkerClick?.({
        student,
        lat: latitude,
        lng: longitude,
      });
    });

    this.map.geoObjects.add(placemark);
    this.studentMarkers.set(student.id, placemark);
  }

  removeStudentMarker(studentId: string): void {
    const marker = this.studentMarkers.get(studentId);
    if (marker && this.map) {
      this.map.geoObjects.remove(marker);
      this.studentMarkers.delete(studentId);
    }
  }

  clearStudentMarkers(): void {
    if (!this.map) return;
    this.studentMarkers.forEach((marker) => {
      this.map.geoObjects.remove(marker);
    });
    this.studentMarkers.clear();
  }

  renderSchoolGeofences(schools: School[], selectedSchoolId?: string): void {
    if (!this.map) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    // Clear old geofences and badges
    this.schoolPolygons.forEach((p) => this.map.geoObjects.remove(p));
    this.schoolPolygons.clear();
    this.schoolBadges.forEach((b) => this.map.geoObjects.remove(b));
    this.schoolBadges.clear();

    schools.forEach((sch) => {
      if (sch.polygon && sch.polygon.length > 2) {
        const isSelected = sch.id === selectedSchoolId;
        const color = sch.color || '#2ee59d';

        // Calculate center coordinates
        let sumLat = 0, sumLng = 0;
        sch.polygon.forEach(([lat, lng]) => {
          sumLat += lat;
          sumLng += lng;
        });
        const centerLat = typeof sch.lat === 'number' && isFinite(sch.lat) ? sch.lat : (sumLat / sch.polygon.length);
        const centerLng = typeof sch.lng === 'number' && isFinite(sch.lng) ? sch.lng : (sumLng / sch.polygon.length);
        const center: [number, number] = [centerLat, centerLng];

        // Yandex expects coordinates as [ [lat, lng], [lat, lng], ... ]
        const poly = new ymaps.Polygon(
          [sch.polygon],
          {
            hintContent: `${sch.name} [GPS: ${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}]`,
            balloonContent: `
              <div style="padding: 8px; font-family: sans-serif; color: #1b1b33;">
                <div style="font-weight: bold; font-size: 14px;">🏫 ${sch.name}</div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">${sch.address || "O'zbekiston"}</div>
                <div style="margin-top: 6px; padding: 4px 8px; background: #2ee59d20; border-radius: 6px; font-size: 11px; font-weight: bold; color: #1b1b33;">
                  📍 Aniq GPS: <strong>${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}</strong>
                </div>
                <div style="font-size: 10px; color: #777; margin-top: 4px;">
                  🛡️ Geozona: <strong>${sch.polygon.length} ta aniq burchak nuqtasi</strong>
                </div>
              </div>
            `,
          },
          {
            fillColor: isSelected ? `${color}44` : `${color}26`,
            strokeColor: color,
            strokeWidth: isSelected ? 3 : 2,
            strokeOpacity: 0.9,
          }
        );

        poly.events.add('click', () => {
          this.options.events?.onSchoolClick?.(sch.id);
        });

        this.map.geoObjects.add(poly);
        this.schoolPolygons.set(sch.id, poly);

        const badgeLayout = ymaps.templateLayoutFactory.createClass(
          `<div style="position: relative; transform: translate(-50%, -50%); background: rgba(27, 27, 51, 0.95); color: ${color}; padding: 4px 9px; border-radius: 8px; font-weight: bold; font-size: 11px; border: 1.5px solid ${color}; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 5px; cursor: pointer;">
            <span>🏫</span>
            <span>${sch.name}</span>
            <span style="font-size: 9.5px; opacity: 0.85; font-family: monospace; background: rgba(255,255,255,0.08); padding: 1px 4px; border-radius: 4px;">📍 ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}</span>
          </div>`
        );

        const badge = new ymaps.Placemark(
          center,
          {},
          {
            iconLayout: badgeLayout,
            zIndex: 300,
          }
        );

        this.map.geoObjects.add(badge);
        this.schoolBadges.set(sch.id, badge);
      }
    });
  }

  renderTrail(studentId: string, coordinates: [number, number][], color: string): void {
    if (!this.map || coordinates.length < 2) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    const existing = this.trailPolylines.get(studentId);
    if (existing) {
      this.map.geoObjects.remove(existing);
    }

    const line = new ymaps.Polyline(
      coordinates,
      {},
      {
        strokeColor: color || '#2ee59d',
        strokeWidth: 3,
        strokeOpacity: 0.8,
      }
    );

    this.map.geoObjects.add(line);
    this.trailPolylines.set(studentId, line);
  }

  clearTrails(): void {
    if (!this.map) return;
    this.trailPolylines.forEach((line) => {
      this.map.geoObjects.remove(line);
    });
    this.trailPolylines.clear();
  }

  setSearchMarker(lat: number, lng: number, title?: string): void {
    this.clearSearchMarker();
    if (!this.map) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    const safeTitle = (title || 'Qidirilgan manzil').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const layout = ymaps.templateLayoutFactory.createClass(
      `<div style="position: relative; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto;">
        <div style="background: #ff2d78; color: #ffffff; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 9999px; box-shadow: 0 4px 16px rgba(0,0,0,0.5); white-space: nowrap; border: 2px solid #ffffff; display: flex; align-items: center; gap: 4px;">
          <span>📍</span>
          <span>${safeTitle}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #ff2d78;"></div>
      </div>`
    );

    this.searchMarker = new ymaps.Placemark(
      [lat, lng],
      {
        hintContent: safeTitle,
        balloonContent: `
          <div style="padding: 6px; font-family: sans-serif;">
            <div style="font-weight: bold; font-size: 13px; color: #1b1b33;">${safeTitle}</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">Koordinatalar: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
          </div>
        `,
      },
      { iconLayout: layout, zIndex: 1200 }
    );

    this.map.geoObjects.add(this.searchMarker);
    this.flyTo(lat, lng, 17);
  }

  clearSearchMarker(): void {
    if (this.searchMarker && this.map) {
      this.map.geoObjects.remove(this.searchMarker);
      this.searchMarker = null;
    }
  }

  // --- DRAWING TOOLS (Polygon / Circle) ---
  startDrawingPolygon(onPointAdded?: (pointsCount: number) => void): void {
    this.cancelDrawing();
    if (!this.map) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    this.drawPoints = [];
    this.drawMarkers = [];

    this.mapClickHandler = (e: any) => {
      const coords = e.get('coords');
      if (!coords || !isFinite(coords[0]) || !isFinite(coords[1])) return;
      const pt: [number, number] = [coords[0], coords[1]];
      this.drawPoints.push(pt);

      const markerIndex = this.drawPoints.length;
      const vertexLayout = ymaps.templateLayoutFactory.createClass(
        `<div style="position: relative; transform: translate(-50%, -50%); background: #ff2d78; color: #ffffff; width: 22px; height: 22px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
          ${markerIndex}
        </div>`
      );

      const vertexMarker = new ymaps.Placemark(pt, {}, { iconLayout: vertexLayout, zIndex: 2000 });
      this.map.geoObjects.add(vertexMarker);
      this.drawMarkers.push(vertexMarker);

      if (this.drawPoints.length === 2) {
        if (this.activeDrawPolyline) this.map.geoObjects.remove(this.activeDrawPolyline);
        this.activeDrawPolyline = new ymaps.Polyline(
          this.drawPoints,
          {},
          { strokeColor: '#ff2d78', strokeWidth: 3, strokeStyle: 'dash' }
        );
        this.map.geoObjects.add(this.activeDrawPolyline);
      } else if (this.drawPoints.length >= 3) {
        if (this.activeDrawPolyline) {
          this.map.geoObjects.remove(this.activeDrawPolyline);
          this.activeDrawPolyline = null;
        }
        if (!this.activeDrawPolygon) {
          this.activeDrawPolygon = new ymaps.Polygon(
            [this.drawPoints],
            {},
            { fillColor: '#ff2d7840', strokeColor: '#ff2d78', strokeWidth: 3, strokeStyle: 'dash' }
          );
          this.map.geoObjects.add(this.activeDrawPolygon);
        } else {
          this.activeDrawPolygon.geometry.setCoordinates([this.drawPoints]);
        }
      }

      onPointAdded?.(this.drawPoints.length);
    };

    this.map.events.add('click', this.mapClickHandler);
  }

  undoLastPolygonPoint(): number {
    if (this.drawPoints.length === 0) return 0;
    this.drawPoints.pop();
    const lastMarker = this.drawMarkers.pop();
    if (lastMarker && this.map) {
      this.map.geoObjects.remove(lastMarker);
    }

    if (this.drawPoints.length < 2) {
      if (this.activeDrawPolyline && this.map) {
        this.map.geoObjects.remove(this.activeDrawPolyline);
        this.activeDrawPolyline = null;
      }
      if (this.activeDrawPolygon && this.map) {
        this.map.geoObjects.remove(this.activeDrawPolygon);
        this.activeDrawPolygon = null;
      }
    } else if (this.drawPoints.length === 2) {
      if (this.activeDrawPolygon && this.map) {
        this.map.geoObjects.remove(this.activeDrawPolygon);
        this.activeDrawPolygon = null;
      }
      const ymaps = (window as any).ymaps;
      if (!this.activeDrawPolyline && ymaps) {
        this.activeDrawPolyline = new ymaps.Polyline(
          this.drawPoints,
          {},
          { strokeColor: '#ff2d78', strokeWidth: 3, strokeStyle: 'dash' }
        );
        this.map.geoObjects.add(this.activeDrawPolyline);
      } else if (this.activeDrawPolyline) {
        this.activeDrawPolyline.geometry.setCoordinates(this.drawPoints);
      }
    } else if (this.activeDrawPolygon) {
      this.activeDrawPolygon.geometry.setCoordinates([this.drawPoints]);
    }

    return this.drawPoints.length;
  }

  finishDrawingPolygon(): [number, number][] | null {
    if (this.mapClickHandler && this.map) {
      this.map.events.remove('click', this.mapClickHandler);
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
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    let initialCenter: [number, number] = [41.311081, 69.240562];
    if (center && Array.isArray(center) && isFinite(center[0]) && isFinite(center[1])) {
      initialCenter = center;
    } else {
      const c = this.map.getCenter();
      if (c && isFinite(c[0]) && isFinite(c[1])) {
        initialCenter = [c[0], c[1]];
      }
    }

    this.activeDrawCircle = new ymaps.Circle(
      [initialCenter, initialRadius],
      {},
      {
        fillColor: '#2ee59d40',
        strokeColor: '#2ee59d',
        strokeWidth: 3,
        strokeStyle: 'dash',
      }
    );

    this.map.geoObjects.add(this.activeDrawCircle);

    this.mapClickHandler = (e: any) => {
      const coords = e.get('coords');
      if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
        if (this.activeDrawCircle) {
          const r = this.activeDrawCircle.geometry.getRadius();
          this.activeDrawCircle.geometry.setCoordinates(coords);
          this.activeDrawCircle.geometry.setRadius(r);
        }
      }
    };

    this.map.events.add('click', this.mapClickHandler);
  }

  setCircleRadius(radius: number): void {
    if (this.activeDrawCircle && isFinite(radius)) {
      this.activeDrawCircle.geometry.setRadius(radius);
    }
  }

  finishDrawingCircle(): { center: [number, number]; radius: number } | null {
    if (!this.activeDrawCircle) return null;
    const center = this.activeDrawCircle.geometry.getCoordinates();
    const radius = Math.round(this.activeDrawCircle.geometry.getRadius());
    const res = {
      center: [center[0], center[1]] as [number, number],
      radius,
    };
    this.cancelDrawing();
    return res;
  }

  cancelDrawing(): void {
    if (this.mapClickHandler && this.map) {
      this.map.events.remove('click', this.mapClickHandler);
      this.mapClickHandler = null;
    }
    if (this.activeDrawPolyline && this.map) {
      this.map.geoObjects.remove(this.activeDrawPolyline);
      this.activeDrawPolyline = null;
    }
    if (this.activeDrawPolygon && this.map) {
      this.map.geoObjects.remove(this.activeDrawPolygon);
      this.activeDrawPolygon = null;
    }
    if (this.activeDrawCircle && this.map) {
      this.map.geoObjects.remove(this.activeDrawCircle);
      this.activeDrawCircle = null;
    }
    if (this.drawMarkers && this.map) {
      this.drawMarkers.forEach((m) => this.map.geoObjects.remove(m));
      this.drawMarkers = [];
    }
    this.drawPoints = [];
  }

  // --- MEASURE TOOL ---
  startMeasure(onUpdate?: (distMeters: number) => void): void {
    this.stopMeasure();
    if (!this.map) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    this.measurePoints = [];
    this.mapClickHandler = (e: any) => {
      const coords = e.get('coords');
      if (!coords) return;
      this.measurePoints.push([coords[0], coords[1]]);

      const label = this.measurePoints.length === 1 ? 'A' : 'B';
      const layout = ymaps.templateLayoutFactory.createClass(
        `<div style="position:relative; transform:translate(-50%,-50%); background:#4db5ff; color:#fff; width:18px; height:18px; border-radius:9999px; text-align:center; font-size:11px; font-weight:bold; line-height:18px;">
          ${label}
        </div>`
      );

      const marker = new ymaps.Placemark(coords, {}, { iconLayout: layout, zIndex: 2000 });
      this.map.geoObjects.add(marker);
      this.measureMarkers.push(marker);

      if (this.measurePoints.length === 2) {
        this.measureLine = new ymaps.Polyline(
          this.measurePoints,
          {},
          { strokeColor: '#4db5ff', strokeWidth: 3, strokeStyle: 'dash' }
        );
        this.map.geoObjects.add(this.measureLine);

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

    this.map.events.add('click', this.mapClickHandler);
  }

  stopMeasure(): void {
    if (this.mapClickHandler && this.map) {
      this.map.events.remove('click', this.mapClickHandler);
      this.mapClickHandler = null;
    }
    if (this.measureLine && this.map) {
      this.map.geoObjects.remove(this.measureLine);
      this.measureLine = null;
    }
    if (this.measureMarkers && this.map) {
      this.measureMarkers.forEach((m) => this.map.geoObjects.remove(m));
      this.measureMarkers = [];
    }
    this.measurePoints = [];
  }

  zoomIn(): void {
    if (!this.map) return;
    try {
      const cur = this.map.getZoom();
      this.map.setZoom(Math.min(cur + 1, 19), { duration: 200 });
    } catch (_) {}
  }

  zoomOut(): void {
    if (!this.map) return;
    try {
      const cur = this.map.getZoom();
      this.map.setZoom(Math.max(cur - 1, 3), { duration: 200 });
    } catch (_) {}
  }

  resize(): void {
    if (!this.map) return;
    try {
      this.map.container.fitToViewport();
    } catch (_) {}
  }

  destroy(): void {
    this.cancelDrawing();
    this.stopMeasure();
    this.clearSearchMarker();
    this.clearStudentMarkers();
    this.clearTrails();
    if (this.map) {
      try {
        this.map.destroy();
      } catch (_) {}
      this.map = null;
    }
  }
}
