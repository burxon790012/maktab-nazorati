/// <reference path="../declarations.d.ts" />
// SMART CHILD — High-Tech Fleet Geolocation & Geofencing System (Google Maps Primary, OSM Fallback)
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { School, Student, StudentTelemetry } from '@/types';
import {
  Search,
  PenTool,
  Check,
  X,
  MapPin,
  Heart,
  Battery,
  Radio,
  Layers,
  Crosshair,
  Activity,
  Maximize2,
  Minimize2,
  Ruler,
  Circle as CircleIcon,
  Copy,
  AlertTriangle,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Navigation2,
  Users,
  ChevronRight,
  ChevronLeft,
  Info,
  Thermometer,
  RotateCcw,
  Footprints,
  Clock,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  MapAdapter,
  MapLayerType,
  MapProviderType,
  createMapAdapter,
} from '@/lib/mapAdapter';
import {
  formatArea,
  formatDistance,
  haversineDistance,
  calculatePolygonArea,
} from '@/lib/geoUtils';
import { SearchCombobox, SearchResultItem } from './SearchCombobox';

interface MapViewProps {
  schools: School[];
  students: Student[];
  onSaveGeofence: (schoolId: string, polygon: [number, number][]) => Promise<void>;
  selectedSchoolId: string;
  onRefreshData?: () => Promise<void>;
  activeFilter?: string;
  onSelectFilter?: (f: string) => void;
  googleMapsApiKey?: string;
  activeNavTab?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  schools,
  students,
  onSaveGeofence,
  selectedSchoolId,
  onRefreshData,
  activeFilter = 'ALL',
  onSelectFilter,
  googleMapsApiKey,
  activeNavTab = 'map',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);

  // Map state
  const [provider, setProvider] = useState<MapProviderType>('leaflet-osm');
  const [isFallbackNotice, setIsFallbackNotice] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayerType>('roadmap');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected entities
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [targetSchoolId, setTargetSchoolId] = useState<string>(selectedSchoolId || 'SCH001');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Side panels toggle
  const [showStudentList, setShowStudentList] = useState(true);

  // Drawing & Tools state
  const [drawingMode, setDrawingMode] = useState<'NONE' | 'POLYGON' | 'CIRCLE' | 'MEASURE'>('NONE');
  const [polygonPointCount, setPolygonPointCount] = useState(0);
  const [circleRadius, setCircleRadius] = useState(200);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [isSavingGeofence, setIsSavingGeofence] = useState(false);

  // Search Pin & Map Pick Mode state
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; title: string; subtitle?: string } | null>(null);
  const [isMapPickMode, setIsMapPickMode] = useState(false);
  const isMapPickModeRef = useRef(false);
  isMapPickModeRef.current = isMapPickMode;

  // In-app non-blocking Toast notification state (zero alert popups)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Sync Search Marker on Map
  useEffect(() => {
    if (searchPin && adapterRef.current) {
      adapterRef.current.setSearchMarker(searchPin.lat, searchPin.lng, searchPin.title);
    } else if (adapterRef.current) {
      adapterRef.current.clearSearchMarker();
    }
  }, [searchPin]);

  // Re-size and invalidate map tiles when switching between main tabs
  useEffect(() => {
    if (activeNavTab === 'map' || activeNavTab === 'geozones' || activeNavTab === 'routes') {
      const t1 = setTimeout(() => adapterRef.current?.resize(), 60);
      const t2 = setTimeout(() => adapterRef.current?.resize(), 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeNavTab]);

  // Movement Trails (last 30 minutes)
  const [trailsHistory, setTrailsHistory] = useState<Record<string, [number, number][]>>({});
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Active School
  const activeSchool = useMemo(() => {
    return schools.find((s) => s.id === targetSchoolId) || schools[0] || {
      id: 'SCH001',
      name: '1-Sonli Namunaviy Maktab',
      address: 'Toshkent sh., Chilonzor tumani',
      lat: 41.311081,
      lng: 69.240562,
      polygon: [],
    };
  }, [schools, targetSchoolId]);

  // Sync activeFilter prop
  useEffect(() => {
    setStatusFilter(activeFilter || 'ALL');
  }, [activeFilter]);

  // 1. Initialize Map Engine (Google Maps with OSM Fallback)
  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return;

    createMapAdapter(googleMapsApiKey).then((res) => {
      if (!isMounted || !container) return;
      adapterRef.current = res.adapter;
      setProvider(res.provider);
      setIsFallbackNotice(res.isFallback);

      const initCenter: [number, number] = [
        activeSchool.lat || 41.311081,
        activeSchool.lng || 69.240562,
      ];

      res.adapter.init(container, {
        center: initCenter,
        zoom: 16,
        isDark: true,
        mapType: mapLayer,
        events: {
          onMarkerClick: (payload) => {
            setSelectedStudent(payload.student);
          },
          onSchoolClick: (schId) => {
            setTargetSchoolId(schId);
          },
          onMapClick: (lat, lng) => {
            if (isMapPickModeRef.current) {
              setSearchPin({
                lat,
                lng,
                title: 'Tanlangan manzil',
                subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
              });
              setIsMapPickMode(false);
            }
          },
        },
      });

      // Initial School Geofences
      res.adapter.renderSchoolGeofences(schools, targetSchoolId);

      // Fit bounds to school if polygon available and valid
      if (activeSchool.polygon && Array.isArray(activeSchool.polygon) && activeSchool.polygon.length > 2) {
        res.adapter.fitBounds(activeSchool.polygon);
      }

      // Staggered size invalidation to ensure full render after flex layout stabilizes
      setTimeout(() => res.adapter.resize(), 100);
      setTimeout(() => res.adapter.resize(), 300);
      setTimeout(() => res.adapter.resize(), 600);
    });

    return () => {
      isMounted = false;
      if (adapterRef.current) {
        adapterRef.current.destroy();
        adapterRef.current = null;
      }
    };
  }, [googleMapsApiKey]);

  // 2. ResizeObserver and Window Resize listener for robust layout adaptation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      adapterRef.current?.resize();
    });
    ro.observe(container);

    const handleWinResize = () => {
      adapterRef.current?.resize();
    };
    window.addEventListener('resize', handleWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWinResize);
    };
  }, []);

  // 3. Update Geofences when schools or selectedSchool changes
  useEffect(() => {
    if (adapterRef.current) {
      adapterRef.current.renderSchoolGeofences(schools, targetSchoolId);
    }
  }, [schools, targetSchoolId]);

  // 4. Update Student Markers and Trails (Guarded View: Never break tiles on 0 results)
  useEffect(() => {
    if (!adapterRef.current) return;
    const adapter = adapterRef.current;

    adapter.clearStudentMarkers();

    const matchingStudents: Student[] = [];

    students.forEach((s) => {
      const telem = s.telemetry;
      if (!telem || telem.latitude == null || telem.longitude == null) return;

      const isInside = telem.geofenceStatus === 'INSIDE';
      const isVerifying = telem.geofenceStatus === 'VERIFYING';
      const isSos = telem.isSos || false;
      const isOffline = telem.deviceStatus === 'OFFLINE' || (telem.lastSeen && Date.now() - telem.lastSeen > 300000);

      // Filter check
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'INSIDE' && !isInside) return;
        if (statusFilter === 'OUTSIDE' && isInside) return;
        if (statusFilter === 'VERIFYING' && !isVerifying) return;
        if (statusFilter === 'SOS' && !isSos) return;
        if (statusFilter === 'ONLINE' && isOffline) return;
        if (statusFilter === 'OFFLINE' && !isOffline) return;
      }

      matchingStudents.push(s);
      adapter.upsertStudentMarker(s, selectedStudent?.id === s.id);

      // Track history update (in-memory last 30 minutes trail)
      setTrailsHistory((prev) => {
        const studentTrail = prev[s.id] || [];
        const lastPt = studentTrail[studentTrail.length - 1];
        if (!lastPt || lastPt[0] !== telem.latitude || lastPt[1] !== telem.longitude) {
          const updated = [...studentTrail, [telem.latitude, telem.longitude] as [number, number]];
          if (updated.length > 50) updated.shift();
          return { ...prev, [s.id]: updated };
        }
        return prev;
      });
    });

    // If exactly 1 student matches: focus with sensible zoom (16)
    if (statusFilter !== 'ALL' && matchingStudents.length === 1) {
      const single = matchingStudents[0];
      if (single.telemetry?.latitude && single.telemetry?.longitude) {
        adapter.flyTo(single.telemetry.latitude, single.telemetry.longitude, 16);
      }
    }
    // If 0 students: KEEP CURRENT MAP VIEW UNCHANGED. Never call fitBounds or setView on 0 markers!
  }, [students, selectedStudent, statusFilter]);

  // Render Trails
  useEffect(() => {
    if (!adapterRef.current) return;
    const adapter = adapterRef.current;
    adapter.clearTrails();

    Object.entries(trailsHistory).forEach(([studentId, pts]) => {
      const std = students.find((s) => s.id === studentId);
      const isInside = std?.telemetry?.geofenceStatus === 'INSIDE';
      const isSos = std?.telemetry?.isSos;
      const color = isSos ? '#ff4d5e' : isInside ? '#2ee59d' : '#ff4d5e';
      adapter.renderTrail(studentId, pts, color);
    });
  }, [trailsHistory, students]);

  // Map Layer toggle (Roadmap vs Satellite)
  const handleToggleLayer = () => {
    const nextLayer: MapLayerType = mapLayer === 'roadmap' ? 'satellite' : 'roadmap';
    setMapLayer(nextLayer);
    adapterRef.current?.setMapType(nextLayer);
  };

  // Recenter to School
  const handleRecenter = () => {
    if (activeSchool.lat && activeSchool.lng) {
      adapterRef.current?.flyTo(activeSchool.lat, activeSchool.lng, 17);
      if (activeSchool.polygon && activeSchool.polygon.length > 2) {
        adapterRef.current?.fitBounds(activeSchool.polygon);
      }
    }
  };

  // Drawing Tools Handlers
  const handleStartPolygonDraw = () => {
    if (drawingMode === 'POLYGON') {
      adapterRef.current?.cancelDrawing();
      setDrawingMode('NONE');
      return;
    }
    setDrawingMode('POLYGON');
    setPolygonPointCount(0);
    adapterRef.current?.startDrawingPolygon((count) => {
      setPolygonPointCount(count);
    });
  };

  const handleUndoPolygonPoint = () => {
    if (adapterRef.current?.undoLastPolygonPoint) {
      const remaining = adapterRef.current.undoLastPolygonPoint();
      setPolygonPointCount(remaining);
    }
  };

  const handleFinishPolygonDraw = async () => {
    if (!adapterRef.current) return;
    const points = adapterRef.current.finishDrawingPolygon();
    setDrawingMode('NONE');
    setPolygonPointCount(0);
    if (points && points.length >= 3) {
      const area = Math.round(calculatePolygonArea(points));
      setIsSavingGeofence(true);
      try {
        activeSchool.polygon = points;
        await onSaveGeofence(activeSchool.id, points);
        showToast(`✅ "${activeSchool.name}" uchun ${formatArea(area)} maydonli yangi geozona muvaffaqiyatli saqlandi!`, 'success');
        adapterRef.current?.renderSchoolGeofences(schools, activeSchool.id);
        adapterRef.current?.fitBounds(points);
      } catch (e: any) {
        showToast("Xatolik: " + e.message, 'error');
      } finally {
        setIsSavingGeofence(false);
        setSearchPin(null);
      }
    } else {
      showToast("⚠️ Poligon uchun kamida 3 ta burchak nuqtasi belgilanishi shart!", 'info');
    }
  };

  const handleStartCircleDraw = (customCenter?: [number, number]) => {
    if (drawingMode === 'CIRCLE') {
      adapterRef.current?.cancelDrawing();
      setDrawingMode('NONE');
      return;
    }
    setDrawingMode('CIRCLE');
    const initCenter: [number, number] = customCenter || (activeSchool.lat && activeSchool.lng
      ? [activeSchool.lat, activeSchool.lng]
      : [41.311081, 69.240562]);
    adapterRef.current?.startDrawingCircle(initCenter, circleRadius);
  };

  const handleChangeCircleRadius = (newRadius: number) => {
    setCircleRadius(newRadius);
    adapterRef.current?.setCircleRadius?.(newRadius);
  };

  const handleFinishCircleDraw = async () => {
    if (!adapterRef.current) return;
    const circle = adapterRef.current.finishDrawingCircle();
    setDrawingMode('NONE');
    if (circle) {
      // Approximate circle as a 16-point polygon for uniform DB storage
      const poly: [number, number][] = [];
      const steps = 16;
      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * 2 * Math.PI;
        const dLat = (circle.radius / 111320) * Math.cos(theta);
        const dLng = (circle.radius / (111320 * Math.cos((circle.center[0] * Math.PI) / 180))) * Math.sin(theta);
        poly.push([circle.center[0] + dLat, circle.center[1] + dLng]);
      }
      activeSchool.lat = circle.center[0];
      activeSchool.lng = circle.center[1];
      activeSchool.polygon = poly;
      setIsSavingGeofence(true);
      try {
        await onSaveGeofence(activeSchool.id, poly);
        showToast(`✅ "${activeSchool.name}" uchun ${circle.radius}m radiusli doiraviy geozona saqlandi!`, 'success');
        adapterRef.current?.renderSchoolGeofences(schools, activeSchool.id);
        adapterRef.current?.fitBounds(poly);
      } catch (e: any) {
        showToast("Xatolik: " + e.message, 'error');
      } finally {
        setIsSavingGeofence(false);
        setSearchPin(null);
      }
    }
  };

  const handleStartMeasure = () => {
    if (drawingMode === 'MEASURE') {
      adapterRef.current?.stopMeasure();
      setDrawingMode('NONE');
      setMeasuredDistance(null);
      return;
    }
    setDrawingMode('MEASURE');
    setMeasuredDistance(null);
    adapterRef.current?.startMeasure((dist) => {
      setMeasuredDistance(dist);
    });
  };

  // Search result selection & Map Pick mode
  const handleSelectSearchResult = (item: SearchResultItem) => {
    setSearchPin({
      lat: item.lat,
      lng: item.lng,
      title: item.title,
      subtitle: item.subtitle,
    });

    adapterRef.current?.flyTo(item.lat, item.lng, 17);

    if (item.category === 'local_student' && item.originalItem) {
      setSelectedStudent(item.originalItem);
    } else if (item.category === 'local_school' && item.originalItem) {
      setTargetSchoolId(item.originalItem.id);
    }
  };

  // User manually triggers custom polygon drawing around the searched place
  const handleStartPolygonFromPin = () => {
    if (searchPin) {
      activeSchool.lat = searchPin.lat;
      activeSchool.lng = searchPin.lng;
    }
    setDrawingMode('POLYGON');
    setPolygonPointCount(0);
    adapterRef.current?.startDrawingPolygon((count) => {
      setPolygonPointCount(count);
    });
  };

  // User triggers custom circle drawing around the searched place
  const handleStartCircleFromPin = () => {
    if (searchPin) {
      activeSchool.lat = searchPin.lat;
      activeSchool.lng = searchPin.lng;
      handleStartCircleDraw([searchPin.lat, searchPin.lng]);
    }
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Independent student text search (Ism, ID yoki sinf)
      if (studentSearch.trim()) {
        const query = studentSearch.trim().toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesId = s.uniqueId.toLowerCase().includes(query);
        const matchesClass = s.className.toLowerCase().includes(query);
        const matchesAddr = s.telemetry?.address && s.telemetry.address.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesClass && !matchesAddr) {
          return false;
        }
      }

      // 2. Status filter
      const telem = s.telemetry;
      const isInside = telem?.geofenceStatus === 'INSIDE';
      const isVerifying = telem?.geofenceStatus === 'VERIFYING';
      const isSos = telem?.isSos;
      const isOffline = telem?.deviceStatus === 'OFFLINE' || (telem?.lastSeen && Date.now() - telem.lastSeen > 300000);

      if (statusFilter === 'INSIDE') return isInside;
      if (statusFilter === 'OUTSIDE') return !isInside;
      if (statusFilter === 'VERIFYING') return isVerifying;
      if (statusFilter === 'SOS') return isSos;
      if (statusFilter === 'ONLINE') return !isOffline;
      if (statusFilter === 'OFFLINE') return isOffline;
      return true;
    });
  }, [students, studentSearch, statusFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col min-h-0 bg-[#1b1b33] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-0' : ''
      }`}
    >
      {/* 1. MAP ENGINE CANVAS (Full Viewport Height) */}
      <div
        ref={containerRef}
        className={`w-full h-full flex-1 min-h-0 relative z-0 ${
          isMapPickMode || drawingMode === 'POLYGON' || drawingMode === 'CIRCLE'
            ? 'cursor-crosshair'
            : ''
        }`}
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
      />

      {/* 1.1 In-app Toast Banner (zero blocking alert popups) */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-[#2ee59d]/20 border-[#2ee59d]/60 text-[#2ee59d]'
              : toast.type === 'error'
              ? 'bg-[#ff4d5e]/20 border-[#ff4d5e]/60 text-[#ff4d5e]'
              : 'bg-[#4db5ff]/20 border-[#4db5ff]/60 text-[#4db5ff]'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1.2 Map Click Pick-Mode Banner */}
      {isMapPickMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] bg-[#1b1b33]/95 border border-[#4db5ff]/70 backdrop-blur-xl p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-[#4db5ff] font-bold">
            <Crosshair className="w-4 h-4 animate-spin" />
            <span>📍 Xaritada istalgan joyni bosing — nuqta avtomatik tanlanadi</span>
          </div>
          <button
            onClick={() => setIsMapPickMode(false)}
            className="px-2.5 py-1 rounded-xl bg-[#2a2a4a] text-[#9a9ac0] hover:text-[#e8e8f5] text-xs font-semibold border border-[#3a3a63]"
          >
            Bekor qilish
          </button>
        </div>
      )}

      {/* 1.3 Search Pin Action Banner */}
      {searchPin && drawingMode === 'NONE' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[94%] bg-[#1b1b33]/95 border border-[#2ee59d]/60 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-xl bg-[#2ee59d]/20 border border-[#2ee59d]/40 flex items-center justify-center shrink-0 text-[#2ee59d]">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[#e8e8f5] truncate">{searchPin.title}</div>
              <div className="text-[11px] text-[#9a9ac0] font-mono truncate">
                {searchPin.subtitle || `${searchPin.lat.toFixed(5)}, ${searchPin.lng.toFixed(5)}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end w-full sm:w-auto">
            <button
              onClick={handleStartPolygonFromPin}
              className="px-3 py-1.5 rounded-xl bg-[#ff2d78] hover:bg-[#ff1a6d] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#ff2d78]/25 transition"
              title="Xarita ustida maktab hududi burchaklarini o'zingiz nuqtalar qo'yib chizasiz"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>✏️ Chegarani o'zim chizish</span>
            </button>
            <button
              onClick={handleStartCircleFromPin}
              className="px-3 py-1.5 rounded-xl bg-[#2ee59d] hover:bg-[#25c485] text-[#1b1b33] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#2ee59d]/20 transition"
              title="Doiraviy radiusli geozona"
            >
              <CircleIcon className="w-3.5 h-3.5" />
              <span>⭕ Aylana</span>
            </button>
            <button
              onClick={() => setSearchPin(null)}
              className="p-1.5 rounded-xl text-[#9a9ac0] hover:text-[#e8e8f5] hover:bg-[#2a2a4a]"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1.4 Active Polygon Drawing HUD Banner */}
      {drawingMode === 'POLYGON' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[94%] bg-[#1b1b33]/95 border-2 border-[#ff2d78] backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-[#ff2d78]/20 border border-[#ff2d78]/40 flex items-center justify-center shrink-0 text-[#ff2d78] animate-pulse">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-[#e8e8f5] flex items-center gap-2">
                <span>✏️ Geozona chegarasini chizish</span>
                <span className="px-2 py-0.5 rounded-full bg-[#ff2d78] text-white text-[10px] font-extrabold">
                  {polygonPointCount} ta nuqta
                </span>
              </div>
              <div className="text-[11px] text-[#9a9ac0] mt-0.5">
                {polygonPointCount < 3
                  ? "Xaritada maktab hududi burchaklarini ketma-ket bosing (kamida 3 ta)"
                  : "Chegara tayyor! Yana nuqta qo'shishingiz yoki Saqlashni bosishingiz mumkin"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end w-full sm:w-auto">
            <button
              onClick={handleUndoPolygonPoint}
              disabled={polygonPointCount === 0}
              className="px-2.5 py-1.5 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] disabled:opacity-40 text-[#e8e8f5] font-semibold text-xs flex items-center gap-1 border border-[#3a3a63] transition"
              title="Oxirgi nuqtani bekor qilish"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#ffb020]" />
              <span>Orqaga</span>
            </button>
            <button
              onClick={handleFinishPolygonDraw}
              disabled={polygonPointCount < 3 || isSavingGeofence}
              className="px-3.5 py-1.5 rounded-xl bg-[#2ee59d] hover:bg-[#25c485] disabled:opacity-40 text-[#1b1b33] font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#2ee59d]/25 transition"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingGeofence ? 'Saqlanmoqda...' : 'Saqlash'}</span>
            </button>
            <button
              onClick={() => {
                adapterRef.current?.cancelDrawing();
                setDrawingMode('NONE');
                setPolygonPointCount(0);
              }}
              className="p-1.5 rounded-xl text-[#9a9ac0] hover:text-[#ff4d5e] hover:bg-[#2a2a4a]"
              title="Bekor qilish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1.5 Active Circle Drawing HUD Banner */}
      {drawingMode === 'CIRCLE' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[94%] bg-[#1b1b33]/95 border-2 border-[#2ee59d] backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-[#2ee59d]/20 border border-[#2ee59d]/40 flex items-center justify-center shrink-0 text-[#2ee59d] animate-pulse">
              <CircleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-[#e8e8f5] flex items-center gap-2">
                <span>⭕ Doiraviy geozona</span>
                <span className="font-mono text-[#2ee59d] font-bold">R = {circleRadius} metr</span>
              </div>
              <div className="text-[11px] text-[#9a9ac0] mt-0.5">
                Xaritada bosib markazni ko'chirishingiz yoki radiusni tanlashingiz mumkin
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-[#2a2a4a] p-1 rounded-xl border border-[#3a3a63]">
              {[50, 100, 200, 300, 500].map((r) => (
                <button
                  key={r}
                  onClick={() => handleChangeCircleRadius(r)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    circleRadius === r
                      ? 'bg-[#2ee59d] text-[#1b1b33]'
                      : 'text-[#9a9ac0] hover:text-[#e8e8f5]'
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
            <button
              onClick={handleFinishCircleDraw}
              disabled={isSavingGeofence}
              className="px-3.5 py-1.5 rounded-xl bg-[#2ee59d] hover:bg-[#25c485] text-[#1b1b33] font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#2ee59d]/25 transition"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingGeofence ? 'Saqlanmoqda...' : 'Saqlash'}</span>
            </button>
            <button
              onClick={() => {
                adapterRef.current?.cancelDrawing();
                setDrawingMode('NONE');
              }}
              className="p-1.5 rounded-xl text-[#9a9ac0] hover:text-[#ff4d5e] hover:bg-[#2a2a4a]"
              title="Bekor qilish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. TOP FLOATING TOOLBAR HUD */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        {/* Left cluster: Search & Student List Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowStudentList(!showStudentList)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold shadow-xl border border-[#3a3a63]/50 backdrop-blur-md transition ${
              showStudentList
                ? 'bg-[#2ee59d] text-[#1b1b33]'
                : 'bg-[#2a2a4a]/90 text-[#9a9ac0] hover:text-[#e8e8f5]'
            }`}
            title="O'quvchilar ro'yxatini yashirish/ko'rsatish"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">O'quvchilar ({filteredStudents.length})</span>
          </button>

          {/* Unified Intelligent Search Combobox */}
          <SearchCombobox
            schools={schools}
            students={students}
            currentSchool={activeSchool}
            googleMapsApiKey={googleMapsApiKey}
            onSelectResult={handleSelectSearchResult}
            onStartMapPickMode={() => setIsMapPickMode(!isMapPickMode)}
            isMapPickMode={isMapPickMode}
          />
        </div>

        {/* Center / Right cluster: Map Tools */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#2a2a4a]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#3a3a63]/50 shadow-xl">
          {/* Geofence Drawing Tools */}
          <button
            onClick={handleStartPolygonDraw}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              drawingMode === 'POLYGON'
                ? 'bg-[#ff2d78] text-white animate-pulse'
                : 'bg-[#1b1b33] text-[#9a9ac0] hover:text-[#e8e8f5]'
            }`}
            title="Poligon Geozona Chizish"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Poligon</span>
            {drawingMode === 'POLYGON' && <span>({polygonPointCount})</span>}
          </button>

          {drawingMode === 'POLYGON' && (
            <button
              onClick={handleFinishPolygonDraw}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#2ee59d] text-[#1b1b33] text-xs font-bold hover:bg-[#25c485]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Saqlash</span>
            </button>
          )}

          <button
            onClick={() => handleStartCircleDraw()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              drawingMode === 'CIRCLE'
                ? 'bg-[#2ee59d] text-[#1b1b33]'
                : 'bg-[#1b1b33] text-[#9a9ac0] hover:text-[#e8e8f5]'
            }`}
            title="Aylana Geozona"
          >
            <CircleIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Aylana</span>
          </button>

          {drawingMode === 'CIRCLE' && (
            <button
              onClick={handleFinishCircleDraw}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#2ee59d] text-[#1b1b33] text-xs font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Saqlash</span>
            </button>
          )}

          {/* Measure Tool */}
          <button
            onClick={handleStartMeasure}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              drawingMode === 'MEASURE'
                ? 'bg-[#4db5ff] text-[#1b1b33]'
                : 'bg-[#1b1b33] text-[#9a9ac0] hover:text-[#e8e8f5]'
            }`}
            title="Masofa O'lchash (Ruler)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {measuredDistance !== null ? `${measuredDistance} m` : "O'lchash"}
            </span>
          </button>

          {/* Layer switcher */}
          <button
            onClick={handleToggleLayer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b33] text-[#9a9ac0] hover:text-[#e8e8f5] text-xs font-semibold transition"
            title="Xarita qatlamini almashtirish"
          >
            <Layers className="w-3.5 h-3.5 text-[#4db5ff]" />
            <span className="hidden md:inline">
              {mapLayer === 'roadmap' ? 'Xarita' : "Sun'iy Yo'ldosh"}
            </span>
          </button>

          {/* Recenter */}
          <button
            onClick={handleRecenter}
            className="p-1.5 rounded-xl bg-[#1b1b33] text-[#9a9ac0] hover:text-[#2ee59d] transition"
            title="Maktabga fokuslash"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-[#1b1b33] text-[#9a9ac0] hover:text-[#e8e8f5] transition"
            title="To'liq ekran"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Engine indicator pill */}
          <div
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border ${
              provider === 'google'
                ? 'bg-[#2ee59d]/15 text-[#2ee59d] border-[#2ee59d]/30'
                : 'bg-[#ffb020]/15 text-[#ffb020] border-[#ffb020]/30'
            }`}
            title={provider === 'google' ? 'Google Maps JavaScript API faol' : 'OpenStreetMap Fallback faol'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${provider === 'google' ? 'bg-[#2ee59d]' : 'bg-[#ffb020]'}`} />
            <span className="hidden sm:inline">
              {provider === 'google' ? 'Google Maps' : 'OSM Zaxira'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. LEFT FLOATING GLASSMORPHIC STUDENT LIST */}
      {showStudentList && (
        <div className="absolute top-16 left-3 bottom-12 w-72 sm:w-80 z-10 flex flex-col bg-[#1b1b33]/92 backdrop-blur-xl border border-[#3a3a63]/60 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="p-3 border-b border-[#3a3a63]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ee59d] animate-ping" />
              <span className="font-bold text-xs text-[#e8e8f5]">Jonli Telemetriya</span>
            </div>
            <div className="flex items-center gap-1.5">
              {statusFilter !== 'ALL' && (
                <span className="text-[10px] font-bold text-[#ffb020] bg-[#ffb020]/15 px-2 py-0.5 rounded-full border border-[#ffb020]/30">
                  {statusFilter}
                </span>
              )}
              <span className="text-[11px] font-mono text-[#2ee59d] font-bold">
                {filteredStudents.length} / {students.length}
              </span>
            </div>
          </div>

          {/* Dedicated Student Search Field */}
          <div className="p-2 border-b border-[#3a3a63]/40 bg-[#1b1b33]/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#9a9ac0] pointer-events-none" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Ism, ID yoki sinf..."
                className="w-full h-8 pl-8 pr-7 bg-[#2a2a4a]/90 border border-[#3a3a63]/50 rounded-xl text-xs text-[#e8e8f5] placeholder:text-[#9a9ac0] focus:outline-none focus:border-[#2ee59d] transition"
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch('')}
                  className="absolute right-2 p-0.5 text-[#9a9ac0] hover:text-[#e8e8f5]"
                  title="Qidiruvni tozalash"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Student Cards List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2a2a4a] border border-[#3a3a63]/50 flex items-center justify-center mx-auto text-[#9a9ac0]">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-xs text-[#9a9ac0] font-medium leading-relaxed">
                  {statusFilter !== 'ALL'
                    ? "Bu holatda o'quvchi yo'q"
                    : studentSearch.trim()
                    ? `"${studentSearch}" bo'yicha o'quvchi topilmadi`
                    : "O'quvchilar topilmadi"}
                </div>
                {statusFilter !== 'ALL' && (
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      onSelectFilter?.('ALL');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] text-xs font-semibold text-[#2ee59d] border border-[#2ee59d]/40 transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Filtrni tozalash</span>
                  </button>
                )}
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch('')}
                    className="px-2.5 py-1 rounded-xl bg-[#2a2a4a] text-xs text-[#9a9ac0] hover:text-[#e8e8f5] border border-[#3a3a63]/40 block mx-auto transition"
                  >
                    Qidiruvni tozalash
                  </button>
                )}
              </div>
            ) : (
              filteredStudents.map((std) => {
                const telem = std.telemetry;
                const isInside = telem?.geofenceStatus === 'INSIDE';
                const isSos = telem?.isSos;
                const isOffline =
                  telem?.deviceStatus === 'OFFLINE' ||
                  (telem?.lastSeen && Date.now() - telem.lastSeen > 300000);
                const isSelected = selectedStudent?.id === std.id;

                const school = schools.find((s) => s.id === std.schoolId) || schools[0];
                let distText = '—';
                if (school && school.lat && school.lng && telem?.latitude && telem?.longitude) {
                  const d = Math.round(haversineDistance(telem.latitude, telem.longitude, school.lat, school.lng));
                  distText = formatDistance(d);
                }

                return (
                  <div
                    key={std.id}
                    onClick={() => {
                      setSelectedStudent(std);
                      if (telem?.latitude && telem?.longitude) {
                        adapterRef.current?.flyTo(telem.latitude, telem.longitude, 17.5);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#2ee59d] bg-[#2ee59d]/15 shadow-md shadow-[#2ee59d]/10'
                        : 'border-[#3a3a63]/40 bg-[#2a2a4a]/70 hover:bg-[#3a3a63]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}
                          alt={std.name}
                          className="w-9 h-9 rounded-xl object-cover border border-[#3a3a63]"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#1b1b33] flex items-center justify-center text-[7px] font-black text-white ${
                            isSos
                              ? 'bg-[#ff4d5e] animate-ping'
                              : isOffline
                              ? 'bg-[#9a9ac0]'
                              : isInside
                              ? 'bg-[#2ee59d]'
                              : 'bg-[#ff4d5e]'
                          }`}
                        >
                          {isOffline ? '•' : isInside ? '✓' : '!'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#e8e8f5] truncate">{std.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                              isSos
                                ? 'bg-[#ff4d5e] text-white animate-pulse'
                                : isOffline
                                ? 'bg-[#9a9ac0]/20 text-[#9a9ac0]'
                                : isInside
                                ? 'bg-[#2ee59d]/20 text-[#2ee59d]'
                                : 'bg-[#ff4d5e]/20 text-[#ff4d5e]'
                            }`}
                          >
                            {isSos ? 'SOS' : isOffline ? 'OFFLINE' : isInside ? 'MAKTABDA' : 'TASHQARIDA'}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#9a9ac0] flex items-center justify-between mt-0.5">
                          <span>
                            {std.className} • <span className="font-mono text-[#4db5ff]">{std.uniqueId}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px] text-[#ff4d5e]">
                            <Heart className="w-2.5 h-2.5 fill-[#ff4d5e]" />
                            {telem?.heartRate || 75}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#9a9ac0] mt-1 pt-1 border-t border-[#3a3a63]/30">
                          <span className="truncate max-w-[140px]" title={telem?.address || 'Toshkent shahri'}>
                            📍 {telem?.address || 'Toshkent shahri'}
                          </span>
                          <span className="font-mono text-[#2ee59d]">
                            🔋 {telem?.batteryLevel || 85}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. RIGHT FLOATING STUDENT DETAIL CARD */}
      {selectedStudent && (
        <div className="absolute top-16 right-3 bottom-12 w-80 sm:w-96 z-20 flex flex-col bg-[#1b1b33]/95 backdrop-blur-xl border border-[#3a3a63]/70 rounded-2xl shadow-2xl p-4 text-[#e8e8f5] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between pb-3 border-b border-[#3a3a63]/40">
            <span className="text-xs font-bold text-[#9a9ac0] uppercase tracking-wider">
              O'quvchi & Soat Tafsilotlari
            </span>
            <button
              onClick={() => setSelectedStudent(null)}
              className="p-1 rounded-lg text-[#9a9ac0] hover:text-[#e8e8f5] hover:bg-[#2a2a4a]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student Profile Info */}
          <div className="flex items-center gap-3.5 my-3">
            <img
              src={selectedStudent.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
              alt={selectedStudent.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#2ee59d] shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm text-[#e8e8f5] truncate">{selectedStudent.name}</h3>
              <p className="text-xs text-[#9a9ac0]">{selectedStudent.className} • ID: {selectedStudent.uniqueId}</p>
              <p className="text-[11px] text-[#4db5ff] truncate">🏫 {selectedStudent.schoolName}</p>
            </div>
          </div>

          {/* Telemetry Status Grid */}
          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="p-2.5 rounded-xl bg-[#2a2a4a]/80 border border-[#3a3a63]/40">
              <span className="text-[10px] text-[#9a9ac0] font-semibold block">GEOFENCE HOLATI</span>
              <span
                className={`text-xs font-black mt-1 inline-block ${
                  selectedStudent.telemetry?.geofenceStatus === 'INSIDE'
                    ? 'text-[#2ee59d]'
                    : 'text-[#ff4d5e]'
                }`}
              >
                {selectedStudent.telemetry?.geofenceStatus === 'INSIDE' ? '🟢 MAKTABDA' : '🔴 TASHQARIDA'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#2a2a4a]/80 border border-[#3a3a63]/40">
              <span className="text-[10px] text-[#9a9ac0] font-semibold block">SOAT HOLATI</span>
              <span className="text-xs font-black text-[#2ee59d] mt-1 inline-block">
                ● ONLINE (0 s oldin)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#2a2a4a]/80 border border-[#3a3a63]/40">
              <div className="flex items-center justify-between text-[10px] text-[#9a9ac0] font-semibold">
                <span>BATAREYA</span>
                <Battery className="w-3.5 h-3.5 text-[#2ee59d]" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-[#2ee59d]">
                  {selectedStudent.telemetry?.batteryLevel || 85}%
                </span>
                <span className="text-[10px] text-[#9a9ac0]">Galaxy Watch5 Pro</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#2a2a4a]/80 border border-[#3a3a63]/40">
              <div className="flex items-center justify-between text-[10px] text-[#9a9ac0] font-semibold">
                <span>YURAK URISHI</span>
                <Heart className="w-3.5 h-3.5 text-[#ff4d5e]" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-[#ff4d5e]">
                  {selectedStudent.telemetry?.heartRate || 76}
                </span>
                <span className="text-[10px] text-[#9a9ac0]">BPM</span>
              </div>
            </div>
          </div>

          {/* Location & Reverse Geocoded Address */}
          <div className="p-3 rounded-xl bg-[#2a2a4a]/60 border border-[#3a3a63]/40 space-y-2 my-1 text-xs">
            <div>
              <span className="text-[10px] text-[#9a9ac0] font-bold block">ANIQLANGAN KO'CHA MANZILI</span>
              <span className="font-semibold text-[#e8e8f5] mt-0.5 block leading-tight">
                📍 {selectedStudent.telemetry?.address || 'Toshkent shahri, Chilonzor tumani'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#3a3a63]/30">
              <span className="text-[#9a9ac0]">GPS Aniqligi:</span>
              <span className="font-mono text-[#2ee59d]">±{selectedStudent.telemetry?.accuracy || 3.5} m</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9a9ac0]">Kordinatalar:</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    `${selectedStudent.telemetry?.latitude?.toFixed(6)}, ${selectedStudent.telemetry?.longitude?.toFixed(6)}`
                  )
                }
                className="font-mono text-[#4db5ff] hover:underline flex items-center gap-1"
              >
                <span>
                  {selectedStudent.telemetry?.latitude?.toFixed(5)}, {selectedStudent.telemetry?.longitude?.toFixed(5)}
                </span>
                <Copy className="w-3 h-3" />
                {copiedCoords && <span className="text-[#2ee59d] text-[10px]">Nusxalandi!</span>}
              </button>
            </div>
          </div>

          {/* Parent Contact */}
          <div className="p-3 rounded-xl bg-[#2a2a4a]/60 border border-[#3a3a63]/40 my-1 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#9a9ac0] block">OTA-ONA</span>
              <span className="font-bold text-[#e8e8f5]">{selectedStudent.parentName || 'Karimov Alisher'}</span>
              <span className="text-[11px] text-[#9a9ac0] block">{selectedStudent.parentPhone || '+998 90 123 45 67'}</span>
            </div>
            <a
              href={`tel:${selectedStudent.parentPhone || '+998901234567'}`}
              className="p-2.5 rounded-xl bg-[#2ee59d] text-[#1b1b33] hover:bg-[#25c485] transition"
              title="Qo'ng'iroq qilish"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#3a3a63]/40">
            <button
              onClick={() => {
                if (selectedStudent.telemetry?.latitude && selectedStudent.telemetry?.longitude) {
                  adapterRef.current?.flyTo(
                    selectedStudent.telemetry.latitude,
                    selectedStudent.telemetry.longitude,
                    18
                  );
                }
              }}
              className="py-2.5 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] border border-[#3a3a63] text-xs font-bold text-[#e8e8f5] flex items-center justify-center gap-1.5 transition"
            >
              <Navigation2 className="w-3.5 h-3.5 text-[#4db5ff]" />
              <span>Fokuslash</span>
            </button>

            <button
              onClick={() => {
                showToast(`🚨 ${selectedStudent.name} uchun FAVQULODDA SOS signali yuborildi!`, 'error');
              }}
              className="py-2.5 rounded-xl bg-[#ff4d5e] hover:bg-[#e03d4e] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-[#ff4d5e]/20 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS Signal</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. BOTTOM BAR: LEGEND & PROVIDER NOTICE */}
      <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-xs text-[#9a9ac0]">
        <div className="pointer-events-auto bg-[#1b1b33]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#3a3a63]/40 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2ee59d]" /> Maktabda (INSIDE)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ff4d5e]" /> Tashqarida (OUTSIDE)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ffb020]" /> Chegarada (VERIFYING)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#9a9ac0]" /> Oflayn (Oxirgi joy)
          </span>
        </div>

        {isFallbackNotice && (
          <div className="pointer-events-auto bg-[#ffb020]/20 text-[#ffb020] border border-[#ffb020]/40 px-3 py-1 rounded-xl text-[11px] font-semibold hidden md:flex items-center gap-1.5 shadow-lg">
            <Info className="w-3.5 h-3.5" />
            <span>OpenStreetMap zaxira rejimi faol</span>
          </div>
        )}
      </div>
    </div>
  );
};
