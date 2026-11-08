import React, { useState } from 'react';
import { CmsGalleryItem } from '@/types/cms';
import { Image as ImageIcon, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GallerySectionProps {
  gallery: CmsGalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const [filter, setFilter] = useState<'all' | 'schools' | 'watches' | 'platform'>('all');
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const items = gallery || [];
  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIndex !== null && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    } else {
      setActiveImageIndex(filtered.length - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIndex !== null && activeImageIndex < filtered.length - 1) {
      setActiveImageIndex(activeImageIndex + 1);
    } else {
      setActiveImageIndex(0);
    }
  };

  return (
    <section id="gallery" className="py-20 md:py-28 relative border-t border-white/5 bg-[#0b1220]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>FOTOGALEREYA VA SKRINSHOTLAR</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            SMART CHILD hayotidan lavhalar
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Maktablar, o'quvchilar, aqlli soatlar va xarita platformamizdan olingan haqiqiy fotomateriallar
          </p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'schools', label: 'Maktablar' },
              { id: 'watches', label: 'Aqlli soatlar' },
              { id: 'platform', label: 'Dasturiy interfeys' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  filter === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => setActiveImageIndex(idx)}
              className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 cursor-pointer shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 aspect-[4/3]"
            >
              <img
                src={item.url}
                alt={item.alt || item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Zoom Hover Icon */}
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>

              {/* Caption */}
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {item.category === 'schools' ? 'Maktab' : item.category === 'watches' ? 'Aqlli soat' : 'Platforma'}
                </span>
                <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
                  {item.title}
                </h4>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeImageIndex !== null && filtered[activeImageIndex] && (
        <div
          onClick={() => setActiveImageIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
            aria-label="Yopish"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 hidden sm:flex"
            aria-label="Oldingi"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 hidden sm:flex"
            aria-label="Keyingi"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden bg-slate-900 border border-white/15 shadow-2xl flex flex-col"
          >
            <img
              src={filtered[activeImageIndex].url}
              alt={filtered[activeImageIndex].alt || filtered[activeImageIndex].title}
              className="w-full max-h-[70vh] object-contain bg-black/50"
            />
            <div className="p-5 bg-slate-900 text-left">
              <h3 className="text-lg font-bold text-white">
                {filtered[activeImageIndex].title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {filtered[activeImageIndex].alt}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

