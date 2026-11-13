import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  PenTool,
  RotateCcw,
  Check,
  X,
  Crosshair,
  Layers,
  Ruler,
  Maximize2,
  Minimize2,
  Users,
  Search,
  Circle as CircleIcon,
  Copy,
  MapPin,
  Heart,
  Plus,
  Minus,
  Footprints,
  Radio,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { School, Student } from '@/types';
import { MapAdapter, MapLayerType, MapProviderType } from '@/lib/mapAdapter/types';
import { createMapAdapter } from '@/lib/mapAdapter';
import { SearchCombobox, SearchResultItem } from './SearchCombobox';

interface MapViewProps {
  schools: School[];
  students: Student[];
  onSaveGeofence: (
    schoolId: string,
    polygon: [number, number][],
    name?: string,
    isNewSchool?: boolean,
    lat?: number,
    lng?: number
  ) => Promise<any>;
  selectedSchoolId: string;
  onRefreshData?: () => Promise<void>;
  activeFilter?: string;
  onSelectFilter?: (f: string) => void;
  googleMapsApiKey?: string;
  activeNavTab?: string;
  selectedStudent?: Student | null;
  onSelectStudent?: (student: Student | null) => void;
  isDemoMode?: boolean;
  onSimulateWalk?: (stage: 'ENTER_SCHOOL' | 'LEAVE_SCHOOL' | 'APPROACHING_GATE' | 'OUTSIDE_STREET') => void;
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
  selectedStudent: externalSelectedStudent,
  onSelectStudent,
  isDemoMode = false,
  onSimulateWalk,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);

  // Map state
  const [provider, setProvider] = useState<MapProviderType>('yandex');
  const [mapLayer, setMapLayer] = useState<MapLayerType>('roadmap');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selection
  const [internalSelectedStudent, setInternalSelectedStudent] = useState<Student | null>(null);
  const selectedStudent = externalSelectedStudent !== undefined ? externalSelectedStudent : internalSelectedStudent;
  const setSelectedStudent = (std: Student | null) => {
    if (onSelectStudent) onSelectStudent(std);
    setInternalSelectedStudent(std);
  };

  const [targetSchoolId, setTargetSchoolId] = useState<string>(selectedSchoolId || 'SCH001');

  // Search & Filter
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const effectiveFilter = activeFilter !== 'ALL' ? activeFilter : statusFilter;

  // Floating Panel Collapses
  const [isStudentPanelCollapsed, setIsStudentPanelCollapsed] = useState(false);
  const [isSimBarCollapsed, setIsSimBarCollapsed] = useState(false);

  // Drawing & Tools state
  const [drawingMode, setDrawingMode] = useState<'NONE' | 'POLYGON' | 'CIRCLE' | 'MEASURE'>('NONE');
  const [polygonPointCount, setPolygonPointCount] = useState(0);
  const [circleRadius, setCircleRadius] = useState(200);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [isSavingGeofence, setIsSavingGeofence] = useState(false);

  // Geofence Name & GPS Confirmation Dialog state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<[number, number][] | null>(null);
  const [geofenceNameInput, setGeofenceNameInput] = useState('');
  const [geofenceLatInput, setGeofenceLatInput] = useState('');
  const [geofenceLngInput, setGeofenceLngInput] = useState('');
  const [saveAsNewSchool, setSaveAsNewSchool] = useState(true);

  // Live GPS Coordinates readout state
  const [currentCursorCoords, setCurrentCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Search Pin & Map Pick Mode state
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; title: string; subtitle?: string } | null>(null);
  const [isMapPickMode, setIsMapPickMode] = useState(false);
  const isMapPickModeRef = useRef(false);
  isMapPickModeRef.current = isMapPickMode;

  // Toast state
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

  // Trails history & display toggle
  const [trailsHistory, setTrailsHistory] = useState<Record<string, [number, number][]>>({});
  const [showTrails, setShowTrails] = useState<boolean>(activeNavTab === 'routes');

  useEffect(() => {
    if (activeNavTab === 'routes') {
      setShowTrails(true);
    }
  }, [activeNavTab]);

  // Active School
  const activeSchool: School = useMemo(() => {
    return schools.find((s) => s.id === targetSchoolId) || schools[0] || {
      id: 'SCH001',
      geofenceId: 'GEO001',
      code: 'SCH001',
      name: "30-Sonli Umumiy O'rta Ta'lim Maktabi",
      address: "Xorazm viloyati, Urganch shahar, 30-maktab",
      lat: 41.550500,
      lng: 60.631500,
      startTime: '08:00',
      endTime: '13:00',
      polygon: [
        [41.5522, 60.6292],
        [41.5522, 60.6338],
        [41.5488, 60.6338],
        [41.5488, 60.6292],
      ],
    };
  }, [schools, targetSchoolId]);

  // Sync target school when parent prop changes
  useEffect(() => {
    if (selectedSchoolId && selectedSchoolId !== 'ALL') {
      setTargetSchoolId(selectedSchoolId);
      const sch = schools.find((s) => s.id === selectedSchoolId);
      if (sch?.lat && sch?.lng) {
        adapterRef.current?.flyTo(sch.lat, sch.lng, 16);
      }
    }
  }, [selectedSchoolId, schools]);

  // 1. Initialize Map Engine
  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return;

    createMapAdapter(googleMapsApiKey).then(async (res) => {
      if (!isMounted) return;
      adapterRef.current = res.adapter;
      setProvider(res.provider);

      const initCenter: [number, number] = [
        activeSchool.lat || 41.550500,
        activeSchool.lng || 60.631500,
      ];

      await res.adapter.init(container, {
        center: initCenter,
        zoom: 16,
        isDark: true,
        mapType: mapLayer,
        events: {
          onMarkerClick: ({ student, lat, lng }) => {
            setSelectedStudent(student);
            adapterRef.current?.flyTo(lat, lng, 17);
          },
          onSchoolClick: (schId) => {
            setTargetSchoolId(schId);
            const s = schools.find((sc) => sc.id === schId);
            if (s) {
              showToast(`🏫 ${s.name} tanlandi`, 'info');
            }
          },
          onMapClick: (lat, lng) => {
            setSelectedCoords({ lat, lng, label: 'Xaritadan tanlangan joy' });
            if (isMapPickModeRef.current) {
              setSearchPin({
                lat,
                lng,
                title: 'Tanlangan nuqta',
                subtitle: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              });
              setIsMapPickMode(false);
            }
          },
          onMouseMove: (lat, lng) => {
            setCurrentCursorCoords({ lat, lng });
          },
        },
      });

      // Initial School Geofences
      res.adapter.renderSchoolGeofences(schools, targetSchoolId);

      // Fit bounds to school and students if valid points exist
      const allPoints: [number, number][] = [];
      if (activeSchool.polygon && Array.isArray(activeSchool.polygon) && activeSchool.polygon.length > 2) {
        allPoints.push(...activeSchool.polygon);
      }
      students
        .filter((s) => s.schoolId === targetSchoolId && s.telemetry?.latitude && s.telemetry?.longitude)
        .forEach((s) => {
          allPoints.push([s.telemetry!.latitude, s.telemetry!.longitude]);
        });
      if (allPoints.length >= 2) {
        res.adapter.fitBounds(allPoints);
      } else if (activeSchool.lat && activeSchool.lng) {
        res.adapter.flyTo(activeSchool.lat, activeSchool.lng, 17);
      }

      // Initial resize
      setTimeout(() => res.adapter.resize(), 100);
      setTimeout(() => res.adapter.resize(), 400);
    });

    return () => {
      isMounted = false;
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, []);

  // 2. ResizeObserver: guarantees map resize whenever sidebar or stats column collapses/expands
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      adapterRef.current?.resize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync geofences and fit bounds when schools or target school change
  const initialFitDoneRef = useRef(false);
  useEffect(() => {
    if (!adapterRef.current) return;
    adapterRef.current.renderSchoolGeofences(schools, targetSchoolId);
    if (!initialFitDoneRef.current && schools.length > 0) {
      initialFitDoneRef.current = true;
      const targetSchool = schools.find((s) => s.id === targetSchoolId) || schools[0];
      if (targetSchool) {
        const allPoints: [number, number][] = [];
        if (targetSchool.polygon && Array.isArray(targetSchool.polygon) && targetSchool.polygon.length > 2) {
          allPoints.push(...targetSchool.polygon);
        }
        students
          .filter((s) => s.schoolId === targetSchool.id && s.telemetry?.latitude && s.telemetry?.longitude)
          .forEach((s) => {
            allPoints.push([s.telemetry!.latitude, s.telemetry!.longitude]);
          });
        if (allPoints.length >= 2) {
          adapterRef.current.fitBounds(allPoints);
        } else if (targetSchool.lat && targetSchool.lng) {
          adapterRef.current.flyTo(targetSchool.lat, targetSchool.lng, 17);
        }
      }
    }
  }, [schools, targetSchoolId, students]);

  // Handle ESC key to cancel active drawing or close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawingMode !== 'NONE') {
          adapterRef.current?.cancelDrawing();
          setDrawingMode('NONE');
          setPolygonPointCount(0);
          showToast("Chizish rejimi bekor qilindi", 'info');
        } else if (saveModalOpen) {
          setSaveModalOpen(false);
        } else if (searchPin) {
          setSearchPin(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingMode, saveModalOpen, searchPin]);

  // Filtered Students calculation
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          (s.className || '').toLowerCase().includes(q) ||
          (s.uniqueId || s.studentId || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Filter
      const telem = s.telemetry;
      const isInside = telem?.geofenceStatus === 'INSIDE';
      const isOutside = telem?.geofenceStatus === 'OUTSIDE';
      const isVerifying = telem?.geofenceStatus === 'VERIFYING';
      const isSos = Boolean(telem?.isSos);
      const isOffline = telem?.deviceStatus === 'OFFLINE' || (telem?.lastSeen ? Date.now() - telem.lastSeen > 300000 : !telem?.lastSeen);

      if (effectiveFilter === 'ALL') return true;
      if (effectiveFilter === 'INSIDE') return isInside;
      if (effectiveFilter === 'OUTSIDE') return isOutside;
      if (effectiveFilter === 'VERIFYING') return isVerifying;
      if (effectiveFilter === 'SOS') return isSos;
      if (effectiveFilter === 'ONLINE') return !isOffline;
      if (effectiveFilter === 'OFFLINE') return isOffline;
      return true;
    });
  }, [students, studentSearch, effectiveFilter]);

  // Live counts for chips
  const counts = useMemo(() => {
    let inside = 0;
    let outside = 0;
    let verifying = 0;
    let sos = 0;
    let offline = 0;

    students.forEach((s) => {
      const telem = s.telemetry;
      if (telem?.isSos) sos++;
      if (telem?.geofenceStatus === 'INSIDE') inside++;
      else if (telem?.geofenceStatus === 'OUTSIDE') outside++;
      else verifying++;
      const isOff = telem?.deviceStatus === 'OFFLINE' || (telem?.lastSeen ? Date.now() - telem.lastSeen > 300000 : !telem?.lastSeen);
      if (isOff) offline++;
    });

    return { total: students.length, inside, outside, verifying, sos, offline };
  }, [students]);

  // Update Markers on Map (FILTER BEHAVIOR: 0 markers keeps map view unchanged!)
  useEffect(() => {
    if (!adapterRef.current) return;
    const adapter = adapterRef.current;
    adapter.clearStudentMarkers();

    const matchingStudents: Student[] = [];

    students.forEach((s) => {
      const telem = s.telemetry;
      if (!telem || typeof telem.latitude !== 'number' || typeof telem.longitude !== 'number') return;
      if (isNaN(telem.latitude) || isNaN(telem.longitude)) return;

      const isInside = telem.geofenceStatus === 'INSIDE';
      const isVerifying = telem.geofenceStatus === 'VERIFYING';
      const isSos = Boolean(telem.isSos);
      const isOffline = telem.deviceStatus === 'OFFLINE' || (telem.lastSeen ? Date.now() - telem.lastSeen > 300000 : !telem.lastSeen);

      if (effectiveFilter !== 'ALL') {
        if (effectiveFilter === 'INSIDE' && !isInside) return;
        if (effectiveFilter === 'OUTSIDE' && isInside) return;
        if (effectiveFilter === 'VERIFYING' && !isVerifying) return;
        if (effectiveFilter === 'SOS' && !isSos) return;
        if (effectiveFilter === 'ONLINE' && isOffline) return;
        if (effectiveFilter === 'OFFLINE' && !isOffline) return;
      }

      matchingStudents.push(s);
      adapter.upsertStudentMarker(s, selectedStudent?.id === s.id);

      // Trails (only accumulate and draw when requested to prevent messy criss-crossing lines)
      if (showTrails || activeNavTab === 'routes') {
        setTrailsHistory((prev) => {
          const studentTrail = prev[s.id] || [];
          const lastPt = studentTrail[studentTrail.length - 1];
          if (!lastPt || lastPt[0] !== telem.latitude || lastPt[1] !== telem.longitude) {
            if (lastPt) {
              const dLat = (telem.latitude - lastPt[0]) * 111320;
              const dLng = (telem.longitude - lastPt[1]) * 111320 * Math.cos((lastPt[0] * Math.PI) / 180);
              const dist = Math.sqrt(dLat * dLat + dLng * dLng);
              // If jump is more than 300m (simulator hop or GPS recalibration), start fresh without a huge line across buildings
              if (dist > 300) {
                return { ...prev, [s.id]: [[telem.latitude, telem.longitude] as [number, number]] };
              }
            }
            const updated = [...studentTrail, [telem.latitude, telem.longitude] as [number, number]];
            if (updated.length > 50) updated.shift();
            return { ...prev, [s.id]: updated };
          }
          return prev;
        });
      }
    });

    // If exactly 1 student matches: focus safely
    if (effectiveFilter !== 'ALL' && matchingStudents.length === 1) {
      const single = matchingStudents[0];
      if (single.telemetry?.latitude && single.telemetry?.longitude) {
        adapter.flyTo(single.telemetry.latitude, single.telemetry.longitude, 16);
      }
    }
  }, [students, selectedStudent, effectiveFilter, showTrails, activeNavTab]);

  // Render Trails
  useEffect(() => {
    if (!adapterRef.current) return;
    const adapter = adapterRef.current;
    adapter.clearTrails();

    if (showTrails || activeNavTab === 'routes') {
      Object.entries(trailsHistory).forEach(([studentId, pts]) => {
        // If a student is selected, only draw their specific trail to keep map clean
        if (selectedStudent && selectedStudent.id !== studentId) return;

        const std = students.find((s) => s.id === studentId);
        const isInside = std?.telemetry?.geofenceStatus === 'INSIDE';
        const isSos = Boolean(std?.telemetry?.isSos);
        const color = isSos ? '#ff4d5e' : isInside ? '#2ee59d' : '#ff4d5e';
        adapter.renderTrail(studentId, pts, color);
      });
    }
  }, [trailsHistory, students, showTrails, activeNavTab, selectedStudent]);

  // Focus selected student if changed externally
  useEffect(() => {
    if (selectedStudent?.telemetry?.latitude && selectedStudent?.telemetry?.longitude) {
      adapterRef.current?.flyTo(
        selectedStudent.telemetry.latitude,
        selectedStudent.telemetry.longitude,
        17
      );
    }
  }, [selectedStudent]);

  // Map Layer toggle (Roadmap vs Satellite)
  const handleToggleLayer = () => {
    const nextLayer: MapLayerType = mapLayer === 'roadmap' ? 'satellite' : 'roadmap';
    setMapLayer(nextLayer);
    adapterRef.current?.setMapType(nextLayer);
  };

  // Recenter to School
  const handleRecenter = () => {
    const allPoints: [number, number][] = [];
    if (activeSchool.polygon && activeSchool.polygon.length > 2) {
      allPoints.push(...activeSchool.polygon);
    }
    students
      .filter((s) => s.schoolId === activeSchool.id && s.telemetry?.latitude && s.telemetry?.longitude)
      .forEach((s) => {
        allPoints.push([s.telemetry!.latitude, s.telemetry!.longitude]);
      });
    if (allPoints.length >= 2) {
      adapterRef.current?.fitBounds(allPoints);
    } else if (activeSchool.lat && activeSchool.lng) {
      adapterRef.current?.flyTo(activeSchool.lat, activeSchool.lng, 17);
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

  const handleFinishPolygonDraw = () => {
    if (!adapterRef.current) return;
    const points = adapterRef.current.finishDrawingPolygon();
    setDrawingMode('NONE');
    setPolygonPointCount(0);
    if (points && points.length >= 3) {
      setPendingPolygon(points);
      const sumLat = points.reduce((sum, p) => sum + p[0], 0);
      const sumLng = points.reduce((sum, p) => sum + p[1], 0);
      const centerLat = sumLat / points.length;
      const centerLng = sumLng / points.length;
      setGeofenceLatInput(centerLat.toFixed(6));
      setGeofenceLngInput(centerLng.toFixed(6));
      setSelectedCoords({ lat: centerLat, lng: centerLng, label: searchPin?.title || "Yangi Geozona" });
      const defaultName = searchPin?.title || (schools.length > 0 ? `${schools.length + 1}-maktab` : '30-maktab');
      setGeofenceNameInput(defaultName);
      setSaveAsNewSchool(Boolean(searchPin || !selectedSchoolId));
      setSaveModalOpen(true);
    } else {
      showToast("Poligon uchun kamida 3 ta burchak nuqtasi belgilanishi shart!", 'info');
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

  const handleFinishCircleDraw = () => {
    if (!adapterRef.current) return;
    const circle = adapterRef.current.finishDrawingCircle();
    setDrawingMode('NONE');
    if (circle) {
      const poly: [number, number][] = [];
      const numPoints = 16;
      const latRadius = circle.radius / 111320;
      const lngRadius = circle.radius / (111320 * Math.cos((circle.center[0] * Math.PI) / 180));
      for (let i = 0; i < numPoints; i++) {
        const theta = (i / numPoints) * (2 * Math.PI);
        poly.push([
          circle.center[0] + latRadius * Math.sin(theta),
          circle.center[1] + lngRadius * Math.cos(theta),
        ]);
      }
      setPendingPolygon(poly);
      setGeofenceLatInput(circle.center[0].toFixed(6));
      setGeofenceLngInput(circle.center[1].toFixed(6));
      setSelectedCoords({ lat: circle.center[0], lng: circle.center[1], label: searchPin?.title || "Yangi Geozona" });
      const defaultName = searchPin?.title || (schools.length > 0 ? `${schools.length + 1}-maktab` : '30-maktab');
      setGeofenceNameInput(defaultName);
      setSaveAsNewSchool(Boolean(searchPin || !selectedSchoolId));
      setSaveModalOpen(true);
    }
  };

  const handleConfirmSaveGeofence = async () => {
    if (!pendingPolygon || pendingPolygon.length < 3) return;
    const finalName = geofenceNameInput.trim() || searchPin?.title || '30-maktab';
    const finalLat = parseFloat(geofenceLatInput);
    const finalLng = parseFloat(geofenceLngInput);
    setIsSavingGeofence(true);
    try {
      if (saveAsNewSchool) {
        await onSaveGeofence(
          'NEW',
          pendingPolygon,
          finalName,
          true,
          isFinite(finalLat) ? finalLat : undefined,
          isFinite(finalLng) ? finalLng : undefined
        );
        showToast(`✅ "${finalName}" muvaffaqiyatli saqlandi!`, 'success');
      } else {
        await onSaveGeofence(
          activeSchool.id,
          pendingPolygon,
          finalName,
          false,
          isFinite(finalLat) ? finalLat : undefined,
          isFinite(finalLng) ? finalLng : undefined
        );
        activeSchool.name = finalName;
        activeSchool.polygon = pendingPolygon;
        if (isFinite(finalLat) && isFinite(finalLng)) {
          activeSchool.lat = finalLat;
          activeSchool.lng = finalLng;
        }
        showToast(`✅ "${finalName}" geozonasi muvaffaqiyatli yangilandi!`, 'success');
      }
      setSaveModalOpen(false);
      setPendingPolygon(null);
      setSearchPin(null);
      if (onRefreshData) {
        await onRefreshData();
      }
      adapterRef.current?.renderSchoolGeofences(schools, activeSchool.id);
      adapterRef.current?.fitBounds(pendingPolygon);
    } catch (e: any) {
      showToast("Xatolik: " + e.message, 'error');
    } finally {
      setIsSavingGeofence(false);
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

  // Search Pin action
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

  const handleStartPolygonFromPin = () => {
    if (searchPin) {
      activeSchool.lat = searchPin.lat;
      activeSchool.lng = searchPin.lng;
    }
    handleStartPolygonDraw();
  };

  const handleStartCircleFromPin = () => {
    if (searchPin) {
      activeSchool.lat = searchPin.lat;
      activeSchool.lng = searchPin.lng;
      handleStartCircleDraw([searchPin.lat, searchPin.lng]);
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col min-h-0 bg-[#0b1220] select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-0' : 'rounded-2xl border border-white/[0.07] overflow-hidden'
      }`}
    >
      {/* 1. MAP ENGINE CANVAS (Full Remaining Height) */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101a2e]/95 text-white border border-[#22d3ee]/40 shadow-2xl backdrop-blur-xl text-xs font-bold hover:bg-[#16233d] transition"
        >
          <Minimize2 className="w-4 h-4 text-[#22d3ee]" />
          <span>Oddiy ko'rinishga qaytish</span>
        </button>
      )}
      <div
        ref={containerRef}
        id="smart-child-map-container"
        className={`w-full h-full flex-1 min-h-0 relative z-0 ${
          isMapPickMode || drawingMode === 'POLYGON' || drawingMode === 'CIRCLE'
            ? 'cursor-crosshair'
            : ''
        }`}
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
      />

      {/* 1.1 In-app Toast Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-[#2ee59d]/20 border-[#2ee59d]/60 text-[#2ee59d]'
              : toast.type === 'error'
              ? 'bg-[#ff4d5e]/20 border-[#ff4d5e]/60 text-[#ff4d5e]'
              : 'bg-[#22d3ee]/20 border-[#22d3ee]/60 text-[#22d3ee]'
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] bg-[#101a2e]/95 border border-[#22d3ee]/70 backdrop-blur-xl p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-[#22d3ee] font-bold">
            <Crosshair className="w-4 h-4 animate-spin" />
            <span>📍 Xaritada istalgan joyni bosing — koordinata avtomatik olinadi</span>
          </div>
          <button
            onClick={() => setIsMapPickMode(false)}
            className="px-2.5 py-1 rounded-xl bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff] text-xs font-semibold border border-white/10"
          >
            Bekor qilish
          </button>
        </div>
      )}

      {/* 1.3 Search Pin Action Banner */}
      {searchPin && drawingMode === 'NONE' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[94%] bg-[#101a2e]/95 border border-[#2ee59d]/60 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-xl bg-[#2ee59d]/20 border border-[#2ee59d]/40 flex items-center justify-center shrink-0 text-[#2ee59d]">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[#eaf2ff] truncate">{searchPin.title}</div>
              <div className="text-xs text-[#2ee59d] font-mono font-bold truncate flex items-center gap-1.5">
                <span>📍 GPS: {searchPin.lat.toFixed(6)}, {searchPin.lng.toFixed(6)}</span>
                {searchPin.subtitle && (
                  <span className="text-[#8ea3c4] font-normal">• {searchPin.subtitle}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end w-full sm:w-auto">
            <button
              onClick={handleStartPolygonFromPin}
              className="px-3 py-1.5 rounded-xl bg-[#22d3ee] hover:bg-[#06b6d4] text-[#0b1220] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#22d3ee]/20 transition"
              title="Xarita ustida maktab hududi burchaklarini o'zingiz chizasiz"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>✏️ Poligon chizish</span>
            </button>
            <button
              onClick={handleStartCircleFromPin}
              className="px-3 py-1.5 rounded-xl bg-[#2ee59d] hover:bg-[#25c485] text-[#0b1220] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#2ee59d]/20 transition"
              title="Doiraviy radiusli geozona"
            >
              <CircleIcon className="w-3.5 h-3.5" />
              <span>⭕ Aylana</span>
            </button>
            <button
              onClick={() => setSearchPin(null)}
              className="p-1.5 rounded-xl text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.06]"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1.4 Active Polygon Drawing HUD Banner */}
      {drawingMode === 'POLYGON' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[94%] bg-[#101a2e]/95 border-2 border-[#22d3ee] backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-[#22d3ee]/20 border border-[#22d3ee]/40 flex items-center justify-center shrink-0 text-[#22d3ee] animate-pulse">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-[#eaf2ff] flex items-center gap-2">
                <span>✏️ Geozona chegarasini chizish</span>
                <span className="px-2 py-0.5 rounded-full bg-[#22d3ee] text-[#0b1220] text-xs font-extrabold">
                  {polygonPointCount} ta nuqta
                </span>
              </div>
              <div className="text-xs text-[#8ea3c4] mt-0.5">
                {polygonPointCount < 3
                  ? "Xaritada maktab hududi burchaklarini ketma-ket bosing (kamida 3 ta nuqta)"
                  : "Chegara tayyor! Nuqta qo'shishingiz yoki Saqlashni bosishingiz mumkin"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end w-full sm:w-auto">
            <button
              onClick={handleUndoPolygonPoint}
              disabled={polygonPointCount === 0}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-[#eaf2ff] font-semibold text-xs flex items-center gap-1 border border-white/10 transition"
              title="Oxirgi nuqtani bekor qilish"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#ffb020]" />
              <span>Orqaga</span>
            </button>
            <button
              onClick={handleFinishPolygonDraw}
              disabled={polygonPointCount < 3 || isSavingGeofence}
              className="px-3.5 py-1.5 rounded-xl bg-[#2ee59d] hover:bg-[#25c485] disabled:opacity-40 text-[#0b1220] font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#2ee59d]/25 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Saqlash</span>
            </button>
            <button
              onClick={() => {
                adapterRef.current?.cancelDrawing();
                setDrawingMode('NONE');
              }}
              className="p-1.5 rounded-xl text-[#8ea3c4] hover:text-[#ff4d5e] hover:bg-white/[0.06]"
              title="Bekor qilish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. TOP-CENTER: PLACE SEARCH COMBOBOX */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[92%] sm:w-auto max-w-sm pointer-events-auto">
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

      {/* 3. TOP-RIGHT: COMPACT TOOL GROUP (Buttons >= 40px) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#101a2e]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.08] shadow-2xl pointer-events-auto">
        {/* Polygon */}
        <button
          onClick={handleStartPolygonDraw}
          className={`h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            drawingMode === 'POLYGON'
              ? 'bg-[#22d3ee] text-[#0b1220] font-bold shadow-md shadow-[#22d3ee]/20'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04]'
          }`}
          aria-label="Poligon geozona chizish"
          title="Poligon Geozona Chizish"
        >
          <PenTool className="w-4 h-4" />
          <span className="hidden md:inline">Poligon</span>
          {drawingMode === 'POLYGON' && <span>({polygonPointCount})</span>}
        </button>

        {drawingMode === 'POLYGON' && (
          <button
            onClick={handleFinishPolygonDraw}
            className="h-10 px-3 rounded-xl bg-[#2ee59d] text-[#0b1220] text-xs font-bold hover:bg-[#25c485] flex items-center gap-1 shadow-md shadow-[#2ee59d]/20"
          >
            <Check className="w-4 h-4" />
            <span>Tugash</span>
          </button>
        )}

        {/* Circle */}
        <button
          onClick={() => handleStartCircleDraw()}
          className={`h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            drawingMode === 'CIRCLE'
              ? 'bg-[#2ee59d] text-[#0b1220] font-bold shadow-md shadow-[#2ee59d]/20'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04]'
          }`}
          aria-label="Doiraviy geozona"
          title="Aylana Geozona"
        >
          <CircleIcon className="w-4 h-4" />
          <span className="hidden md:inline">Aylana</span>
        </button>

        {drawingMode === 'CIRCLE' && (
          <button
            onClick={handleFinishCircleDraw}
            className="h-10 px-3 rounded-xl bg-[#2ee59d] text-[#0b1220] text-xs font-bold hover:bg-[#25c485] flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Saqlash</span>
          </button>
        )}

        {/* Measure (Ruler) */}
        <button
          onClick={handleStartMeasure}
          className={`h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            drawingMode === 'MEASURE'
              ? 'bg-[#22d3ee] text-[#0b1220] font-bold shadow-md shadow-[#22d3ee]/20'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04]'
          }`}
          aria-label="Masofa o'lchash"
          title="Masofa O'lchash (Ruler)"
        >
          <Ruler className="w-4 h-4" />
          <span className="hidden md:inline">
            {measuredDistance !== null ? `${measuredDistance} m` : "O'lchash"}
          </span>
        </button>

        {/* Layer Switcher */}
        <button
          onClick={handleToggleLayer}
          className="h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04] transition"
          aria-label="Xarita qatlamini almashtirish"
          title="Xarita / Sun'iy Yo'ldosh"
        >
          <Layers className="w-4 h-4 text-[#22d3ee]" />
          <span className="hidden lg:inline">
            {mapLayer === 'roadmap' ? 'Xarita' : "Sun'iy yo'ldosh"}
          </span>
        </button>

        {/* Trail Toggle & Clear */}
        <button
          onClick={() => {
            if (showTrails) {
              setShowTrails(false);
              setTrailsHistory({});
              adapterRef.current?.clearTrails();
              showToast("Marshrut chiziqlari tozalandi", "info");
            } else {
              setShowTrails(true);
              showToast("Marshrut chizig'i yoqildi", "info");
            }
          }}
          className={`h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            showTrails
              ? 'bg-[#2ee59d]/20 text-[#2ee59d] border border-[#2ee59d]/40'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04]'
          }`}
          aria-label="Marshrut chizig'ini yoqish yoki tozalash"
          title={showTrails ? "Marshrut chiziqlarini tozalash / yashirish" : "Marshrut chizig'ini ko'rsatish"}
        >
          <Footprints className="w-4 h-4 text-[#2ee59d]" />
          <span className="hidden md:inline">
            {showTrails ? "Chiziqlarni tozalash" : "Marshrut"}
          </span>
        </button>

        {/* Recenter */}
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8ea3c4] hover:text-[#2ee59d] hover:bg-white/[0.04] transition"
          aria-label="Maktabga qaytish"
          title="Maktabga fokuslash"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04] transition"
          aria-label={isFullscreen ? "Kichraytirish" : "To'liq ekran"}
          title="To'liq ekran"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 4. TOP-LEFT GLASS PANEL: "JONLI KUZATUV" (Hidden on mobile <768px in favor of bottom sheet, sized to content, no empty blurred area) */}
      <div
        className={`hidden md:flex absolute top-3 left-3 z-20 w-80 sm:w-[340px] h-fit max-h-[calc(100%-2rem)] flex-col bg-[#101a2e]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 pointer-events-auto`}
      >
        {/* Panel Header */}
        <div className="p-3.5 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ee59d] animate-pulse shrink-0" />
            <h3 className="font-bold text-xs text-[#eaf2ff] uppercase tracking-wider truncate">
              Jonli kuzatuv
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[#22d3ee] font-mono text-xs font-bold">
              {filteredStudents.length} ta
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Collapse button: "–" like in mockup */}
            <button
              onClick={() => setIsStudentPanelCollapsed(!isStudentPanelCollapsed)}
              aria-label={isStudentPanelCollapsed ? "Panelni ochish" : "Panelni yig'ish"}
              title={isStudentPanelCollapsed ? "Ochish" : "Yig'ish"}
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8ea3c4] hover:text-[#eaf2ff] flex items-center justify-center text-sm font-bold transition"
            >
              {isStudentPanelCollapsed ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Panel Content (When Expanded) */}
        {!isStudentPanelCollapsed && (
          <div className="flex flex-col min-h-0 h-fit">
            {/* Search Input: "Ism, ID yoki sinf..." */}
            <div className="p-2.5 border-b border-white/[0.07] bg-black/10 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-[#8ea3c4] pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Ism, ID yoki sinf..."
                  className="w-full h-8 pl-8 pr-7 bg-[#16233d]/90 border border-white/[0.08] rounded-xl text-xs text-[#eaf2ff] placeholder:text-[#8ea3c4] focus:outline-none focus:border-[#22d3ee] transition"
                />
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch('')}
                    className="absolute right-2.5 p-0.5 text-[#8ea3c4] hover:text-[#eaf2ff]"
                    title="Tozalash"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Chips with Live Counts */}
            <div className="p-2 border-b border-white/[0.07] flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  onSelectFilter?.('ALL');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  effectiveFilter === 'ALL'
                    ? 'bg-[#22d3ee] text-[#0b1220] font-bold shadow-sm'
                    : 'bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff]'
                }`}
              >
                Hammasi ({counts.total})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('INSIDE');
                  onSelectFilter?.('INSIDE');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  effectiveFilter === 'INSIDE'
                    ? 'bg-[#2ee59d] text-[#0b1220] font-bold shadow-sm'
                    : 'bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff]'
                }`}
              >
                Maktabda ({counts.inside})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('OUTSIDE');
                  onSelectFilter?.('OUTSIDE');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  effectiveFilter === 'OUTSIDE'
                    ? 'bg-[#ff4d5e] text-white font-bold shadow-sm'
                    : 'bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff]'
                }`}
              >
                Tashqarida ({counts.outside})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('VERIFYING');
                  onSelectFilter?.('VERIFYING');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  effectiveFilter === 'VERIFYING'
                    ? 'bg-[#ffb020] text-[#0b1220] font-bold shadow-sm'
                    : 'bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff]'
                }`}
              >
                Chegarada ({counts.verifying})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('SOS');
                  onSelectFilter?.('SOS');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  effectiveFilter === 'SOS'
                    ? 'bg-[#ff4d5e] text-white font-bold shadow-sm'
                    : 'bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff]'
                }`}
              >
                SOS ({counts.sos})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('OFFLINE');
                  onSelectFilter?.('OFFLINE');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  effectiveFilter === 'OFFLINE'
                    ? 'bg-white/20 text-[#eaf2ff] font-bold shadow-sm'
                    : 'bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff]'
                }`}
              >
                Oflayn ({counts.offline})
              </button>
            </div>

            {/* Student List (Scrolls internally only when long, no empty blurred area) */}
            <div className="overflow-y-auto max-h-[360px] p-2 space-y-1.5 scrollbar-thin">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 px-4 text-xs text-[#8ea3c4]">
                  Bu holatda o'quvchi yo'q
                </div>
              ) : (
                filteredStudents.map((std) => {
                  const telem = std.telemetry;
                  const isSelected = selectedStudent?.id === std.id;
                  const isInside = telem?.geofenceStatus === 'INSIDE';
                  const isSos = Boolean(telem?.isSos);
                  const isOffline = telem?.deviceStatus === 'OFFLINE' || (telem?.lastSeen ? Date.now() - telem.lastSeen > 300000 : !telem?.lastSeen);

                  return (
                    <div
                      key={std.id}
                      onClick={() => {
                        setSelectedStudent(std);
                        if (telem?.latitude && telem?.longitude) {
                          adapterRef.current?.flyTo(telem.latitude, telem.longitude, 17);
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#22d3ee] bg-[#22d3ee]/15 shadow-sm shadow-[#22d3ee]/20'
                          : 'border-white/[0.05] bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Avatar with Status Ring */}
                        <div className="relative shrink-0">
                          <img
                            src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}
                            alt={std.name}
                            className={`w-9 h-9 rounded-xl object-cover border ${
                              isSos
                                ? 'border-[#ff4d5e]'
                                : isOffline
                                ? 'border-dashed border-[#8ea3c4]'
                                : isInside
                                ? 'border-[#2ee59d]'
                                : 'border-[#ff4d5e]'
                            }`}
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#101a2e] flex items-center justify-center text-xs font-bold text-white ${
                              isSos
                                ? 'bg-[#ff4d5e] animate-ping'
                                : isOffline
                                ? 'bg-[#8ea3c4]'
                                : isInside
                                ? 'bg-[#2ee59d]'
                                : 'bg-[#ff4d5e]'
                            }`}
                          >
                            {isOffline ? '•' : isInside ? '✓' : '!'}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#eaf2ff] truncate">{std.name}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                isSos
                                  ? 'bg-[#ff4d5e] text-white animate-pulse'
                                  : isOffline
                                  ? 'bg-white/10 text-[#8ea3c4]'
                                  : isInside
                                  ? 'bg-[#2ee59d]/20 text-[#2ee59d]'
                                  : 'bg-[#ff4d5e]/20 text-[#ff4d5e]'
                              }`}
                            >
                              {isSos ? 'SOS' : isOffline ? 'Oflayn' : isInside ? 'Maktabda' : 'Tashqarida'}
                            </span>
                          </div>

                          <div className="text-xs text-[#8ea3c4] flex items-center justify-between mt-0.5">
                            <span className="truncate">
                              {std.className} • <span className="font-mono text-[#22d3ee]">{std.uniqueId}</span>
                            </span>
                            <span className="flex items-center gap-1 font-mono text-xs text-[#ff4d5e] shrink-0 ml-1">
                              <Heart className="w-2.5 h-2.5 fill-[#ff4d5e]" />
                              {telem?.heartRate || 75}
                            </span>
                          </div>

                          {/* Real address without fallback */}
                          <div className="flex items-center justify-between text-xs text-[#8ea3c4] mt-1 pt-1 border-t border-white/[0.04]">
                            <span className="truncate max-w-[170px]">
                              📍 {telem?.address || 'Manzil aniqlanmoqda...'}
                            </span>
                            <span className="font-mono text-[#2ee59d] shrink-0 ml-1">
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
      </div>

      {/* 5. BOTTOM-RIGHT: ROUND ZOOM +/- BUTTONS (Replaces default map zoom control) */}
      <div className="absolute bottom-12 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => adapterRef.current?.zoomIn?.()}
          aria-label="Xaritani kattalashtirish"
          title="Kattalashtirish (+)"
          className="w-10 h-10 rounded-full bg-[#101a2e]/90 hover:bg-[#16233d] border border-white/10 text-[#eaf2ff] shadow-xl flex items-center justify-center font-bold text-lg backdrop-blur-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => adapterRef.current?.zoomOut?.()}
          aria-label="Xaritani kichiklashtirish"
          title="Kichiklashtirish (−)"
          className="w-10 h-10 rounded-full bg-[#101a2e]/90 hover:bg-[#16233d] border border-white/10 text-[#eaf2ff] shadow-xl flex items-center justify-center font-bold text-lg backdrop-blur-md transition active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 6. BOTTOM-LEFT: SLIM STATUS LEGEND & REAL-TIME GPS READOUT */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none text-xs flex-wrap">
        {/* Status Legend */}
        <div className="pointer-events-auto bg-[#101a2e]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-3 text-[#8ea3c4] shadow-xl">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2ee59d]" /> Maktabda
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff4d5e]" /> Tashqarida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffb020]" /> Chegarada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8ea3c4]" /> Oflayn
          </span>
        </div>

        {/* Live GPS Coordinates Readout Box */}
        <div className="pointer-events-auto bg-[#101a2e]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#22d3ee]/40 flex items-center gap-2 shadow-xl text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#22d3ee] font-bold">📍 GPS:</span>
            <span className="text-[#eaf2ff] font-bold">
              {currentCursorCoords
                ? `${currentCursorCoords.lat.toFixed(6)}, ${currentCursorCoords.lng.toFixed(6)}`
                : selectedCoords
                ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`
                : `${(activeSchool.lat || 41.311081).toFixed(6)}, ${(activeSchool.lng || 69.240562).toFixed(6)}`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const lat = currentCursorCoords?.lat || selectedCoords?.lat || activeSchool.lat || 41.550500;
              const lng = currentCursorCoords?.lng || selectedCoords?.lng || activeSchool.lng || 60.631500;
              navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
              setCopiedCoords(true);
              setTimeout(() => setCopiedCoords(false), 2000);
            }}
            className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-xs text-[#22d3ee] font-semibold transition flex items-center gap-1"
            title="GPS koordinatasini nusxalash"
          >
            {copiedCoords ? <Check className="w-3 h-3 text-[#2ee59d]" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copiedCoords ? 'Nusxalandi' : 'Nusxa'}</span>
          </button>
        </div>
      </div>

      {/* 7. DEMO MODE ONLY: COLLAPSIBLE SIMULATION BAR */}
      {isDemoMode && onSimulateWalk && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-[#101a2e]/95 backdrop-blur-xl border border-[#ffb020]/40 rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#ffb020]/15 text-[#ffb020] text-xs font-mono font-bold tracking-wider">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>DEMO SIMULYATOR</span>
          </div>

          {!isSimBarCollapsed && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSimulateWalk('ENTER_SCHOOL')}
                className="px-2.5 py-1 rounded-xl bg-[#2ee59d]/20 hover:bg-[#2ee59d]/30 text-[#2ee59d] text-xs font-semibold border border-[#2ee59d]/40 transition flex items-center gap-1"
                title="Maktab hududiga kirish"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>
              <button
                onClick={() => onSimulateWalk('APPROACHING_GATE')}
                className="px-2.5 py-1 rounded-xl bg-[#ffb020]/20 hover:bg-[#ffb020]/30 text-[#ffb020] text-xs font-semibold border border-[#ffb020]/40 transition"
                title="Maktab darvozasiga yaqinlashish"
              >
                Darvozada
              </button>
              <button
                onClick={() => onSimulateWalk('LEAVE_SCHOOL')}
                className="px-2.5 py-1 rounded-xl bg-[#ff4d5e]/20 hover:bg-[#ff4d5e]/30 text-[#ff4d5e] text-xs font-semibold border border-[#ff4d5e]/40 transition"
                title="Maktabdan chiqish"
              >
                Chiqish
              </button>
              <button
                onClick={() => onSimulateWalk('OUTSIDE_STREET')}
                className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8ea3c4] text-xs font-semibold border border-white/10 transition"
                title="Ko'chada yurish"
              >
                Ko'chada
              </button>
            </div>
          )}

          <button
            onClick={() => setIsSimBarCollapsed(!isSimBarCollapsed)}
            className="p-1 rounded-lg text-[#8ea3c4] hover:text-[#eaf2ff] transition"
            title={isSimBarCollapsed ? "Simulyatorni ochish" : "Simulyatorni yig'ish"}
          >
            {isSimBarCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* 8. SAVE GEOFENCE / SCHOOL NAME CONFIRMATION DIALOG */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#101a2e] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-[#eaf2ff]">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30 flex items-center justify-center font-bold text-base">
                  🏫
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#eaf2ff]">Geozonani Saqlash</h3>
                  <p className="text-xs text-[#8ea3c4]">Belgilangan joy uchun nom va koordinatalar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="p-1.5 rounded-xl text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8ea3c4] mb-1.5">
                  Maktab / Joy Nomi:
                </label>
                <input
                  type="text"
                  value={geofenceNameInput}
                  onChange={(e) => setGeofenceNameInput(e.target.value)}
                  placeholder="Masalan: 30-maktab"
                  className="w-full h-11 px-3.5 bg-[#16233d] border border-white/10 rounded-xl text-sm text-[#eaf2ff] focus:outline-none focus:border-[#22d3ee] transition font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmSaveGeofence();
                    }
                  }}
                />
              </div>

              {/* Exact GPS Coordinates Section */}
              <div className="p-3 bg-white/[0.02] border border-white/[0.07] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#eaf2ff] flex items-center gap-1.5">
                    <span>📍</span> Aniq GPS Koordinatalari (Markaz)
                  </span>
                  <span className="text-xs text-[#22d3ee] font-mono font-semibold bg-[#22d3ee]/15 px-2 py-0.5 rounded-full border border-[#22d3ee]/30">
                    ±10 sm Aniqlik
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#8ea3c4] mb-0.5 font-medium">
                      Kenglik (Latitude):
                    </label>
                    <input
                      type="text"
                      value={geofenceLatInput}
                      onChange={(e) => setGeofenceLatInput(e.target.value)}
                      className="w-full h-8 px-2.5 bg-[#0b1220] border border-white/10 rounded-lg text-xs font-mono text-[#22d3ee] font-bold focus:outline-none focus:border-[#22d3ee]"
                      placeholder="41.550500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8ea3c4] mb-0.5 font-medium">
                      Uzunlik (Longitude):
                    </label>
                    <input
                      type="text"
                      value={geofenceLngInput}
                      onChange={(e) => setGeofenceLngInput(e.target.value)}
                      className="w-full h-8 px-2.5 bg-[#0b1220] border border-white/10 rounded-lg text-xs font-mono text-[#22d3ee] font-bold focus:outline-none focus:border-[#22d3ee]"
                      placeholder="60.631500"
                    />
                  </div>
                </div>

                <div className="text-xs text-[#8ea3c4] flex items-center justify-between pt-1 border-t border-white/[0.06]">
                  <span>Perimetr: <b>{pendingPolygon?.length || 0} ta GPS nuqta</b></span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${geofenceLatInput}, ${geofenceLngInput}`);
                      setCopiedCoords(true);
                      setTimeout(() => setCopiedCoords(false), 2000);
                    }}
                    className="text-[#22d3ee] hover:underline flex items-center gap-1 font-mono text-xs"
                  >
                    {copiedCoords ? '✅ Nusxalandi' : '📋 Nusxa olish'}
                  </button>
                </div>
              </div>

              {/* Save mode selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8ea3c4]">
                  Saqlash varianti:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveAsNewSchool(true)}
                    className={`p-3 rounded-2xl border text-xs font-semibold text-left transition flex flex-col gap-0.5 ${
                      saveAsNewSchool
                        ? 'bg-[#22d3ee]/15 border-[#22d3ee] text-[#22d3ee] ring-1 ring-[#22d3ee]/40'
                        : 'bg-white/[0.03] border-white/10 text-[#8ea3c4] hover:text-[#eaf2ff]'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span>➕</span> Yangi maktab
                    </span>
                    <span className="text-xs opacity-75">Mustaqil maktab sifatida</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaveAsNewSchool(false)}
                    className={`p-3 rounded-2xl border text-xs font-semibold text-left transition flex flex-col gap-0.5 ${
                      !saveAsNewSchool
                        ? 'bg-[#22d3ee]/15 border-[#22d3ee] text-[#22d3ee] ring-1 ring-[#22d3ee]/40'
                        : 'bg-white/[0.03] border-white/10 text-[#8ea3c4] hover:text-[#eaf2ff]'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span>✏️</span> Mavjud maktab
                    </span>
                    <span className="text-xs opacity-75 truncate">{activeSchool.name}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.06] transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isSavingGeofence || !geofenceNameInput.trim()}
                onClick={handleConfirmSaveGeofence}
                className="px-5 py-2.5 rounded-xl bg-[#2ee59d] text-[#0b1220] font-bold text-xs hover:bg-[#25c485] transition shadow-lg shadow-[#2ee59d]/25 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingGeofence ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
