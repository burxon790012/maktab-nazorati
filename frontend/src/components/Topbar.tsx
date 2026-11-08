import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  School as SchoolIcon,
  User as UserIcon,
  Map as MapIcon,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { Student } from '@/types';

export type ViewMode = 'map' | 'cards' | 'list';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  schools: any[];
  selectedSchoolId: string;
  onSelectSchool: (id: string) => void;
  alerts: any[];
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onMarkAllAlertsRead?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentRole: string;
  onChangeRole: (role: string) => void;
  onLogout?: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  activeSosStudent?: Student | null;
  onSelectSosStudent?: (student: Student) => void;
  onToggleStats?: () => void;
  isStatsOpen?: boolean;
  onOpenPublicWebsite?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  viewMode,
  onChangeViewMode,
  schools,
  selectedSchoolId,
  onSelectSchool,
  alerts,
  unreadAlertsCount,
  onOpenAlerts,
  onMarkAllAlertsRead,
  darkMode,
  onToggleDarkMode,
  currentRole,
  onChangeRole,
  onLogout,
  isDemoMode,
  onToggleDemoMode,
  activeSosStudent,
  onSelectSosStudent,
  onToggleStats,
  isStatsOpen,
  onOpenPublicWebsite,
}) => {
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0] || {
    id: 'school_01',
    name: '1-sonli namunaviy maktab',
  };

  const roles = [
    { id: 'SUPER_ADMIN', label: 'Super Admin' },
    { id: 'SCHOOL_ADMIN', label: 'Maktab Admini' },
    { id: 'TEACHER', label: "O'qituvchi" },
    { id: 'PARENT', label: 'Ota-ona' },
  ];

  return (
    <header className="h-14 px-3 sm:px-4 lg:px-5 bg-[#101a2e]/95 backdrop-blur-md border-b border-white/[0.07] flex items-center justify-between gap-2.5 text-[#eaf2ff] z-30 select-none shrink-0">
      {/* Left: Mobile hamburger, Logo title, Subtitle & SOS/Demo badges */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8ea3c4] hover:text-[#eaf2ff] transition"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-[#eaf2ff] tracking-tight truncate flex items-center gap-1.5">
              <span className="hidden sm:inline">SMART CHILD</span>
              <span className="sm:hidden text-xs text-[#22d3ee] font-black">SC</span>
            </h1>

            {/* DEMO badge: only shown in demo mode */}
            {isDemoMode && (
              <button
                onClick={onToggleDemoMode}
                title="Demo rejimi (Soat simulyatsiyasi)"
                aria-label="Demo rejimini almashtirish"
                className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-[#ffb020]/15 text-[#ffb020] border border-[#ffb020]/30 tracking-wider hover:bg-[#ffb020]/25 transition"
              >
                DEMO
              </button>
            )}

            {/* Compact SOS Pill: appears ONLY when an SOS is active */}
            {activeSosStudent && (
              <button
                onClick={() => onSelectSosStudent?.(activeSosStudent)}
                className="px-2 py-0.5 rounded-full bg-[#ff4d5e]/20 text-[#ff4d5e] border border-[#ff4d5e]/50 text-xs font-bold flex items-center gap-1.5 hover:bg-[#ff4d5e]/30 transition"
                aria-live="assertive"
                title={`${activeSosStudent.name} uchun favqulodda SOS signali faol`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d5e] animate-ping" />
                <ShieldAlert className="w-3 h-3" />
                <span className="truncate max-w-[120px]">SOS: {activeSosStudent.name}</span>
              </button>
            )}
          </div>
          <span className="text-xs text-[#8ea3c4] truncate hidden md:inline leading-tight">
            Bolalar xavfsizligi va GPS monitoringi
          </span>
        </div>
      </div>

      {/* Center: View Switcher (Xarita / Kartalar / Ro'yxat) */}
      <div className="hidden md:flex items-center bg-[#0b1220] p-0.5 rounded-xl border border-white/[0.07]">
        <button
          onClick={() => onChangeViewMode('map')}
          aria-label="Xarita ko'rinishi"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'map'
              ? 'bg-[#22d3ee] text-[#0b1220] shadow-sm font-bold'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff]'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Xarita</span>
        </button>
        <button
          onClick={() => onChangeViewMode('cards')}
          aria-label="Kartalar ko'rinishi"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'cards'
              ? 'bg-[#22d3ee] text-[#0b1220] shadow-sm font-bold'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Kartalar</span>
        </button>
        <button
          onClick={() => onChangeViewMode('list')}
          aria-label="Ro'yxat ko'rinishi"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'list'
              ? 'bg-[#22d3ee] text-[#0b1220] shadow-sm font-bold'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff]'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Ro'yxat</span>
        </button>
      </div>

      {/* Right Controls: School Selector, Alerts, ONE Theme Toggle, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* School Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSchoolDropdown(!showSchoolDropdown);
              setShowRoleDropdown(false);
              setShowAlertsDropdown(false);
            }}
            aria-label="Maktabni tanlash"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-medium text-[#eaf2ff] transition max-w-[100px] sm:max-w-[190px]"
          >
            <SchoolIcon className="w-3.5 h-3.5 text-[#22d3ee] shrink-0" />
            <span className="truncate">{selectedSchool.name}</span>
            <ChevronDown className="w-3 h-3 text-[#8ea3c4] shrink-0" />
          </button>

          {showSchoolDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-[#16233d] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-xs font-bold text-[#8ea3c4] uppercase tracking-wider">
                Maktabni tanlang
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                {schools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => {
                      onSelectSchool(school.id);
                      setShowSchoolDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      school.id === selectedSchoolId
                        ? 'bg-[#22d3ee]/15 text-[#22d3ee] font-bold'
                        : 'text-[#eaf2ff] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="truncate">{school.name}</span>
                    {school.id === selectedSchoolId && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3ee]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAlertsDropdown(!showAlertsDropdown);
              setShowSchoolDropdown(false);
              setShowRoleDropdown(false);
            }}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#8ea3c4] hover:text-[#eaf2ff] transition relative"
            aria-label="Ogohlantirishlar ro'yxati"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-extrabold bg-[#ff4d5e] text-white rounded-full ring-2 ring-[#101a2e] animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-[#16233d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.07]">
                <span className="text-xs font-bold text-[#eaf2ff] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ffb020]" />
                  Ogohlantirishlar ({alerts.length})
                </span>
                {onMarkAllAlertsRead && unreadAlertsCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkAllAlertsRead();
                    }}
                    className="text-xs text-[#22d3ee] hover:underline"
                  >
                    Barchasini o'qish
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto py-1 space-y-1 scrollbar-thin">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8ea3c4]">
                    Hech qanday ogohlantirish yo'q
                  </div>
                ) : (
                  alerts.slice(0, 5).map((a, idx) => (
                    <div
                      key={a.id || idx}
                      className={`p-2.5 rounded-xl text-xs transition ${
                        a.isRead ? 'bg-white/[0.02] text-[#8ea3c4]' : 'bg-white/[0.06] text-[#eaf2ff]'
                      }`}
                    >
                      <div className="font-semibold">{a.title || 'Ogohlantirish'}</div>
                      <div className="text-xs text-[#8ea3c4] mt-0.5 line-clamp-2">
                        {a.message}
                      </div>
                      <div className="text-xs text-[#8ea3c4]/70 mt-1">{a.time || 'hozir'}</div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  setShowAlertsDropdown(false);
                  onOpenAlerts();
                }}
                className="w-full mt-1 py-1.5 text-center text-xs font-semibold text-[#22d3ee] hover:bg-white/[0.06] rounded-xl transition"
              >
                Barcha ogohlantirishlarni ko'rish
              </button>
            </div>
          )}
        </div>

        {/* Link to Public Website */}
        {onOpenPublicWebsite && (
          <button
            onClick={onOpenPublicWebsite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#22d3ee] hover:text-white text-xs font-semibold transition"
            title="Ommaviy veb-saytni ko'rish"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Veb-sayt</span>
          </button>
        )}

        {/* EXACTLY ONE Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#ffb020] transition"
          aria-label={darkMode ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
          title={darkMode ? "Kunduzgi rejim" : "Tungi rejim"}
        >
          {darkMode ? <Sun className="w-4 h-4 text-[#ffb020]" /> : <Moon className="w-4 h-4 text-[#22d3ee]" />}
        </button>

        {/* Profile Avatar with Role Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowSchoolDropdown(false);
              setShowAlertsDropdown(false);
            }}
            aria-label="Foydalanuvchi profili"
            className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-semibold text-[#eaf2ff] transition"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#22d3ee] flex items-center justify-center text-[#0b1220] font-bold text-xs shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:inline text-xs font-medium">
              {roles.find((r) => r.id === currentRole)?.label || currentRole}
            </span>
            <ChevronDown className="w-3 h-3 text-[#8ea3c4] shrink-0" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-[#16233d] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-xs font-bold text-[#8ea3c4] uppercase tracking-wider">
                Rolni tanlang
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onChangeRole(r.id);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                    r.id === currentRole
                      ? 'bg-[#22d3ee]/15 text-[#22d3ee] font-bold'
                      : 'text-[#eaf2ff] hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{r.label}</span>
                  {r.id === currentRole && <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3ee]" />}
                </button>
              ))}

              {onLogout && (
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    onLogout();
                  }}
                  className="w-full mt-1 pt-1 border-t border-white/[0.07] text-left px-3 py-2 rounded-xl text-xs font-medium text-[#ff4d5e] hover:bg-[#ff4d5e]/10 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Chiqish</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tablet Toggle for Right Stats Drawer (1024-1279px) */}
        {onToggleStats && (
          <button
            onClick={onToggleStats}
            aria-label="Statistika panelini ko'rsatish"
            className={`hidden md:flex xl:hidden px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition items-center gap-1.5 ${
              isStatsOpen
                ? 'bg-[#22d3ee] text-[#0b1220] border-[#22d3ee]'
                : 'bg-white/[0.04] text-[#8ea3c4] hover:text-[#eaf2ff] border-white/[0.07]'
            }`}
          >
            <span>Statistika</span>
          </button>
        )}
      </div>
    </header>
  );
};
