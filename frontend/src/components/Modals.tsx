import React, { useState } from 'react';
import { School, Student, User, NotificationItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Trash2, X } from 'lucide-react';

// 1. ADD NEW SCHOOL DIALOG
interface AddSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSchool: (schoolData: {
    name: string;
    code: string;
    address: string;
    startTime: string;
    endTime: string;
    lat?: number;
    lng?: number;
    directorName?: string;
    directorPhone?: string;
    directorLogin?: string;
    directorPassword?: string;
  }) => Promise<void>;
}

export const AddSchoolDialog: React.FC<AddSchoolModalProps> = ({ open, onOpenChange, onAddSchool }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('41.550500');
  const [lng, setLng] = useState('60.631500');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('13:30');

  // Director Account creation (Hierarchy Level 1 -> Level 2)
  const [directorName, setDirectorName] = useState('');
  const [directorPhone, setDirectorPhone] = useState('+998901234567');
  const [directorLogin, setDirectorLogin] = useState('');
  const [directorPassword, setDirectorPassword] = useState('Direktor123!');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Iltimos, maktab nomini kiriting!");
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    await onAddSchool({
      name,
      code,
      address,
      startTime,
      endTime,
      lat: isFinite(parsedLat) ? parsedLat : undefined,
      lng: isFinite(parsedLng) ? parsedLng : undefined,
      directorName: directorName.trim() || undefined,
      directorPhone: directorPhone.trim() || undefined,
      directorLogin: directorLogin.trim() || undefined,
      directorPassword: directorPassword.trim() || undefined,
    });
    setName('');
    setCode('');
    setAddress('');
    setDirectorName('');
    setDirectorLogin('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🏫 Yangi Maktab & Direktor Ro'yxatdan O'tkazish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label htmlFor="sch-name">Maktab Nomi:</Label>
            <Input
              id="sch-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!directorLogin) {
                  const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                  setDirectorLogin(cleaned ? `direktor_${cleaned}` : '');
                }
              }}
              placeholder="Masalan: 30-Sonli Umumiy O'rta Ta'lim Maktabi"
              className="mt-1 font-bold"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sch-code">School ID (Kodi):</Label>
              <Input
                id="sch-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SCH002"
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="sch-addr">Manzil:</Label>
              <Input
                id="sch-addr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Urganch shahar"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Exact GPS Coordinates Section (Urganch default ±10sm accuracy) */}
          <div className="p-3 bg-white/[0.03] border border-cyan-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">📍 Yandex Maps GPS Koordinatalari</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ±10 sm Aniqlik
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sch-lat" className="text-[11px] text-slate-400">Kenglik (Latitude):</Label>
                <Input
                  id="sch-lat"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="41.550500"
                  className="mt-1 font-mono text-xs text-cyan-300 font-bold"
                />
              </div>
              <div>
                <Label htmlFor="sch-lng" className="text-[11px] text-slate-400">Uzunlik (Longitude):</Label>
                <Input
                  id="sch-lng"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="60.631500"
                  className="mt-1 font-mono text-xs text-cyan-300 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Maktab Direktori Hisobini Yaratish (Level 2 Hierarchy) */}
          <div className="p-3 bg-white/[0.03] border border-blue-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">👤 Maktab Direktori Hisobi (Avtomatik)</span>
              <span className="text-[10px] text-slate-400">Rol: SCHOOL_ADMIN</span>
            </div>
            <div>
              <Label className="text-[11px] text-slate-400">Direktor F.I.Sh:</Label>
              <Input
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                placeholder="Akmal Rahimov"
                className="mt-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] text-slate-400">Direktor Logini:</Label>
                <Input
                  value={directorLogin}
                  onChange={(e) => setDirectorLogin(e.target.value)}
                  placeholder="direktor_30"
                  className="mt-1 font-mono text-xs text-blue-300"
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">Direktor Paroli:</Label>
                <Input
                  value={directorPassword}
                  onChange={(e) => setDirectorPassword(e.target.value)}
                  placeholder="Direktor123!"
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sch-start">Dars Boshlanishi:</Label>
              <Input
                id="sch-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sch-end">Dars Tugashi:</Label>
              <Input
                id="sch-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600 font-bold">Maktab & Direktorni Saqlash</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 2. EDIT SCHOOL NAME & DETAILS DIALOG
interface EditSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: School | null;
  onUpdateSchool: (id: string, updates: { name: string; address: string; startTime: string; endTime: string; lat?: number; lng?: number }) => Promise<void>;
  onDeleteSchool: (id: string) => Promise<void>;
}

export const EditSchoolDialog: React.FC<EditSchoolModalProps> = ({
  open,
  onOpenChange,
  school,
  onUpdateSchool,
  onDeleteSchool,
}) => {
  if (!school) return null;

  const [name, setName] = useState(school.name);
  const [address, setAddress] = useState(school.address);
  const [lat, setLat] = useState(String(school.lat || '41.311081'));
  const [lng, setLng] = useState(String(school.lng || '69.240562'));
  const [startTime, setStartTime] = useState(school.startTime);
  const [endTime, setEndTime] = useState(school.endTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Iltimos, maktab nomini kiriting!");
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    await onUpdateSchool(school.id, {
      name,
      address,
      startTime,
      endTime,
      lat: isFinite(parsedLat) ? parsedLat : undefined,
      lng: isFinite(parsedLng) ? parsedLng : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>✏️ Maktab Nomi va Ma'lumotlarini Tahrirlash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label>School ID (Unikal):</Label>
            <Input value={school.id} readOnly disabled className="mt-1 font-mono opacity-70 cursor-not-allowed" />
          </div>
          <div>
            <Label htmlFor="edit-name">Maktab Nomi (Tahrirlash):</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 font-bold text-sm border-primary/50"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-address">Manzil:</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-lat">📍 GPS Kenglik (Latitude):</Label>
              <Input
                id="edit-lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="41.311081"
                className="mt-1 font-mono text-xs text-[#2ee59d] font-bold"
              />
            </div>
            <div>
              <Label htmlFor="edit-lng">📍 GPS Uzunlik (Longitude):</Label>
              <Input
                id="edit-lng"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="69.240562"
                className="mt-1 font-mono text-xs text-[#2ee59d] font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-start">Dars Boshlanishi:</Label>
              <Input
                id="edit-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-end">Dars Tugashi:</Label>
              <Input
                id="edit-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (confirm(`Haqiqatan ham "${school.name}" maktabini o'chirmoqchimisiz?`)) {
                  await onDeleteSchool(school.id);
                  onOpenChange(false);
                }
              }}
              className="gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Maktabni o'chirish
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button type="submit">💾 O'zgarishlarni Saqlash</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 3. ADD SINGLE STUDENT DIALOG
interface AddStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schools: School[];
  onAddStudent: (data: any) => Promise<void>;
  currentRole?: string;
  defaultSchoolId?: string;
  defaultClassName?: string;
}

export const AddStudentDialog: React.FC<AddStudentModalProps> = ({
  open,
  onOpenChange,
  schools,
  onAddStudent,
  currentRole,
  defaultSchoolId,
  defaultClassName,
}) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [schoolId, setSchoolId] = useState(defaultSchoolId || schools[0]?.id || 'SCH001');
  const [className, setClassName] = useState(defaultClassName || '5-B');
  const [parentPhone, setParentPhone] = useState('+998901234567');
  const [deviceId, setDeviceId] = useState('');

  // Parent Account Fields (Hierarchy Level 3 -> Level 4)
  const [parentName, setParentName] = useState('');
  const [parentLogin, setParentLogin] = useState('');
  const [parentPassword, setParentPassword] = useState('Ota12345!');

  // Sync defaults whenever modal opens
  React.useEffect(() => {
    if (open) {
      if (defaultSchoolId) setSchoolId(defaultSchoolId);
      if (defaultClassName) setClassName(defaultClassName);
    }
  }, [open, defaultSchoolId, defaultClassName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("O'quvchi ismini kiriting!");
    await onAddStudent({
      studentId: studentId.trim() || undefined,
      name: name.trim(),
      schoolId: currentRole === 'TEACHER' && defaultSchoolId ? defaultSchoolId : schoolId,
      className: currentRole === 'TEACHER' && defaultClassName ? defaultClassName : className,
      parentPhone,
      parentName: parentName.trim() || undefined,
      parentLogin: parentLogin.trim() || undefined,
      parentPassword: parentPassword.trim() || undefined,
      deviceId: deviceId.trim() || undefined,
    });
    setName('');
    setStudentId('');
    setParentName('');
    setParentLogin('');
    setDeviceId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>➕ O'quvchi & Ota-ona Hisobini Ro'yxatga Olish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Student ID (STU-XXXX):</Label>
              <Input
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  if (!parentLogin) {
                    setParentLogin(`ota_${e.target.value.toLowerCase()}`);
                  }
                }}
                placeholder="STU-10005"
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <Label>Sinf:</Label>
              <Input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1 text-xs" />
            </div>
          </div>

          <div>
            <Label>O'quvchi F.I.Sh:</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!parentName) setParentName(`${e.target.value}ning Ota-onasi`);
              }}
              placeholder="Masalan: Behruz Aliyev"
              className="mt-1 font-bold"
              required
            />
          </div>

          <div>
            <Label>Biriktiriladigan Maktab:</Label>
            <select
              value={currentRole === 'TEACHER' && defaultSchoolId ? defaultSchoolId : schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              disabled={currentRole === 'TEACHER'}
              className="w-full h-9 rounded-lg border border-input bg-background/50 px-2 text-xs font-semibold focus:outline-none mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.id}: {s.name}</option>
              ))}
            </select>
            {currentRole === 'TEACHER' && (
              <p className="text-[10px] text-cyan-400 mt-1">Siz faqat o'zingiz biriktirilgan maktabga o'quvchi qo'sha olasiz</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Samsung Galaxy Watch 5 Pro Qurilma ID:</Label>
              <span className="text-[10px] text-amber-300">Ixtiyoriy (bo'sh qoldirish mumkin)</span>
            </div>
            <Input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Masalan: W5P-C8C5B916 (agar soat keyinroq biriktirilsa, bo'sh qoldiring)"
              className="mt-1 font-mono text-xs text-cyan-300 font-bold"
            />
            <p className="text-[10px] text-[#8ea3c4] mt-0.5">
              💡 Eslatma: Agar soatni "Notanish soatlar" bo'limidan biriktirmoqchi bo'lsangiz, bu maydonni bo'sh qoldiring.
            </p>
          </div>

          {/* Ota-ona Hisobi (Level 4 Hierarchy) */}
          <div className="p-3 bg-white/[0.03] border border-amber-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">👨‍👩‍👧 Ota-ona Login & Paroli</span>
              <span className="text-[10px] text-slate-400">Rol: PARENT</span>
            </div>

            <div>
              <Label className="text-[11px] text-slate-400">Ota-onaning F.I.Sh:</Label>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Jasur Aliyev"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-[11px] text-slate-400">Ota-onaning Telefoni:</Label>
              <Input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="mt-1 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] text-slate-400">Ota-ona Logini:</Label>
                <Input
                  value={parentLogin}
                  onChange={(e) => setParentLogin(e.target.value)}
                  placeholder="ota_10005"
                  className="mt-1 font-mono text-xs text-amber-300 font-bold"
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">Ota-ona Paroli:</Label>
                <Input
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  placeholder="Ota12345!"
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600 font-bold">O'quvchi & Ota-onani Saqlash</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 4. BULK CSV IMPORT DIALOG
interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schools: School[];
  onBulkImport: (schoolId: string, text: string) => Promise<void>;
}

export const BulkImportDialog: React.FC<BulkImportModalProps> = ({ open, onOpenChange, schools, onBulkImport }) => {
  const [schoolId, setSchoolId] = useState(schools[0]?.id || 'SCH001');
  const [csvText, setCsvText] = useState(`10004, Sardor Mirzayev, 5-B, +998901112233, watch-5pro-04
10005, Nodira Karimova, 5-B, +998902223344, watch-5pro-05
10006, Bekzod Toshmatov, 9-A, +998903334455, watch-5pro-06`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return alert("CSV matnini kiriting!");
    await onBulkImport(schoolId, csvText);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>📊 Ommaviy O'quvchilarni Import Qilish (CSV)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Biriktiriladigan Maktab:</Label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background/50 px-2 text-xs font-semibold focus:outline-none mt-1"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.id}: {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>CSV format: (ID, Ism, Sinf, Telefon, Smartwatch ID):</Label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full rounded-lg border border-input bg-background/50 p-2 font-mono text-xs focus:outline-none mt-1"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit">Import Qilish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 5. ATTENDANCE CORRECTION DIALOG
interface CorrectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onSubmitCorrection: (studentId: string, status: string, reason: string) => Promise<void>;
}

export const CorrectionDialog: React.FC<CorrectionModalProps> = ({
  open,
  onOpenChange,
  student,
  onSubmitCorrection,
}) => {
  if (!student) return null;

  const [status, setStatus] = useState('PRESENT');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return alert("Tuzatish sababini yozing!");
    await onSubmitCorrection(student.id, status, reason);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>✏️ O'qituvchi Tomonidan Davomatni Tuzatish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>O'quvchi:</Label>
            <Input value={`${student.name} (${student.uniqueId})`} readOnly disabled className="mt-1 opacity-70" />
          </div>
          <div>
            <Label>Yangi Davomat Holati:</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background/50 px-2 text-xs font-semibold focus:outline-none mt-1"
            >
              <option value="PRESENT">🟢 PRESENT – Maktabda (Kelgan)</option>
              <option value="LATE">🟡 PRESENT – Kechikkan</option>
              <option value="ABSENT">🔴 OUTSIDE – Kelmagan</option>
            </select>
          </div>
          <div>
            <Label>Tuzatish Sababi (Audit jurnali uchun majburiy):</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: Darsda qatnashdi, soat quvvati tugagan"
              className="mt-1"
              required
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit">Tuzatishni Saqlash</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 6. NOTIFICATION DRAWER
interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose, notifications }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-card border-l border-border shadow-2xl p-4 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Bildirishnomalar (Push)</h3>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 py-3">
        {notifications.map((n) => (
          <div key={n.id} className="p-3 rounded-xl border border-border bg-card/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">{n.title}</span>
              <span className="text-xs text-muted-foreground font-mono">{n.time}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 7. EDIT STUDENT MODAL
export interface EditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  schools: School[];
  onUpdateStudent: (id: string, data: any) => Promise<void>;
  onDeleteStudent?: (id: string) => Promise<void>;
  currentRole?: string;
}

export const EditStudentDialog: React.FC<EditStudentModalProps> = ({
  open,
  onOpenChange,
  student,
  schools,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  if (!student) return null;

  const [name, setName] = useState(student.name || '');
  const [schoolId, setSchoolId] = useState(student.schoolId || schools[0]?.id || 'SCH001');
  const [className, setClassName] = useState(student.className || '5-B');
  const [parentName, setParentName] = useState(student.parentName || '');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '+998901234567');
  const [parentLogin, setParentLogin] = useState((student as any).parentLogin || '');
  const [parentPassword, setParentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceId, setDeviceId] = useState(student.deviceId || '');
  const [photo, setPhoto] = useState(student.photo || '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (student) {
      setName(student.name || '');
      setSchoolId(student.schoolId || schools[0]?.id || 'SCH001');
      setClassName(student.className || '5-B');
      setParentName(student.parentName || '');
      setParentPhone(student.parentPhone || '+998901234567');
      setParentLogin((student as any).parentLogin || '');
      setParentPassword('');
      setDeviceId(student.deviceId || '');
      setPhoto(student.photo || '');
    }
  }, [student, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("O'quvchi ismini kiriting!");
    setSaving(true);
    try {
      await onUpdateStudent(student.id, {
        name: name.trim(),
        schoolId,
        className: className.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentLogin: parentLogin.trim() || undefined,
        parentPassword: parentPassword.trim() || undefined,
        deviceId: deviceId.trim() || null,
        photo: photo.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err: any) {
      alert("Xatolik yuz berdi: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#101a2e] border-white/[0.08] text-[#eaf2ff]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#eaf2ff] flex items-center gap-2">
            ✏️ O'quvchi Ma'lumotlarini Tahrirlash va Yangilash
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#8ea3c4]">Student ID (Tizim kodi):</Label>
              <Input
                value={student.uniqueId || student.id}
                readOnly
                disabled
                className="mt-1 font-mono text-xs opacity-70 bg-[#0b1220] border-white/10"
              />
            </div>
            <div>
              <Label className="text-xs text-[#8ea3c4]">Smartwatch ID (Soat):</Label>
              <Input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Masalan: W5P-C470C226"
                className="mt-1 font-mono text-xs bg-[#16233d] border-white/10 text-cyan-300"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#8ea3c4]">O'quvchi F.I.O (Ism, Familiya):</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 text-sm font-semibold bg-[#16233d] border-white/10 text-[#eaf2ff]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#8ea3c4]">Biriktirilgan Maktab:</Label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full mt-1 h-9 px-3 rounded-md bg-[#16233d] border border-white/10 text-xs text-[#eaf2ff] focus:outline-none focus:border-cyan-500 font-medium"
              >
                {schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#8ea3c4]">Sinf (Masalan: 5-B):</Label>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-1 text-xs bg-[#16233d] border-white/10 font-bold text-[#eaf2ff]"
                required
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">👨‍👩‍👧 Ota-ona Hisobi & Tizimga Kirish Ma'lumotlari</span>
              <span className="text-[10px] text-slate-400">Rol: PARENT</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#8ea3c4]">Ota-onasi (F.I.O):</Label>
                <Input
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Masalan: Valiyev Karim"
                  className="mt-1 text-xs bg-[#16233d] border-white/10 text-[#eaf2ff]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#8ea3c4]">Telefon Raqami:</Label>
                <Input
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="mt-1 font-mono text-xs bg-[#16233d] border-white/10 text-[#eaf2ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div>
                <Label className="text-xs text-amber-300">Ota-ona Logini:</Label>
                <Input
                  value={parentLogin}
                  onChange={(e) => setParentLogin(e.target.value)}
                  placeholder="Masalan: otashbek.com"
                  className="mt-1 font-mono text-xs bg-[#16233d] border-amber-500/30 text-amber-200"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Ilovaga kirish uchun login yoki telefon</p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-amber-300">Ota-ona Yangi Paroli:</Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    {showPassword ? "Yashirish" : "Ko'rish"}
                  </button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  placeholder="Yangi parol (ixtiyoriy)"
                  className="mt-1 font-mono text-xs bg-[#16233d] border-amber-500/30 text-amber-200"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Parol o'zgarmasa, bo'sh qoldiring</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#8ea3c4]">Rasm URL (Avatar):</Label>
            <Input
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://..."
              className="mt-1 text-xs bg-[#16233d] border-white/10 text-[#eaf2ff]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
            {onDeleteStudent && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`${student.name} o'quvchisini tizimdan butunlay o'chirishga ishonchingiz komilmi?`)) {
                    onDeleteStudent(student.id);
                    onOpenChange(false);
                  }
                }}
                className="text-xs h-9 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              >
                O'chirish
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs h-9 border-white/10 hover:bg-white/5 text-[#cbd5e1]"
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs h-9 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 shadow"
              >
                {saving ? 'Saqlanmoqda...' : 'Saqlash va Yangilash'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
