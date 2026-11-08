import React, { useState } from 'react';
import { CmsBanner } from '@/types/cms';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface TopBannerProps {
  banner: CmsBanner;
}

export const TopBanner: React.FC<TopBannerProps> = ({ banner }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!banner || !banner.enabled || dismissed) return null;

  return (
    <div className="relative isolate z-50 bg-gradient-to-r from-blue-700 via-cyan-600 to-indigo-700 px-4 py-2.5 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase text-white backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            {banner.badge || 'YANGILIK'}
          </span>
          <p className="truncate text-white/95">
            {banner.text}
          </p>
          {banner.linkText && banner.linkUrl && (
            <a
              href={banner.linkUrl}
              className="hidden sm:inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:text-white/80 transition-colors whitespace-nowrap ml-1"
            >
              {banner.linkText}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white transition-colors ml-4 shrink-0"
          aria-label="E'lonni yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

