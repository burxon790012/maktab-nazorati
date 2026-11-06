import React from 'react';
import { Role, School } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Bell, Sun, Moon, Footprints, School as SchoolIcon, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  selectedSchoolId: string;
  setSelectedSchoolId: (id: string) => void;
  schools: School[];
  onOpenAddSchool: () => void;
  onSimulateWalk: (stage: 'ENTER_SCHOOL' | 'LEAVE_SCHOOL') => void;
  unreadCount: number;
  onToggleNotif: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  selectedSchoolId,
  setSelectedSchoolId,
  schools,
  onOpenAddSchool,
  onSimulateWalk,
  unreadCount,
  onToggleNotif,
  theme,
  toggleTheme,
}) => {
  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'default';
      case 'SCHOOL_ADMIN': return 'info';
      case 'TEACHER': return 'warning';
      case 'PARENT': return 'success';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight">SMART CHILD</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0 font-bold border-primary/40 text-primary">
              v2.5 PRO
            </Badge>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-medium hidden sm:block">
            Samsung Watch5 Pro • GPS Geofence Davomat Tizimi
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-card/60 border border-border px-2.5 py-1 rounded-lg">
          <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as Role)}
            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="SUPER_ADMIN" className="bg-card">👑 Super Admin</option>
            <option value="SCHOOL_ADMIN" className="bg-card">🏫 Maktab Admini</option>
            <option value="TEACHER" className="bg-card">👩‍🏫 O'qituvchi</option>
            <option value="PARENT" className="bg-card">📱 Ota-ona</option>
          </select>
          <Badge variant={getRoleBadgeVariant(currentRole)} className="text-xs py-0">
            {currentRole}
          </Badge>
        </div>

        {/* School Switcher */}
        <div className="flex items-center gap-1.5 bg-card/60 border border-border px-2.5 py-1 rounded-lg">
          <SchoolIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL" className="bg-card">🌐 Barcha Maktablar</option>
            {schools.map((sch) => (
              <option key={sch.id} value={sch.id} className="bg-card">
                {sch.id}: {sch.name}
              </option>
            ))}
          </select>

          {currentRole === 'SUPER_ADMIN' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAddSchool}
              className="h-6 px-2 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
              title="Yangi maktab ro'yxatdan o'tkazish"
            >
              <Plus className="w-3 h-3" />
              <span>Maktab</span>
            </Button>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Quick GPS Walk Simulator */}
        <div className="hidden lg:flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSimulateWalk('ENTER_SCHOOL')}
            className="h-7 text-xs px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            title="Bolaning maktabga kirishini sinash"
          >
            <Footprints className="w-3.5 h-3.5 mr-1" />
            Kirish
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSimulateWalk('LEAVE_SCHOOL')}
            className="h-7 text-xs px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            title="Bolaning maktabdan chiqishini sinash"
          >
            Chiqish
          </Button>
        </div>

        {/* Notifications */}
        <Button
          size="icon"
          variant="outline"
          onClick={onToggleNotif}
          className="relative h-8 w-8 rounded-lg"
          title="Xabarnomalar"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>

        {/* Dark/Light mode */}
        <Button
          size="icon"
          variant="outline"
          onClick={toggleTheme}
          className="h-8 w-8 rounded-lg"
          title="Mavzuni almashtirish"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </Button>
      </div>
    </header>
  );
};
