import React, { useEffect, useState, useMemo } from 'react';
import {
  PieChart,
  Watch,
  BatteryCharging,
  AlertTriangle,
  Heart,
  Thermometer,
  ShieldAlert,
  Crosshair,
  Phone,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';
import { Student } from '@/types';

interface RightStatsColumnProps {
  students: Student[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  alerts: any[];
  onOpenAlerts: () => void;
  selectedStudent: Student | null;
  onCloseSelectedStudent: () => void;
  onFocusStudent: (student: Student) => void;
  onTriggerSos: (student: Student) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isLoading?: boolean;
}

// 300ms smooth count-up animation hook
function useAnimatedNumber(target: number, duration: number = 300): number {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = current;
    const diff = target - startValue;

    if (diff === 0) return;

    let frameId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease-out-cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startValue + diff * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return current;
}

export const RightStatsColumn: React.FC<RightStatsColumnProps> = ({
  students,
  activeFilter,
  onSelectFilter,
  alerts,
  onOpenAlerts,
  selectedStudent,
  onCloseSelectedStudent,
  onFocusStudent,
  onTriggerSos,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  isLoading = false,
}) => {
  // Listen for Esc key to close selected student
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStudent) {
        onCloseSelectedStudent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudent, onCloseSelectedStudent]);

  // Telemetry aggregates
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
    let lowBatteryCount = 0;

    students.forEach((s) => {
      const telem = s.telemetry;
      const status = telem?.geofenceStatus;

      if (telem?.isSos) {
        sos++;
      }

      if (status === 'INSIDE') inside++;
      else if (status === 'OUTSIDE') outside++;
      else verifying++;

      const isOffline = telem?.deviceStatus === 'OFFLINE' || (telem?.lastSeen ? Date.now() - telem.lastSeen > 300000 : !telem?.lastSeen);
      if (isOffline) offline++;
      else online++;

      const batt = telem?.batteryLevel;
      if (typeof batt === 'number' && !isNaN(batt)) {
        batterySum += batt;
        batteryCount++;
        if (batt < 20) lowBatteryCount++;
      }
    });

    const avgBattery = batteryCount > 0 ? Math.round(batterySum / batteryCount) : 85;

    return {
      total,
      inside,
      outside,
      verifying,
      sos,
      online,
      offline,
      avgBattery,
      lowBatteryCount,
    };
  }, [students]);

  // Animated counters
  const animatedInside = useAnimatedNumber(stats.inside);
  const animatedOutside = useAnimatedNumber(stats.outside);
  const animatedVerifying = useAnimatedNumber(stats.verifying);
  const animatedOnline = useAnimatedNumber(stats.online);
  const animatedOffline = useAnimatedNumber(stats.offline);
  const animatedAvgBattery = useAnimatedNumber(stats.avgBattery);

  // Donut chart calculations
  const totalStudents = stats.total || 1;
  const insidePct = Math.round((stats.inside / totalStudents) * 100);
  const outsidePct = Math.round((stats.outside / totalStudents) * 100);
  const verifyingPct = 100 - insidePct - outsidePct;

  const radius = 42;
  const circ = 2 * Math.PI * radius; // 263.89

  const insideStroke = (stats.inside / totalStudents) * circ;
  const outsideStroke = (stats.outside / totalStudents) * circ;
  const verifyingStroke = (stats.verifying / totalStudents) * circ;

  const insideOffset = 0;
  const outsideOffset = -insideStroke;
  const verifyingOffset = -(insideStroke + outsideStroke);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Stats Container: 340px */}
      <aside
        className={`fixed xl:static top-14 bottom-0 right-0 z-40 flex flex-col transition-all duration-200 border-l border-white/[0.07] bg-[#101a2e] text-[#eaf2ff] select-none
          ${collapsed ? 'w-0 xl:w-12 overflow-hidden' : 'w-full sm:w-[340px] xl:w-[340px]'}
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
        `}
        aria-label="Statistika paneli"
      >
        {/* Collapsed strip on Desktop */}
        {collapsed ? (
          <div className="hidden xl:flex flex-col items-center justify-between h-full py-4 text-[#8ea3c4]">
            <button
              onClick={onToggleCollapse}
              aria-label="Statistika panelini ochish"
              title="Statistika panelini ochish"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] hover:text-[#eaf2ff] transition"
            >
              <ChevronLeft className="w-5 h-5 text-[#22d3ee]" />
            </button>
            <div className="rotate-90 origin-center text-xs font-bold tracking-wider uppercase text-[#8ea3c4] whitespace-nowrap">
              Statistika
            </div>
            <div className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header / Collapse Bar */}
            <div className="h-12 px-5 flex items-center justify-between border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#22d3ee]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[#eaf2ff]">
                  Jonli Statistika
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Desktop Collapse */}
                <button
                  onClick={onToggleCollapse}
                  aria-label="Statistika panelini yig'ish"
                  title="Statistikani yashirish"
                  className="hidden xl:flex p-1.5 rounded-xl hover:bg-white/[0.06] text-[#8ea3c4] hover:text-[#eaf2ff] transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Mobile Close */}
                <button
                  onClick={onCloseMobile}
                  aria-label="Yopish"
                  className="xl:hidden p-1.5 rounded-xl hover:bg-white/[0.06] text-[#8ea3c4] hover:text-[#eaf2ff] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Cards Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {/* SKELETON LOADER STATE */}
              {isLoading && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/[0.05]" />
                  <div className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.05]" />
                  <div className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.05]" />
                </div>
              )}

              {!isLoading && (
                <>
                  {/* CARD 0: SELECTED STUDENT CARD (When a student is chosen) */}
                  {selectedStudent && (
                    <div className="rounded-2xl p-5 bg-[#16233d]/90 border-2 border-[#22d3ee]/60 shadow-xl space-y-3.5 animate-in fade-in slide-in-from-top-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider flex items-center gap-1.5">
                          <span>👤</span> Tanlangan O'quvchi
                        </span>
                        <button
                          onClick={onCloseSelectedStudent}
                          className="p-1 rounded-lg text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.06] transition"
                          aria-label="Tanlangan o'quvchini yopish (Esc)"
                          title="Yopish (Esc)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Profile header */}
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            selectedStudent.photo ||
                            'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120'
                          }
                          alt={selectedStudent.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-[#22d3ee] shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-[#eaf2ff] truncate">
                            {selectedStudent.name}
                          </h4>
                          <p className="text-xs text-[#8ea3c4] truncate">
                            {selectedStudent.className} •{' '}
                            <span className="font-mono text-[#22d3ee]">
                              {selectedStudent.uniqueId || selectedStudent.studentId}
                            </span>
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              selectedStudent.telemetry?.geofenceStatus === 'INSIDE'
                                ? 'bg-[#2ee59d]/15 text-[#2ee59d] border border-[#2ee59d]/30'
                                : selectedStudent.telemetry?.geofenceStatus === 'OUTSIDE'
                                ? 'bg-[#ff4d5e]/15 text-[#ff4d5e] border border-[#ff4d5e]/30'
                                : 'bg-[#ffb020]/15 text-[#ffb020] border border-[#ffb020]/30'
                            }`}
                          >
                            {selectedStudent.telemetry?.geofenceStatus === 'INSIDE'
                              ? 'Maktabda'
                              : selectedStudent.telemetry?.geofenceStatus === 'OUTSIDE'
                              ? 'Tashqarida'
                              : 'Chegarada'}
                          </span>
                        </div>
                      </div>

                      {/* Real address (no Toshkent shahri fallback) */}
                      <div className="text-xs text-[#8ea3c4] flex items-start gap-1.5 bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                        <MapPin className="w-3.5 h-3.5 text-[#22d3ee] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {selectedStudent.telemetry?.address || 'Manzil aniqlanmoqda...'}
                        </span>
                      </div>

                      {/* Vital stats row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <Heart className="w-3.5 h-3.5 text-[#ff4d5e] mx-auto mb-1 fill-[#ff4d5e]/40" />
                          <div className="font-mono font-bold text-xs text-[#eaf2ff]">
                            {selectedStudent.telemetry?.heartRate || 76}
                          </div>
                          <div className="text-[9px] text-[#8ea3c4]">Yurak urishi</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <Thermometer className="w-3.5 h-3.5 text-[#ffb020] mx-auto mb-1" />
                          <div className="font-mono font-bold text-xs text-[#eaf2ff]">
                            {selectedStudent.telemetry?.bodyTemperature || 36.6}°C
                          </div>
                          <div className="text-[9px] text-[#8ea3c4]">Harorat</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <BatteryCharging className="w-3.5 h-3.5 text-[#2ee59d] mx-auto mb-1" />
                          <div className="font-mono font-bold text-xs text-[#2ee59d]">
                            {selectedStudent.telemetry?.batteryLevel || 85}%
                          </div>
                          <div className="text-[9px] text-[#8ea3c4]">Batareya</div>
                        </div>
                      </div>

                      {/* Parent phone (tel: link) */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
                        <span className="text-[#8ea3c4]">Ota-onasi:</span>
                        <a
                          href={`tel:${selectedStudent.parentPhone || '+998901234567'}`}
                          className="font-mono font-bold text-[#22d3ee] hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{selectedStudent.parentPhone || '+998 90 123-45-67'}</span>
                        </a>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => onFocusStudent(selectedStudent)}
                          className="h-9 px-3 rounded-xl bg-[#22d3ee] hover:bg-[#06b6d4] text-[#0b1220] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#22d3ee]/20 transition"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>Fokuslash</span>
                        </button>
                        <button
                          onClick={() => onTriggerSos(selectedStudent)}
                          className="h-9 px-3 rounded-xl bg-[#ff4d5e] hover:bg-[#e03d4e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#ff4d5e]/20 transition"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>SOS Signal</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CARD 1: HOLAT (Donut Chart + Interactive Filtering) */}
                  <div className="rounded-2xl p-5 bg-[#101a2e]/90 border border-white/[0.07] shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ea3c4]">
                        Holat (Geozona)
                      </h3>
                      {activeFilter !== 'ALL' && (
                        <button
                          onClick={() => onSelectFilter('ALL')}
                          className="text-[11px] text-[#22d3ee] hover:underline font-semibold"
                        >
                          Filtrni tozalash
                        </button>
                      )}
                    </div>

                    {/* Donut Chart with Center Percentage */}
                    <div className="flex items-center justify-center py-1">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          {/* Background Circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeWidth="10"
                          />
                          {/* Segment: Maktabda (Green) */}
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#2ee59d"
                            strokeWidth="10"
                            strokeDasharray={`${insideStroke} ${circ}`}
                            strokeDashoffset={insideOffset}
                            strokeLinecap="round"
                            className="cursor-pointer transition-all duration-300 hover:opacity-80"
                            onClick={() =>
                              onSelectFilter(activeFilter === 'INSIDE' ? 'ALL' : 'INSIDE')
                            }
                          />
                          {/* Segment: Tashqarida (Red) */}
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#ff4d5e"
                            strokeWidth="10"
                            strokeDasharray={`${outsideStroke} ${circ}`}
                            strokeDashoffset={outsideOffset}
                            strokeLinecap="round"
                            className="cursor-pointer transition-all duration-300 hover:opacity-80"
                            onClick={() =>
                              onSelectFilter(activeFilter === 'OUTSIDE' ? 'ALL' : 'OUTSIDE')
                            }
                          />
                          {/* Segment: Chegarada (Amber) */}
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#ffb020"
                            strokeWidth="10"
                            strokeDasharray={`${verifyingStroke} ${circ}`}
                            strokeDashoffset={verifyingOffset}
                            strokeLinecap="round"
                            className="cursor-pointer transition-all duration-300 hover:opacity-80"
                            onClick={() =>
                              onSelectFilter(activeFilter === 'VERIFYING' ? 'ALL' : 'VERIFYING')
                            }
                          />
                        </svg>

                        {/* Center big number */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                          <span className="font-mono font-bold text-2xl text-[#eaf2ff] leading-none">
                            {insidePct}%
                          </span>
                          <span className="text-[10px] text-[#8ea3c4] font-medium mt-0.5">
                            Maktabda
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Legend with live counts */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => onSelectFilter(activeFilter === 'INSIDE' ? 'ALL' : 'INSIDE')}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition ${
                          activeFilter === 'INSIDE'
                            ? 'bg-[#2ee59d]/15 text-[#2ee59d] border border-[#2ee59d]/40'
                            : 'hover:bg-white/[0.04] text-[#eaf2ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2ee59d]" />
                          <span>Maktabda</span>
                        </div>
                        <span className="font-mono font-bold">{animatedInside} ta</span>
                      </button>

                      <button
                        onClick={() =>
                          onSelectFilter(activeFilter === 'OUTSIDE' ? 'ALL' : 'OUTSIDE')
                        }
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition ${
                          activeFilter === 'OUTSIDE'
                            ? 'bg-[#ff4d5e]/15 text-[#ff4d5e] border border-[#ff4d5e]/40'
                            : 'hover:bg-white/[0.04] text-[#eaf2ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d5e]" />
                          <span>Tashqarida</span>
                        </div>
                        <span className="font-mono font-bold">{animatedOutside} ta</span>
                      </button>

                      <button
                        onClick={() =>
                          onSelectFilter(activeFilter === 'VERIFYING' ? 'ALL' : 'VERIFYING')
                        }
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition ${
                          activeFilter === 'VERIFYING'
                            ? 'bg-[#ffb020]/15 text-[#ffb020] border border-[#ffb020]/40'
                            : 'hover:bg-white/[0.04] text-[#eaf2ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ffb020]" />
                          <span>Chegarada</span>
                        </div>
                        <span className="font-mono font-bold">{animatedVerifying} ta</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: SOATLAR (Online / Offline Big Numbers + Progress Bar) */}
                  <div className="rounded-2xl p-5 bg-[#101a2e]/90 border border-white/[0.07] shadow-lg space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Watch className="w-4 h-4 text-[#22d3ee]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ea3c4]">
                          Soatlar
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-[#8ea3c4]">
                        Jami: {stats.total}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[11px] text-[#8ea3c4] block">ONLINE</span>
                        <span className="text-2xl font-mono font-bold text-[#22d3ee] block mt-1">
                          {animatedOnline}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[11px] text-[#8ea3c4] block">OFFLINE</span>
                        <span className="text-2xl font-mono font-bold text-[#8ea3c4] block mt-1">
                          {animatedOffline}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
                        <div
                          className="h-full bg-[#22d3ee] transition-all duration-500 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? (stats.online / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#8ea3c4] mt-1.5 font-mono">
                        <span>Faollik: {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%</span>
                        <span>{stats.online}/{stats.total} ulangan</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: BATAREYA (Average + Low Battery Warning) */}
                  <div className="rounded-2xl p-5 bg-[#101a2e]/90 border border-white/[0.07] shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BatteryCharging className="w-4 h-4 text-[#2ee59d]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ea3c4]">
                          Batareya
                        </h3>
                      </div>
                      <span className="text-xl font-mono font-bold text-[#2ee59d]">
                        {animatedAvgBattery}%
                      </span>
                    </div>

                    {/* Battery Bar */}
                    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          stats.avgBattery < 30
                            ? 'bg-[#ff4d5e]'
                            : stats.avgBattery < 60
                            ? 'bg-[#ffb020]'
                            : 'bg-[#2ee59d]'
                        }`}
                        style={{ width: `${stats.avgBattery}%` }}
                      />
                    </div>

                    {/* Low Battery Warning (< 20%) */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#8ea3c4] text-[11px]">20% dan past soatlar:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                          stats.lowBatteryCount > 0
                            ? 'bg-[#ff4d5e]/20 text-[#ff4d5e] border border-[#ff4d5e]/40'
                            : 'bg-white/[0.04] text-[#8ea3c4]'
                        }`}
                      >
                        {stats.lowBatteryCount} ta
                      </span>
                    </div>
                  </div>

                  {/* CARD 4: SOS VA OGOHLANTIRISHLAR (Pulsing Count + Last 5 Alerts) */}
                  <div className="rounded-2xl p-5 bg-[#101a2e]/90 border border-white/[0.07] shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            stats.sos > 0 ? 'text-[#ff4d5e] animate-pulse' : 'text-[#ffb020]'
                          }`}
                        />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ea3c4]">
                          SOS & Xabarlar
                        </h3>
                      </div>
                      {stats.sos > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#ff4d5e] text-white text-[11px] font-mono font-extrabold shadow-sm shadow-[#ff4d5e]/40 animate-pulse">
                          {stats.sos} ta SOS
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-[#2ee59d]">Hammasi xavfsiz</span>
                      )}
                    </div>

                    {/* Last 5 Alerts List */}
                    <div className="space-y-2 pt-1">
                      {alerts.length === 0 ? (
                        <div className="text-center py-4 text-xs text-[#8ea3c4]">
                          Yangi ogohlantirishlar yo'q
                        </div>
                      ) : (
                        alerts.slice(0, 5).map((a, idx) => (
                          <div
                            key={a.id || idx}
                            className={`p-2.5 rounded-xl border text-xs space-y-0.5 transition ${
                              a.type === 'SOS' || a.title?.includes('SOS')
                                ? 'bg-[#ff4d5e]/10 border-[#ff4d5e]/30 text-[#eaf2ff]'
                                : 'bg-white/[0.02] border-white/[0.05] text-[#8ea3c4]'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="truncate text-[#eaf2ff]">
                                {a.studentName || a.title || 'Ogohlantirish'}
                              </span>
                              <span className="text-[10px] text-[#8ea3c4] font-mono shrink-0 ml-2">
                                {a.time || 'hozir'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8ea3c4] truncate">
                              {a.message || a.title}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* View All Alerts Button */}
                    <button
                      onClick={onOpenAlerts}
                      className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-[#22d3ee] transition flex items-center justify-center gap-1.5"
                    >
                      <span>Hammasini ko'rish</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
