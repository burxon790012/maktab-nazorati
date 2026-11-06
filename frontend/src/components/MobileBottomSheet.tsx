import React, { useState, useMemo } from 'react';
import {
  Users,
  PieChart,
  Search,
  X,
  Heart,
  ChevronUp,
  ChevronDown,
  Phone,
  Crosshair,
  ShieldAlert,
  BatteryCharging,
  Watch,
  AlertTriangle,
} from 'lucide-react';
import { Student } from '@/types';

interface MobileBottomSheetProps {
  students: Student[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  alerts: any[];
  onOpenAlerts: () => void;
  selectedStudent: Student | null;
  onSelectStudent: (student: Student | null) => void;
  onFocusStudent: (student: Student) => void;
  onTriggerSos: (student: Student) => void;
}

type SheetMode = 'peek' | 'half' | 'full';
type SheetTab = 'students' | 'stats';

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  students,
  activeFilter,
  onSelectFilter,
  alerts,
  onOpenAlerts,
  selectedStudent,
  onSelectStudent,
  onFocusStudent,
  onTriggerSos,
}) => {
  const [sheetMode, setSheetMode] = useState<SheetMode>('peek');
  const [sheetTab, setSheetTab] = useState<SheetTab>('students');
  const [search, setSearch] = useState('');

  // Height mapping
  const heightClass =
    sheetMode === 'peek'
      ? 'h-16'
      : sheetMode === 'half'
      ? 'h-[50vh]'
      : 'h-[82vh]';

  const toggleExpand = () => {
    if (sheetMode === 'peek') setSheetMode('half');
    else if (sheetMode === 'half') setSheetMode('full');
    else setSheetMode('peek');
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          (s.className || '').toLowerCase().includes(q) ||
          (s.uniqueId || s.studentId || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      const telem = s.telemetry;
      const isInside = telem?.geofenceStatus === 'INSIDE';
      const isOutside = telem?.geofenceStatus === 'OUTSIDE';
      const isVerifying = telem?.geofenceStatus === 'VERIFYING';
      const isSos = Boolean(telem?.isSos);
      const isOffline = telem?.deviceStatus === 'OFFLINE' || (telem?.lastSeen ? Date.now() - telem.lastSeen > 300000 : !telem?.lastSeen);

      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'INSIDE') return isInside;
      if (activeFilter === 'OUTSIDE') return isOutside;
      if (activeFilter === 'VERIFYING') return isVerifying;
      if (activeFilter === 'SOS') return isSos;
      if (activeFilter === 'ONLINE') return !isOffline;
      if (activeFilter === 'OFFLINE') return isOffline;
      return true;
    });
  }, [students, search, activeFilter]);

  // Aggregates for stats tab
  const stats = useMemo(() => {
    const total = students.length || 0;
    let inside = 0;
    let outside = 0;
    let verifying = 0;
    let sos = 0;
    let online = 0;
    let offline = 0;
    let batterySum = 0;
    let batteryCount = 0;

    students.forEach((s) => {
      const telem = s.telemetry;
      if (telem?.isSos) sos++;
      if (telem?.geofenceStatus === 'INSIDE') inside++;
      else if (telem?.geofenceStatus === 'OUTSIDE') outside++;
      else verifying++;
      const isOff = telem?.deviceStatus === 'OFFLINE' || (telem?.lastSeen ? Date.now() - telem.lastSeen > 300000 : !telem?.lastSeen);
      if (isOff) offline++;
      else online++;
      if (typeof telem?.batteryLevel === 'number') {
        batterySum += telem.batteryLevel;
        batteryCount++;
      }
    });

    const avgBattery = batteryCount > 0 ? Math.round(batterySum / batteryCount) : 85;
    return { total, inside, outside, verifying, sos, online, offline, avgBattery };
  }, [students]);

  const total = stats.total || 1;
  const insidePct = Math.round((stats.inside / total) * 100);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#101a2e]/98 backdrop-blur-2xl border-t border-white/[0.08] shadow-2xl transition-all duration-300 ease-out flex flex-col ${heightClass} pb-[env(safe-area-inset-bottom)] select-none`}
      style={{ touchAction: 'pan-y' }}
      aria-label="Mobil boshqaruv paneli"
    >
      {/* Drag Handle & Header */}
      <div
        onClick={toggleExpand}
        className="pt-2 pb-1.5 px-4 cursor-pointer flex flex-col items-center shrink-0"
      >
        <div className="w-10 h-1.5 rounded-full bg-white/20 hover:bg-white/30 transition mb-2" />

        {/* Segmented Switch (O'quvchilar / Statistika) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-between gap-2"
        >
          <div className="flex-1 flex items-center bg-[#0b1220] p-1 rounded-xl border border-white/[0.07]">
            <button
              onClick={() => {
                setSheetTab('students');
                if (sheetMode === 'peek') setSheetMode('half');
              }}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                sheetTab === 'students'
                  ? 'bg-[#22d3ee] text-[#0b1220] font-bold'
                  : 'text-[#8ea3c4]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>O'quvchilar ({filteredStudents.length})</span>
            </button>
            <button
              onClick={() => {
                setSheetTab('stats');
                if (sheetMode === 'peek') setSheetMode('half');
              }}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                sheetTab === 'stats'
                  ? 'bg-[#22d3ee] text-[#0b1220] font-bold'
                  : 'text-[#8ea3c4]'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Statistika</span>
            </button>
          </div>

          <button
            onClick={toggleExpand}
            className="p-2 rounded-xl bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff] shrink-0"
            aria-label={sheetMode === 'peek' ? "Ochish" : "Yopish"}
          >
            {sheetMode === 'peek' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Sheet Body */}
      {sheetMode !== 'peek' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-3.5 pb-2">
          {/* TAB 1: O'QUVCHILAR */}
          {sheetTab === 'students' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search */}
              <div className="relative my-2 shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8ea3c4] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ism, ID yoki sinf..."
                  className="w-full h-8 pl-8 pr-7 bg-[#16233d] border border-white/[0.08] rounded-xl text-xs text-[#eaf2ff] placeholder:text-[#8ea3c4] focus:outline-none focus:border-[#22d3ee]"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-2 text-[#8ea3c4]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none shrink-0 text-[10px]">
                {['ALL', 'INSIDE', 'OUTSIDE', 'VERIFYING', 'SOS', 'OFFLINE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => onSelectFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                      activeFilter === st
                        ? 'bg-[#22d3ee] text-[#0b1220] font-bold'
                        : 'bg-white/[0.04] text-[#8ea3c4]'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'Hammasi'
                      : st === 'INSIDE'
                      ? 'Maktabda'
                      : st === 'OUTSIDE'
                      ? 'Tashqarida'
                      : st === 'VERIFYING'
                      ? 'Chegarada'
                      : st === 'SOS'
                      ? 'SOS'
                      : 'Oflayn'}
                  </button>
                ))}
              </div>

              {/* Selected Student Card (if any) */}
              {selectedStudent && (
                <div className="p-3 mb-2 rounded-xl bg-[#16233d] border border-[#22d3ee]/40 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#22d3ee]">Tanlangan o'quvchi:</span>
                    <button
                      onClick={() => onSelectStudent(null)}
                      className="p-0.5 text-[#8ea3c4] hover:text-[#eaf2ff]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedStudent.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=60'}
                      alt={selectedStudent.name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#22d3ee]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[#eaf2ff] truncate">{selectedStudent.name}</div>
                      <div className="text-[11px] text-[#8ea3c4]">{selectedStudent.className}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onFocusStudent(selectedStudent)}
                      className="flex-1 py-1.5 rounded-lg bg-[#22d3ee] text-[#0b1220] font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>Xaritada</span>
                    </button>
                    <button
                      onClick={() => onTriggerSos(selectedStudent)}
                      className="flex-1 py-1.5 rounded-lg bg-[#ff4d5e] text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>SOS</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Student List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
                {filteredStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8ea3c4]">
                    Bu holatda o'quvchi yo'q
                  </div>
                ) : (
                  filteredStudents.map((std) => {
                    const isInside = std.telemetry?.geofenceStatus === 'INSIDE';
                    const isSos = Boolean(std.telemetry?.isSos);
                    const isOffline = std.telemetry?.deviceStatus === 'OFFLINE' || (std.telemetry?.lastSeen ? Date.now() - std.telemetry.lastSeen > 300000 : !std.telemetry?.lastSeen);

                    return (
                      <div
                        key={std.id}
                        onClick={() => {
                          onSelectStudent(std);
                          onFocusStudent(std);
                        }}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-2.5 active:bg-white/[0.06]"
                      >
                        <img
                          src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=60'}
                          alt={std.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#eaf2ff] truncate">{std.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isSos
                                  ? 'bg-[#ff4d5e] text-white'
                                  : isInside
                                  ? 'bg-[#2ee59d]/20 text-[#2ee59d]'
                                  : isOffline
                                  ? 'bg-white/10 text-[#8ea3c4]'
                                  : 'bg-[#ff4d5e]/20 text-[#ff4d5e]'
                              }`}
                            >
                              {isSos ? 'SOS' : isInside ? 'Maktabda' : isOffline ? 'Oflayn' : 'Tashqarida'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#8ea3c4] flex items-center justify-between mt-0.5">
                            <span>{std.className}</span>
                            <span>🔋 {std.telemetry?.batteryLevel || 85}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STATISTIKA */}
          {sheetTab === 'stats' && (
            <div className="flex-1 overflow-y-auto space-y-3 pt-2 scrollbar-thin">
              {/* Donut stat summary */}
              <div className="p-3.5 rounded-2xl bg-[#16233d]/70 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8ea3c4] uppercase font-bold tracking-wider block">
                    Maktabda Davomat
                  </span>
                  <span className="font-mono text-2xl font-bold text-[#eaf2ff] block mt-0.5">
                    {insidePct}%
                  </span>
                  <span className="text-xs text-[#2ee59d]">
                    {stats.inside} / {stats.total} o'quvchi
                  </span>
                </div>
                <div className="text-right space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 justify-end text-[#2ee59d]">
                    <span className="w-2 h-2 rounded-full bg-[#2ee59d]" />
                    <span>Maktabda: {stats.inside}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end text-[#ff4d5e]">
                    <span className="w-2 h-2 rounded-full bg-[#ff4d5e]" />
                    <span>Tashqarida: {stats.outside}</span>
                  </div>
                </div>
              </div>

              {/* Online/Offline Watches */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-[10px] text-[#8ea3c4] uppercase">ONLINE SOATLAR</span>
                  <span className="font-mono text-xl font-bold text-[#22d3ee] block mt-0.5">
                    {stats.online}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-[10px] text-[#8ea3c4] uppercase">O'RTACHA BATAREYA</span>
                  <span className="font-mono text-xl font-bold text-[#2ee59d] block mt-0.5">
                    {stats.avgBattery}%
                  </span>
                </div>
              </div>

              {/* SOS alerts count */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${stats.sos > 0 ? 'text-[#ff4d5e] animate-pulse' : 'text-[#ffb020]'}`} />
                  <span className="text-xs font-semibold">SOS & Xabarlar:</span>
                </div>
                <span className="font-mono font-bold text-xs text-[#ff4d5e]">
                  {stats.sos} ta SOS
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
