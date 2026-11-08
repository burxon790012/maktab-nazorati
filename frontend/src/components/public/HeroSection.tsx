import React from 'react';
import { CmsHero } from '@/types/cms';
import { ShieldCheck, ArrowRight, LogIn, MapPin, Watch, BatteryCharging, Heart, Activity, Radio } from 'lucide-react';

interface HeroSectionProps {
  hero: CmsHero;
  onExplore: () => void;
  onLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ hero, onExplore, onLogin }) => {
  return (
    <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Subtitle, CTAs & Stats */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-8">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{hero.badge || "INTELLEKTUAL MAKTAB XAVFSIZLIGI"}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              {hero.headline ? (
                <>
                  <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    {hero.headline.split('—')[0]}
                  </span>
                  {hero.headline.includes('—') && (
                    <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                      — {hero.headline.split('—')[1]}
                    </span>
                  )}
                </>
              ) : (
                <>
                  SMART CHILD — <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Har bir bola uchun xavfsiz kelajak</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {hero.subtitle ||
                "Maktablar, o'qituvchilar va oilalarni zamonaviy texnologiyalar orqali birlashtiruvchi intellektual maktab xavfsizligi va GPS monitoring tizimi."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onExplore}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <span>{hero.primaryCta?.text || "Platformani o'rganish"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onLogin}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-base border border-white/15 backdrop-blur-md hover:border-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <LogIn className="w-5 h-5 text-cyan-400" />
                <span>{hero.secondaryCta?.text || "Tizimga kirish"}</span>
              </button>
            </div>

            {/* Live Stats Row */}
            {hero.stats && hero.stats.length > 0 && (
              <div className="pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                {hero.stats.map((stat, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight text-cyan-300">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Hero Visual & Floating Interactive Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Decorative Glow Border */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt" />

              {/* Main Card Container */}
              <div className="relative rounded-3xl bg-slate-900/90 border border-white/15 overflow-hidden shadow-2xl backdrop-blur-xl">
                
                {/* Main Hero Photograph */}
                <div className="relative h-72 sm:h-80 w-full overflow-hidden">
                  <img
                    src={hero.heroImage || "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"}
                    alt="SMART CHILD maktab va bolalar xavfsizligi"
                    className="w-full h-full object-cover object-center filter brightness-[0.88] hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {/* Status Overlay Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-emerald-500/40 backdrop-blur-md text-xs font-semibold text-emerald-400 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Jonli GPS Signal Faol</span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-white/20 backdrop-blur-md text-xs font-semibold text-slate-200">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>LTE / GPS 4G</span>
                  </div>
                </div>

                {/* Simulated Telemetry Cards */}
                <div className="p-5 space-y-4">
                  {/* Student & School Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full ring-2 ring-cyan-400/50 overflow-hidden bg-slate-800">
                        <img
                          src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80"
                          alt="O'quvchi fotosi"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Ali Valiyev</h4>
                        <p className="text-xs text-slate-400">5-A sinf o'quvchisi</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Maktabda (Xavfsiz)
                    </span>
                  </div>

                  {/* Geolocation Card */}
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 text-slate-200">
                      <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Urganch sh., 30-maktab</div>
                        <div className="text-[11px] text-slate-400 font-mono">41.5508° N, 60.6312° E</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">Geozona ichida</span>
                      <span className="text-[10px] text-slate-400">aniqlik: ±3m</span>
                    </div>
                  </div>

                  {/* Health & Device Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px]">
                        <Watch className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Soat</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1">Galaxy Watch5</div>
                    </div>

                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px]">
                        <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Batareya</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">92% (Quvvatli)</div>
                    </div>

                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px]">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span>Puls</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1">74 bpm</div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
