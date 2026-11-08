import React from 'react';
import { CmsTechnology } from '@/types/cms';
import { Cpu, Satellite, Map, Watch, Wifi, Shield, Lock, Layers } from 'lucide-react';

interface TechnologySectionProps {
  technology: CmsTechnology;
}

const techIcons = [Satellite, Map, Watch, Wifi, Layers, Lock];

export const TechnologySection: React.FC<TechnologySectionProps> = ({ technology }) => {
  const items = technology?.items || [];

  return (
    <section id="technology" className="py-20 md:py-28 relative border-t border-white/5 bg-[#0b1220]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
            <Cpu className="w-4 h-4" />
            <span>{technology.badge || "TEXNOLOGIK ARXITEKTURA"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {technology.title || "Ishonchli va zamonaviy texnologiyalar ustiga qurilgan"}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {technology.subtitle ||
              "Uzluksiz 99.9% faoliyat ko'rsatish va milliy xavfsizlik talablariga mos keluvchi backend infratuzilmasi"}
          </p>
        </div>

        {/* 6 Technology Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item, idx) => {
            const IconComponent = techIcons[idx % techIcons.length] || Satellite;

            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-slate-900/40 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/70 transition-all duration-300 shadow-lg group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {item.badge && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ishchi holatda tasdiqlangan</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
