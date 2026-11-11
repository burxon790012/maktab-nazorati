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
  Watch,
  Users as UsersIcon,
  Shield,
} from 'lucide-react';
import { Student } from '@/types';
import { NavTab } from './Sidebar';

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
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
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
  currentTab = 'map',
  onSelectTab,
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
          className="md:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8ea3c4] hover:text-[#eaf2ff] transition"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:base font-bold text-[#eaf2ff] tracking-tight truncate flex items-center gap-1.5">
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

      {/* Center: Main Section Navigation Tabs (Xarita / Soatlar / O'quvchilar / Super Admin) */}
      <div className="hidden sm:flex items-center bg-[#0b1220] p-1 rounded-xl border border-white/[0.07] gap-0.5">
        <button
          onClick={() => {
            if (onSelectTab) onSelectTab('map');
            onChangeViewMode('map');
          }}
          aria-label="Xarita ko'rinishi"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentTab === 'map'
              ? 'bg-[#22d3ee] text-[#0b1220] shadow-sm font-bold'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04]'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Xarita</span>
        </button>

        <button
          onClick={() => {
            if (onSelectTab) onSelectTab('devices');
          }}
          aria-label="Aqlli soatlar floti"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentTab === 'devices'
              ? 'bg-[#2ee59d] text-[#0b1220] shadow-sm font-bold'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04]'
          }`}
        >
          <Watch className="w-3.5 h-3.5" />
          <span>Soatlar</span>
        </button>

        <button
          onClick={() => {
            if (onSelectTab) onSelectTab('students');
            onChangeViewMode('cards');
          }}
          aria-label="O'quvchilar ro'yxati"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentTab === 'students'
              ? 'bg-[#22d3ee] text-[#0b1220] shadow-sm font-bold'
              : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04]'
          }`}
        >
          <UsersIcon className="w-3.5 h-3.5" />
          <span>O'quvchilar</span>
        </button>

        {currentRole === 'SUPER_ADMIN' && (
          <button
            onClick={() => {
              if (onSelectTab) onSelectTab('superadmin');
            }}
            aria-label="Super Admin boshqaruv paneli"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentTab === 'superadmin'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm font-black'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        )}
      </div>

      {/* Right Controls: School Selector, Alerts, ONE Theme Toggle, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* School Selector Dropdown (Only Super Admin can switch schools) */}
        <div className="relative">
          {currentRole === 'SUPER_ADMIN' ? (
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
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs font-semibold text-[#eaf2ff] max-w-[140px] sm:max-w-[210px]">
              <SchoolIcon className="w-3.5 h-3.5 text-[#22d3ee] shrink-0" />
              <span className="truncate">{selectedSchool.name}</span>
            </div>
          )}

          {showSchoolDropdown && currentRole === 'SUPER_ADMIN' && (
            <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-[#16233d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#8ea3c4] uppercase tracking-wider border-b border-white/[0.07] mb-1">
                Maktabni tanlang
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                {schools.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSchool(s.id);
                      setShowSchoolDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      s.id === selectedSchoolId
                        ? 'bg-[#22d3ee]/15 text-[#22d3ee] font-bold'
                        : 'text-[#eaf2ff] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-[10px] text-[#8ea3c4] truncate">{s.city || s.region || s.id}</div>
                    </div>
                    {s.id === selectedSchoolId && <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3ee] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alerts Bell Icon with Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAlertsDropdown(!showAlertsDropdown);
              setShowSchoolDropdown(false);
              setShowRoleDropdown(false);
            }}
            aria-label="Ogohlantirishlar ro'yxati"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#8ea3c4] hover:text-[#eaf2ff] transition relative"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#ff4d5e] text-white text-[10px] font-black animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-[#16233d] border border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
                <span className="font-bold text-xs text-[#eaf2ff]">Ogohlantirishlar</span>
                {unreadAlertsCount > 0 && onMarkAllAlertsRead && (
                  <button
                    onClick={onMarkAllAlertsRead}
                    className="text-[11px] font-semibold text-[#2ee59d] hover:underline"
                  >
                    O'qilgan deb belgilash
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

        {/* Profile Avatar with Role Selector & Quick Section Navigation */}
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
            <div className="absolute right-0 mt-2 w-64 bg-[#16233d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 border-b border-white/[0.07] mb-1">
                <div className="text-[11px] text-[#8ea3c4] uppercase tracking-wider font-semibold">Profil holati</div>
                <div className="text-xs font-bold text-[#eaf2ff] mt-0.5">
                  {roles.find((r) => r.id === currentRole)?.label || currentRole}
                </div>
              </div>

              {/* Quick Section Shortcuts for Super Admin */}
              {currentRole === 'SUPER_ADMIN' && onSelectTab && (
                <div className="py-1 border-b border-white/[0.07] mb-1 space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#8ea3c4] uppercase tracking-wider">
                    Tezkor bo'limlar
                  </div>
                  <button
                    onClick={() => {
                      onSelectTab('superadmin');
                      setShowRoleDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-amber-400 hover:bg-white/[0.06] flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Super Admin Boshqaruvi</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('devices');
                      setShowRoleDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-[#2ee59d] hover:bg-white/[0.06] flex items-center gap-2"
                  >
                    <Watch className="w-3.5 h-3.5" />
                    <span>Aqlli Soatlar Floti</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('students');
                      setShowRoleDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-[#22d3ee] hover:bg-white/[0.06] flex items-center gap-2"
                  >
                    <UsersIcon className="w-3.5 h-3.5" />
                    <span>O'quvchilar Nazorati</span>
                  </button>
                </div>
              )}

              {/* Role switcher (Only Super Admin has view switching permission) */}
              {currentRole === 'SUPER_ADMIN' && (
                <div className="space-y-0.5 py-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#8ea3c4] uppercase tracking-wider">
                    Ko'rinishni almashtirish
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onChangeRole(r.id);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                        r.id === currentRole
                          ? 'bg-[#22d3ee]/15 text-[#22d3ee] font-bold'
                          : 'text-[#eaf2ff] hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{r.label}</span>
                      {r.id === currentRole && <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3ee]" />}
                    </button>
                  ))}
                </div>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    onLogout();
                  }}
                  className="w-full mt-1 pt-1.5 border-t border-white/[0.07] text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#ff4d5e] hover:bg-[#ff4d5e]/10 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Tizimdan chiqish</span>
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
