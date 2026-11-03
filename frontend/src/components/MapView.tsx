/// <reference path="../declarations.d.ts" />
// SMART CHILD — Leaflet Interactive Geofence Map View Component
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { School, Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, PenTool, Check, X, MapPin, Heart, Battery, Radio } from 'lucide-react';

interface MapViewProps {
  schools: School[];
  students: Student[];
  onSaveGeofence: (schoolId: string, polygon: [number, number][]) => Promise<void>;
  selectedSchoolId: string;
}

export const MapView: React.FC<MapViewProps> = ({
  schools,
  students,
  onSaveGeofence,
  selectedSchoolId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<{ [key: string]: L.Polygon }>({});
  const studentMarkersRef = useRef<{ [key: string]: L.Marker }>({});

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const tempDrawLayerRef = useRef<L.Polyline | L.Polygon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [41.311081, 69.240562],
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap tile layer (Reliable Carto Dark / OSM standard fallback)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap, © CARTO',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render School Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old layers
    Object.values(polygonLayersRef.current).forEach((layer) => map.removeLayer(layer));
    polygonLayersRef.current = {};

    schools.forEach((sch) => {
      if (sch.polygon && sch.polygon.length >= 3) {
        const poly = L.polygon(sch.polygon, {
          color: sch.color || '#10b981',
          weight: 2.5,
          fillColor: sch.color || '#10b981',
          fillOpacity: 0.16,
          dashArray: '5, 5',
        }).addTo(map);

        poly.bindPopup(`
          <div style="padding: 4px;">
            <b style="font-size: 14px;">🏫 ${sch.name}</b><br/>
            <span style="font-size: 11px; opacity: 0.8;"><b>School ID:</b> <code>${sch.id}</code></span><br/>
            <span style="font-size: 11px; opacity: 0.8;"><b>Geofence ID:</b> <code>${sch.geofenceId || 'GEO001'}</code></span><br/>
            <span style="font-size: 11px; color: #10b981; font-weight: bold;">✓ ${sch.polygon.length} ta GPS nuqtali chegara faol</span>
          </div>
        `);

        polygonLayersRef.current[sch.id] = poly;
      }
    });

    // If a specific school is selected, pan to it
    if (selectedSchoolId !== 'ALL') {
      const activeSch = schools.find((s) => s.id === selectedSchoolId);
      if (activeSch && activeSch.lat && activeSch.lng) {
        map.flyTo([activeSch.lat, activeSch.lng], 16);
      }
    }
  }, [schools, selectedSchoolId]);

  // 3. Render Student Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old student markers
    Object.values(studentMarkersRef.current).forEach((m) => map.removeLayer(m));
    studentMarkersRef.current = {};

    students.forEach((std) => {
      const telem = std.telemetry;
      if (!telem || telem.latitude == null || telem.longitude == null) return;

      const isInside = telem.geofenceStatus === 'INSIDE';
      const color = isInside ? '#10b981' : (telem.geofenceStatus === 'VERIFYING' ? '#f59e0b' : '#ef4444');
      const pulseClass = isInside ? 'animate-pulse' : '';

      const icon = L.divIcon({
        className: 'student-marker-wrapper',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${color}; opacity: 0.25;" class="${pulseClass}"></div>
            <div style="width: 36px; height: 36px; border-radius: 9999px; border: 2.5px solid ${color}; overflow: hidden; background: #000; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
              <img src="${std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${std.name}" />
            </div>
            <div style="position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 9999px; background: ${color}; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #fff; font-weight: bold;">
              ${isInside ? '✓' : '!'}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([telem.latitude, telem.longitude], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="min-width: 200px; padding: 4px;">
          <b style="font-size: 14px;">${std.name}</b> (${std.className})<br/>
          <span style="font-size: 11px;"><b>ID:</b> <code>${std.uniqueId}</code></span><br/>
          <span style="font-size: 11px;"><b>Maktab:</b> ${std.schoolName} (<code>${std.schoolId}</code>)</span>
          <hr style="margin: 6px 0; border: none; border-top: 1px solid rgba(255,255,255,0.1);"/>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Holati:</span>
            <b style="color: ${color};">${telem.statusDisplay || 'OUTSIDE'}</b>
          </div>
          <div style="font-size: 11px; opacity: 0.8;">❤️ Yurak urishi: ${telem.heartRate || 76} BPM</div>
          <div style="font-size: 11px; opacity: 0.8;">🌡️ Tana harorati: ${(telem.bodyTemperature || 36.6).toFixed(1)}°C</div>
          <div style="font-size: 11px; opacity: 0.8;">⌚ Samsung Galaxy Watch5 Pro (${telem.batteryLevel || 88}%)</div>
        </div>
      `);

      studentMarkersRef.current[std.id] = marker;
    });
  }, [students]);

  // 4. Drawing Polygon Handlers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;
      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      setDrawnPoints((prev) => {
        const next = [...prev, newPoint];
        if (tempDrawLayerRef.current) {
          map.removeLayer(tempDrawLayerRef.current);
        }
        tempDrawLayerRef.current = L.polygon(next, {
          color: '#10b981',
          weight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.2,
          dashArray: '4, 4',
        }).addTo(map);
        return next;
      });
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawing]);

  const handleStartDraw = () => {
    setIsDrawing(true);
    setDrawnPoints([]);
    if (tempDrawLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(tempDrawLayerRef.current);
      tempDrawLayerRef.current = null;
    }
  };

  const handleFinishDraw = async () => {
    if (drawnPoints.length < 3) {
      alert("Kamida 3 ta GPS nuqta belgilang!");
      return;
    }
    const targetSchool = selectedSchoolId !== 'ALL' ? selectedSchoolId : (schools[0]?.id || 'SCH001');
    await onSaveGeofence(targetSchool, drawnPoints);
    setIsDrawing(false);
    setDrawnPoints([]);
    if (tempDrawLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(tempDrawLayerRef.current);
      tempDrawLayerRef.current = null;
    }
  };

  const handleCancelDraw = () => {
    setIsDrawing(false);
    setDrawnPoints([]);
    if (tempDrawLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(tempDrawLayerRef.current);
      tempDrawLayerRef.current = null;
    }
  };

  // 5. Geocoding search (Nominatim)
  const handlePlaceSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.length > 0 && mapInstanceRef.current) {
          const first = data[0];
          mapInstanceRef.current.flyTo([parseFloat(first.lat), parseFloat(first.lon)], 16);
        } else {
          alert("Manzil topilmadi");
        }
      } catch {
        alert("Qidiruvda xatolik yuz berdi");
      }
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.uniqueId.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const insideCount = students.filter((s) => s.telemetry?.geofenceStatus === 'INSIDE').length;
  const outsideCount = students.length - insideCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)] min-h-[620px]">
      {/* Left: Students Telemetry Sidebar */}
      <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden border-border/80">
        <CardHeader className="p-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              O'quvchilar Nazorati
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {students.length} faol
            </Badge>
          </div>
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Ism yoki ID bo'yicha..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
          {filteredStudents.map((std) => {
            const telem = std.telemetry;
            const isInside = telem?.geofenceStatus === 'INSIDE';
            return (
              <div
                key={std.id}
                onClick={() => {
                  if (telem && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([telem.latitude, telem.longitude], 17);
                    studentMarkersRef.current[std.id]?.openPopup();
                  }
                }}
                className="p-2.5 rounded-lg border border-border/60 bg-card/40 hover:bg-muted/50 transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="relative">
                  <img
                    src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}
                    className="w-10 h-10 rounded-lg object-cover border border-border"
                    alt={std.name}
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                      isInside ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{std.name}</span>
                    <Badge variant={isInside ? 'success' : 'danger'} className="text-[9px] px-1.5 py-0">
                      {isInside ? 'PRESENT' : 'OUTSIDE'}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between mt-0.5">
                    <span>{std.className} • ID: {std.uniqueId}</span>
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                      {telem?.heartRate || 76}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Right: Leaflet Map Container */}
      <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />

        {/* Top-Left Drawing Toolbar HUD */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 flex-wrap">
          <div className="relative w-56">
            <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handlePlaceSearch}
              placeholder="Maktab manzilini qidirish..."
              className="h-8 pl-8 text-xs bg-background/90 backdrop-blur-md border-border shadow-lg"
            />
          </div>

          {!isDrawing ? (
            <Button
              size="sm"
              variant="success"
              onClick={handleStartDraw}
              className="h-8 text-xs gap-1.5 shadow-lg backdrop-blur-md"
            >
              <PenTool className="w-3.5 h-3.5" />
              Chegara Chizish
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 bg-background/90 p-1 rounded-lg border border-border shadow-lg backdrop-blur-md">
              <span className="text-[11px] font-bold px-2 text-emerald-400">
                {drawnPoints.length} nuqta
              </span>
              <Button size="sm" variant="default" onClick={handleFinishDraw} className="h-7 text-xs px-2 gap-1">
                <Check className="w-3 h-3" /> Saqlash
              </Button>
              <Button size="sm" variant="destructive" onClick={handleCancelDraw} className="h-7 text-xs px-2 gap-1">
                <X className="w-3 h-3" /> Bekor
              </Button>
            </div>
          )}
        </div>

        {/* Top-Right HUD Metrics Panel */}
        <div className="absolute top-3 right-3 z-[1000] bg-background/85 backdrop-blur-md border border-border rounded-xl p-2 px-3 shadow-xl flex items-center gap-4 text-xs font-semibold">
          <div>
            <span className="text-[10px] text-muted-foreground block">Jami</span>
            <b className="text-sm font-bold">{students.length}</b>
          </div>
          <div className="w-[1px] h-6 bg-border" />
          <div>
            <span className="text-[10px] text-emerald-400 block">Maktabda</span>
            <b className="text-sm font-bold text-emerald-400">{insideCount}</b>
          </div>
          <div className="w-[1px] h-6 bg-border" />
          <div>
            <span className="text-[10px] text-rose-400 block">Tashqarida</span>
            <b className="text-sm font-bold text-rose-400">{outsideCount}</b>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-background/85 backdrop-blur-md border border-border rounded-lg p-2 text-[10px] font-bold flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            PRESENT (Maktab ichida)
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            OUTSIDE (Maktabdan tashqarida)
          </span>
        </div>
      </div>
    </div>
  );
};
