import React from 'react';
import { Student } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Thermometer, BatteryCharging, Footprints, ShieldAlert, Watch } from 'lucide-react';

interface HealthTabProps {
  students: Student[];
}

export const HealthTab: React.FC<HealthTabProps> = ({ students }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">❤️ Salomatlik va Telemetriya Monitoringi</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Samsung Galaxy Watch5 Pro orqali o'quvchilarning yurak urishi (BPM), tana harorati va faolligi
        </p>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
        <div>
          <b>Tibbiy ogohlantirish (Medical Disclaimer):</b> Smartwatch ko'rsatkichlari faqat xavfsizlik va
          wellness monitoringi uchun mo'ljallangan bo'lib, tibbiy tashxis hisoblanmaydi.
        </div>
      </div>

      {/* Grid of Student Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((std) => {
          const telem = std.telemetry;
          const bpm = telem?.heartRate || 76;
          const temp = telem?.bodyTemperature || 36.6;
          const battery = telem?.batteryLevel || 88;
          const steps = telem?.stepCount || 3400;

          const isBpmHigh = bpm > 110;
          const isTempHigh = temp > 37.2;

          return (
            <Card key={std.id} className="overflow-hidden hover:border-primary/50 transition-all">
              <CardHeader className="p-4 border-b border-border/60 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={std.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80'}
                      className="w-9 h-9 rounded-lg object-cover border border-border"
                      alt={std.name}
                    />
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{std.name}</h4>
                      <span className="text-xs text-muted-foreground">{std.className} • ID: {std.uniqueId}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs gap-1 font-mono">
                    <Watch className="w-3 h-3 text-muted-foreground" />
                    Watch5 Pro
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-3 grid grid-cols-2 gap-3 text-xs">
                {/* BPM */}
                <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-medium">Yurak Urishi</span>
                    <Heart className={`w-3.5 h-3.5 ${isBpmHigh ? 'text-rose-500 fill-rose-500 animate-ping' : 'text-rose-400 fill-rose-400'}`} />
                  </div>
                  <div className={`text-lg font-black font-mono ${isBpmHigh ? 'text-rose-400' : 'text-foreground'}`}>
                    {bpm} <span className="text-xs font-normal text-muted-foreground">BPM</span>
                  </div>
                  <span className="text-xs text-emerald-400">Normal (60-100)</span>
                </div>

                {/* Temperature */}
                <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-medium">Tana Harorati</span>
                    <Thermometer className={`w-3.5 h-3.5 ${isTempHigh ? 'text-rose-400' : 'text-teal-400'}`} />
                  </div>
                  <div className={`text-lg font-black font-mono ${isTempHigh ? 'text-rose-400' : 'text-foreground'}`}>
                    {temp.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">°C</span>
                  </div>
                  <span className="text-xs text-emerald-400">Normal (36.1-37.2)</span>
                </div>

                {/* Battery */}
                <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-medium">Batareya</span>
                    <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-black font-mono text-amber-400">
                    {battery}%
                  </div>
                  <span className="text-xs text-muted-foreground">Quvvat yetarli</span>
                </div>

                {/* Steps */}
                <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-medium">Qadamlar</span>
                    <Footprints className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-lg font-black font-mono text-foreground">
                    {steps.toLocaleString()}
                  </div>
                  <span className="text-xs text-blue-400">Kunlik faollik</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
