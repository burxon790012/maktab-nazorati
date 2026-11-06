/// <reference path="./declarations.d.ts" />
// SMART CHILD — Production Multi-School Fleet Management Platform
import React, { useEffect, useState, useMemo } from 'react';
import { School, Student, User, AuditLog, NotificationItem, Role } from '@/types';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { Topbar, ViewMode } from '@/components/Topbar';
import { RightStatsColumn } from '@/components/RightStatsColumn';
import { MobileBottomSheet } from '@/components/MobileBottomSheet';
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

export type KpiFilter = 'ALL' | 'INSIDE' | 'OUTSIDE' | 'VERIFYING' | 'SOS' | 'ONLINE' | 'OFFLINE';

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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Theme state (persisted in localStorage inside try/catch)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('maktab_theme') as any) || 'dark';
    } catch (_) {
      return 'dark';
    }
  });

  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem('maktab_auth_token') || '';
    } catch (_) {
      return '';
    }
  });

  // Layout UI State (persisted in localStorage inside try/catch)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('maktab_sidebar_collapsed') === 'true';
    } catch (_) {
      return false;
    }
  });

  const [statsCollapsed, setStatsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('maktab_stats_collapsed') === 'true';
    } catch (_) {
      return false;
    }
  });

  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);
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

  // Apply Theme to DOM
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('maktab_theme', next);
    } catch (_) {}
  };

  // Authenticated fetch wrapper
  const authFetch = async (url: string, options: RequestInit = {}) => {
    let activeToken = token;
    try {
      activeToken = token || localStorage.getItem('maktab_auth_token') || '';
    } catch (_) {}

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
        try {
          localStorage.setItem('maktab_auth_token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('maktab_refresh_token', data.refreshToken);
          }
        } catch (_) {}
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
      const res = await authFetch('/api/v1/students');
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
      const res = await authFetch('/api/v1/reports/audit');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/api/v1/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await authFetch('/api/v1/devices');
      const data = await res.json();
      if (data.success) {
        setDevicesList(data.devices);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };

  const fetchGoogleMapsApiKey = async () => {
    try {
      const res = await fetch('/api/v1/config/maps-key');
      const data = await res.json();
      if (data.success && data.googleMapsApiKey) {
        setGoogleMapsApiKey(data.googleMapsApiKey);
      }
    } catch (err) {
      console.warn('Google Maps API kalitini olishda xatolik:', err);
    }
  };

  // Initial Data Load
  useEffect(() => {
    const initApp = async () => {
      let activeTok = token;
      if (!activeTok) {
        activeTok = await loginWithRole('SUPER_ADMIN') || '';
      }
      await Promise.all([
        fetchSchools(),
        fetchStudents(),
        fetchUsers(),
        fetchAuditLogs(),
        fetchNotifications(),
        fetchDevices(),
        fetchGoogleMapsApiKey(),
      ]);
    };
    initApp();
  }, []);

  // Polling for live telemetry in Demo/Production mode (every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStudents();
      fetchNotifications();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket Live Updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('⚡ [FLEET WS] Jonli telemetriya ulandi');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'telemetry_update' && msg.data) {
            setStudents((prev) =>
              prev.map((s) => (s.id === msg.data.id ? { ...s, ...msg.data } : s))
            );
          } else if (msg.event === 'sos_alert') {
            fetchNotifications();
            fetchStudents();
          } else if (msg.event === 'school_added' || msg.event === 'school_updated') {
            fetchSchools();
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWs, 3000);
      };
    };

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Handlers
  const handleMarkAllAlertsRead = async () => {
    try {
      await authFetch('/api/v1/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking alerts read:', err);
    }
  };

  const handleRegisterDevice = async (data: { deviceId: string; studentId: string; model: string }) => {
    try {
      const res = await authFetch('/api/v1/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (d.success) {
        fetchDevices();
        fetchStudents();
      }
    } catch (err) {
      console.error('Device register error:', err);
    }
  };

  const handleRegenerateToken = async (deviceId: string) => {
    try {
      const res = await authFetch(`/api/v1/devices/${deviceId}/token`, { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        fetchDevices();
      }
    } catch (err) {
      console.error('Token regeneration error:', err);
    }
  };

  const handleSaveGeofence = async (
    schoolId: string,
    polygon: [number, number][],
    name?: string,
    isNewSchool = false,
    lat?: number,
    lng?: number
  ) => {
    const avgLat = lat !== undefined && isFinite(lat)
      ? lat
      : polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
    const avgLng = lng !== undefined && isFinite(lng)
      ? lng
      : polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;

    if (isNewSchool || schoolId === 'NEW') {
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
        body: JSON.stringify({ polygon, name, lat: avgLat, lng: avgLng }),
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

  const handleSendEmergencySos = async (student?: Student | null) => {
    try {
      const devId = student?.deviceId || 'watch-5pro-01';
      const lat = student?.telemetry?.latitude || 41.31112;
      const lng = student?.telemetry?.longitude || 69.24061;
      await authFetch('/api/v1/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: devId, latitude: lat, longitude: lng }),
      });
      await fetchStudents();
      await fetchNotifications();
    } catch (err) {
      console.error('SOS sending error:', err);
    }
  };

  const handleSimulateWalk = async (stage: 'ENTER_SCHOOL' | 'LEAVE_SCHOOL' | 'APPROACHING_GATE' | 'OUTSIDE_STREET') => {
    try {
      const studentId = selectedStudent?.id || students[0]?.id || 'STU001';
      await authFetch('/api/v1/telemetry/simulate-walk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, stage }),
      });
      await fetchStudents();
    } catch (err) {
      console.error('Simulate walk error:', err);
    }
  };

  const unreadAlertsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden bg-[#0b1220] text-[#eaf2ff] select-none ${
        theme === 'dark' ? 'dark' : 'light'
      }`}
    >
      {/* 1. Left Sidebar Navigation (72px collapsed, 240px expanded) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'map') setViewMode('map');
          else if (tab === 'students') setViewMode('cards');
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => {
          const next = !sidebarCollapsed;
          setSidebarCollapsed(next);
          try {
            localStorage.setItem('maktab_sidebar_collapsed', String(next));
          } catch (_) {}
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar (~56px) */}
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
            try {
              localStorage.removeItem('maktab_auth_token');
            } catch (_) {}
            setToken('');
            loginWithRole('PARENT');
          }}
          isDemoMode={isDemoMode}
          onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
          activeSosStudent={
            students.find((s) => s.telemetry?.isSos) || null
          }
          onSelectSosStudent={(s) => {
            setSelectedStudent(s);
            if (currentTab !== 'map') setCurrentTab('map');
          }}
          onToggleStats={() => setStatsDrawerOpen(!statsDrawerOpen)}
          isStatsOpen={statsDrawerOpen}
        />

        {/* 3. Fleet Dashboard Workspace: Central Map + Right Stats Column (340px) */}
        <div className="flex-1 flex min-h-0 w-full h-full p-2 sm:p-2.5 gap-2 sm:gap-2.5 overflow-hidden relative">
          {/* Main View Area */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full overflow-hidden">
            {/* Map Container View (Kept mounted for map, geozones, and routes) */}
            <div
              className={`flex-1 flex flex-col min-h-0 w-full h-full ${
                currentTab === 'map' || currentTab === 'geozones' || currentTab === 'routes'
                  ? 'flex'
                  : 'hidden'
              }`}
            >
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
                selectedStudent={selectedStudent}
                onSelectStudent={setSelectedStudent}
                isDemoMode={isDemoMode}
                onSimulateWalk={handleSimulateWalk}
              />
            </div>

            {currentTab === 'students' && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#101a2e] rounded-2xl border border-white/[0.07]">
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
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#101a2e] rounded-2xl border border-white/[0.07]">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
                  <h2 className="text-lg font-bold text-[#eaf2ff]">Barcha Ogohlantirishlar va SOS Hodisalari</h2>
                  {unreadAlertsCount > 0 && (
                    <button
                      onClick={handleMarkAllAlertsRead}
                      className="px-3 py-1.5 rounded-xl bg-[#2ee59d] text-[#0b1220] text-xs font-bold"
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
                          ? 'bg-white/[0.02] border-white/[0.05] text-[#8ea3c4]'
                          : 'bg-[#ff4d5e]/10 border-[#ff4d5e]/40 text-[#eaf2ff] shadow-lg shadow-[#ff4d5e]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#eaf2ff]">{n.title}</span>
                        <span className="text-xs text-[#8ea3c4]">{n.time}</span>
                      </div>
                      <p className="text-xs text-[#8ea3c4] mt-1.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentTab === 'health' && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#101a2e] rounded-2xl border border-white/[0.07]">
                <HealthTab students={students} />
              </div>
            )}

            {currentTab === 'parents' && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#101a2e] rounded-2xl border border-white/[0.07]">
                <ParentTab students={students} onTriggerSos={() => handleSendEmergencySos(selectedStudent)} />
              </div>
            )}

            {currentTab === 'reports' && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#101a2e] rounded-2xl border border-white/[0.07]">
                <ReportsTab auditLogs={auditLogs} />
              </div>
            )}

            {currentTab === 'superadmin' && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#101a2e] rounded-2xl border border-white/[0.07]">
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

          {/* Right Stats Column: 340px (Rendered when viewing map/geozones/routes or via drawer) */}
          {(currentTab === 'map' || currentTab === 'geozones' || currentTab === 'routes') && (
            <RightStatsColumn
              students={students}
              activeFilter={kpiFilter}
              onSelectFilter={(f) => setKpiFilter(f as any)}
              alerts={notifications}
              onOpenAlerts={() => setCurrentTab('alerts')}
              selectedStudent={selectedStudent}
              onCloseSelectedStudent={() => setSelectedStudent(null)}
              onFocusStudent={(s) => setSelectedStudent(s)}
              onTriggerSos={handleSendEmergencySos}
              collapsed={statsCollapsed}
              onToggleCollapse={() => {
                const next = !statsCollapsed;
                setStatsCollapsed(next);
                try {
                  localStorage.setItem('maktab_stats_collapsed', String(next));
                } catch (_) {}
              }}
              mobileOpen={statsDrawerOpen}
              onCloseMobile={() => setStatsDrawerOpen(false)}
            />
          )}

          {/* Mobile Bottom Sheet (< 768px, test 390px) */}
          {(currentTab === 'map' || currentTab === 'geozones' || currentTab === 'routes') && (
            <MobileBottomSheet
              students={students}
              activeFilter={kpiFilter}
              onSelectFilter={(f) => setKpiFilter(f as any)}
              alerts={notifications}
              onOpenAlerts={() => setCurrentTab('alerts')}
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudent}
              onFocusStudent={(s) => setSelectedStudent(s)}
              onTriggerSos={handleSendEmergencySos}
            />
          )}
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
