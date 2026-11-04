/// <reference path="../declarations.d.ts" />
// SMART CHILD — High-Performance Professional Geolocation & Geofencing System
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { School, Student, StudentTelemetry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  calculatePolygonArea,
  calculatePerimeter,
  generateCirclePolygon,
  formatArea,
  formatDistance,
  haversineDistance,
} from '@/lib/geoUtils';
import {
  Search,
  PenTool,
  Check,
  X,
  MapPin,
  Heart,
  Battery,
  BatteryCharging,
  Radio,
  Layers,
  Crosshair,
  Activity,
  Compass,
  Maximize2,
  Minimize2,
  Ruler,
  Play,
  Pause,
  RotateCcw,
  Undo,
  Circle,
  Copy,
  AlertTriangle,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Navigation2,
  Users,
  ChevronRight,
  Info,
  Thermometer,
} from 'lucide-react';

interface MapViewProps {
  schools: School[];
  students: Student[];
  onSaveGeofence: (schoolId: string, polygon: [number, number][]) => Promise<void>;
  selectedSchoolId: string;
  onRefreshData?: () => Promise<void>;
}

type MapTileLayerType = 'dark' | 'satellite' | 'voyager' | 'streets';
type GeofenceToolMode = 'NONE' | 'DRAW_POLYGON' | 'CIRCLE' | 'MEASURE';
type ZoneType = 'SAFE' | 'DANGER';

const TILE_CONFIGS: Record<MapTileLayerType, { name: string; url: string; attr: string; maxZoom: number }> = {
  dark: {
    name: 'Tungi Rejim',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; CartoDB &copy; OpenStreetMap',
    maxZoom: 19,
  },
  satellite: {
    name: "Sun'iy Yo'ldosh (Esri)",
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    maxZoom: 19,
  },
  voyager: {
    name: 'Topografiya (Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attr: '&copy; CartoDB &copy; OpenStreetMap',
    maxZoom: 19,
  },
  streets: {
    name: "Standart Ko'cha",
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

export const MapView: React.FC<MapViewProps> = ({
  schools,
  students,
  onSaveGeofence,
  selectedSchoolId,
  onRefreshData,
}) => {
  // Map container & Leaflet instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Layers refs
  const schoolLayersRef = useRef<{ [key: string]: L.Polygon | L.LayerGroup }>({});
  const studentMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const studentAccuracyCirclesRef = useRef<{ [key: string]: L.Circle }>({});
  const trailPolylinesRef = useRef<{ [key: string]: L.Polyline }>({});
  const measureLayersRef = useRef<L.LayerGroup | null>(null);
  const tempDrawLayerRef = useRef<L.Polygon | L.Polyline | null>(null);
  const tempPointsMarkersRef = useRef<L.CircleMarker[]>([]);

  // Movement history state (studentId -> coordinates array)
  const [historyTrails, setHistoryTrails] = useState<Record<string, [number, number][]>>({});
  const [showTrails, setShowTrails] = useState(true);

  // Map view layer & UI states
  const [mapLayer, setMapLayer] = useState<MapTileLayerType>('dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [copiedCoord, setCopiedCoord] = useState(false);

  // Geofence Studio State
  const [activeTool, setActiveTool] = useState<GeofenceToolMode>('NONE');
  const [zoneType, setZoneType] = useState<ZoneType>('SAFE');
  const [targetSchoolId, setTargetSchoolId] = useState<string>(
    selectedSchoolId !== 'ALL' ? selectedSchoolId : (schools[0]?.id || 'SCH001')
  );
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [circleRadius, setCircleRadius] = useState<number>(120);

  // Measure tool state
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measuredDistanceMeters, setMeasuredDistanceMeters] = useState<number | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INSIDE' | 'OUTSIDE' | 'SOS'>('ALL');

  // Walking simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number>(0);
  const simTimerRef = useRef<any>(null);

  // Active target school object
  const activeSchool = useMemo(() => {
    return schools.find((s) => s.id === targetSchoolId) || schools[0];
  }, [schools, targetSchoolId]);

  // Keep targetSchoolId synced when prop changes
  useEffect(() => {
    if (selectedSchoolId !== 'ALL') {
      setTargetSchoolId(selectedSchoolId);
    }
  }, [selectedSchoolId]);

  // Update movement history trails when students move
  useEffect(() => {
    students.forEach((s) => {
      const telem = s.telemetry;
      if (telem && telem.latitude && telem.longitude) {
        setHistoryTrails((prev) => {
          const current = prev[s.id] || [];
          const lastPoint = current[current.length - 1];
          if (!lastPoint || lastPoint[0] !== telem.latitude || lastPoint[1] !== telem.longitude) {
            const updated = [...current, [telem.latitude, telem.longitude] as [number, number]];
            // Keep last 15 points
            return { ...prev, [s.id]: updated.slice(-15) };
          }
          return prev;
        });
      }
    });
  }, [students]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = activeSchool?.lat && activeSchool?.lng
      ? [activeSchool.lat, activeSchool.lng]
      : [41.311081, 69.240562];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom attribution in bottom corner
    L.control.attribution({ position: 'bottomright' }).addTo(map);

    // Apply initial Tile Layer
    const tileConfig = TILE_CONFIGS[mapLayer];
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attr,
      subdomains: 'abcd',
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;
    measureLayersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Change Tile Layer Dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const tileConfig = TILE_CONFIGS[mapLayer];
    const newLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attr,
      subdomains: 'abcd',
    }).addTo(map);

    currentTileLayerRef.current = newLayer;
  }, [mapLayer]);

  // 3. Render School Geofence Polygons & Badges
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old school layers
    Object.values(schoolLayersRef.current).forEach((layer) => {
      map.removeLayer(layer);
    });
    schoolLayersRef.current = {};

    schools.forEach((sch) => {
      const isSelected = sch.id === targetSchoolId;
      const schoolGroup = L.layerGroup();

      if (sch.polygon && sch.polygon.length >= 3) {
        const polyArea = calculatePolygonArea(sch.polygon);
        const polyPerimeter = calculatePerimeter(sch.polygon);
        const strokeColor = sch.color || (isSelected ? '#10b981' : '#6366f1');

        const poly = L.polygon(sch.polygon, {
          color: strokeColor,
          weight: isSelected ? 3.5 : 2,
          fillColor: strokeColor,
          fillOpacity: isSelected ? 0.22 : 0.12,
          dashArray: isSelected ? '6, 6' : '3, 4',
        });

        // Interactive School Popup with Geometrics
        poly.bindPopup(`
          <div style="min-width: 230px; font-family: inherit; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 20px;">🏫</span>
              <div>
                <b style="font-size: 13.5px; display: block; color: #fff;">${sch.name}</b>
                <span style="font-size: 10.5px; opacity: 0.7;">ID: <code>${sch.id}</code> | Geofence: <code>${sch.geofenceId || 'GEO001'}</code></span>
              </div>
            </div>
            <div style="font-size: 11px; margin-bottom: 6px; padding: 6px; background: rgba(255,255,255,0.06); border-radius: 6px;">
              <div>📍 <b>Manzil:</b> ${sch.address}</div>
              <div>📐 <b>Geozona Maydoni:</b> <b style="color: #10b981;">${formatArea(polyArea)}</b></div>
              <div>📏 <b>Chegara Perimetri:</b> ${formatDistance(polyPerimeter)}</div>
              <div>👥 <b>Jami O'quvchilar:</b> ${sch.totalStudents || 0} nafar</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button onclick="window.dispatchEvent(new CustomEvent('select_school_event', { detail: '${sch.id}' }))"
                style="width: 100%; background: #10b981; color: #000; font-weight: bold; font-size: 11px; padding: 5px 8px; border: none; border-radius: 6px; cursor: pointer;">
                Ushbu Maktabga Fokuslash
              </button>
            </div>
          </div>
        `);

        schoolGroup.addLayer(poly);
      }

      // School Center Pin / Badge
      if (sch.lat && sch.lng) {
        const schoolIcon = L.divIcon({
          className: 'school-badge-wrapper',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
              <div style="background: ${sch.color || '#10b981'}; color: #fff; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; border: 1.5px solid rgba(255,255,255,0.4); white-space: nowrap;">
                🏫 ${sch.name.length > 18 ? sch.name.slice(0, 18) + '...' : sch.name}
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const schoolMarker = L.marker([sch.lat, sch.lng], { icon: schoolIcon });
        schoolGroup.addLayer(schoolMarker);
      }

      schoolGroup.addTo(map);
      schoolLayersRef.current[sch.id] = schoolGroup;
    });

    // Listen to window event from popup
    const handleSelectSchoolEvent = (e: any) => {
      if (e.detail) {
        setTargetSchoolId(e.detail);
        const sch = schools.find((s) => s.id === e.detail);
        if (sch && sch.lat && sch.lng && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([sch.lat, sch.lng], 16.5);
        }
      }
    };

    window.addEventListener('select_school_event', handleSelectSchoolEvent);
    return () => {
      window.removeEventListener('select_school_event', handleSelectSchoolEvent);
    };
  }, [schools, targetSchoolId]);

  // 4. Render Dynamic Student Markers, Accuracy Halos & Breadcrumb Trails
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers and halos
    Object.values(studentMarkersRef.current).forEach((m) => map.removeLayer(m));
    studentMarkersRef.current = {};
    Object.values(studentAccuracyCirclesRef.current).forEach((c) => map.removeLayer(c));
    studentAccuracyCirclesRef.current = {};
    Object.values(trailPolylinesRef.current).forEach((p) => map.removeLayer(p));
    trailPolylinesRef.current = {};

    students.forEach((std) => {
      const telem = std.telemetry;
      if (!telem || telem.latitude == null || telem.longitude == null) return;

      const isInside = telem.geofenceStatus === 'INSIDE';
      const isVerifying = telem.geofenceStatus === 'VERIFYING';
      const isSos = telem.isSos || false;

      // Status-dependent palette
      let color = '#ef4444'; // Red (Outside)
      let statusLabel = 'TASHQARIDA';
      if (isInside) {
        color = '#10b981'; // Green (Inside)
        statusLabel = 'MAKTABDA';
      } else if (isVerifying) {
        color = '#f59e0b'; // Amber (Verifying)
        statusLabel = 'TEKSHIRUV';
      }

      if (isSos) {
        color = '#ef4444';
        statusLabel = '🚨 SOS!';
      }

      const isSelected = selectedStudent?.id === std.id;
      const markerSize = isSelected ? 50 : 42;
      const pulseHtml = isSos
        ? `<div class="radar-ring" style="position: absolute; inset: -10px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); border: 2px solid #ef4444;"></div>`
        : isInside
        ? `<div class="radar-ring" style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(16, 185, 129, 0.25);"></div>`
        : '';

      const customIcon = L.divIcon({
        className: 'student-pro-marker',
        html: `
          <div style="position: relative; width: ${markerSize}px; height: ${markerSize}px; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
            ${pulseHtml}
            <div style="width: ${markerSize - 8}px; height: ${markerSize - 8}px; border-radius: 9999px; border: 3px solid ${color}; overflow: hidden; background: #000; position: relative; z-index: 2; transition: all 0.2s;">
              <img src="${std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${std.name}" />
            </div>
            <div style="position: absolute; bottom: 0; right: 0; z-index: 3; background: ${color}; color: #fff; font-size: 8px; font-weight: 800; border-radius: 9999px; border: 1.5px solid #000; padding: 1px 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
              ${isInside ? '✓' : isSos ? 'SOS' : '!'}
            </div>
            ${
              isSelected
                ? `<div style="position: absolute; top: -18px; background: #10b981; color: #000; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; z-index: 4;">${std.name}</div>`
                : ''
            }
          </div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      const marker = L.marker([telem.latitude, telem.longitude], { icon: customIcon }).addTo(map);

      // Tooltip on hover
      marker.bindTooltip(
        `<b>${std.name}</b> (${std.className})<br/><span style="color: ${color}; font-weight: bold;">● ${statusLabel}</span> • ❤️ ${telem.heartRate || 75} BPM`,
        { className: 'custom-leaflet-tooltip', direction: 'top', offset: [0, -18] }
      );

      // Click selects student for HUD
      marker.on('click', () => {
        setSelectedStudent(std);
        map.flyTo([telem.latitude, telem.longitude], 17.5, { duration: 0.8 });
      });

      studentMarkersRef.current[std.id] = marker;

      // GPS Accuracy Confidence Halo
      const accuracyRadius = Math.max(telem.accuracy || 3.5, 2.5);
      const accCircle = L.circle([telem.latitude, telem.longitude], {
        radius: accuracyRadius,
        color: color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.12,
        dashArray: '3, 3',
      }).addTo(map);

      studentAccuracyCirclesRef.current[std.id] = accCircle;

      // History Breadcrumb Trail
      if (showTrails && historyTrails[std.id] && historyTrails[std.id].length > 1) {
        const polyline = L.polyline(historyTrails[std.id], {
          color: color,
          weight: 2.5,
          opacity: 0.65,
          dashArray: '4, 6',
        }).addTo(map);
        trailPolylinesRef.current[std.id] = polyline;
      }
    });
  }, [students, selectedStudent, showTrails, historyTrails]);

  // 5. Drawing & Distance Measuring Click Handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const clickCoords: [number, number] = [
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6)),
      ];

      // CASE A: Polygon Geofence Drawing Mode
      if (activeTool === 'DRAW_POLYGON') {
        setDrawnPoints((prev) => {
          const updated = [...prev, clickCoords];

          // Render live preview polygon
          if (tempDrawLayerRef.current) {
            map.removeLayer(tempDrawLayerRef.current);
          }

          const strokeColor = zoneType === 'SAFE' ? '#10b981' : '#ef4444';
          tempDrawLayerRef.current = L.polygon(updated, {
            color: strokeColor,
            weight: 2.5,
            fillColor: strokeColor,
            fillOpacity: 0.25,
            dashArray: '5, 5',
          }).addTo(map);

          // Add interactive vertex handle
          const vertexMarker = L.circleMarker(clickCoords, {
            radius: 5,
            color: '#fff',
            fillColor: strokeColor,
            fillOpacity: 1,
            weight: 2,
          }).addTo(map);

          tempPointsMarkersRef.current.push(vertexMarker);
          return updated;
        });
      }

      // CASE B: Distance Measurement Tool
      else if (activeTool === 'MEASURE') {
        setMeasurePoints((prev) => {
          if (prev.length >= 2) {
            // Reset and start new measurement
            if (measureLayersRef.current) measureLayersRef.current.clearLayers();
            const next = [clickCoords];
            const m = L.circleMarker(clickCoords, { radius: 6, color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 1 });
            measureLayersRef.current?.addLayer(m);
            setMeasuredDistanceMeters(null);
            return next;
          }

          const next = [...prev, clickCoords];
          const m = L.circleMarker(clickCoords, { radius: 6, color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 1 });
          measureLayersRef.current?.addLayer(m);

          if (next.length === 2) {
            const dist = haversineDistance(next[0][0], next[0][1], next[1][0], next[1][1]);
            setMeasuredDistanceMeters(dist);

            const line = L.polyline(next, {
              color: '#f59e0b',
              weight: 3,
              dashArray: '6, 6',
            });
            measureLayersRef.current?.addLayer(line);

            // Midpoint marker with distance badge
            const midLat = (next[0][0] + next[1][0]) / 2;
            const midLng = (next[0][1] + next[1][1]) / 2;
            const badgeIcon = L.divIcon({
              className: 'measure-badge',
              html: `
                <div style="background: #18181b; color: #fbbf24; border: 1.5px solid #f59e0b; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; transform: translate(-50%, -50%); white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                  📏 ${formatDistance(dist)}
                </div>
              `,
              iconSize: [0, 0],
            });
            const badgeMarker = L.marker([midLat, midLng], { icon: badgeIcon });
            measureLayersRef.current?.addLayer(badgeMarker);
          }
          return next;
        });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [activeTool, zoneType]);

  // 6. Handle Circle Geofence Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || activeTool !== 'CIRCLE') return;

    if (!activeSchool || !activeSchool.lat || !activeSchool.lng) return;

    // Generate circle polygon
    const circleCoords = generateCirclePolygon(activeSchool.lat, activeSchool.lng, circleRadius, 36);
    setDrawnPoints(circleCoords);

    // Render preview on map
    if (tempDrawLayerRef.current) {
      map.removeLayer(tempDrawLayerRef.current);
    }

    const strokeColor = zoneType === 'SAFE' ? '#10b981' : '#ef4444';
    tempDrawLayerRef.current = L.polygon(circleCoords, {
      color: strokeColor,
      weight: 2.5,
      fillColor: strokeColor,
      fillOpacity: 0.22,
      dashArray: '4, 4',
    }).addTo(map);

    map.flyTo([activeSchool.lat, activeSchool.lng], 16.5);
  }, [activeTool, circleRadius, activeSchool, zoneType]);

  // Cleanup drawing layers
  const cleanupDrawLayers = () => {
    const map = mapInstanceRef.current;
    if (tempDrawLayerRef.current && map) {
      map.removeLayer(tempDrawLayerRef.current);
      tempDrawLayerRef.current = null;
    }
    tempPointsMarkersRef.current.forEach((m) => map?.removeLayer(m));
    tempPointsMarkersRef.current = [];
    if (measureLayersRef.current) {
      measureLayersRef.current.clearLayers();
    }
    setDrawnPoints([]);
    setMeasurePoints([]);
    setMeasuredDistanceMeters(null);
  };

  // Undo last point in polygon drawing
  const handleUndoPoint = () => {
    if (drawnPoints.length === 0) return;
    const map = mapInstanceRef.current;
    const nextPoints = drawnPoints.slice(0, -1);
    setDrawnPoints(nextPoints);

    // Remove last vertex marker
    const lastMarker = tempPointsMarkersRef.current.pop();
    if (lastMarker && map) map.removeLayer(lastMarker);

    // Re-render polygon
    if (tempDrawLayerRef.current && map) {
      map.removeLayer(tempDrawLayerRef.current);
      if (nextPoints.length > 0) {
        const strokeColor = zoneType === 'SAFE' ? '#10b981' : '#ef4444';
        tempDrawLayerRef.current = L.polygon(nextPoints, {
          color: strokeColor,
          weight: 2.5,
          fillColor: strokeColor,
          fillOpacity: 0.2,
          dashArray: '5, 5',
        }).addTo(map);
      }
    }
  };

  // Save new geofence to backend
  const handleSaveGeofenceStudio = async () => {
    if (drawnPoints.length < 3) {
      alert("Kamida 3 ta GPS nuqta belgilanishi zarur!");
      return;
    }

    try {
      await onSaveGeofence(targetSchoolId, drawnPoints);
      cleanupDrawLayers();
      setActiveTool('NONE');
      if (onRefreshData) await onRefreshData();
    } catch {
      alert("Geozonani saqlashda xatolik yuz berdi!");
    }
  };

  // Geocoding Search (Nominatim)
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ' Tashkent Uzbekistan'
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        mapInstanceRef.current.flyTo([lat, lon], 17, { duration: 1.2 });
      } else {
        alert("Kiritilgan manzil topilmadi. Qidiruv so'zini tekshiring.");
      }
    } catch {
      alert("Qidiruv xizmatida vaqtinchalik xatolik yuz berdi.");
    }
  };

  // Focus All Students & Schools
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const boundsPoints: [number, number][] = [];
    schools.forEach((s) => {
      if (s.lat && s.lng) boundsPoints.push([s.lat, s.lng]);
    });
    students.forEach((s) => {
      if (s.telemetry?.latitude && s.telemetry?.longitude) {
        boundsPoints.push([s.telemetry.latitude, s.telemetry.longitude]);
      }
    });

    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [50, 50], maxZoom: 17 });
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Interactive Live Walking Simulator
  const handleTriggerSimStage = async (
    stage: 'OUTSIDE_STREET' | 'APPROACHING_GATE' | 'ENTER_SCHOOL' | 'INSIDE_CLASS' | 'LEAVE_SCHOOL' | 'SOS'
  ) => {
    const targetStudentId = selectedStudent?.id || students[0]?.id || '10001';

    if (stage === 'SOS') {
      // Trigger emergency SOS payload
      try {
        const target = students.find((s) => s.id === targetStudentId) || students[0];
        const res = await fetch('/api/v1/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: target?.deviceId || 'watch-5pro-01',
            is_sos: true,
            heart_rate: 128,
            body_temperature: 37.1,
            battery_level: target?.telemetry?.batteryLevel || 84,
            latitude: target?.telemetry?.latitude || 41.311081,
            longitude: target?.telemetry?.longitude || 69.240562,
          }),
        });
        const data = await res.json();
        if (data.success && onRefreshData) {
          await onRefreshData();
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    try {
      const res = await fetch('/api/v1/telemetry/simulate-walk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: targetStudentId, stage }),
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) await onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Automated Walk Simulation Loop
  const handleToggleAutoWalk = () => {
    if (isSimulating) {
      clearInterval(simTimerRef.current);
      setIsSimulating(false);
      setSimStep(0);
      return;
    }

    setIsSimulating(true);
    const stages: ('OUTSIDE_STREET' | 'APPROACHING_GATE' | 'ENTER_SCHOOL' | 'INSIDE_CLASS' | 'LEAVE_SCHOOL')[] = [
      'OUTSIDE_STREET',
      'APPROACHING_GATE',
      'ENTER_SCHOOL',
      'INSIDE_CLASS',
      'LEAVE_SCHOOL',
    ];

    let currentIdx = 0;
    handleTriggerSimStage(stages[0]);
    setSimStep(1);

    simTimerRef.current = setInterval(() => {
      currentIdx = (currentIdx + 1) % stages.length;
      handleTriggerSimStage(stages[currentIdx]);
      setSimStep(currentIdx + 1);
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  // Filter students for sidebar
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.uniqueId.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.className.toLowerCase().includes(studentSearch.toLowerCase());

      if (!matchesSearch) return false;

      const isInside = s.telemetry?.geofenceStatus === 'INSIDE';
      const isSos = s.telemetry?.isSos;

      if (statusFilter === 'INSIDE') return isInside;
      if (statusFilter === 'OUTSIDE') return !isInside;
      if (statusFilter === 'SOS') return isSos;
      return true;
    });
  }, [students, studentSearch, statusFilter]);

  const insideCount = students.filter((s) => s.telemetry?.geofenceStatus === 'INSIDE').length;
  const outsideCount = students.length - insideCount;
  const sosCount = students.filter((s) => s.telemetry?.isSos).length;

  // Real-time geometric calculations for Geofence Studio
  const currentDrawArea = useMemo(() => calculatePolygonArea(drawnPoints), [drawnPoints]);
  const currentDrawPerimeter = useMemo(() => calculatePerimeter(drawnPoints), [drawnPoints]);

  return (
    <div
      ref={mapWrapperRef}
      className={`grid grid-cols-1 lg:grid-cols-4 gap-3 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-background p-3' : 'h-[calc(100vh-115px)] min-h-[640px]'
      }`}
    >
      {/* 1. LEFT SIDEBAR: Students Telemetry & Quick Focus List */}
      <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden border-border/70 bg-card/90 backdrop-blur-md shadow-xl">
        <CardHeader className="p-3 border-b border-border/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              GPS Jonli Kuzatuv
            </CardTitle>
            <Badge variant="outline" className="text-[10.5px] font-mono border-primary/30 text-primary">
              {students.length} nafar o'quvchi
            </Badge>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Ism, ID yoki sinf..."
              className="h-8 pl-8 text-xs bg-background/50"
            />
          </div>

          {/* Filter Pills */}
          <div className="grid grid-cols-4 gap-1 text-[10.5px] font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`py-1 rounded-md transition-all text-center ${
                statusFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Hammasi ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('INSIDE')}
              className={`py-1 rounded-md transition-all text-center ${
                statusFilter === 'INSIDE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/50 text-emerald-400 hover:bg-muted'
              }`}
            >
              Maktabda ({insideCount})
            </button>
            <button
              onClick={() => setStatusFilter('OUTSIDE')}
              className={`py-1 rounded-md transition-all text-center ${
                statusFilter === 'OUTSIDE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-muted/50 text-rose-400 hover:bg-muted'
              }`}
            >
              Tashqarida ({outsideCount})
            </button>
            <button
              onClick={() => setStatusFilter('SOS')}
              className={`py-1 rounded-md transition-all text-center ${
                statusFilter === 'SOS'
                  ? 'bg-amber-600 text-white shadow-sm animate-pulse'
                  : 'bg-muted/50 text-amber-400 hover:bg-muted'
              }`}
            >
              SOS ({sosCount})
            </button>
          </div>
        </CardHeader>

        {/* Student Cards List */}
        <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Filtr bo'yicha o'quvchi topilmadi
            </div>
          ) : (
            filteredStudents.map((std) => {
              const telem = std.telemetry;
              const isInside = telem?.geofenceStatus === 'INSIDE';
              const isSos = telem?.isSos;
              const isSelected = selectedStudent?.id === std.id;

              return (
                <div
                  key={std.id}
                  onClick={() => {
                    setSelectedStudent(std);
                    if (telem?.latitude && telem?.longitude && mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([telem.latitude, telem.longitude], 17.5, { duration: 1 });
                      studentMarkersRef.current[std.id]?.openPopup();
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                      : 'border-border/60 bg-card/60 hover:bg-muted/40 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}
                        className="w-10 h-10 rounded-xl object-cover border border-border shadow-sm"
                        alt={std.name}
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center text-[7px] text-white font-extrabold ${
                          isSos ? 'bg-rose-600 animate-ping' : isInside ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      >
                        {isInside ? '✓' : '!'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate text-foreground">{std.name}</span>
                        <Badge
                          variant={isSos ? 'destructive' : isInside ? 'success' : 'danger'}
                          className="text-[9px] px-1.5 py-0 font-extrabold"
                        >
                          {isSos ? '🚨 SOS' : isInside ? 'PRESENT' : 'OUTSIDE'}
                        </Badge>
                      </div>

                      <div className="text-[10.5px] text-muted-foreground flex items-center justify-between mt-1">
                        <span>
                          {std.className} • ID: <code className="text-primary/90 font-mono">{std.uniqueId}</code>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-rose-400 font-semibold">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {telem?.heartRate || 76} BPM
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 mt-1 pt-1 border-t border-border/40">
                        <span className="truncate max-w-[130px]">🏫 {std.schoolName}</span>
                        <span className="flex items-center gap-1 font-mono text-emerald-400">
                          <Battery className="w-3 h-3 text-emerald-400" />
                          {telem?.batteryLevel || 85}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 2. RIGHT / MAIN: High-Tech Leaflet Map & Professional HUD Studio */}
      <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-zinc-950 flex flex-col">
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full flex-1 min-h-[520px]" />

        {/* --- TOP-LEFT CONTROLS HUD: Search & Tools --- */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 flex-wrap max-w-[90%]">
          {/* Geocoding Address Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-52 sm:w-64">
            <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Manzil yoki maktab qidirish..."
              className="h-8 pl-8 pr-7 text-xs bg-background/90 backdrop-blur-md border-border shadow-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Geofence Studio Main Button */}
          {activeTool === 'NONE' ? (
            <div className="flex items-center gap-1 bg-background/90 p-1 rounded-xl border border-border/80 shadow-lg backdrop-blur-md">
              <Button
                size="sm"
                variant="success"
                onClick={() => {
                  cleanupDrawLayers();
                  setActiveTool('DRAW_POLYGON');
                }}
                className="h-7 text-xs gap-1.5 px-2.5 shadow-sm font-bold"
              >
                <PenTool className="w-3.5 h-3.5" />
                Poligon Chizish
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  cleanupDrawLayers();
                  setActiveTool('CIRCLE');
                }}
                className="h-7 text-xs gap-1.5 px-2.5 border-border hover:bg-muted font-bold"
              >
                <Circle className="w-3.5 h-3.5 text-emerald-400" />
                Aylana Geozona
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  cleanupDrawLayers();
                  setActiveTool('MEASURE');
                }}
                className="h-7 text-xs gap-1 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                title="Masofani o'lchash"
              >
                <Ruler className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : activeTool === 'DRAW_POLYGON' ? (
            /* Active Drawing Toolbar */
            <div className="flex items-center gap-2 bg-background/95 p-1.5 rounded-xl border border-emerald-500/50 shadow-2xl backdrop-blur-lg flex-wrap">
              <div className="flex items-center gap-1.5 px-2 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400">Poligon: {drawnPoints.length} nuqta</span>
              </div>

              {/* Area & Perimeter calculations */}
              {drawnPoints.length >= 3 && (
                <div className="hidden sm:flex items-center gap-2 px-2 text-[11px] font-mono border-l border-border/70 text-muted-foreground">
                  <span>📐 {formatArea(currentDrawArea)}</span>
                  <span>📏 {formatDistance(currentDrawPerimeter)}</span>
                </div>
              )}

              {/* Zone type selector */}
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value as ZoneType)}
                className="bg-card text-[11px] font-semibold border border-border rounded-md px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="SAFE">🟢 Xavfsiz Zona (Maktab)</option>
                <option value="DANGER">🔴 Xavfli Hudud (Trassa/Kanal)</option>
              </select>

              {/* Target School Selector */}
              <select
                value={targetSchoolId}
                onChange={(e) => setTargetSchoolId(e.target.value)}
                className="bg-card text-[11px] font-semibold border border-border rounded-md px-2 py-1 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleUndoPoint}
                disabled={drawnPoints.length === 0}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                title="Oxirgi nuqtani bekor qilish"
              >
                <Undo className="w-3 h-3" /> Orqaga
              </Button>

              <Button
                size="sm"
                variant="default"
                onClick={handleSaveGeofenceStudio}
                disabled={drawnPoints.length < 3}
                className="h-7 text-xs px-2.5 gap-1 font-bold shadow-md"
              >
                <Check className="w-3.5 h-3.5" /> Saqlash
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  cleanupDrawLayers();
                  setActiveTool('NONE');
                }}
                className="h-7 text-xs px-2 gap-1"
              >
                <X className="w-3 h-3" /> Bekor
              </Button>
            </div>
          ) : activeTool === 'CIRCLE' ? (
            /* Active Circle Toolbar */
            <div className="flex items-center gap-2 bg-background/95 p-1.5 rounded-xl border border-primary/50 shadow-2xl backdrop-blur-lg flex-wrap">
              <span className="text-xs font-bold text-primary px-2">Aylana Geozona:</span>
              <div className="flex items-center gap-1.5">
                {[80, 120, 160, 250, 400].map((r) => (
                  <button
                    key={r}
                    onClick={() => setCircleRadius(r)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all ${
                      circleRadius === r
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>

              <select
                value={targetSchoolId}
                onChange={(e) => setTargetSchoolId(e.target.value)}
                className="bg-card text-[11px] font-semibold border border-border rounded-md px-2 py-1 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                variant="default"
                onClick={handleSaveGeofenceStudio}
                className="h-7 text-xs px-2.5 gap-1 font-bold shadow-md"
              >
                <Check className="w-3.5 h-3.5" /> Saqlash
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  cleanupDrawLayers();
                  setActiveTool('NONE');
                }}
                className="h-7 text-xs px-2 gap-1"
              >
                <X className="w-3 h-3" /> Bekor
              </Button>
            </div>
          ) : (
            /* Measure distance toolbar */
            <div className="flex items-center gap-2 bg-background/95 p-1.5 rounded-xl border border-amber-500/50 shadow-2xl backdrop-blur-lg">
              <span className="text-xs font-bold text-amber-400 px-2 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5" />
                {measuredDistanceMeters !== null
                  ? `Masofa: ${formatDistance(measuredDistanceMeters)}`
                  : 'Xaritada 2 ta nuqtani bosing'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  cleanupDrawLayers();
                  setActiveTool('NONE');
                }}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" /> Yopish
              </Button>
            </div>
          )}
        </div>

        {/* --- TOP-RIGHT CONTROLS: Layer Switcher & Tools --- */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
          {/* Layer switcher menu */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="h-8 text-xs gap-1.5 bg-background/90 backdrop-blur-md border-border shadow-lg font-bold"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">{TILE_CONFIGS[mapLayer].name}</span>
            </Button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-card border border-border rounded-xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl z-[1001]">
                {(Object.keys(TILE_CONFIGS) as MapTileLayerType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMapLayer(key);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                      mapLayer === key
                        ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span>{TILE_CONFIGS[key].name}</span>
                    {mapLayer === key && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle History Trails */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTrails(!showTrails)}
            className={`h-8 text-xs gap-1 bg-background/90 backdrop-blur-md border-border shadow-lg ${
              showTrails ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
            title="GPS Harakat Marshrutlarini Ko'rsatish"
          >
            <Navigation2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Marshrut</span>
          </Button>

          {/* Fit all */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleFitAll}
            className="h-8 px-2.5 bg-background/90 backdrop-blur-md border-border shadow-lg text-muted-foreground hover:text-foreground"
            title="Barcha ob'ektlarni ko'rsatish"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </Button>

          {/* Fullscreen */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleFullscreen}
            className="h-8 px-2.5 bg-background/90 backdrop-blur-md border-border shadow-lg text-muted-foreground hover:text-foreground"
            title="To'liq ekranga o'tish"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* --- BOTTOM-CENTER: Interactive Walking Simulation Toolbar --- */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 bg-background/90 border border-border/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl max-w-[95%] overflow-x-auto">
          <div className="flex items-center gap-1 px-2 border-r border-border/60">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-foreground whitespace-nowrap">Jonli Simulyatsiya:</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTriggerSimStage('OUTSIDE_STREET')}
            className="h-7 text-[11px] px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-bold whitespace-nowrap"
          >
            🚶 1. Ko'chada
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTriggerSimStage('APPROACHING_GATE')}
            className="h-7 text-[11px] px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-bold whitespace-nowrap"
          >
            🚧 2. Darvozada
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTriggerSimStage('ENTER_SCHOOL')}
            className="h-7 text-[11px] px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold whitespace-nowrap"
          >
            🏫 3. Kirdi
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTriggerSimStage('INSIDE_CLASS')}
            className="h-7 text-[11px] px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-bold whitespace-nowrap"
          >
            📚 4. Sinfda
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTriggerSimStage('LEAVE_SCHOOL')}
            className="h-7 text-[11px] px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-bold whitespace-nowrap"
          >
            🏃 5. Chiqdi
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleTriggerSimStage('SOS')}
            className="h-7 text-[11px] px-2.5 font-bold shadow-md whitespace-nowrap gap-1"
          >
            🚨 SOS Test
          </Button>

          <div className="w-[1px] h-5 bg-border/60 mx-1" />

          {/* Auto Walk Playback */}
          <Button
            size="sm"
            variant={isSimulating ? 'destructive' : 'outline'}
            onClick={handleToggleAutoWalk}
            className="h-7 text-[11px] px-2.5 font-bold whitespace-nowrap gap-1 border-primary/40 text-primary"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3 h-3" /> To'xtatish ({simStep}/5)
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Avto-Yurish
              </>
            )}
          </Button>
        </div>

        {/* --- BOTTOM-LEFT LEGEND --- */}
        <div className="hidden sm:flex absolute bottom-4 left-4 z-[1000] bg-background/85 backdrop-blur-md border border-border/80 rounded-xl p-2 px-3 text-[10.5px] font-bold items-center gap-3.5 shadow-xl">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
            PRESENT (Maktabda)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
            OUTSIDE (Tashqarida)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50" />
            VERIFYING (Chegarada)
          </span>
        </div>

        {/* --- RIGHT SLIDE-OUT: Comprehensive Student Telemetry HUD Drawer --- */}
        {selectedStudent && (
          <div className="absolute top-14 right-3 z-[1000] w-80 max-w-[calc(100%-24px)] bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedStudent.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-primary/50 shadow-md"
                    alt={selectedStudent.name}
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-[8px] text-white font-extrabold ${
                      selectedStudent.telemetry?.geofenceStatus === 'INSIDE' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  >
                    {selectedStudent.telemetry?.geofenceStatus === 'INSIDE' ? '✓' : '!'}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-foreground leading-tight">{selectedStudent.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedStudent.className} • ID: <code className="text-primary font-mono">{selectedStudent.uniqueId}</code>
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 truncate max-w-[150px]">
                    🏫 {selectedStudent.schoolName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Banner */}
            <div className="mt-3 p-2 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
              <div className="text-[11px] font-bold text-muted-foreground">Geozona Holati:</div>
              <Badge
                variant={
                  selectedStudent.telemetry?.isSos
                    ? 'destructive'
                    : selectedStudent.telemetry?.geofenceStatus === 'INSIDE'
                    ? 'success'
                    : 'danger'
                }
                className="text-[10px] font-extrabold px-2 py-0.5"
              >
                {selectedStudent.telemetry?.isSos
                  ? '🚨 SOS FAVQULODDA'
                  : selectedStudent.telemetry?.geofenceStatus === 'INSIDE'
                  ? 'PRESENT — MAKTAB ICHIDA'
                  : 'LEFT — MAKTABDAN TASHQARIDA'}
              </Badge>
            </div>

            {/* Real-Time Vitals Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 heart-beating">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Yurak Urishi</span>
                  <b className="text-xs font-mono font-bold text-foreground">
                    {selectedStudent.telemetry?.heartRate || 76} BPM
                  </b>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Harorat</span>
                  <b className="text-xs font-mono font-bold text-foreground">
                    {(selectedStudent.telemetry?.bodyTemperature || 36.6).toFixed(1)}°C
                  </b>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Battery className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Batareya (Soat)</span>
                  <b className="text-xs font-mono font-bold text-foreground">
                    {selectedStudent.telemetry?.batteryLevel || 84}%
                  </b>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">GPS Aniqligi</span>
                  <b className="text-xs font-mono font-bold text-foreground">
                    ±{selectedStudent.telemetry?.accuracy || 3.2}m
                  </b>
                </div>
              </div>
            </div>

            {/* Smartwatch Model & Coordinates */}
            <div className="mt-3 p-2.5 rounded-xl bg-muted/30 border border-border/50 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Aqlli Qurilma:</span>
                <span className="font-semibold text-foreground">Samsung Galaxy Watch5 Pro</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Koordinatalar:</span>
                <button
                  onClick={() => {
                    if (selectedStudent.telemetry?.latitude && selectedStudent.telemetry?.longitude) {
                      const coordText = `${selectedStudent.telemetry.latitude}, ${selectedStudent.telemetry.longitude}`;
                      navigator.clipboard.writeText(coordText);
                      setCopiedCoord(true);
                      setTimeout(() => setCopiedCoord(false), 1500);
                    }
                  }}
                  className="font-mono text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  {selectedStudent.telemetry?.latitude?.toFixed(5)}, {selectedStudent.telemetry?.longitude?.toFixed(5)}
                  <Copy className="w-3 h-3" />
                  {copiedCoord && <span className="text-[9px] text-emerald-400">Nusxa olindi!</span>}
                </button>
              </div>

              {selectedStudent.parentName && (
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">Ota-onasi:</span>
                  <a
                    href={`tel:${selectedStudent.parentPhone || ''}`}
                    className="font-semibold text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    {selectedStudent.parentPhone || selectedStudent.parentName}
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/60">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (
                    selectedStudent.telemetry?.latitude &&
                    selectedStudent.telemetry?.longitude &&
                    mapInstanceRef.current
                  ) {
                    mapInstanceRef.current.flyTo(
                      [selectedStudent.telemetry.latitude, selectedStudent.telemetry.longitude],
                      18,
                      { duration: 0.8 }
                    );
                  }
                }}
                className="h-8 text-xs font-bold gap-1"
              >
                <Crosshair className="w-3.5 h-3.5" /> Fokuslash
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleTriggerSimStage('SOS')}
                className="h-8 text-xs font-bold gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> SOS Signal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
