import React, { useState } from 'react';
import { CmsFeature } from '@/types/cms';
import {
  Compass,
  Watch,
  School,
  UserCheck,
  LayoutDashboard,
  ShieldAlert,
  BellRing,
  BatteryCharging,
  History,
  BarChart3,
  Lock,
  Sliders,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';

interface FeaturesSectionProps {
  features: CmsFeature[];
}

const iconMap: Record<string, React.ElementType> = {
  Compass,
  Watch,
  School,
  UserCheck,
  LayoutDashboard,
  ShieldAlert,
  BellRing,
  BatteryCharging,
  History,
  BarChart3,
  Lock,
  Sliders
};

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ features }) => {
  const [selectedFeature, setSelectedFeature] = useState<CmsFeature | null>(null);

  const activeFeatures = (features || []).filter((f) => f.enabled !== false);

  return (
    <section id="features" className="py-20 md:py-28 relative bg-[#0b1220]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORMA AFZALLIKLARI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Har tomonlama xavfsizlik va boshqaruv vositalari
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Maktab ma'muriyati, o'qituvchilar va ota-onalar uchun eng ilg'or xavfsizlik imkoniyatlari yagona ekotizimda birlashtirildi.
          </p>
        </div>

        {/* 12 Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {activeFeatures.map((feat) => {
            const IconComponent = iconMap[feat.icon] || Compass;

            return (
              <div
                key={feat.id}
                onClick={() => setSelectedFeature(feat)}
                className="group relative p-7 rounded-3xl bg-slate-900/50 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                {/* Subtle Card Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />

                <div>
                  {/* Top Bar with Icon & Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {feat.tag && (
                      <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {feat.tag}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  <span>Batafsil ma'lumot</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-left">
            <button
              onClick={() => setSelectedFeature(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
              {(() => {
                const SelectedIcon = iconMap[selectedFeature.icon] || Compass;
                return <SelectedIcon className="w-7 h-7" />;
              })()}
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-semibold mb-2">
              {selectedFeature.tag}
            </div>

            <h3 className="text-2xl font-bold text-white mt-1">
              {selectedFeature.title}
            </h3>

            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              {selectedFeature.desc}
            </p>

            <div className="mt-6 p-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
              💡 Ushbu imkoniyat SMART CHILD platformasida to'liq sinxronizatsiya qilingan va barcha vakolatli foydalanuvchilar uchun moslashtirilgan.
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
