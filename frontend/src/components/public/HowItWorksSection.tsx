import React from 'react';
import { CmsHowItWorks } from '@/types/cms';
import { School, UserPlus, Watch, ShieldCheck, ArrowRight } from 'lucide-react';

interface HowItWorksSectionProps {
  howItWorks: CmsHowItWorks;
}

const stepIcons = [School, UserPlus, Watch, ShieldCheck];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ howItWorks }) => {
  const steps = howItWorks?.steps || [];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative border-t border-white/5 bg-[#0b1220]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase">
            <span>{howItWorks.badge || "BOSQICHMA-BOSQICH"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {howItWorks.title || "SMART CHILD tizimi qanday ishlaydi?"}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {howItWorks.subtitle ||
              "Maktabdan to ota-ona smartfonigacha bo'lgan 4 ta oson va ishonchli qadam"}
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const IconComponent = stepIcons[idx] || ShieldCheck;

            return (
              <div
                key={idx}
                className="relative p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
              >
                {/* Step Number & Connector */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-cyan-400/40 font-mono">
                      {step.number || `0${idx + 1}`}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2.5">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <span>Bosqich {idx + 1}</span>
                  {idx < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

