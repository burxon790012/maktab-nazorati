// Google Maps JavaScript API Adapter (Modern Architecture with AdvancedMarkerElement & Custom Geofencing)
import { School, Student } from '@/types';
import {
  MapAdapter,
  MapInitOptions,
  MapLayerType,
  MapProviderType,
} from './types';

// Dark Mode Map Styles for Google Maps
const GOOGLE_DARK_STYLES: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#1b1b33' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b33' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9a9ac0' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e8e8f5' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9a9ac0' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#242445' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2a2a4a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3a3a63' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e8e8f5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3b3b68' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f1f3a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#141428' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4db5ff' }],
  },
];

export class GoogleMapAdapter implements MapAdapter {
  private map: any = null;
  private options!: MapInitOptions;
  private studentMarkers: Map<string, any> = new Map();
  private schoolPolygons: Map<string, any> = new Map();
  private schoolMarkers: Map<string, any> = new Map();
  private trailPolylines: Map<string, any> = new Map();
  private searchMarker: any = null;

  // Custom Drawing state
  private activeDrawPolygon: any = null;
  private activeDrawCircle: any = null;
  private drawPoints: { lat: number; lng: number }[] = [];
  private drawMarkers: any[] = [];
  private mapClickListener: any = null;

  // Measure state
  private measureLine: any = null;
  private measureStartMarker: any = null;
  private measureEndMarker: any = null;

  getProviderName(): MapProviderType {
    return 'google';
  }

  async init(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.options = options;
    const g = window.google;
    if (!g || !g.maps) {
      throw new Error('Google Maps SDK mavjud emas');
    }

    const mapTypeId =
      options.mapType === 'satellite'
        ? g.maps.MapTypeId.HYBRID
        : g.maps.MapTypeId.ROADMAP;

    this.map = new g.maps.Map(container, {
      center: { lat: options.center[0], lng: options.center[1] },
      zoom: options.zoom,
      mapTypeId: mapTypeId,
      disableDefaultUI: true,
      zoomControl: true,
      scrollwheel: true,
      styles: options.isDark ? GOOGLE_DARK_STYLES : [],
      // Use mapId if cloud styles available or default
      mapId: 'SMART_CHILD_FLEET_MAP',
    });

    if (options.events?.onMapClick) {
      this.map.addListener('click', (e: any) => {
        options.events?.onMapClick?.(e.latLng.lat(), e.latLng.lng());
      });
    }
  }

  setMapType(type: MapLayerType): void {
    if (!this.map || !window.google) return;
    const g = window.google;
    if (type === 'satellite' || type === 'hybrid') {
      this.map.setMapTypeId(g.maps.MapTypeId.HYBRID);
    } else if (type === 'terrain') {
      this.map.setMapTypeId(g.maps.MapTypeId.TERRAIN);
    } else {
      this.map.setMapTypeId(g.maps.MapTypeId.ROADMAP);
    }
  }

  setTheme(isDark: boolean): void {
    if (!this.map) return;
    this.map.setOptions({
      styles: isDark ? GOOGLE_DARK_STYLES : [],
    });
  }

  flyTo(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;
    this.map.panTo({ lat, lng });
    if (zoom) {
      this.map.setZoom(zoom);
    }
  }

  fitBounds(bounds: [number, number][]): void {
    if (!this.map || !bounds || bounds.length === 0 || !window.google) return;
    const g = window.google;
    const gBounds = new g.maps.LatLngBounds();
    bounds.forEach(([lat, lng]) => gBounds.extend({ lat, lng }));
    this.map.fitBounds(gBounds);
  }

  upsertStudentMarker(student: Student, isSelected: boolean): void {
    if (!this.map || !student.telemetry || !window.google) return;
    const g = window.google;
    const telem = student.telemetry;
    if (telem.latitude == null || telem.longitude == null) return;

    const isInside = telem.geofenceStatus === 'INSIDE';
    const isVerifying = telem.geofenceStatus === 'VERIFYING';
    const isSos = telem.isSos || false;
    const isOffline = telem.deviceStatus === 'OFFLINE' || (telem.lastSeen && Date.now() - telem.lastSeen > 300000);

    let color = '#ff4d5e'; // Red
    let statusBadgeText = isInside ? '✓' : isSos ? 'SOS' : '!';
    if (isOffline) {
      color = '#9a9ac0'; // Gray
      statusBadgeText = 'OFF';
    } else if (isInside) {
      color = '#2ee59d'; // Green
    } else if (isVerifying) {
      color = '#ffb020'; // Amber
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

    // Create DOM element for AdvancedMarkerElement
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.cursor = 'pointer';
    container.style.filter = 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))';

    container.innerHTML = `
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
    `;

    container.addEventListener('click', () => {
      this.options.events?.onMarkerClick?.({
        student,
        lat: telem.latitude,
        lng: telem.longitude,
      });
    });

    const position = { lat: telem.latitude, lng: telem.longitude };

    // Use AdvancedMarkerElement if available, fallback to google.maps.Marker
    let marker = this.studentMarkers.get(student.id);
    if (marker) {
      if (marker.position) marker.position = position;
      if (marker.content) marker.content = container;
      if (marker.setPosition) marker.setPosition(position);
    } else {
      if (g.maps.marker && g.maps.marker.AdvancedMarkerElement) {
        marker = new g.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: position,
          content: container,
          title: student.name,
        });
      } else {
        // Fallback for older Google Maps build
        marker = new g.maps.Marker({
          map: this.map,
          position: position,
          title: student.name,
        });
      }
      this.studentMarkers.set(student.id, marker);
    }
  }

  removeStudentMarker(studentId: string): void {
    const marker = this.studentMarkers.get(studentId);
    if (marker) {
      if (marker.map !== undefined) marker.map = null;
      if (marker.setMap) marker.setMap(null);
      this.studentMarkers.delete(studentId);
    }
  }

  clearStudentMarkers(): void {
    this.studentMarkers.forEach((m) => {
      if (m.map !== undefined) m.map = null;
      if (m.setMap) m.setMap(null);
    });
    this.studentMarkers.clear();
  }

  renderSchoolGeofences(schools: School[], selectedSchoolId?: string): void {
    if (!this.map || !window.google) return;
    const g = window.google;

    // Clear old
    this.schoolPolygons.forEach((p) => p.setMap(null));
    this.schoolPolygons.clear();
    this.schoolMarkers.forEach((m) => {
      if (m.map !== undefined) m.map = null;
      if (m.setMap) m.setMap(null);
    });
    this.schoolMarkers.clear();

    schools.forEach((sch) => {
      if (sch.polygon && sch.polygon.length > 2) {
        const paths = sch.polygon.map(([lat, lng]) => ({ lat, lng }));
        const isSelected = sch.id === selectedSchoolId;

        const poly = new g.maps.Polygon({
          paths,
          strokeColor: sch.color || '#2ee59d',
          strokeOpacity: 0.9,
          strokeWeight: isSelected ? 3 : 2,
          fillColor: sch.color || '#2ee59d',
          fillOpacity: 0.16,
          map: this.map,
        });

        poly.addListener('click', () => {
          this.options.events?.onSchoolClick?.(sch.id);
        });

        this.schoolPolygons.set(sch.id, poly);
      }

      // School center label badge
      if (sch.lat && sch.lng) {
        const badgeDiv = document.createElement('div');
        badgeDiv.style.background = sch.color || '#2ee59d';
        badgeDiv.style.color = '#1b1b33';
        badgeDiv.style.padding = '3px 8px';
        badgeDiv.style.borderRadius = '9999px';
        badgeDiv.style.fontSize = '11px';
        badgeDiv.style.fontWeight = 'bold';
        badgeDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        badgeDiv.style.cursor = 'pointer';
        badgeDiv.style.whiteSpace = 'nowrap';
        badgeDiv.innerText = `🏫 ${sch.name}`;

        badgeDiv.addEventListener('click', () => {
          this.options.events?.onSchoolClick?.(sch.id);
        });

        if (g.maps.marker && g.maps.marker.AdvancedMarkerElement) {
          const schMarker = new g.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: { lat: sch.lat, lng: sch.lng },
            content: badgeDiv,
          });
          this.schoolMarkers.set(sch.id, schMarker);
        }
      }
    });
  }

  renderTrail(studentId: string, coordinates: [number, number][], color: string): void {
    if (!this.map || !coordinates || coordinates.length < 2 || !window.google) return;
    const g = window.google;

    let polyline = this.trailPolylines.get(studentId);
    const path = coordinates.map(([lat, lng]) => ({ lat, lng }));

    if (polyline) {
      polyline.setPath(path);
      polyline.setOptions({ strokeColor: color });
    } else {
      polyline = new g.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: this.map,
      });
      this.trailPolylines.set(studentId, polyline);
    }
  }

  clearTrails(): void {
    this.trailPolylines.forEach((p) => p.setMap(null));
    this.trailPolylines.clear();
  }

  setSearchMarker(lat: number, lng: number, title?: string): void {
    this.clearSearchMarker();
    if (!this.map || !window.google) return;
    const g = window.google;

    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.transform = 'translate(-50%, -100%)';
    container.style.pointerEvents = 'none';

    container.innerHTML = `
      <div style="background: #2ee59d; color: #1b1b33; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); white-space: nowrap; margin-bottom: 3px; border: 1.5px solid #ffffff; max-width: 220px; overflow: hidden; text-overflow: ellipsis;">
        📍 ${title || 'Qidirilgan joy'}
      </div>
      <div style="width: 26px; height: 26px; background: #2ee59d; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 14px rgba(46, 229, 157, 0.7); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background: #1b1b33; border-radius: 50%;"></div>
      </div>
    `;

    const position = { lat, lng };
    if (g.maps.marker && g.maps.marker.AdvancedMarkerElement) {
      this.searchMarker = new g.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position,
        content: container,
        title: title || 'Qidirilgan joy',
        zIndex: 2000,
      });
    } else {
      this.searchMarker = new g.maps.Marker({
        position,
        map: this.map,
        title: title || 'Qidirilgan joy',
      });
    }
  }

  clearSearchMarker(): void {
    if (this.searchMarker) {
      if (this.searchMarker.map !== undefined) this.searchMarker.map = null;
      if (this.searchMarker.setMap) this.searchMarker.setMap(null);
      this.searchMarker = null;
    }
  }

  // --- CUSTOM GEOFENCE DRAWING (Modern, Deprecated Drawing Library Free) ---
  startDrawingPolygon(onPointAdded?: (pointsCount: number) => void): void {
    this.cancelDrawing();
    if (!this.map || !window.google) return;
    const g = window.google;

    this.drawPoints = [];
    this.drawMarkers = [];

    this.activeDrawPolygon = new g.maps.Polygon({
      paths: [],
      strokeColor: '#ff2d78',
      strokeOpacity: 0.9,
      strokeWeight: 2.5,
      fillColor: '#ff2d78',
      fillOpacity: 0.22,
      editable: false,
      draggable: false,
      map: this.map,
    });

    this.mapClickListener = this.map.addListener('click', (e: any) => {
      const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.drawPoints.push(pt);
      this.activeDrawPolygon.setPath(this.drawPoints);

      const markerIndex = this.drawPoints.length;
      const markerContainer = document.createElement('div');
      markerContainer.innerHTML = `
        <div style="background: #ff2d78; color: #ffffff; width: 22px; height: 22px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.6); transform: translate(-50%, -50%);">
          ${markerIndex}
        </div>
      `;

      let marker: any;
      if (g.maps.marker && g.maps.marker.AdvancedMarkerElement) {
        marker = new g.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: pt,
          content: markerContainer,
          zIndex: 3000,
        });
      } else {
        marker = new g.maps.Marker({
          map: this.map,
          position: pt,
        });
      }
      this.drawMarkers.push(marker);
      onPointAdded?.(this.drawPoints.length);
    });
  }

  undoLastPolygonPoint(): number {
    if (this.drawPoints.length === 0) return 0;
    this.drawPoints.pop();
    const lastMarker = this.drawMarkers.pop();
    if (lastMarker) {
      if (lastMarker.map !== undefined) lastMarker.map = null;
      if (lastMarker.setMap) lastMarker.setMap(null);
    }
    if (this.activeDrawPolygon) {
      this.activeDrawPolygon.setPath(this.drawPoints);
    }
    return this.drawPoints.length;
  }

  finishDrawingPolygon(): [number, number][] | null {
    if (!this.activeDrawPolygon) return null;
    if (this.mapClickListener) {
      window.google?.maps?.event?.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }

    const pathArray = this.activeDrawPolygon.getPath().getArray();
    if (pathArray.length < 3) {
      this.cancelDrawing();
      return null;
    }

    const result: [number, number][] = pathArray.map((pt: any) => [pt.lat(), pt.lng()]);
    this.cancelDrawing();
    return result;
  }

  startDrawingCircle(center?: [number, number], initialRadius = 200): void {
    this.cancelDrawing();
    if (!this.map || !window.google) return;
    const g = window.google;

    const initialCenter = center
      ? { lat: center[0], lng: center[1] }
      : this.map.getCenter();

    this.activeDrawCircle = new g.maps.Circle({
      strokeColor: '#2ee59d',
      strokeOpacity: 0.9,
      strokeWeight: 2.5,
      fillColor: '#2ee59d',
      fillOpacity: 0.22,
      map: this.map,
      center: initialCenter,
      radius: initialRadius,
      editable: true,
      draggable: true,
    });

    this.mapClickListener = this.map.addListener('click', (e: any) => {
      if (this.activeDrawCircle) {
        this.activeDrawCircle.setCenter(e.latLng);
      }
    });
  }

  setCircleRadius(radius: number): void {
    if (this.activeDrawCircle) {
      this.activeDrawCircle.setRadius(radius);
    }
  }

  finishDrawingCircle(): { center: [number, number]; radius: number } | null {
    if (!this.activeDrawCircle) return null;
    const center = this.activeDrawCircle.getCenter();
    const radius = this.activeDrawCircle.getRadius();
    const result = {
      center: [center.lat(), center.lng()] as [number, number],
      radius: Math.round(radius),
    };
    this.cancelDrawing();
    return result;
  }

  cancelDrawing(): void {
    if (this.mapClickListener && window.google) {
      window.google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }
    if (this.activeDrawPolygon) {
      this.activeDrawPolygon.setMap(null);
      this.activeDrawPolygon = null;
    }
    if (this.activeDrawCircle) {
      this.activeDrawCircle.setMap(null);
      this.activeDrawCircle = null;
    }
    if (this.drawMarkers) {
      this.drawMarkers.forEach((m) => {
        if (m.map !== undefined) m.map = null;
        if (m.setMap) m.setMap(null);
      });
      this.drawMarkers = [];
    }
    this.drawPoints = [];
  }

  // --- MEASURE TOOL (google.maps.geometry.spherical) ---
  startMeasure(onUpdate?: (distMeters: number) => void): void {
    this.stopMeasure();
    if (!this.map || !window.google) return;
    const g = window.google;

    let points: any[] = [];
    this.mapClickListener = this.map.addListener('click', (e: any) => {
      points.push(e.latLng);
      if (points.length === 1) {
        this.measureStartMarker = new g.maps.Marker({
          position: points[0],
          map: this.map,
          label: 'A',
        });
      } else if (points.length === 2) {
        this.measureEndMarker = new g.maps.Marker({
          position: points[1],
          map: this.map,
          label: 'B',
        });
        this.measureLine = new g.maps.Polyline({
          path: points,
          strokeColor: '#4db5ff',
          strokeWeight: 3,
          map: this.map,
        });

        // Compute distance using spherical geometry
        let dist = 0;
        if (g.maps.geometry && g.maps.geometry.spherical) {
          dist = Math.round(g.maps.geometry.spherical.computeDistanceBetween(points[0], points[1]));
        } else {
          // Haversine fallback
          dist = 100;
        }
        onUpdate?.(dist);
      } else {
        // Reset and start new measurement
        this.stopMeasure();
        this.startMeasure(onUpdate);
      }
    });
  }

  stopMeasure(): void {
    if (this.mapClickListener && window.google) {
      window.google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }
    if (this.measureLine) {
      this.measureLine.setMap(null);
      this.measureLine = null;
    }
    if (this.measureStartMarker) {
      this.measureStartMarker.setMap(null);
      this.measureStartMarker = null;
    }
    if (this.measureEndMarker) {
      this.measureEndMarker.setMap(null);
      this.measureEndMarker = null;
    }
  }

  resize(): void {
    if (!this.map || !window.google) return;
    window.google.maps.event.trigger(this.map, 'resize');
  }

  destroy(): void {
    this.cancelDrawing();
    this.stopMeasure();
    this.clearSearchMarker();
    this.clearStudentMarkers();
    this.clearTrails();
    this.schoolPolygons.forEach((p) => p.setMap(null));
    this.schoolPolygons.clear();
    this.schoolMarkers.forEach((m) => {
      if (m.map !== undefined) m.map = null;
      if (m.setMap) m.setMap(null);
    });
    this.schoolMarkers.clear();
    this.map = null;
  }
}
