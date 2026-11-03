import React, { useState } from 'react';
import { Student } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, Download, Printer, CheckCircle, Clock, AlertTriangle, Edit2 } from 'lucide-react';

interface AttendanceTabProps {
  students: Student[];
  selectedSchoolId: string;
  onOpenCorrection: (student: Student) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  students,
  selectedSchoolId,
  onOpenCorrection,
}) => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.uniqueId.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === 'ALL' || s.className === classFilter;
    return matchSearch && matchClass;
  });

  const handleExportCsv = () => {
    window.location.href = `/api/v1/attendance/export/csv?schoolId=${selectedSchoolId}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">📋 Aqlli GPS Maktab Davomati</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Qat'iy Maktab-O'quvchi Geofence tekshiruvi. Boshqa maktab poligoniga kirsa, unga davomat yozilmaydi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={handleExportCsv} className="gap-1.5 shadow-md">
            <Download className="w-4 h-4" />
            Excel (CSV) Yuklash
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
            <Printer className="w-4 h-4" />
            Chop etish (PDF)
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="p-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="O'quvchi ismi yoki ID..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background/50 px-3 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Barcha Sinflar</option>
              <option value="5-B">5-B Sinf</option>
              <option value="9-A">9-A Sinf</option>
              <option value="7-A">7-A Sinf</option>
            </select>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O'quvchi</TableHead>
              <TableHead>Biriktirilgan Maktab</TableHead>
              <TableHead>Sinf</TableHead>
              <TableHead>Kelgan Vaqti</TableHead>
              <TableHead>Ketgan Vaqti</TableHead>
              <TableHead>Davomat Holati</TableHead>
              <TableHead>GPS / Verifikatsiya</TableHead>
              <TableHead className="text-right">Tuzatish</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((std) => {
              const att = std.todayAttendance;
              const isPresent = att?.status === 'PRESENT' || att?.statusColor === 'GREEN';
              const isLate = att?.status === 'LATE';

              return (
                <TableRow key={std.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}
                        className="w-8 h-8 rounded-lg object-cover border border-border"
                        alt={std.name}
                      />
                      <div>
                        <div className="font-bold text-xs">{std.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">ID: {std.uniqueId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-primary font-bold">{std.schoolId}</span> • {std.schoolName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold text-xs">
                      {std.className}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-400">
                    {att?.arrivalTime || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {att?.departureTime || '—'}
                  </TableCell>
                  <TableCell>
                    {isPresent ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle className="w-3 h-3" /> PRESENT (Kelgan)
                      </Badge>
                    ) : isLate ? (
                      <Badge variant="warning" className="gap-1">
                        <Clock className="w-3 h-3" /> PRESENT (Kechikkan)
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> OUTSIDE (Kelmagan)
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                      ✓ GPS Geofence Tasdiqlandi
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenCorrection(std)}
                      className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                      title="O'qituvchi tomonidan tuzatish"
                    >
                      <Edit2 className="w-3 h-3" />
                      Tuzatish
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
