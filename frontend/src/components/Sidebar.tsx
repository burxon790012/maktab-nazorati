import React from 'react';
import {
  Compass,
  Users,
  ShieldCheck,
  Navigation,
  Bell,
  Watch,
  Activity,
  Smartphone,
  FileText,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export type NavTab =
  | 'map'
  | 'students'
  | 'geozones'
  | 'routes'
  | 'alerts'
  | 'devices'
  | 'health'
  | 'parents'
  | 'reports'
  | 'superadmin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  unreadAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  unreadAlertsCount,
}) => {
  const navItems = [
    { id: 'map' as NavTab, label: 'Xarita', icon: Compass },
    { id: 'students' as NavTab, label: "O'quvchilar", icon: Users },
    { id: 'geozones' as NavTab, label: 'Geozonalar', icon: ShieldCheck },
    { id: 'routes' as NavTab, label: 'Marshrutlar', icon: Navigation },
    {
      id: 'alerts' as NavTab,
      label: 'Ogohlantirishlar',
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
      badgeColor: 'bg-[#ff4d5e]',
    },
    { id: 'devices' as NavTab, label: 'Soatlar', icon: Watch },
    { id: 'health' as NavTab, label: 'Salomatlik', icon: Activity },
    { id: 'parents' as NavTab, label: 'Ota-ona ilovasi', icon: Smartphone },
    { id: 'reports' as NavTab, label: 'Hisobotlar', icon: FileText },
    { id: 'superadmin' as NavTab, label: 'Super Admin', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: 72px collapsed, 240px expanded */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-200 border-r border-white/[0.07] bg-[#101a2e] text-[#eaf2ff] select-none
          ${collapsed ? 'w-[72px]' : 'w-[240px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Asosiy menyu"
      >
        {/* Brand / Logo Header (56px) */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#22d3ee] p-0.5 flex-shrink-0 shadow-lg shadow-[#22d3ee]/20">
              <div className="w-full h-full bg-[#101a2e] rounded-[9px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-[#22d3ee] to-[#2ee59d] text-base tracking-tight">
                SC
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-150">
                <span className="font-bold tracking-tight text-sm leading-none text-[#eaf2ff] flex items-center gap-1.5">
                  SMART CHILD
                </span>
                <span className="text-[10px] text-[#8ea3c4] font-medium tracking-wider uppercase mt-1">
                  Fleet Dashboard
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            aria-label="Menyuni yopish"
            className="lg:hidden p-1.5 text-[#8ea3c4] hover:text-[#eaf2ff] rounded-xl hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full group relative flex items-center gap-3 rounded-xl font-medium text-xs transition-all duration-150
                  ${collapsed ? 'h-11 justify-center px-0' : 'h-11 px-3'}
                  ${
                    isActive
                      ? 'bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/40 shadow-sm shadow-[#22d3ee]/10 font-semibold'
                      : 'text-[#8ea3c4] hover:text-[#eaf2ff] hover:bg-white/[0.04] border border-transparent'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#22d3ee]' : 'text-[#8ea3c4] group-hover:text-[#eaf2ff]'
                  }`}
                />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#ff4d5e] text-white shadow-sm shadow-[#ff4d5e]/40">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed Badge Pill */}
                {collapsed && item.badge !== null && item.badge !== undefined && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff4d5e] rounded-full ring-2 ring-[#101a2e]" />
                )}

                {/* Tooltip on Hover when Collapsed */}
                {collapsed && (
                  <div
                    role="tooltip"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full ml-2.5 z-50 px-2.5 py-1.5 bg-[#16233d] border border-white/10 text-xs font-semibold text-[#eaf2ff] rounded-lg shadow-2xl whitespace-nowrap flex items-center gap-2"
                  >
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#ff4d5e] text-white text-[9px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse / Expand Toggle Button for Desktop */}
        <div className="p-2.5 border-t border-white/[0.07] hidden lg:flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex flex-col text-[11px] text-[#8ea3c4] pl-1">
              <span className="font-semibold text-[#eaf2ff]">Samsung Watch5 Pro</span>
              <span className="text-[10px] text-[#2ee59d] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ee59d] animate-pulse" />
                Jonli telemetriya
              </span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Yon panelni ochish" : "Yon panelni yig'ish"}
            title={collapsed ? "Yon panelni ochish (240px)" : "Yon panelni yig'ish (72px)"}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8ea3c4] hover:text-[#eaf2ff] transition ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
