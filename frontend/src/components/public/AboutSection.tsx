import React from 'react';
import { CmsAbout } from '@/types/cms';
import { ShieldCheck, HeartHandshake, Eye, Zap, CheckCircle2 } from 'lucide-react';

interface AboutSectionProps {
  about: CmsAbout;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ about }) => {
  return (
    <section id="about" className="py-20 md:py-28 relative border-t border-white/5 bg-[#0b1220]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{about.badge || "BIZNING MISSIYAMIZ"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {about.title || "SMART CHILD platformasi haqida"}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {about.subtitle ||
              "Farzandlarimizning maktabga borish va qaytish yo'lidagi har bir qadami xavfsiz, ota-onalar va ta'lim maskanlari esa xotirjam bo'lishi shart."}
          </p>
        </div>

        {/* Narrative & High-impact Grid */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Narrative Box */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Loyihaning maqsadi va yaratilish tarixi
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {about.story}
              </p>
            </div>

            {/* Core Pillars */}
            <div className="space-y-4">
              {(about.features || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all"
                >
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Composition */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
                alt="Maktab sinfxonasi va o'quvchilar"
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/15">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Ota-onalar va Maktab Hamkorligi</div>
                    <div className="text-xs text-slate-300">Yagona xavfsizlik axborot muhiti</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 text-center">
                <div className="text-3xl font-extrabold text-cyan-400 font-mono">100%</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">Elektron davomat aniqligi</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 text-center">
                <div className="text-3xl font-extrabold text-blue-400 font-mono">&lt; 3s</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">SOS yetib borish tezligi</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
