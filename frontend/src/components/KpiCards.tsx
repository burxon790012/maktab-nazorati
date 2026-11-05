import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Radio,
  BatteryCharging,
  Flame,
  CheckCircle2,
  Users
} from 'lucide-react';

export type KpiFilter = 'ALL' | 'INSIDE' | 'OUTSIDE' | 'VERIFYING' | 'SOS' | 'ONLINE' | 'OFFLINE';

interface KpiCardsProps {
  stats: {
    inside: number;
    outside: number;
    verifying: number;
    sos: number;
    onlineWatches: number;
    offlineWatches: number;
    totalStudents: number;
    avgBattery: number;
  };
  activeFilter: KpiFilter;
  onSelectFilter: (filter: KpiFilter) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'INSIDE' as KpiFilter,
      label: 'Maktabda',
      value: stats.inside,
      total: stats.totalStudents,
      color: '#2ee59d',
      bgGlow: 'hover:shadow-[#2ee59d]/10',
      borderColor: 'border-[#2ee59d]',
      progressPct: stats.totalStudents ? Math.round((stats.inside / stats.totalStudents) * 100) : 0,
      icon: ShieldCheck,
      desc: "Xavfsiz hududda",
    },
    {
      id: 'OUTSIDE' as KpiFilter,
      label: 'Tashqarida',
      value: stats.outside,
      total: stats.totalStudents,
      color: '#ff4d5e',
      bgGlow: 'hover:shadow-[#ff4d5e]/10',
      borderColor: 'border-[#ff4d5e]',
      progressPct: stats.totalStudents ? Math.round((stats.outside / stats.totalStudents) * 100) : 0,
      icon: AlertTriangle,
      desc: "Maktabdan tashqarida",
    },
    {
      id: 'VERIFYING' as KpiFilter,
      label: 'Chegarada',
      value: stats.verifying,
      total: stats.totalStudents,
      color: '#ffb020',
      bgGlow: 'hover:shadow-[#ffb020]/10',
      borderColor: 'border-[#ffb020]',
      progressPct: stats.totalStudents ? Math.round((stats.verifying / stats.totalStudents) * 100) : 0,
      icon: Clock,
      desc: "Aniqlanmoqda (Flapping himoya)",
    },
    {
      id: 'SOS' as KpiFilter,
      label: 'Favqulodda SOS',
      value: stats.sos,
      total: null,
      color: '#ff4d5e',
      bgGlow: 'hover:shadow-[#ff4d5e]/20',
      borderColor: 'border-[#ff4d5e]',
      isPulse: stats.sos > 0,
      progressPct: stats.sos > 0 ? 100 : 0,
      icon: Flame,
      desc: stats.sos > 0 ? "Tezkor chora ko'ring!" : "Tinch holat",
    },
    {
      id: 'ONLINE' as KpiFilter,
      label: 'Soatlar ONLINE',
      value: `${stats.onlineWatches} / ${stats.onlineWatches + stats.offlineWatches}`,
      rawVal: stats.onlineWatches,
      color: '#4db5ff',
      bgGlow: 'hover:shadow-[#4db5ff]/10',
      borderColor: 'border-[#4db5ff]',
      progressPct: (stats.onlineWatches + stats.offlineWatches) > 0
        ? Math.round((stats.onlineWatches / (stats.onlineWatches + stats.offlineWatches)) * 100)
        : 0,
      icon: Radio,
      desc: `${stats.offlineWatches} ta oflayn`,
    },
    {
      id: 'ALL' as KpiFilter,
      label: "O'rtacha Batareya",
      value: `${stats.avgBattery}%`,
      rawVal: stats.avgBattery,
      color: stats.avgBattery > 40 ? '#2ee59d' : stats.avgBattery > 20 ? '#ffb020' : '#ff4d5e',
      bgGlow: 'hover:shadow-[#2ee59d]/10',
      borderColor: 'border-[#2ee59d]',
      progressPct: stats.avgBattery,
      icon: BatteryCharging,
      desc: "Samsung Galaxy Watch5 Pro",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onSelectFilter(isSelected ? 'ALL' : card.id)}
            className={`cursor-pointer group relative p-3.5 rounded-2xl bg-[#2a2a4a] border transition-all duration-200 overflow-hidden shadow-sm flex flex-col justify-between
              ${isSelected ? `${card.borderColor} ring-2 ring-opacity-50 ring-offset-1 ring-offset-[#1b1b33] ${card.borderColor}` : 'border-[#3a3a63]/40 hover:border-[#3a3a63]'}
              ${card.isPulse ? 'sos-badge-pulse' : ''}
              ${card.bgGlow} hover:-translate-y-0.5
            `}
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-semibold text-[#9a9ac0] truncate group-hover:text-[#e8e8f5] transition">
                {card.label}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${card.color}18`, color: card.color }}
              >
                <Icon className={`w-4 h-4 ${card.isPulse ? 'animate-bounce' : ''}`} />
              </div>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1 my-1">
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: card.color }}
              >
                {card.value}
              </span>
              {card.total !== null && (
                <span className="text-xs text-[#9a9ac0] font-medium">
                  / {card.total}
                </span>
              )}
            </div>

            {/* Progress line */}
            <div className="w-full bg-[#1b1b33] h-1.5 rounded-full overflow-hidden mt-1 mb-1.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, card.progressPct))}%`,
                  backgroundColor: card.color,
                }}
              />
            </div>

            {/* Small description */}
            <div className="text-[11px] text-[#9a9ac0] truncate flex items-center justify-between">
              <span>{card.desc}</span>
              {isSelected && (
                <span className="text-[10px] font-bold text-[#2ee59d] uppercase">Faol</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

