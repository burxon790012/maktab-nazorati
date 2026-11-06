/// <reference path="./declarations.d.ts" />
// SMART CHILD — Production Multi-School Fleet Management Platform
import React, { useEffect, useState, useMemo } from 'react';
import { School, Student, User, AuditLog, NotificationItem, Role } from '@/types';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { Topbar, ViewMode } from '@/components/Topbar';
import { KpiCards, KpiFilter } from '@/components/KpiCards';
import { MapView } from '@/components/MapView';
import { DevicesTab, DeviceInfo } from '@/components/DevicesTab';
import { StudentsTab } from '@/components/StudentsTab';
import { AttendanceTab } from '@/components/AttendanceTab';
import { HealthTab } from '@/components/HealthTab';
import { ParentTab } from '@/components/ParentTab';
import { ReportsTab } from '@/components/ReportsTab';
import { SuperAdminTab } from '@/components/SuperAdminTab';
import {
  AddSchoolDialog,
  EditSchoolDialog,
  AddStudentDialog,
  BulkImportDialog,
  CorrectionDialog,
  NotificationDrawer,
} from '@/components/Modals';

export const App: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [devicesList, setDevicesList] = useState<DeviceInfo[]>([]);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');

  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<NavTab>('map');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('ALL');
  const [currentRole, setCurrentRole] = useState<Role>('SUPER_ADMIN');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('ALL');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [token, setToken] = useState<string>(() => localStorage.getItem('maktab_auth_token') || '');

  // Layout UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Modals state
  const [openAddSchool, setOpenAddSchool] = useState(false);
  const [openEditSchool, setOpenEditSchool] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openBulkImport, setOpenBulkImport] = useState(false);
  const [openCorrection, setOpenCorrection] = useState(false);
  const [studentToCorrect, setStudentToCorrect] = useState<Student | null>(null);
  const [openNotifDrawer, setOpenNotifDrawer] = useState(false);

  // Authenticated fetch wrapper
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const activeToken = token || localStorage.getItem('maktab_auth_token');
    const headers = new Headers(options.headers || {});
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }
    return fetch(url, { ...options, headers });
  };

  const loginWithRole = async (role: Role) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password: 'password123' }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('maktab_auth_token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('maktab_refresh_token', data.refreshToken);
        }
        return data.token;
      }
    } catch (err) {
      console.error('Error logging in with role:', err);
    }
    return null;
  };

  // Data Fetching
  const fetchSchools = async () => {
    try {
      const res = await authFetch('/api/v1/schools');
      const data = await res.json();
      if (data.success) {
        setSchools(data.schools);
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await authFetch(`/api/v1/students?schoolId=${selectedSchoolId}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await authFetch('/api/v1/audit-logs');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/api/alerts');
      const data = await res.json();
      if (data.success && data.alerts) {
        setNotifications(data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await authFetch('/api/devices');
      const data = await res.json();
      if (data.success && data.devices) {
        setDevicesList(data.devices);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/v1/config');
      const data = await res.json();
      if (data && data.googleMapsApiKey) {
        setGoogleMapsApiKey(data.googleMapsApiKey);
      }
    } catch (_) {}
  };

  useEffect(() => {
    let isMounted = true;
    loginWithRole(currentRole).then(() => {
      if (!isMounted) return;
      fetchSchools();
      fetchUsers();
      fetchAuditLogs();
      fetchNotifications();
      fetchStudents();
      fetchDevices();
      fetchConfig();
    });
    return () => {
      isMounted = false;
    };
  }, [currentRole]);

  useEffect(() => {
    fetchStudents();
  }, [selectedSchoolId]);

  // Invalidate Map size on Tab or ViewMode switch (Xarita / Kartalar / Ro'yxat)
  useEffect(() => {
    if (currentTab === 'map') {
      const t1 = setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      const t2 = setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [currentTab, viewMode]);

  // Real-Time SSE Stream Setup
  useEffect(() => {
    let sse: EventSource | null = null;
    let active = true;

    const initSse = async () => {
      let streamUrl = '/api/v1/stream';
      try {
        const activeToken = token || localStorage.getItem('maktab_auth_token');
        if (activeToken) {
          const ticketRes = await fetch('/api/v1/stream/ticket', {
            method: 'POST',
            headers: { Authorization: `Bearer ${activeToken}` },
          });
          const ticketData = await ticketRes.json();
          if (ticketData.success && ticketData.ticket) {
            streamUrl = `/api/v1/stream?ticket=${ticketData.ticket}`;
          }
        }
      } catch (_) {}

      if (!active) return;
      sse = new EventSource(streamUrl);
      sse.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (
            d.event === 'telemetry' ||
            d.event === 'location_update' ||
            d.event === 'attendance_updated' ||
            d.event === 'geofence_updated' ||
            d.event === 'geofence_alert' ||
            d.event === 'student_added' ||
            d.event === 'device_status_update'
          ) {
            fetchStudents();
            fetchDevices();
          } else if (
            d.event === 'school_added' ||
            d.event === 'school_updated' ||
            d.event === 'school_deleted'
          ) {
            fetchSchools();
            fetchStudents();
            fetchAuditLogs();
          } else if (d.event === 'notification') {
            fetchNotifications();
          }
        } catch (_) {}
      };
    };

    initSse();

    return () => {
      active = false;
      if (sse) sse.close();
    };
  }, [token]);

  // Theme switcher
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  // KPI Statistics Calculations
  const stats = useMemo(() => {
    let inside = 0;
    let outside = 0;
    let verifying = 0;
    let sos = 0;
    let totalBattery = 0;
    let batteryCount = 0;

    students.forEach((s) => {
      const t = s.telemetry;
      if (!t) return;
      if (t.geofenceStatus === 'INSIDE') inside++;
      else if (t.geofenceStatus === 'VERIFYING') verifying++;
      else outside++;

      if (t.isSos) sos++;
      if (t.batteryLevel !== undefined && t.batteryLevel !== null) {
        totalBattery += t.batteryLevel;
        batteryCount++;
      }
    });

    const onlineWatches = devicesList.filter((d) => d.status === 'ONLINE').length;
    const offlineWatches = devicesList.filter((d) => d.status === 'OFFLINE' || d.status === 'DELAYED').length;
    const avgBattery = batteryCount > 0 ? Math.round(totalBattery / batteryCount) : 86;

    return {
      inside,
      outside,
      verifying,
      sos,
      onlineWatches,
      offlineWatches,
      totalStudents: students.length,
      avgBattery,
    };
  }, [students, devicesList]);

  // Actions
  const handleRegisterDevice = async (deviceData: any) => {
    const res = await authFetch('/api/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData),
    });
    const d = await res.json();
    if (d.success) {
      fetchDevices();
      fetchStudents();
      return d;
    } else {
      throw new Error(d.message || "Xatolik yuz berdi");
    }
  };

  const handleRegenerateToken = async (deviceId: string) => {
    const res = await authFetch(`/api/devices/${deviceId}/regenerate-token`, {
      method: 'POST',
    });
    const d = await res.json();
    if (d.success) {
      fetchDevices();
      return d;
    } else {
      throw new Error(d.message || "Xatolik yuz berdi");
    }
  };

  const handleMarkAllAlertsRead = async () => {
    await authFetch('/api/alerts/mark-all-read', { method: 'POST' });
    fetchNotifications();
  };

  const handleSaveGeofence = async (
    schoolId: string,
    polygon: [number, number][],
    name?: string,
    isNewSchool?: boolean
  ) => {
    if (isNewSchool) {
      const avgLat = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
      const avgLng = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
      const res = await authFetch('/api/v1/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || '30-maktab',
          polygon,
          lat: avgLat,
          lng: avgLng,
          address: "O'zbekiston",
        }),
      });
      const d = await res.json();
      if (d.success) {
        await fetchSchools();
        await fetchStudents();
        await fetchAuditLogs();
        return d.school;
      } else {
        throw new Error(d.message || "Yangi maktabni saqlashda xatolik yuz berdi");
      }
    } else {
      const res = await authFetch(`/api/v1/schools/${schoolId}/geofence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon, name }),
      });
      const d = await res.json();
      if (d.success) {
        await fetchSchools();
        await fetchStudents();
        await fetchAuditLogs();
        return d.school;
      } else {
        throw new Error(d.message || "Geozonani saqlashda xatolik yuz berdi");
      }
    }
  };

  const handleTriggerSos = async () => {
    await authFetch('/api/v1/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: 'watch-5pro-01', latitude: 41.31112, longitude: 69.24061 }),
    });
    fetchStudents();
    fetchNotifications();
    alert("🚨 SOS SIGNAL YUBORILDI!");
  };

  const unreadAlertsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1b1b33] text-[#e8e8f5]">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'map') setViewMode('map');
          else if (tab === 'students') setViewMode('cards');
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          viewMode={viewMode}
          onChangeViewMode={(mode) => {
            setViewMode(mode);
            if (mode === 'map') setCurrentTab('map');
            else if (mode === 'cards' || mode === 'list') setCurrentTab('students');
          }}
          schools={schools}
          selectedSchoolId={selectedSchoolId}
          onSelectSchool={setSelectedSchoolId}
          alerts={notifications}
          unreadAlertsCount={unreadAlertsCount}
          onOpenAlerts={() => setOpenNotifDrawer(true)}
          onMarkAllAlertsRead={handleMarkAllAlertsRead}
          darkMode={theme === 'dark'}
          onToggleDarkMode={toggleTheme}
          currentRole={currentRole}
          onChangeRole={(r) => setCurrentRole(r as Role)}
          onLogout={() => {
            localStorage.removeItem('maktab_auth_token');
            setToken('');
            loginWithRole('PARENT');
          }}
          isDemoMode={isDemoMode}
          onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        />

        {/* Dashboard Workspace */}
        <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 gap-3 overflow-hidden">
          {/* KPI Summary Cards Row */}
          <KpiCards
            stats={stats}
            activeFilter={kpiFilter}
            onSelectFilter={(f) => {
              setKpiFilter(f);
              if (currentTab !== 'map' && currentTab !== 'students') {
                setCurrentTab('map');
              }
            }}
          />

          {/* Active View / Main Tab Display */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#2a2a4a]/40 border border-[#3a3a63]/40 rounded-2xl overflow-hidden shadow-xl">
            {/* Map Container View (Kept mounted for map, geozones, and routes so Leaflet tiles and sizing are never destroyed) */}
            <div className={`flex-1 flex flex-col min-h-0 w-full h-full ${currentTab === 'map' || currentTab === 'geozones' || currentTab === 'routes' ? 'flex' : 'hidden'}`}>
              <MapView
                schools={schools}
                students={students}
                onSaveGeofence={handleSaveGeofence}
                selectedSchoolId={selectedSchoolId}
                onRefreshData={fetchStudents}
                activeFilter={kpiFilter}
                onSelectFilter={(f) => setKpiFilter(f as KpiFilter)}
                googleMapsApiKey={googleMapsApiKey}
                activeNavTab={currentTab}
              />
            </div>

            {currentTab === 'students' && (
              <div className="flex-1 overflow-y-auto p-4">
                <StudentsTab
                  students={students}
                  onOpenAddSingle={() => setOpenAddStudent(true)}
                  onOpenBulkImport={() => setOpenBulkImport(true)}
                  onOpenTransfer={() => {}}
                  onDeleteStudent={async (id) => {
                    await authFetch(`/api/v1/students/${id}`, { method: 'DELETE' });
                    fetchStudents();
                  }}
                  onViewOnMap={() => {
                    setCurrentTab('map');
                    setViewMode('map');
                  }}
                />
              </div>
            )}

            {currentTab === 'devices' && (
              <DevicesTab
                devices={devicesList}
                students={students}
                onRefresh={fetchDevices}
                onRegisterDevice={handleRegisterDevice}
                onRegenerateToken={handleRegenerateToken}
              />
            )}

            {currentTab === 'alerts' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#3a3a63]/40">
                  <h2 className="text-lg font-bold text-[#e8e8f5]">Barcha Ogohlantirishlar va SOS Hodisalari</h2>
                  {unreadAlertsCount > 0 && (
                    <button
                      onClick={handleMarkAllAlertsRead}
                      className="px-3 py-1.5 rounded-xl bg-[#2ee59d] text-[#1b1b33] text-xs font-bold"
                    >
                      Barchasini o'qilgan deb belgilash
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border transition ${
                        n.isRead
                          ? 'bg-[#2a2a4a]/40 border-[#3a3a63]/30 text-[#9a9ac0]'
                          : 'bg-[#2a2a4a] border-[#ff4d5e]/50 text-[#e8e8f5] shadow-lg shadow-[#ff4d5e]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#e8e8f5]">{n.title}</span>
                        <span className="text-xs text-[#9a9ac0]">{n.time}</span>
                      </div>
                      <p className="text-xs text-[#9a9ac0] mt-1.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentTab === 'health' && (
              <div className="flex-1 overflow-y-auto p-4">
                <HealthTab students={students} />
              </div>
            )}

            {currentTab === 'parents' && (
              <div className="flex-1 overflow-y-auto p-4">
                <ParentTab students={students} onTriggerSos={handleTriggerSos} />
              </div>
            )}

            {currentTab === 'reports' && (
              <div className="flex-1 overflow-y-auto p-4">
                <ReportsTab auditLogs={auditLogs} />
              </div>
            )}

            {currentTab === 'superadmin' && (
              <div className="flex-1 overflow-y-auto p-4">
                <SuperAdminTab
                  schools={schools}
                  students={students}
                  users={users}
                  onOpenAddSchool={() => setOpenAddSchool(true)}
                  onOpenEditSchool={(s) => {
                    setSchoolToEdit(s);
                    setOpenEditSchool(true);
                  }}
                  onOpenAddUser={() => {}}
                  onFlyToSchool={() => setCurrentTab('map')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <AddSchoolDialog
        open={openAddSchool}
        onOpenChange={setOpenAddSchool}
        onAddSchool={async (sch) => {
          await authFetch('/api/v1/schools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sch),
          });
          fetchSchools();
        }}
      />

      <EditSchoolDialog
        open={openEditSchool}
        onOpenChange={setOpenEditSchool}
        school={schoolToEdit}
        onUpdateSchool={async (id, updates) => {
          await authFetch(`/api/v1/schools/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          fetchSchools();
        }}
        onDeleteSchool={async (id) => {
          await authFetch(`/api/v1/schools/${id}`, { method: 'DELETE' });
          fetchSchools();
        }}
      />

      <AddStudentDialog
        open={openAddStudent}
        onOpenChange={setOpenAddStudent}
        schools={schools}
        onAddStudent={async (data) => {
          await authFetch('/api/v1/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          fetchStudents();
        }}
      />

      <BulkImportDialog
        open={openBulkImport}
        onOpenChange={setOpenBulkImport}
        schools={schools}
        onBulkImport={async (schoolId, text) => {
          const lines = text.trim().split('\n');
          const studentsArr = lines.map((l) => {
            const p = l.split(',').map((x) => x.trim());
            return {
              studentId: p[0],
              name: p[1],
              className: p[2] || '5-B',
              parentPhone: p[3] || '+998901112233',
              deviceId: p[4] || `watch-5pro-${p[0]}`,
            };
          });
          await authFetch('/api/v1/students/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schoolId, students: studentsArr }),
          });
          fetchStudents();
        }}
      />

      <CorrectionDialog
        open={openCorrection}
        onOpenChange={setOpenCorrection}
        student={studentToCorrect}
        onSubmitCorrection={async (studentId, status, reason) => {
          await authFetch('/api/v1/attendance/correct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, status, reason, teacherId: "Dilnoza Karimova" }),
          });
          fetchStudents();
        }}
      />

      <NotificationDrawer
        open={openNotifDrawer}
        onClose={() => setOpenNotifDrawer(false)}
        notifications={notifications}
      />
    </div>
  );
};

export default App;
