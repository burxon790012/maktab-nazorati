import React, { useState } from 'react';
import {
  Watch,
  Plus,
  RefreshCw,
  QrCode,
  Battery,
  BatteryCharging,
  BatteryWarning,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  MapPin,
  ShieldCheck,
  User,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';

export interface DeviceInfo {
  id: string;
  deviceId: string;
  model: string;
  serialNumber?: string;
  studentId?: string;
  studentName?: string;
  studentClass?: string;
  schoolName?: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  battery: number;
  isWorn: boolean;
  lastSeenAt?: string | null;
  lastAddress?: string;
  token?: string;
}

interface DevicesTabProps {
  devices: DeviceInfo[];
  students: any[];
  onRefresh: () => void;
  onRegisterDevice: (data: { deviceId: string; studentId: string; model: string }) => Promise<any>;
  onRegenerateToken: (deviceId: string) => Promise<any>;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  devices,
  students,
  onRefresh,
  onRegisterDevice,
  onRegenerateToken,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'DELAYED' | 'OFFLINE'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    deviceId: string;
    token: string;
    studentName?: string;
    qrData: string;
  } | null>(null);

  // Form state
  const [newDevId, setNewDevId] = useState('');
  const [newStudentId, setNewStudentId] = useState(students[0]?.id || '10001');
  const [newModel, setNewModel] = useState('Samsung Galaxy Watch5 Pro (SM-R920)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      (d.studentName && d.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.deviceId && d.deviceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.lastAddress && d.lastAddress.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevId.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await onRegisterDevice({
        deviceId: newDevId.trim(),
        studentId: newStudentId,
        model: newModel,
      });
      if (res && res.device) {
        setShowAddModal(false);
        setQrModalData({
          deviceId: res.device.deviceId,
          token: res.device.token,
          studentName: res.device.studentName,
          qrData: res.device.qrData,
        });
        setNewDevId('');
      }
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegen = async (deviceId: string, studentName?: string) => {
    if (!confirm(`Haqiqatan ham ${deviceId} uchun tokenni yangilamoqchimisiz? Eski ulanish uziladi.`)) {
      return;
    }
    try {
      const res = await onRegenerateToken(deviceId);
      if (res && res.token) {
        setQrModalData({
          deviceId,
          token: res.token,
          studentName,
          qrData: res.qrData,
        });
      }
    } catch (err: any) {
      alert("Tokenni yangilashda xatolik: " + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#1b1b33] text-[#e8e8f5] space-y-5">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#3a3a63]/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#e8e8f5] flex items-center gap-2">
            <Watch className="w-6 h-6 text-[#2ee59d]" />
            Aqlli Soatlar va Qurilmalar Floti
          </h2>
          <p className="text-xs text-[#9a9ac0] mt-1">
            Samsung Galaxy Watch5 Pro (Wear OS 4) soatlarining real vaqt holati, batareyasi va 256-bit xavfsiz ulanishlari
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-[#2a2a4a] hover:bg-[#3a3a63] border border-[#3a3a63]/40 text-[#9a9ac0] hover:text-[#e8e8f5] transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Yangilash</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#2ee59d] hover:bg-[#25c485] text-[#1b1b33] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#2ee59d]/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Soat Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="O'quvchi ismi, ID yoki manzil bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#2a2a4a] border border-[#3a3a63]/40 text-xs text-[#e8e8f5] placeholder-[#9a9ac0] focus:outline-none focus:border-[#2ee59d]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'ONLINE', 'DELAYED', 'OFFLINE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#2ee59d] text-[#1b1b33] font-bold'
                  : 'bg-[#2a2a4a] text-[#9a9ac0] hover:text-[#e8e8f5]'
              }`}
            >
              {st === 'ALL'
                ? `Barchasi (${devices.length})`
                : st === 'ONLINE'
                ? `Online (${devices.filter((d) => d.status === 'ONLINE').length})`
                : st === 'DELAYED'
                ? `Kechikish (${devices.filter((d) => d.status === 'DELAYED').length})`
                : `Oflayn (${devices.filter((d) => d.status === 'OFFLINE').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#2a2a4a] border border-[#3a3a63]/40 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1b1b33]/60 border-b border-[#3a3a63]/40 text-[#9a9ac0] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">O'quvchi</th>
                <th className="py-3 px-4">Qurilma / Model</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4">Batareya</th>
                <th className="py-3 px-4">Sensor (Qo'lda)</th>
                <th className="py-3 px-4">Oxirgi Manzil</th>
                <th className="py-3 px-4">Kontakt Vaqti</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a3a63]/20">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9a9ac0]">
                    Hech qanday aqlli soat topilmadi
                  </td>
                </tr>
              ) : (
                filteredDevices.map((d) => {
                  const isOnline = d.status === 'ONLINE';
                  const isDelayed = d.status === 'DELAYED';

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-[#3a3a63]/30 transition group"
                    >
                      {/* Student */}
                      <td className="py-3.5 px-4 font-medium text-[#e8e8f5]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#3a3a63] flex items-center justify-center font-bold text-[#2ee59d]">
                            {d.studentName ? d.studentName.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="font-bold">{d.studentName || "Biriktirilmagan"}</div>
                            <div className="text-[11px] text-[#9a9ac0]">
                              {d.studentClass || '—'} • {d.schoolName || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Device / Model */}
                      <td className="py-3.5 px-4 text-[#e8e8f5]">
                        <div className="font-mono font-semibold text-xs text-[#4db5ff]">
                          {d.deviceId}
                        </div>
                        <div className="text-[11px] text-[#9a9ac0]">{d.model}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isOnline
                              ? 'bg-[#2ee59d]/15 text-[#2ee59d] border border-[#2ee59d]/30'
                              : isDelayed
                              ? 'bg-[#ffb020]/15 text-[#ffb020] border border-[#ffb020]/30'
                              : 'bg-[#9a9ac0]/15 text-[#9a9ac0] border border-[#9a9ac0]/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnline
                                ? 'bg-[#2ee59d] animate-ping'
                                : isDelayed
                                ? 'bg-[#ffb020]'
                                : 'bg-[#9a9ac0]'
                            }`}
                          />
                          {isOnline ? 'ONLINE' : isDelayed ? 'DELAYED' : 'OFFLINE'}
                        </span>
                      </td>

                      {/* Battery */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              d.battery > 50
                                ? 'text-[#2ee59d]'
                                : d.battery > 20
                                ? 'text-[#ffb020]'
                                : 'text-[#ff4d5e]'
                            }`}
                          >
                            {d.battery}%
                          </span>
                          <div className="w-16 bg-[#1b1b33] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, d.battery)}%`,
                                backgroundColor:
                                  d.battery > 50 ? '#2ee59d' : d.battery > 20 ? '#ffb020' : '#ff4d5e',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Is Worn */}
                      <td className="py-3.5 px-4">
                        {d.isWorn ? (
                          <span className="text-[#2ee59d] text-[11px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Qo'lda taqilgan
                          </span>
                        ) : (
                          <span className="text-[#ff4d5e] text-[11px] font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Yechilgan!
                          </span>
                        )}
                      </td>

                      {/* Last Address */}
                      <td className="py-3.5 px-4 text-[#e8e8f5] max-w-[220px]">
                        <div className="flex items-start gap-1 text-[11px] text-[#9a9ac0]">
                          <MapPin className="w-3.5 h-3.5 text-[#ff2d78] flex-shrink-0 mt-0.5" />
                          <span className="truncate">{d.lastAddress || "Toshkent shahri"}</span>
                        </div>
                      </td>

                      {/* Last Seen */}
                      <td className="py-3.5 px-4 text-[#9a9ac0] text-[11px]">
                        {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleTimeString() : 'Noma\'lum'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRegen(d.deviceId, d.studentName)}
                            title="Tokenni qayta tiklash va QR kod olish"
                            className="p-1.5 rounded-lg bg-[#1b1b33] hover:bg-[#3a3a63] text-[#9a9ac0] hover:text-[#2ee59d] transition"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#2a2a4a] border border-[#3a3a63] rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[#9a9ac0] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#e8e8f5] flex items-center gap-2 mb-1">
              <Watch className="w-5 h-5 text-[#2ee59d]" />
              Yangi Samsung Galaxy Watch5 Pro qo'shish
            </h3>
            <p className="text-xs text-[#9a9ac0] mb-4">
              Soatga 256-bit xavfsiz token biriktiriladi va Wear OS ilovasi uchun QR kod generatsiya qilinadi.
            </p>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#9a9ac0] mb-1">
                  Qurilma ID yoki Seriya Raqami *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: W5P-TEST-002 yoki SM-R920-SN123"
                  value={newDevId}
                  onChange={(e) => setNewDevId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b33] border border-[#3a3a63] text-xs text-[#e8e8f5] focus:outline-none focus:border-[#2ee59d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9a9ac0] mb-1">
                  Biriktiriladigan O'quvchi
                </label>
                <select
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b33] border border-[#3a3a63] text-xs text-[#e8e8f5] focus:outline-none focus:border-[#2ee59d]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade} - {s.schoolName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9a9ac0] mb-1">
                  Soat Modeli
                </label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b33] border border-[#3a3a63] text-xs text-[#e8e8f5] focus:outline-none focus:border-[#2ee59d]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1b1b33] text-xs font-semibold text-[#9a9ac0] hover:text-[#e8e8f5]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#2ee59d] text-xs font-bold text-[#1b1b33] hover:bg-[#25c485] transition"
                >
                  {isSubmitting ? "Ro'yxatga olinmoqda..." : "Ro'yxatdan O'tkazish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code & Token Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#2a2a4a] border border-[#3a3a63] rounded-2xl p-5 shadow-2xl relative text-center">
            <button
              onClick={() => setQrModalData(null)}
              className="absolute top-4 right-4 text-[#9a9ac0] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#2ee59d]/20 text-[#2ee59d] flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[#e8e8f5] mb-1">
              Samsung Galaxy Watch5 Pro Ulanishi
            </h3>
            <p className="text-xs text-[#9a9ac0] mb-4">
              {qrModalData.studentName ? `${qrModalData.studentName} uchun: ` : ''}
              Soatdagi ilova orqali quyidagi ma'lumotlarni o'rnating yoki QR kodni skanerlang
            </p>

            {/* QR Image fallback using quickchart or svg */}
            <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  qrModalData.qrData
                )}`}
                alt="Soat Ulanish QR Kodi"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Token display */}
            <div className="mt-4 p-3 bg-[#1b1b33] rounded-xl border border-[#3a3a63]/40 text-left">
              <div className="flex items-center justify-between text-[11px] text-[#9a9ac0] mb-1">
                <span>256-bit Qurilma Tokeni:</span>
                <button
                  onClick={() => copyToClipboard(qrModalData.token)}
                  className="text-[#2ee59d] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  {copiedToken ? 'Nusxalandi!' : 'Nusxalash'}
                </button>
              </div>
              <div className="font-mono text-xs text-[#2ee59d] break-all select-all">
                {qrModalData.token}
              </div>
            </div>

            <button
              onClick={() => setQrModalData(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#2ee59d] text-xs font-bold text-[#1b1b33] hover:bg-[#25c485] transition"
            >
              Tushundim, Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
