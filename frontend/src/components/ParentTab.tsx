import React, { useState } from 'react';
import { Student } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertOctagon, Play, Navigation, Home, Dumbbell, MapPin } from 'lucide-react';

interface ParentTabProps {
  students: Student[];
  onTriggerSos: () => Promise<void>;
}

export const ParentTab: React.FC<ParentTabProps> = ({ students, onTriggerSos }) => {
  const child = students[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [routeStep, setRouteStep] = useState(0);

  const handlePlayRoute = async () => {
    setIsPlaying(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setRouteStep(step);
      if (step >= 5) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">📱 Ota-ona Ilovasi (Parent Portal)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Farzandingizning jonli joylashuvi, xavfsiz zonalari va tezkor SOS xabarnomalari
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={onTriggerSos}
          className="gap-2 font-black shadow-lg shadow-rose-500/25 animate-pulse"
        >
          <AlertOctagon className="w-5 h-5" />
          🚨 SOS FAVQULODDA SIGNAL
        </Button>
      </div>

      {child && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Child Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary shadow-xl">
                <img
                  src={child.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                  className="w-full h-full object-cover"
                  alt={child.name}
                />
              </div>
              <CardTitle className="text-base font-bold mt-2">{child.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{child.className} • ID: {child.uniqueId}</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center justify-between">
                <span>Holati:</span>
                <Badge variant="success">PRESENT (Maktabda)</Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-card/60 border border-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maktab:</span>
                  <b>{child.schoolName}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yurak urishi:</span>
                  <b className="text-rose-400">78 BPM</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batareya:</span>
                  <b className="text-amber-400">88% (Watch5 Pro)</b>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Safe Zones & Route History */}
          <div className="md:col-span-2 space-y-4">
            {/* Safe Zones */}
            <Card>
              <CardHeader className="p-4 border-b border-border/60">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Xavfsiz Hududlar (Safe Zones)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <b className="text-xs">1-Sonli Namunaviy Maktab Hududi</b>
                      <p className="text-[10px] text-muted-foreground">Radius: 250m • Geofence ID: GEO001</p>
                    </div>
                  </div>
                  <Badge variant="success">FAOL (Hozir shu yerda)</Badge>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <b className="text-xs">Uy (Chilonzor mavzesi)</b>
                      <p className="text-[10px] text-muted-foreground">Radius: 150m</p>
                    </div>
                  </div>
                  <Badge variant="outline">Xavfsiz</Badge>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <b className="text-xs">Sport Majmuasi / Dzyudo</b>
                      <p className="text-[10px] text-muted-foreground">Radius: 180m</p>
                    </div>
                  </div>
                  <Badge variant="outline">Xavfsiz</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Route Playback */}
            <Card>
              <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Bugungi Harakat Tarixi (GPS Breadcrumbs)
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePlayRoute}
                  disabled={isPlaying}
                  className="gap-1 text-xs h-7"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  {isPlaying ? `Ko'rsatilmoqda (${routeStep}/5)...` : "Marshrutni O'ynatish"}
                </Button>
              </CardHeader>
              <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
                <p>07:55 da uydan chiqdi ➔ 08:18 da 1-Sonli Namunaviy Maktab hududiga xavfsiz yetib keldi.</p>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${(routeStep / 5) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
