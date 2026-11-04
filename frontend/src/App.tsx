/// <reference path="./declarations.d.ts" />
// SMART CHILD — Production Multi-School React TSX Dashboard with shadcn/ui
import React, { useEffect, useState } from 'react';
import { School, Student, User, AuditLog, NotificationItem, Role } from '@/types';
import { Navbar } from '@/components/Navbar';
import { MapView } from '@/components/MapView';
import { SuperAdminTab } from '@/components/SuperAdminTab';
import { AttendanceTab } from '@/components/AttendanceTab';
import { StudentsTab } from '@/components/StudentsTab';
import { HealthTab } from '@/components/HealthTab';
import { ParentTab } from '@/components/ParentTab';
import { ReportsTab } from '@/components/ReportsTab';
import {
  AddSchoolDialog,
  EditSchoolDialog,
  AddStudentDialog,
  BulkImportDialog,
  CorrectionDialog,
  NotificationDrawer,
} from '@/components/Modals';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Map, Shield, ClipboardCheck, Users, Heart, Smartphone, BarChart3 } from 'lucide-react';

export const App: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Navigation & Role states
  const [activeTab, setActiveTab] = useState('tab-map');
  const [currentRole, setCurrentRole] = useState<Role>('SUPER_ADMIN');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('ALL');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals state
  const [openAddSchool, setOpenAddSchool] = useState(false);
  const [openEditSchool, setOpenEditSchool] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openBulkImport, setOpenBulkImport] = useState(false);
  const [openCorrection, setOpenCorrection] = useState(false);
  const [studentToCorrect, setStudentToCorrect] = useState<Student | null>(null);
  const [openNotifDrawer, setOpenNotifDrawer] = useState(false);

  // 1. Fetch initial data
  const fetchSchools = async () => {
    try {
      const res = await fetch('/api/v1/schools');
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
      const res = await fetch(`/api/v1/students?schoolId=${selectedSchoolId}`);
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
      const res = await fetch('/api/v1/users');
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
      const res = await fetch('/api/v1/audit-logs');
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
      const res = await fetch('/api/v1/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchUsers();
    fetchAuditLogs();
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedSchoolId]);

  // 2. Real-Time SSE Stream Setup
  useEffect(() => {
    const sse = new EventSource('/api/v1/stream');
    sse.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (
          d.event === 'telemetry' ||
          d.event === 'attendance_updated' ||
          d.event === 'geofence_updated' ||
          d.event === 'student_added'
        ) {
          fetchStudents();
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

    return () => {
      sse.close();
    };
  }, []);

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

  // API Actions
  const handleAddSchool = async (schoolData: any) => {
    const res = await fetch('/api/v1/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolData),
    });
    const d = await res.json();
    if (d.success) {
      fetchSchools();
    } else {
      alert(d.message);
    }
  };

  const handleUpdateSchool = async (id: string, updates: any) => {
    const res = await fetch(`/api/v1/schools/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const d = await res.json();
    if (d.success) {
      fetchSchools();
      fetchStudents();
      fetchAuditLogs();
    } else {
      alert(d.message);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    const res = await fetch(`/api/v1/schools/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      fetchSchools();
      fetchStudents();
      fetchAuditLogs();
    } else {
      alert(d.message);
    }
  };

  const handleAddStudent = async (data: any) => {
    const res = await fetch('/api/v1/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (d.success) {
      fetchStudents();
      fetchAuditLogs();
    } else {
      alert(d.message);
    }
  };

  const handleBulkImport = async (schoolId: string, text: string) => {
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

    const res = await fetch('/api/v1/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId, students: studentsArr }),
    });
    const d = await res.json();
    if (d.success) {
      fetchStudents();
      fetchAuditLogs();
    } else {
      alert(d.message);
    }
  };

  const handleSaveGeofence = async (schoolId: string, polygon: [number, number][]) => {
    const res = await fetch(`/api/v1/schools/${schoolId}/geofence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ polygon }),
    });
    const d = await res.json();
    if (d.success) {
      fetchSchools();
      fetchStudents();
      fetchAuditLogs();
    } else {
      alert(d.message);
    }
  };

  const handleSubmitCorrection = async (studentId: string, status: string, reason: string) => {
    const res = await fetch('/api/v1/attendance/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, status, reason, teacherId: "Dilnoza Karimova (O'qituvchi)" }),
    });
    const d = await res.json();
    if (d.success) {
      fetchStudents();
      fetchAuditLogs();
    } else {
      alert(d.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const res = await fetch(`/api/v1/students/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      fetchStudents();
      fetchAuditLogs();
    } else {
      alert(d.message);
    }
  };

  const handleSimulateWalk = async (stage: 'ENTER_SCHOOL' | 'LEAVE_SCHOOL') => {
    const res = await fetch('/api/v1/telemetry/simulate-walk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: '10001', stage }),
    });
    const d = await res.json();
    if (d.success) {
      fetchStudents();
    }
  };

  const handleTriggerSos = async () => {
    await fetch('/api/v1/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: 'watch-5pro-01', latitude: 41.31112, longitude: 69.24061 }),
    });
    fetchStudents();
    fetchNotifications();
    alert("🚨 SOS SIGNAL YUBORILDI!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        selectedSchoolId={selectedSchoolId}
        setSelectedSchoolId={setSelectedSchoolId}
        schools={schools}
        onOpenAddSchool={() => setOpenAddSchool(true)}
        onSimulateWalk={handleSimulateWalk}
        unreadCount={notifications.length}
        onToggleNotif={() => setOpenNotifDrawer(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main App Content & Tabs */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-1">
            <TabsList>
              <TabsTrigger value="tab-map" className="gap-1.5">
                <Map className="w-4 h-4 text-emerald-400" />
                Xarita & Chegara
              </TabsTrigger>

              {currentRole === 'SUPER_ADMIN' && (
                <TabsTrigger value="tab-superadmin" className="gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Super Admin
                </TabsTrigger>
              )}

              <TabsTrigger value="tab-attendance" className="gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-blue-400" />
                Aqlli Davomat
              </TabsTrigger>

              <TabsTrigger value="tab-students" className="gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                O'quvchilar
              </TabsTrigger>

              <TabsTrigger value="tab-health" className="gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Salomatlik
              </TabsTrigger>

              <TabsTrigger value="tab-parent" className="gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-400" />
                Ota-ona Ilovasi
              </TabsTrigger>

              <TabsTrigger value="tab-reports" className="gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Hisobotlar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: LIVE MAP */}
          <TabsContent value="tab-map">
            <MapView
              schools={schools}
              students={students}
              onSaveGeofence={handleSaveGeofence}
              selectedSchoolId={selectedSchoolId}
              onRefreshData={async () => {
                await fetchStudents();
                await fetchSchools();
              }}
            />
          </TabsContent>

          {/* TAB 2: SUPER ADMIN */}
          {currentRole === 'SUPER_ADMIN' && (
            <TabsContent value="tab-superadmin">
              <SuperAdminTab
                schools={schools}
                students={students}
                users={users}
                onOpenAddSchool={() => setOpenAddSchool(true)}
                onOpenEditSchool={(sch) => {
                  setSchoolToEdit(sch);
                  setOpenEditSchool(true);
                }}
                onOpenAddUser={() => alert("Admin/O'qituvchi qo'shish oynasi")}
                onFlyToSchool={(sch) => {
                  setSelectedSchoolId(sch.id);
                  setActiveTab('tab-map');
                }}
              />
            </TabsContent>
          )}

          {/* TAB 3: ATTENDANCE */}
          <TabsContent value="tab-attendance">
            <AttendanceTab
              students={students}
              selectedSchoolId={selectedSchoolId}
              onOpenCorrection={(std) => {
                setStudentToCorrect(std);
                setOpenCorrection(true);
              }}
              onViewOnMap={(std) => {
                if (std.schoolId) setSelectedSchoolId(std.schoolId);
                setActiveTab('tab-map');
              }}
            />
          </TabsContent>

          {/* TAB 4: STUDENTS */}
          <TabsContent value="tab-students">
            <StudentsTab
              students={students}
              onOpenAddSingle={() => setOpenAddStudent(true)}
              onOpenBulkImport={() => setOpenBulkImport(true)}
              onOpenTransfer={() => alert("Transfer oynasi")}
              onDeleteStudent={handleDeleteStudent}
              onViewOnMap={(std) => {
                if (std.schoolId) setSelectedSchoolId(std.schoolId);
                setActiveTab('tab-map');
              }}
            />
          </TabsContent>

          {/* TAB 5: HEALTH */}
          <TabsContent value="tab-health">
            <HealthTab students={students} />
          </TabsContent>

          {/* TAB 6: PARENT */}
          <TabsContent value="tab-parent">
            <ParentTab students={students} onTriggerSos={handleTriggerSos} />
          </TabsContent>

          {/* TAB 7: REPORTS */}
          <TabsContent value="tab-reports">
            <ReportsTab auditLogs={auditLogs} />
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOGS */}
      <AddSchoolDialog
        open={openAddSchool}
        onOpenChange={setOpenAddSchool}
        onAddSchool={handleAddSchool}
      />

      <EditSchoolDialog
        open={openEditSchool}
        onOpenChange={setOpenEditSchool}
        school={schoolToEdit}
        onUpdateSchool={handleUpdateSchool}
        onDeleteSchool={handleDeleteSchool}
      />

      <AddStudentDialog
        open={openAddStudent}
        onOpenChange={setOpenAddStudent}
        schools={schools}
        onAddStudent={handleAddStudent}
      />

      <BulkImportDialog
        open={openBulkImport}
        onOpenChange={setOpenBulkImport}
        schools={schools}
        onBulkImport={handleBulkImport}
      />

      <CorrectionDialog
        open={openCorrection}
        onOpenChange={setOpenCorrection}
        student={studentToCorrect}
        onSubmitCorrection={handleSubmitCorrection}
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
