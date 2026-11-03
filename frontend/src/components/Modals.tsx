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
  onAddSchool: (schoolData: { name: string; code: string; address: string; startTime: string; endTime: string }) => Promise<void>;
}

export const AddSchoolDialog: React.FC<AddSchoolModalProps> = ({ open, onOpenChange, onAddSchool }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('13:30');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Iltimos, maktab nomini kiriting!");
    await onAddSchool({ name, code, address, startTime, endTime });
    setName('');
    setCode('');
    setAddress('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🏫 Yangi Maktab Ro'yxatdan O'tkazish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label htmlFor="sch-name">Maktab Nomi:</Label>
            <Input
              id="sch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: 45-Sonli Umumiy O'rta Ta'lim Maktabi"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="sch-code">Unikal School ID (masalan: SCH004):</Label>
            <Input
              id="sch-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SCH004"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="sch-addr">Manzil:</Label>
            <Input
              id="sch-addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Toshkent sh., Yunusobod tumani"
              className="mt-1"
            />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">Saqlash</Button>
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
  onUpdateSchool: (id: string, updates: { name: string; address: string; startTime: string; endTime: string }) => Promise<void>;
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
  const [startTime, setStartTime] = useState(school.startTime);
  const [endTime, setEndTime] = useState(school.endTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Iltimos, maktab nomini kiriting!");
    await onUpdateSchool(school.id, { name, address, startTime, endTime });
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
}

export const AddStudentDialog: React.FC<AddStudentModalProps> = ({ open, onOpenChange, schools, onAddStudent }) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [schoolId, setSchoolId] = useState(schools[0]?.id || 'SCH001');
  const [className, setClassName] = useState('5-B');
  const [parentPhone, setParentPhone] = useState('+998901234567');
  const [deviceId, setDeviceId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("O'quvchi ismini kiriting!");
    await onAddStudent({ studentId, name, schoolId, className, parentPhone, deviceId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>➕ Yakka O'quvchini Ro'yxatga Olish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Student ID (masalan: 10005):</Label>
            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="10005" className="mt-1 font-mono" />
          </div>
          <div>
            <Label>O'quvchi F.I.O:</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Behruz Aliyev" className="mt-1" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Maktab:</Label>
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
              <Label>Sinf:</Label>
              <Input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Ota-onasi Telefon Raqami:</Label>
            <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="mt-1 font-mono" />
          </div>
          <div>
            <Label>Smartwatch Device ID:</Label>
            <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="watch-5pro-05" className="mt-1 font-mono" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit">Ro'yxatga Olish</Button>
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
              <span className="text-[10px] text-muted-foreground font-mono">{n.time}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
