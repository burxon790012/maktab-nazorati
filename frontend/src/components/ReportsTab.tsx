import React from 'react';
import { AuditLog } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { BarChart3, ShieldCheck } from 'lucide-react';

interface ReportsTabProps {
  auditLogs: AuditLog[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">📊 Tizim Hisobotlari va Xavfsizlik Auditi</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kunlik, haftalik va oylik davomat ko'rsatkichlari hamda xavfsizlik loglari
        </p>
      </div>

      {/* Weekly Trend Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Dushanba</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-emerald-400">100%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Barcha o'quvchilar vaqtida kelgan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Seshanba</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-emerald-400">100%</div>
            <p className="text-[10px] text-amber-400 mt-1">1 nafar kechikkan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Chorshanba</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-emerald-400">100%</div>
            <p className="text-[10px] text-muted-foreground mt-1">O'z vaqtida kelgan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Payshanba</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-primary">75%</div>
            <p className="text-[10px] text-rose-400 mt-1">1 nafar kelmagan</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Tizim Harakatlari va Xavfsizlik Auditi (Audit Logs)
          </CardTitle>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-[10px]">
            ✓ Doimiy Qayd Etiladi
          </Badge>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vaqt</TableHead>
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Amal (Action)</TableHead>
              <TableHead>Obyekt</TableHead>
              <TableHead>Tafsilotlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </TableCell>
                <TableCell className="font-bold text-xs">{log.user}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[9px]">
                    {log.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="text-primary font-mono text-[11px] bg-primary/10 px-1.5 py-0.5 rounded">
                    {log.action}
                  </code>
                </TableCell>
                <TableCell className="font-mono text-xs">{log.target}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
