import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  School,
  User,
  Map as MapIcon,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertTriangle,
  Radio,
  LogOut,
  ChevronDown
} from 'lucide-react';

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
}) => {
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0] || {
    id: 'school_01',
    name: '1-sonli ixtisoslashtirilgan maktab',
  };

  const roles = [
    { id: 'SUPER_ADMIN', label: 'Super Admin' },
    { id: 'SCHOOL_ADMIN', label: 'Maktab Admini' },
    { id: 'TEACHER', label: "O'qituvchi" },
    { id: 'PARENT', label: 'Ota-ona' },
  ];

  return (
    <header className="h-16 px-4 lg:px-6 bg-[#1b1b33]/90 backdrop-blur-md border-b border-[#3a3a63]/40 flex items-center justify-between gap-3 text-[#e8e8f5] z-30 select-none">
      {/* Left: Hamburger & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] text-[#9a9ac0] hover:text-[#e8e8f5] transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#e8e8f5] tracking-tight truncate">
              SMART CHILD Fleet
            </h1>
            <button
              onClick={onToggleDemoMode}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md flex items-center gap-1 transition ${
                isDemoMode
                  ? 'bg-[#ffb020]/20 text-[#ffb020] border border-[#ffb020]/40'
                  : 'bg-[#2ee59d]/20 text-[#2ee59d] border border-[#2ee59d]/40'
              }`}
              title="Demo yoki Haqiqiy soat rejimini almashtirish"
            >
              <Radio className={`w-3 h-3 ${isDemoMode ? '' : 'animate-pulse'}`} />
              {isDemoMode ? 'Demo Simulyatsiya' : 'Jonli Soat'}
            </button>
          </div>
          <span className="text-[12px] text-[#9a9ac0] truncate hidden sm:inline">
            Samsung Galaxy Watch5 Pro bilan xavfsizlik va telemetriya nazorati
          </span>
        </div>
      </div>

      {/* Center: View Switcher (Map / Cards / List) */}
      <div className="hidden md:flex items-center bg-[#2a2a4a] p-1 rounded-xl border border-[#3a3a63]/40">
        <button
          onClick={() => onChangeViewMode('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'map'
              ? 'bg-[#2ee59d] text-[#1b1b33] shadow-md shadow-[#2ee59d]/20'
              : 'text-[#9a9ac0] hover:text-[#e8e8f5]'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Xarita</span>
        </button>
        <button
          onClick={() => onChangeViewMode('cards')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'cards'
              ? 'bg-[#2ee59d] text-[#1b1b33] shadow-md shadow-[#2ee59d]/20'
              : 'text-[#9a9ac0] hover:text-[#e8e8f5]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Kartalar</span>
        </button>
        <button
          onClick={() => onChangeViewMode('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'list'
              ? 'bg-[#2ee59d] text-[#1b1b33] shadow-md shadow-[#2ee59d]/20'
              : 'text-[#9a9ac0] hover:text-[#e8e8f5]'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Ro'yxat</span>
        </button>
      </div>

      {/* Right Controls: School Selector, Alerts, Dark/Light, Role */}
      <div className="flex items-center gap-2">
        {/* School Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSchoolDropdown(!showSchoolDropdown);
              setShowRoleDropdown(false);
              setShowAlertsDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] border border-[#3a3a63]/40 text-xs font-medium text-[#e8e8f5] transition max-w-[160px] sm:max-w-[200px]"
          >
            <School className="w-4 h-4 text-[#4db5ff] flex-shrink-0" />
            <span className="truncate">{selectedSchool.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9a9ac0]" />
          </button>

          {showSchoolDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-[#2a2a4a] border border-[#3a3a63] rounded-xl shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#9a9ac0] uppercase">
                Maktabni tanlang
              </div>
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => {
                    onSelectSchool(school.id);
                    setShowSchoolDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    school.id === selectedSchoolId
                      ? 'bg-[#2ee59d]/20 text-[#2ee59d]'
                      : 'text-[#e8e8f5] hover:bg-[#3a3a63]'
                  }`}
                >
                  <span className="truncate">{school.name}</span>
                  {school.id === selectedSchoolId && (
                    <CheckCircle2 className="w-4 h-4 text-[#2ee59d]" />
                  )}
                </button>
              ))}
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
            className="p-2 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] border border-[#3a3a63]/40 text-[#9a9ac0] hover:text-[#e8e8f5] transition relative"
            aria-label="Ogohlantirishlar"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-extrabold bg-[#ff4d5e] text-white rounded-full ring-2 ring-[#1b1b33] animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-[#2a2a4a] border border-[#3a3a63] rounded-xl shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#3a3a63]/40">
                <span className="text-xs font-bold text-[#e8e8f5] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#ffb020]" />
                  Ogohlantirishlar ({alerts.length})
                </span>
                {onMarkAllAlertsRead && unreadAlertsCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkAllAlertsRead();
                    }}
                    className="text-[11px] text-[#2ee59d] hover:underline"
                  >
                    Barchasini o'qish
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto py-1 space-y-1 scrollbar-thin">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#9a9ac0]">
                    Hech qanday ogohlantirish yo'q
                  </div>
                ) : (
                  alerts.slice(0, 5).map((a, idx) => (
                    <div
                      key={a.id || idx}
                      className={`p-2 rounded-lg text-xs transition ${
                        a.isRead ? 'bg-[#1b1b33]/40 text-[#9a9ac0]' : 'bg-[#3a3a63]/50 text-[#e8e8f5]'
                      }`}
                    >
                      <div className="font-semibold">{a.title || 'Ogohlantirish'}</div>
                      <div className="text-[11px] text-[#9a9ac0] mt-0.5 line-clamp-2">
                        {a.message}
                      </div>
                      <div className="text-[10px] text-[#9a9ac0]/70 mt-1">{a.time || 'hozir'}</div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  setShowAlertsDropdown(false);
                  onOpenAlerts();
                }}
                className="w-full mt-1 py-1.5 text-center text-xs font-medium text-[#2ee59d] hover:bg-[#3a3a63] rounded-lg transition"
              >
                Barcha ogohlantirishlarni ko'rish
              </button>
            </div>
          )}
        </div>

        {/* Single Dark / Light Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] border border-[#3a3a63]/40 text-[#ffb020] transition"
          aria-label="Rejimni almashtirish"
          title={darkMode ? 'Kunduzgi rejimga o\'tish' : 'Tungi rejimga o\'tish'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-[#ffb020]" /> : <Moon className="w-4 h-4 text-[#4db5ff]" />}
        </button>

        {/* Role Selector & Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowSchoolDropdown(false);
              setShowAlertsDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] border border-[#3a3a63]/40 text-xs font-semibold text-[#e8e8f5] transition"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#2ee59d] to-[#4db5ff] flex items-center justify-center text-[#1b1b33] font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline">
              {roles.find((r) => r.id === currentRole)?.label || currentRole}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9a9ac0]" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-[#2a2a4a] border border-[#3a3a63] rounded-xl shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#9a9ac0] uppercase">
                Rolni tanlang (Demo RBAC)
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onChangeRole(r.id);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    r.id === currentRole
                      ? 'bg-[#2ee59d]/20 text-[#2ee59d]'
                      : 'text-[#e8e8f5] hover:bg-[#3a3a63]'
                  }`}
                >
                  <span>{r.label}</span>
                  {r.id === currentRole && <CheckCircle2 className="w-4 h-4 text-[#2ee59d]" />}
                </button>
              ))}

              {onLogout && (
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    onLogout();
                  }}
                  className="w-full mt-1 pt-1 border-t border-[#3a3a63]/40 text-left px-3 py-2 rounded-lg text-xs font-medium text-[#ff4d5e] hover:bg-[#ff4d5e]/10 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Chiqish</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
