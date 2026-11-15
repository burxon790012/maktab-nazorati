import React, { useState } from 'react';
import { Student } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users, UserPlus, FileSpreadsheet, ArrowLeftRight, Trash2, Search, MapPin, Edit3, Copy, Check } from 'lucide-react';

interface StudentsTabProps {
  students: Student[];
  onOpenAddSingle: () => void;
  onOpenBulkImport: () => void;
  onOpenTransfer: () => void;
  onDeleteStudent: (id: string) => Promise<void>;
  onEditStudent?: (student: Student) => void;
  onViewOnMap?: (student: Student) => void;
  currentRole?: string;
  currentUser?: any;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  onOpenAddSingle,
  onOpenBulkImport,
  onOpenTransfer,
  onDeleteStudent,
  onEditStudent,
  onViewOnMap,
  currentRole,
  currentUser,
}) => {
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.uniqueId.toLowerCase().includes(search.toLowerCase()) ||
      s.schoolName.toLowerCase().includes(search.toLowerCase())
  );

  const isTeacher = currentRole === 'TEACHER';

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {isTeacher
              ? `👥 Mening O'quvchilarim ${currentUser?.className ? `(${currentUser.className}-sinf)` : ''}`
              : "👥 O'quvchilar Boshqaruvi"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isTeacher
              ? "Siz mas'ul bo'lgan sinf o'quvchilari, ularning GPS soatlari va ota-onalari"
              : "Maktabga biriktirilgan barcha o'quvchilar ro'yxati, smartwatch ulanishlari va ota-onalar kontaktlari"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={onOpenAddSingle} className="gap-1.5 shadow-md bg-cyan-600 hover:bg-cyan-500 text-white">
            <UserPlus className="w-4 h-4" />
            O'quvchi Qo'shish
          </Button>
          {!isTeacher && (
            <>
              <Button variant="outline" onClick={onOpenBulkImport} className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                <FileSpreadsheet className="w-4 h-4" />
                Ommaviy CSV Import
              </Button>
              <Button variant="outline" onClick={onOpenTransfer} className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                <ArrowLeftRight className="w-4 h-4" />
                Maktabni Ko'chirish
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="p-3 border-b border-border/60">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish (Ism, ID, Maktab)..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>F.I.O</TableHead>
              <TableHead>Maktab</TableHead>
              <TableHead>Sinf</TableHead>
              <TableHead>Smartwatch ID</TableHead>
              <TableHead>Ota-onasi</TableHead>
              <TableHead>Telefon Raqam</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((std) => (
              <TableRow key={std.id}>
                <TableCell>
                  <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {std.uniqueId}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <img
                      src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}
                      className="w-7 h-7 rounded-md object-cover border border-border"
                      alt={std.name}
                    />
                    <b className="text-xs">{std.name}</b>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div>
                      <span className="font-mono text-muted-foreground">{std.schoolId}</span> • {std.schoolName}
                    </div>
                    {currentRole === 'SUPER_ADMIN' && std.telemetry?.latitude && std.telemetry?.longitude && (
                      <button
                        type="button"
                        onClick={() => {
                          const lat = std.telemetry!.latitude;
                          const lng = std.telemetry!.longitude;
                          const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                          navigator.clipboard.writeText(coords);
                          if ((window as any).copySmartChildCoords) {
                            (window as any).copySmartChildCoords(lat.toFixed(6), lng.toFixed(6));
                          } else {
                            alert(`Super Admin: GPS Koordinata nusxalandi: ${coords}`);
                          }
                        }}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded hover:bg-cyan-900/40 transition cursor-pointer"
                        title="Super Admin: GPS koordinatasini nusxalash uchun bosing"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{std.telemetry.latitude.toFixed(4)}, {std.telemetry.longitude.toFixed(4)}</span>
                        <Copy className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-bold">
                    {std.className}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {std.deviceId ? (
                    <span className="text-cyan-300 font-semibold">{std.deviceId}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Biriktirilmagan</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">{std.parentName || "Ota-ona"}</TableCell>
                <TableCell className="font-mono text-xs">{std.parentPhone || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEditStudent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditStudent(std)}
                        className="h-7 text-xs px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-semibold gap-1"
                        title="O'quvchi ma'lumotlarini tahrirlash"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tahrirlash</span>
                      </Button>
                    )}
                    {onViewOnMap && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewOnMap(std)}
                        className="h-7 text-xs px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-semibold gap-1"
                        title="GPS Xaritada ko'rish"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xarita</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`${std.name} o'quvchisini tizimdan o'chirishga ishonchingiz komilmi?`)) {
                          onDeleteStudent(std.id);
                        }
                      }}
                      className="h-7 text-xs px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      title="O'quvchini o'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
