import React, { useState, useEffect } from 'react';
import { School, Student } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import {
  Watch,
  Wifi,
  Battery,
  BatteryCharging,
  Radio,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  XCircle,
  ShieldAlert,
  Clock,
  Copy,
  Check,
  Plus,
} from 'lucide-react';

export interface UnknownDevice {
  id: string;
  deviceUid: string;
  model: string;
  firstSeenAt: string;
  lastSeenAt: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  batteryLevel: number | null;
  isCharging: boolean;
  appVersion: string;
  connectionType: string;
  isAssigned: boolean;
}

export interface RegisteredDevice {
  id: string;
  deviceUid: string;
  model: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string | null;
  schoolId?: string;
  schoolName: string;
  className: string;
  firstSeenAt: string;
  lastSeenAt: string;
  registeredAt: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  batteryLevel: number | null;
  isCharging: boolean;
  appVersion: string;
  connectionType: string;
  isRevoked: boolean;
  isAssigned: boolean;
}

interface WatchManagerProps {
  schools: School[];
  students: Student[];
  token?: string;
  onRefreshStudents?: () => void;
}

export const WatchManager: React.FC<WatchManagerProps> = ({
  schools,
  students,
  token = '',
  onRefreshStudents
}) => {
  const [activeTab, setActiveTab] = useState<'unknown' | 'registered'>('unknown');
  const [unknownDevices, setUnknownDevices] = useState<UnknownDevice[]>([]);
  const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<UnknownDevice | RegisteredDevice | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reassign Modal
  const [reassignModalOpen, setReassignModalOpen] = useState<boolean>(false);
  const [reassignReason, setReassignReason] = useState<string>('');

  // Confirmation Modals
  const [unassignModalOpen, setUnassignModalOpen] = useState<boolean>(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState<boolean>(false);

  // Manual Discover Modal
  const [manualDiscoverOpen, setManualDiscoverOpen] = useState<boolean>(false);
  const [manualDevUid, setManualDevUid] = useState<string>('');
  const [manualDevModel, setManualDevModel] = useState<string>('Samsung Galaxy Watch5 Pro (SM-R920)');
  const [manualDevBattery, setManualDevBattery] = useState<number>(100);

  // Submit Manual Device Discovery
  const handleManualDiscoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDevUid.trim()) return;
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch('/api/v1/devices/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceUid: manualDevUid.trim(),
          model: manualDevModel.trim(),
          batteryLevel: Number(manualDevBattery),
          connectionType: 'WIFI',
          appVersion: '1.0.0'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Soatni aniqlashda xatolik");
      }
      setFeedbackMessage({ type: 'success', text: "Yangi soat muvaffaqiyatli aniqlandi va Ro'yxatdan o'tmagan soatlar safiga qo'shildi!" });
      setActiveTab('unknown');
      await fetchDevices();
      setManualDevUid('');
      setTimeout(() => {
        setManualDiscoverOpen(false);
        setFeedbackMessage(null);
      }, 1200);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [unknownRes, registeredRes] = await Promise.all([
        fetch('/api/v1/devices/unknown', { headers }),
        fetch('/api/v1/devices/registered', { headers })
      ]);

      if (unknownRes.ok) {
        const data = await unknownRes.json();
        setUnknownDevices(data.devices || []);
      }
      if (registeredRes.ok) {
        const data = await registeredRes.json();
        setRegisteredDevices(data.devices || []);
      }
    } catch (err) {
      console.error("Soatlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle Copy ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Assign Modal
  const handleOpenAssign = (dev: UnknownDevice) => {
    setSelectedDevice(dev);
    const initialSchool = schools.length > 0 ? schools[0].id : '';
    setSelectedSchoolId(initialSchool);
    const schoolStudents = students.filter(s => s.schoolId === initialSchool);
    setSelectedStudentId(schoolStudents.length > 0 ? schoolStudents[0].id : '');
    setAssignNotes('');
    setFeedbackMessage(null);
    setAssignModalOpen(true);
  };

  // Submit Assignment
  const handleConfirmAssign = async () => {
    if (!selectedDevice || !selectedStudentId) return;
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/v1/devices/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceUid: selectedDevice.deviceUid,
          studentId: selectedStudentId,
          schoolId: selectedSchoolId,
          notes: assignNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Biriktirishda xatolik yuz berdi");
      }

      setFeedbackMessage({ type: 'success', text: "Soat muvaffaqiyatli biriktirildi va ro'yxatdan o'tkazildi!" });
      if (onRefreshStudents) onRefreshStudents();
      await fetchDevices();
      setTimeout(() => {
        setAssignModalOpen(false);
        setFeedbackMessage(null);
      }, 1200);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || "Xatolik yuz berdi" });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reassign Modal
  const handleOpenReassign = (dev: RegisteredDevice) => {
    setSelectedDevice(dev);
    setSelectedSchoolId(dev.schoolId || (schools[0]?.id || ''));
    setSelectedStudentId('');
    setReassignReason('');
    setFeedbackMessage(null);
    setReassignModalOpen(true);
  };

  // Confirm Reassign
  const handleConfirmReassign = async () => {
    if (!selectedDevice || !selectedStudentId) return;
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/v1/devices/reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceUid: selectedDevice.deviceUid,
          newStudentId: selectedStudentId,
          reason: reassignReason || "Super Admin tomonidan qayta biriktirildi"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Qayta biriktirishda xatolik");
      }

      setFeedbackMessage({ type: 'success', text: "Soat yangi o'quvchiga muvaffaqiyatli biriktirildi!" });
      if (onRefreshStudents) onRefreshStudents();
      await fetchDevices();
      setTimeout(() => {
        setReassignModalOpen(false);
        setFeedbackMessage(null);
      }, 1200);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Unassign Modal
  const handleOpenUnassign = (dev: RegisteredDevice) => {
    setSelectedDevice(dev);
    setFeedbackMessage(null);
    setUnassignModalOpen(true);
  };

  // Confirm Unassign
  const handleConfirmUnassign = async () => {
    if (!selectedDevice) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/v1/devices/unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deviceUid: selectedDevice.deviceUid })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setFeedbackMessage({ type: 'success', text: "Soat ajratildi va Notanish soatlar safiga qaytarildi." });
      if (onRefreshStudents) onRefreshStudents();
      await fetchDevices();
      setTimeout(() => {
        setUnassignModalOpen(false);
        setFeedbackMessage(null);
      }, 1000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Revoke Modal
  const handleOpenRevoke = (dev: RegisteredDevice | UnknownDevice) => {
    setSelectedDevice(dev);
    setFeedbackMessage(null);
    setRevokeModalOpen(true);
  };

  // Confirm Revoke
  const handleConfirmRevoke = async () => {
    if (!selectedDevice) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/v1/devices/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deviceUid: selectedDevice.deviceUid, reason: "Super Admin tomonidan bekor qilindi" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setFeedbackMessage({ type: 'success', text: "Qurilma hisob ma'lumotlari butunlay bekor qilindi (Revoked)." });
      if (onRefreshStudents) onRefreshStudents();
      await fetchDevices();
      setTimeout(() => {
        setRevokeModalOpen(false);
        setFeedbackMessage(null);
      }, 1200);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered devices
  const filteredUnknown = unknownDevices.filter(d =>
    d.deviceUid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRegistered = registeredDevices.filter(d =>
    d.deviceUid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDateTime = (ts?: string) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString('uz-UZ', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ONLINE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ONLINE
        </span>
      );
    }
    if (status === 'DELAYED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          DELAYED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-[#8ea3c4] border border-slate-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        OFFLINE
      </span>
    );
  };

  const eligibleStudentsForAssign = students.filter(s =>
    (!selectedSchoolId || s.schoolId === selectedSchoolId) &&
    (!s.deviceId || s.deviceId === selectedDevice?.deviceUid)
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#eaf2ff] flex items-center gap-2">
                Aqlli Soatlar Boshqaruvi va Avtomatik Discovery
              </h2>
              <p className="text-xs text-[#8ea3c4] mt-0.5">
                Samsung Galaxy Watch 5 Pro qurilmalari Wi-Fi orqali serverga ulanganda avtomatik aniqlanadi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDevices}
            disabled={loading}
            className="gap-2 text-xs h-9 border-white/[0.07] hover:bg-white/5 text-[#cbd5e1]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setManualDevUid('');
              setFeedbackMessage(null);
              setManualDiscoverOpen(true);
            }}
            className="gap-2 text-xs h-9 bg-[#2ee59d] hover:bg-[#25c485] text-[#0b1220] font-bold shadow-md shadow-[#2ee59d]/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Soat Qo'shish</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#101a2e] border-white/[0.07]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#8ea3c4]">Jami Soatlar</p>
              <div className="text-2xl font-black text-[#eaf2ff] mt-1">
                {unknownDevices.length + registeredDevices.length}
              </div>
              <p className="text-[11px] text-cyan-400 mt-0.5">Samsung Galaxy Watch 5 Pro</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('unknown')}
          className={`cursor-pointer transition-all border ${
            activeTab === 'unknown'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
              : 'bg-[#101a2e] border-white/[0.07] hover:border-amber-500/30'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <span>Ro'yxatdan O'tmagan Soatlar</span>
                {unknownDevices.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </p>
              <div className="text-2xl font-black text-amber-400 mt-1">{unknownDevices.length} ta</div>
              <p className="text-[11px] text-[#8ea3c4] mt-0.5">O'quvchiga biriktirish kutilmoqda</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('registered')}
          className={`cursor-pointer transition-all border ${
            activeTab === 'registered'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
              : 'bg-[#101a2e] border-white/[0.07] hover:border-emerald-500/30'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-300">Ro'yxatdan O'tgan Soatlar</p>
              <div className="text-2xl font-black text-emerald-400 mt-1">{registeredDevices.length} ta</div>
              <p className="text-[11px] text-[#8ea3c4] mt-0.5">O'quvchilarga to'liq biriktirilgan</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#101a2e] border-white/[0.07]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#8ea3c4]">Jonli Aloqada (Online)</p>
              <div className="text-2xl font-black text-[#eaf2ff] mt-1">
                {[...unknownDevices, ...registeredDevices].filter(d => d.status === 'ONLINE').length}
              </div>
              <p className="text-[11px] text-emerald-400 mt-0.5">Wi-Fi orqali to'g'ridan-to'g'ri faol</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#101a2e] border border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('unknown')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'unknown'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-[#8ea3c4] hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ro'yxatdan O'tmagan Soatlar (Notanish)</span>
            <Badge
              variant="outline"
              className={`ml-1 text-[10px] px-1.5 py-0 border-0 ${
                activeTab === 'unknown' ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-[#cbd5e1]'
              }`}
            >
              {unknownDevices.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('registered')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'registered'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-[#8ea3c4] hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ro'yxatdan O'tgan Soatlar</span>
            <Badge
              variant="outline"
              className={`ml-1 text-[10px] px-1.5 py-0 border-0 ${
                activeTab === 'registered' ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-[#cbd5e1]'
              }`}
            >
              {registeredDevices.length}
            </Badge>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#8ea3c4] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ID, model yoki o'quvchi bo'yicha qidirish..."
            className="h-8 pl-8 text-xs bg-[#16233d] border-white/[0.07] focus-visible:ring-cyan-500"
          />
        </div>
      </div>

      {/* TAB 1: UNKNOWN WATCHES */}
      {activeTab === 'unknown' && (
        <Card className="bg-[#101a2e] border-white/[0.07] overflow-hidden">
          <CardHeader className="p-4 border-b border-white/[0.07] bg-[#0b1220]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#eaf2ff] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Notanish Soatlar Ro'yxati (Unknown Watches)
                </CardTitle>
                <p className="text-xs text-[#8ea3c4] mt-0.5">
                  Ushbu soatlar serverga Wi-Fi orqali bog'langan, ammo hali birorta o'quvchiga biriktirilmagan.
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 font-mono text-xs">
                {filteredUnknown.length} ta kutilmoqda
              </Badge>
            </div>
          </CardHeader>

          {filteredUnknown.length === 0 ? (
            <div className="p-12 text-center text-[#8ea3c4]">
              <Watch className="w-10 h-10 mx-auto text-[#475569] mb-3" />
              <p className="font-semibold text-[#cbd5e1]">Hozircha notanish soatlar mavjud emas</p>
              <p className="text-xs text-[#64748b] mt-1 max-w-md mx-auto">
                Yangi Samsung Galaxy Watch 5 Pro o'zining Wi-Fi tarmog'iga ulanishi bilan uning unikal ID raqami avtomatik ravishda ushbu jadvalda paydo bo'ladi.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#0b1220]/40">
                <TableRow className="border-white/[0.07] hover:bg-transparent">
                  <TableHead className="text-xs text-[#8ea3c4]">Model</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Unikal Device ID</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Ilk Aniqlangan</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Oxirgi Aloqa</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Holat</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Batareya</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Versiya</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4] text-right">Amal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnknown.map((dev) => (
                  <TableRow key={dev.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <Watch className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{dev.model}</span>
                      </div>
                      <div className="text-[10px] text-[#8ea3c4] flex items-center gap-1 mt-0.5">
                        <Wifi className="w-3 h-3 text-cyan-400" />
                        <span>{dev.connectionType}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-xs text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded">
                          {dev.deviceUid}
                        </code>
                        <button
                          onClick={() => handleCopyId(dev.deviceUid)}
                          className="text-[#8ea3c4] hover:text-cyan-400 transition"
                          title="ID nusxalash"
                        >
                          {copiedId === dev.deviceUid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-[#8ea3c4]">
                      {formatDateTime(dev.firstSeenAt)}
                    </TableCell>

                    <TableCell className="text-xs text-[#cbd5e1] font-mono">
                      {formatDateTime(dev.lastSeenAt)}
                    </TableCell>

                    <TableCell>{getStatusBadge(dev.status)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {dev.isCharging ? (
                          <BatteryCharging className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Battery className="w-4 h-4 text-[#8ea3c4]" />
                        )}
                        <span className={dev.batteryLevel && dev.batteryLevel < 20 ? 'text-rose-400' : 'text-slate-200'}>
                          {dev.batteryLevel !== null ? `${dev.batteryLevel}%` : '—'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-[#8ea3c4]">
                      v{dev.appVersion}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAssign(dev)}
                        className="h-7 text-xs px-3 gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 shadow"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Biriktirish</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 2: REGISTERED WATCHES */}
      {activeTab === 'registered' && (
        <Card className="bg-[#101a2e] border-white/[0.07] overflow-hidden">
          <CardHeader className="p-4 border-b border-white/[0.07] bg-[#0b1220]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#eaf2ff] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ro'yxatdan O'tgan Soatlar (Registered Watches)
                </CardTitle>
                <p className="text-xs text-[#8ea3c4] mt-0.5">
                  Ushbu soatlar o'quvchilarga to'liq biriktirilgan va ularning joylashuvi Yandex xaritasida real vaqtda ko'rsatiladi.
                </p>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
                {filteredRegistered.length} ta faol
              </Badge>
            </div>
          </CardHeader>

          {filteredRegistered.length === 0 ? (
            <div className="p-12 text-center text-[#8ea3c4]">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[#475569] mb-3" />
              <p className="font-semibold text-[#cbd5e1]">Ro'yxatdan o'tgan soatlar topilmadi</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#0b1220]/40">
                <TableRow className="border-white/[0.07] hover:bg-transparent">
                  <TableHead className="text-xs text-[#8ea3c4]">Model & ID</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Biriktirilgan O'quvchi</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Maktab va Sinf</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Holat</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Oxirgi Aloqa</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4]">Batareya</TableHead>
                  <TableHead className="text-xs text-[#8ea3c4] text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistered.map((dev) => (
                  <TableRow key={dev.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="font-bold text-slate-200 text-xs">{dev.model}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <code className="font-mono text-[11px] text-cyan-300 bg-cyan-950/40 px-1.5 py-0.2 rounded">
                          {dev.deviceUid}
                        </code>
                        <button
                          onClick={() => handleCopyId(dev.deviceUid)}
                          className="text-[#8ea3c4] hover:text-cyan-400 transition"
                        >
                          {copiedId === dev.deviceUid ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-[#eaf2ff] text-xs">{dev.studentName}</div>
                      <div className="text-[10px] text-[#8ea3c4] font-mono">ID: {dev.studentId}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-slate-200">{dev.schoolName}</div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-white/[0.07] text-cyan-400">
                        {dev.className || "5-B sinf"}
                      </Badge>
                    </TableCell>

                    <TableCell>{getStatusBadge(dev.status)}</TableCell>

                    <TableCell className="text-xs text-[#cbd5e1] font-mono">
                      {formatDateTime(dev.lastSeenAt)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {dev.isCharging ? (
                          <BatteryCharging className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Battery className="w-4 h-4 text-[#8ea3c4]" />
                        )}
                        <span className={dev.batteryLevel && dev.batteryLevel < 20 ? 'text-rose-400' : 'text-slate-200'}>
                          {dev.batteryLevel !== null ? `${dev.batteryLevel}%` : '—'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReassign(dev)}
                          className="h-7 text-xs px-2 gap-1 border-white/[0.07] hover:bg-white/5 text-[#cbd5e1]"
                          title="Boshqa o'quvchiga qayta biriktirish"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Qayta biriktirish</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUnassign(dev)}
                          className="h-7 text-xs px-2 gap-1 border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                          title="O'quvchidan ajratish (Notanish holatiga qaytarish)"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Ajratish</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRevoke(dev)}
                          className="h-7 text-xs px-2 gap-1 border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                          title="Qurilma tokenini bekor qilish (Revoke)"
                        >
                          <ShieldAlert className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* ASSIGN MODAL */}
      {assignModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#101a2e] border border-white/[0.07] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex items-center justify-between bg-[#16233d]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#eaf2ff] text-sm">Soatni O'quvchiga Biriktirish</h3>
                  <p className="text-[11px] text-[#8ea3c4]">Super Admin tomonidan tasdiqlangan ro'yxatdan o'tkazish</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-[#8ea3c4] hover:text-[#eaf2ff] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Selected Watch Info Card */}
              <div className="p-3 rounded-xl bg-[#0b1220]/80 border border-white/[0.07] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{selectedDevice.model}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-[#8ea3c4]">ID:</span>
                    <code className="font-mono text-xs text-cyan-300">{selectedDevice.deviceUid}</code>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#cbd5e1]">
                    Batareya: {selectedDevice.batteryLevel !== null ? `${selectedDevice.batteryLevel}%` : '—'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">{selectedDevice.status}</div>
                </div>
              </div>

              {/* School Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  1. Maktabni tanlang:
                </label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => {
                    const newSchId = e.target.value;
                    setSelectedSchoolId(newSchId);
                    const matching = students.filter(s => s.schoolId === newSchId);
                    setSelectedStudentId(matching.length > 0 ? matching[0].id : '');
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#16233d] border border-white/[0.07] text-xs text-[#eaf2ff] focus:outline-none focus:border-cyan-500"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  2. O'quvchini tanlang (F.I.O va Sinf):
                </label>
                {eligibleStudentsForAssign.length === 0 ? (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    Ushbu maktabda soat biriktirilmagan bo'sh o'quvchi topilmadi.
                  </p>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#16233d] border border-white/[0.07] text-xs text-[#eaf2ff] focus:outline-none focus:border-cyan-500"
                  >
                    {eligibleStudentsForAssign.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} — {st.className || "5-B sinf"} (ID: {st.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  Qaydlar (ixtiyoriy):
                </label>
                <Input
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Masalan: Yangi Samsung Watch 5 Pro taqdim etildi..."
                  className="h-9 text-xs bg-[#16233d] border-white/[0.07]"
                />
              </div>

              {feedbackMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {feedbackMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/[0.07] bg-[#0b1220]/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModalOpen(false)}
                disabled={actionLoading}
                className="text-xs h-9 border-white/[0.07]"
              >
                Bekor qilish
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAssign}
                disabled={actionLoading || !selectedStudentId}
                className="text-xs h-9 px-4 gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Tasdiqlash va Biriktirish</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {reassignModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#101a2e] border border-white/[0.07] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex items-center justify-between bg-[#16233d]">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-[#eaf2ff] text-sm">Soatni Boshqa O'quvchiga Qayta Biriktirish</h3>
              </div>
              <button onClick={() => setReassignModalOpen(false)} className="text-[#8ea3c4] hover:text-[#eaf2ff]">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-[#0b1220]/80 border border-white/[0.07]">
                <div className="text-xs text-[#8ea3c4]">Joriy soat va o'quvchi:</div>
                <div className="font-mono text-cyan-300 font-bold text-xs mt-0.5">{selectedDevice.deviceUid}</div>
                <div className="text-xs text-slate-200 mt-1 font-semibold">
                  Hozirgi egasi: {(selectedDevice as RegisteredDevice).studentName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  Yangi o'quvchini tanlang:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#16233d] border border-white/[0.07] text-xs text-[#eaf2ff] focus:outline-none focus:border-cyan-500"
                >
                  <option value="">O'quvchini tanlang...</option>
                  {students
                    .filter(s => s.id !== (selectedDevice as RegisteredDevice).studentId)
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} — {st.className || "5-B"} (ID: {st.id})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  Qayta biriktirish sababi:
                </label>
                <Input
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Masalan: O'quvchi maktabni o'zgartirdi yoki yangi o'quvchiga berildi..."
                  className="h-9 text-xs bg-[#16233d] border-white/[0.07]"
                />
              </div>

              {feedbackMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${feedbackMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                  {feedbackMessage.text}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/[0.07] bg-[#0b1220]/60 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReassignModalOpen(false)}>Bekor qilish</Button>
              <Button size="sm" onClick={handleConfirmReassign} disabled={actionLoading || !selectedStudentId} className="bg-cyan-500 text-slate-950 font-bold">
                Qayta biriktirishni tasdiqlash
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UNASSIGN CONFIRM MODAL */}
      {unassignModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#101a2e] border border-white/[0.07] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-[#eaf2ff] text-sm">Soatni Ajratishni Tasdiqlang</h3>
            </div>
            <p className="text-xs text-[#cbd5e1]">
              Haqiqatan ham <strong className="text-cyan-300">{selectedDevice.deviceUid}</strong> ID li soatni o'quvchidan ajratmoqchimisiz?
            </p>
            <p className="text-[11px] text-[#8ea3c4] bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              Soat darhol "Notanish soatlar" ro'yxatiga qaytadi va bolaning real vaqt GPS telemetriyasini qabul qilish to'xtatiladi.
            </p>

            {feedbackMessage && (
              <div className="text-xs text-emerald-400 font-semibold">{feedbackMessage.text}</div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setUnassignModalOpen(false)}>Bekor qilish</Button>
              <Button size="sm" onClick={handleConfirmUnassign} disabled={actionLoading} className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                Ha, soatni ajratish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE CONFIRM MODAL */}
      {revokeModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#101a2e] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-[#eaf2ff] text-sm">Qurilma Kirishini Butunlay Bekor Qilish (Revoke)</h3>
            </div>
            <p className="text-xs text-[#cbd5e1]">
              <strong className="text-rose-400">{selectedDevice.deviceUid}</strong> qurilmasining xavfsizlik tokeni va serverga kirish huquqi butunlay bekor qilinadi.
            </p>
            <p className="text-[11px] text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              DIQQAT: Bekor qilingan qurilma serverga boshqa hech qanday telemetriya yoki so'rov yubora olmaydi.
            </p>

            {feedbackMessage && (
              <div className="text-xs text-emerald-400 font-semibold">{feedbackMessage.text}</div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRevokeModalOpen(false)}>Bekor qilish</Button>
              <Button size="sm" onClick={handleConfirmRevoke} disabled={actionLoading} className="bg-rose-600 text-white font-bold hover:bg-rose-500">
                Ha, butunlay bekor qilish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL DISCOVER MODAL */}
      {manualDiscoverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#101a2e] border border-white/[0.07] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex items-center justify-between bg-[#16233d]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2ee59d]/15 flex items-center justify-center text-[#2ee59d]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#eaf2ff] text-sm">Yangi Soatni Aniqlash (Kiritish)</h3>
                  <p className="text-[11px] text-[#8ea3c4]">Soat ID raqamini ro'yxatdan o'tmagan soatlar safiga qo'shish</p>
                </div>
              </div>
              <button
                onClick={() => setManualDiscoverOpen(false)}
                className="text-[#8ea3c4] hover:text-[#eaf2ff] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualDiscoverSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  Qurilma ID / UID (Unikal raqami): *
                </label>
                <Input
                  required
                  placeholder="Masalan: watch-5pro-05 yoki W5P-99234"
                  value={manualDevUid}
                  onChange={(e) => setManualDevUid(e.target.value)}
                  className="h-10 text-xs bg-[#16233d] border-white/[0.07] text-[#eaf2ff] focus-visible:ring-cyan-500 font-mono"
                />
                <p className="text-[10px] text-[#8ea3c4] mt-1">
                  Galaxy Watch 5 Pro soatidagi dastur yuboradigan ID yoki seriya raqami.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  Soat Modeli:
                </label>
                <Input
                  value={manualDevModel}
                  onChange={(e) => setManualDevModel(e.target.value)}
                  className="h-10 text-xs bg-[#16233d] border-white/[0.07] text-[#eaf2ff] focus-visible:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                  Boshlang'ich Batareya (%):
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={manualDevBattery}
                  onChange={(e) => setManualDevBattery(Number(e.target.value))}
                  className="h-10 text-xs bg-[#16233d] border-white/[0.07] text-[#eaf2ff] focus-visible:ring-cyan-500"
                />
              </div>

              {feedbackMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  feedbackMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {feedbackMessage.text}
                </div>
              )}

              <div className="p-4 border-t border-white/[0.07] flex items-center justify-end gap-2 -mx-5 -mb-5 mt-5 bg-[#0b1220]/60">
                <Button type="button" variant="outline" size="sm" onClick={() => setManualDiscoverOpen(false)}>
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading || !manualDevUid.trim()}
                  className="bg-[#2ee59d] hover:bg-[#25c485] text-[#0b1220] font-bold"
                >
                  {actionLoading ? "Kiritilmoqda..." : "Aniqlash va Qo'shish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
