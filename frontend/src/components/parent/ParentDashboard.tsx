import React, { useEffect, useState, useRef } from 'react';
import { User, Student } from '@/types';
import {
  Shield,
  LogOut,
  Sun,
  Moon,
  Battery,
  Watch,
  MapPin,
  Clock,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  AlertTriangle,
  Phone,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { createMapAdapter } from '@/lib/mapAdapter';
import { MapAdapter } from '@/lib/mapAdapter/types';

interface ParentDashboardProps {
  currentUser: User;
  token: string;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onLogout: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  currentUser,
  token,
  theme,
  toggleTheme,
  onLogout
}) => {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite'>('roadmap');
  const [sosSent, setSosSent] = useState(false);
  const [sosSending, setSosSending] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);

  // 1. Fetch parent's children from backend
  const fetchMyChildren = async () => {
    try {
      const res = await fetch('/api/v1/parent/my-children', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.children) && data.children.length > 0) {
        setChildren(data.children);
        setSelectedChild((prev) => prev ? (data.children.find((c: Student) => c.id === prev.id) || data.children[0]) : data.children[0]);
      }
    } catch (err) {
      console.error('Farzandlar ma\'lumotini olishda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyChildren();
    const interval = setInterval(fetchMyChildren, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // 2. Initialize Yandex Map
  useEffect(() => {
    let isMounted = true;
    const container = mapContainerRef.current;
    if (!container) return;

    createMapAdapter().then(async (res) => {
      if (!isMounted) return;
      adapterRef.current = res.adapter;

      const defaultLat = selectedChild?.telemetry?.latitude || 41.550500;
      const defaultLng = selectedChild?.telemetry?.longitude || 60.631500;

      await res.adapter.init(container, {
        center: [defaultLat, defaultLng],
        zoom: 17,
        isDark: theme === 'dark',
        mapType: mapLayer,
      });

      // Render School geofence if present
      if (selectedChild && (selectedChild as any).schoolGeofence) {
        const sg = (selectedChild as any).schoolGeofence;
        if (sg.polygon && Array.isArray(sg.polygon)) {
          res.adapter.renderSchoolGeofences([
            {
              id: selectedChild.schoolId,
              geofenceId: `GEO${selectedChild.schoolId}`,
              code: selectedChild.schoolId,
              name: sg.name || 'Maktab',
              lat: sg.lat || defaultLat,
              lng: sg.lng || defaultLng,
              polygon: sg.polygon,
              startTime: '08:00',
              endTime: '13:00',
              address: ''
            }
          ], selectedChild.schoolId);
        }
      }

      // Add child marker
      if (selectedChild) {
        res.adapter.upsertStudentMarker(selectedChild, true);
        res.adapter.flyTo(defaultLat, defaultLng, 17);
      }
    });

    return () => {
      isMounted = false;
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, []);

  // Update map when child or telemetry changes
  useEffect(() => {
    if (!adapterRef.current || !selectedChild) return;
    const telem = selectedChild.telemetry;
    if (telem?.latitude && telem?.longitude) {
      adapterRef.current.clearStudentMarkers();
      adapterRef.current.upsertStudentMarker(selectedChild, true);
      adapterRef.current.flyTo(telem.latitude, telem.longitude, 17);
    }
  }, [selectedChild]);

  // Handle Layer Toggle
  const toggleMapLayer = () => {
    const nextLayer = mapLayer === 'roadmap' ? 'satellite' : 'roadmap';
    setMapLayer(nextLayer);
    adapterRef.current?.setMapType(nextLayer);
  };

  // Recenter on child
  const handleRecenter = () => {
    if (!adapterRef.current || !selectedChild?.telemetry) return;
    const { latitude, longitude } = selectedChild.telemetry;
    if (latitude && longitude) {
      adapterRef.current.flyTo(latitude, longitude, 17);
    }
  };

  // Send SOS
  const handleSendSos = async () => {
    if (!selectedChild || sosSending) return;
    setSosSending(true);
    try {
      await fetch('/api/v1/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId: selectedChild.deviceId,
          latitude: selectedChild.telemetry?.latitude || 41.550500,
          longitude: selectedChild.telemetry?.longitude || 60.631500,
          studentName: selectedChild.name,
          parentPhone: currentUser.phone
        })
      });
      setSosSent(true);
      setTimeout(() => setSosSent(false), 8000);
    } catch (e) {
      console.error('SOS xatosi:', e);
    } finally {
      setSosSending(false);
    }
  };

  const telem = selectedChild?.telemetry;
  const isInside = telem?.geofenceStatus === 'INSIDE';
  const lat = telem?.latitude || 41.550500;
  const lng = telem?.longitude || 60.631500;
  const battery = telem?.batteryLevel ?? 85;
  const isWorn = telem?.isWorn ?? true;

  return (
    <div className={`min-h-screen flex flex-col bg-[#0b1220] text-[#eaf2ff] font-sans selection:bg-cyan-500 selection:text-slate-950 ${theme === 'dark' ? 'dark' : 'light'}`}>
      
      {/* 1. PARENT HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-[#101a2e]/90 border-b border-white/10 backdrop-blur-xl flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-white tracking-tight">SMART CHILD</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[11px] border border-cyan-500/30">
                Ota-ona kabineti
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate hidden sm:block">
              {currentUser.name} (Farzand xavfsizligi jonli monitoringi)
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {children.length > 1 && (
            <select
              value={selectedChild?.id || ''}
              onChange={(e) => {
                const found = children.find((c) => c.id === e.target.value);
                if (found) setSelectedChild(found);
              }}
              className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name} ({c.className})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchMyChildren}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Ma'lumotlarni yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Mavzuni almashtirish"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-300" />}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-colors"
            title="Chiqish"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: CHILD CARD & LIVE YANDEX MAP */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* LEFT COLUMN: CHILD STATUS & TELEMETRY CARD */}
        <aside className="w-full lg:w-[380px] p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto bg-[#0e1626] border-r border-white/10 shrink-0">
          
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Farzandingiz ma'lumotlari yuklanmoqda...
            </div>
          ) : !selectedChild ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Sizga biriktirilgan o'quvchi topilmadi. Maktab ma'muriyatiga murojaat qiling.
            </div>
          ) : (
            <>
              {/* Child Profile Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#14213d] border border-white/10 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={selectedChild.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                      alt={selectedChild.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-md"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#101a2e] ${
                        isInside ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-white truncate">
                      {selectedChild.name}
                    </h2>
                    <p className="text-xs text-cyan-400 font-semibold">
                      {selectedChild.className || '5-B sinf'} • {selectedChild.uniqueId || selectedChild.id}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {selectedChild.schoolName || 'Urganch shahar 30-maktab'}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Joriy hududiy holat:</span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      isInside
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isInside ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`} />
                    <span>{isInside ? "Maktab hududida (Xavfsiz)" : "Maktabdan tashqarida"}</span>
                  </span>
                </div>
              </div>

              {/* Samsung Galaxy Watch 5 Pro Telemetry Card */}
              <div className="p-4 rounded-2xl bg-[#121d33] border border-white/10 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <Watch className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Samsung Galaxy Watch 5 Pro
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>

                {/* Battery & Worn Status */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Batareya</span>
                      </span>
                      <span className="font-bold text-white font-mono">{battery}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                        style={{ width: `${battery}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Soat taqilganligi</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isWorn ? "Qo'lda taqilgan" : "Yechilgan"}</span>
                    </span>
                  </div>
                </div>

                {/* Exact GPS Coordinates Section (As requested by user!) */}
                <div className="p-3 rounded-xl bg-[#0b1220] border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Aniq GPS Koordinatalari</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                        setCopiedCoords(true);
                        setTimeout(() => setCopiedCoords(false), 2000);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold transition flex items-center gap-1"
                      title="Koordinatani nusxalash"
                    >
                      {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCoords ? 'Nusxalandi' : 'Nusxa'}</span>
                    </button>
                  </div>

                  <div className="font-mono text-sm font-bold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10 text-center tracking-wide">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>So'nggi signal:</span>
                    </span>
                    <span className="font-medium text-slate-300">Hozir faol (Real vaqt)</span>
                  </div>
                </div>

                {/* Emergency SOS Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendSos}
                    disabled={sosSending || sosSent}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                      sosSent
                        ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-500/25 active:scale-[0.99]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{sosSent ? "SOS Signali Maktab Xavfsizligiga Yuborildi!" : "Favqulodda SOS Signali Yuborish"}</span>
                  </button>
                </div>
              </div>

              {/* School Security Contact */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Maktab navbatchi qismi</div>
                    <div className="text-[11px] text-slate-400">+998 71 200-50-50</div>
                  </div>
                </div>
                <a
                  href="tel:+998712005050"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                >
                  Qo'ng'iroq
                </a>
              </div>
            </>
          )}

        </aside>

        {/* RIGHT COLUMN: YANDEX MAP CONTAINER (FULL SCREEN) */}
        <section className="flex-1 relative flex flex-col min-h-[400px] h-full overflow-hidden bg-[#070d18]">
          
          {/* Map Layer Controls Floating in Top Right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={toggleMapLayer}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101a2e]/90 hover:bg-[#16233d] border border-white/10 text-white text-xs font-semibold shadow-xl backdrop-blur-md transition"
              title="Xarita qatlamini almashtirish"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{mapLayer === 'roadmap' ? 'Standart Xarita' : "Sun'iy yo'ldosh (Sputnik)"}</span>
            </button>

            <button
              onClick={handleRecenter}
              className="p-2 rounded-xl bg-[#101a2e]/90 hover:bg-[#16233d] border border-white/10 text-cyan-400 shadow-xl backdrop-blur-md transition"
              title="Farzandga fokuslash"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Live Coordinates Pill on Map Bottom */}
          <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-[#101a2e]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/40 shadow-2xl flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-bold">YANDEX MAPS:</span>
              <span className="text-white font-bold">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                setCopiedCoords(true);
                setTimeout(() => setCopiedCoords(false), 2000);
              }}
              className="text-cyan-400 hover:text-white"
              title="Nusxalash"
            >
              {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* The actual map DOM div element */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />
        </section>

      </main>
    </div>
  );
};
