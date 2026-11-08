import React, { useState } from 'react';
import { School, Student, User } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { School as SchoolIcon, Users, CheckCircle2, Watch, Edit3, MapPin, Plus, Globe, Settings } from 'lucide-react';
import { WebsiteManager } from '@/components/cms/WebsiteManager';

interface SuperAdminTabProps {
  schools: School[];
  students: Student[];
  users: User[];
  onOpenAddSchool: () => void;
  onOpenEditSchool: (school: School) => void;
  onOpenAddUser: () => void;
  onFlyToSchool: (school: School) => void;
  token?: string;
  onPreview?: () => void;
}

export const SuperAdminTab: React.FC<SuperAdminTabProps> = ({
  schools,
  students,
  users,
  onOpenAddSchool,
  onOpenEditSchool,
  onOpenAddUser,
  onFlyToSchool,
  token = '',
  onPreview = () => {}
}) => {
  const [currentSection, setCurrentSection] = useState<'schools' | 'cms'>('schools');

  return (
    <div className="space-y-6">
      {/* Super Admin Section Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border w-fit">
        <button
          onClick={() => setCurrentSection('schools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentSection === 'schools'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Maktablar va Foydalanuvchilar</span>
        </button>

        <button
          onClick={() => setCurrentSection('cms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentSection === 'cms'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>WEBSITE MANAGEMENT (CMS)</span>
        </button>
      </div>

      {currentSection === 'cms' ? (
        <WebsiteManager token={token} onPreview={onPreview} />
      ) : (
        <>
          {/* Top Banner & Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">👑 Super Admin Boshqaruv Paneli</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Barcha maktablar, unikal School ID va Geofence chegaralari, ma'murlar va platforma xavfsizligi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onOpenAddSchool} className="gap-1.5 shadow-md">
                <Plus className="w-4 h-4" />
                Yangi Maktab Qo'shish
              </Button>
              <Button variant="outline" onClick={onOpenAddUser} className="gap-1.5">
                <Users className="w-4 h-4" />
                Admin / O'qituvchi Qo'shish
              </Button>
            </div>
          </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Ro'yxatdagi Maktablar</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <SchoolIcon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{schools.length}</div>
            <p className="text-xs text-emerald-400 mt-1 font-medium">Barchasi GPS Geofence bilan himoyalangan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Jami O'quvchilar</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{students.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Qat'iy maktab-poligon biriktiruvi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Davomat Ko'rsatkichi</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-400">100%</div>
            <p className="text-xs text-emerald-400 mt-1 font-medium">O'z vaqtida kelish darajasi yuqori</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Uzluksiz Soatlar (Watch5 Pro)</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Watch className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-400">{students.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Telemetriya va puls monitoringi faol</p>
          </CardContent>
        </Card>
      </div>

      {/* Schools Management Registry Table */}
      <Card>
        <CardHeader className="p-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <SchoolIcon className="w-4 h-4 text-primary" />
              Ro'yxatdan O'tgan Maktablar va GPS Chegaralari
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {schools.length} ta maktab
            </Badge>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School ID</TableHead>
              <TableHead>Maktab Nomi</TableHead>
              <TableHead>Geofence ID</TableHead>
              <TableHead>Koordinatalar</TableHead>
              <TableHead>Dars Vaqti</TableHead>
              <TableHead>GPS Nuqtalar</TableHead>
              <TableHead>O'quvchilar</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((sch) => {
              const count = students.filter((s) => s.schoolId === sch.id).length;
              return (
                <TableRow key={sch.id}>
                  <TableCell>
                    <code className="font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                      {sch.id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{sch.name}</div>
                    <div className="text-xs text-muted-foreground">{sch.address}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" className="font-mono">
                      {sch.geofenceId || 'GEO001'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#2ee59d]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>[{sch.lat ? sch.lat.toFixed(6) : '41.311081'}, {sch.lng ? sch.lng.toFixed(6) : '69.240562'}]</span>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `${sch.lat ? sch.lat.toFixed(6) : '41.311081'}, ${sch.lng ? sch.lng.toFixed(6) : '69.240562'}`;
                          navigator.clipboard.writeText(text);
                          alert(`GPS koordinata nusxalandi: ${text}`);
                        }}
                        className="text-xs text-[#9a9ac0] hover:text-[#2ee59d] transition"
                        title="GPS koordinatani nusxalash"
                      >
                        📋
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {sch.startTime} - {sch.endTime}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                      {sch.polygon ? sch.polygon.length : 4} ta nuqta
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <b>{count} nafar</b>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onOpenEditSchool(sch)}
                        className="h-7 text-xs px-2.5 gap-1"
                        title="Maktab nomini o'zgartirish"
                      >
                        <Edit3 className="w-3 h-3" />
                        Tahrirlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFlyToSchool(sch)}
                        className="h-7 text-xs px-2 gap-1"
                        title="Xaritada ko'rish"
                      >
                        <MapPin className="w-3 h-3" />
                        Xarita
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Platform Users Table */}
      <Card>
        <CardHeader className="p-4 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Foydalanuvchilar va Rollar Boshqaruvi
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foydalanuvchi ID</TableHead>
              <TableHead>F.I.O</TableHead>
              <TableHead>Email / Telefon</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Biriktirilgan Maktab</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono font-bold text-xs">{u.id}</TableCell>
                <TableCell className="font-bold">{u.name}</TableCell>
                <TableCell>
                  <div>{u.email}</div>
                  <div className="text-xs font-mono text-muted-foreground">{u.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'SUPER_ADMIN' ? 'default' : 'secondary'} className="text-xs">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{u.schoolId || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
        </>
      )}
    </div>
  );
};
