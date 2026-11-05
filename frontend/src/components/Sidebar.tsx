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
  Sparkles,
  X
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
    { id: 'devices' as NavTab, label: 'Soatlar', sub: 'Qurilmalar', icon: Watch },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 border-r border-[#3a3a63]/40 bg-[#1b1b33] text-[#e8e8f5] select-none
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#3a3a63]/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff2d78] to-[#2ee59d] p-0.5 flex-shrink-0 shadow-lg shadow-[#ff2d78]/20">
              <div className="w-full h-full bg-[#1b1b33] rounded-[10px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-[#ff2d78] to-[#2ee59d] text-lg">
                SC
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold tracking-tight text-base leading-none text-[#e8e8f5] flex items-center gap-1.5">
                  SMART CHILD
                  <Sparkles className="w-3.5 h-3.5 text-[#ff2d78]" />
                </span>
                <span className="text-[11px] text-[#9a9ac0] font-medium tracking-wider uppercase mt-1">
                  Fleet Dashboard
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#9a9ac0] hover:text-[#e8e8f5] rounded-lg hover:bg-[#2a2a4a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
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
                title={collapsed ? item.label : undefined}
                className={`w-full group flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 relative
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2a2a4a] to-[#3a3a63]/70 text-[#2ee59d] shadow-sm shadow-black/20 border-l-4 border-[#2ee59d]'
                      : 'text-[#9a9ac0] hover:text-[#e8e8f5] hover:bg-[#2a2a4a]/50'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#2ee59d]' : 'text-[#9a9ac0]'
                  }`}
                />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#ff4d5e] text-white shadow-sm shadow-[#ff4d5e]/40">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed Badge Dot */}
                {collapsed && item.badge !== null && item.badge !== undefined && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ff4d5e] rounded-full ring-2 ring-[#1b1b33]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse / Expand Toggle Button for Desktop */}
        <div className="p-3 border-t border-[#3a3a63]/30 hidden lg:flex items-center justify-between">
          {!collapsed && (
            <div className="flex flex-col text-xs text-[#9a9ac0]">
              <span className="font-semibold text-[#e8e8f5]">Samsung Watch5 Pro</span>
              <span className="text-[11px] text-[#2ee59d] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ee59d] animate-ping" />
                Jonli telemetriya
              </span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label="Sidebar collapse"
            className="p-2 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] text-[#9a9ac0] hover:text-[#e8e8f5] transition ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};

