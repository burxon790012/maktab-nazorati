import React, { useState, useEffect } from 'react';
import { CmsData } from '@/types/cms';
import { TopBanner } from './TopBanner';
import { PublicHeader } from './PublicHeader';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { ForSchoolsSection } from './ForSchoolsSection';
import { TechnologySection } from './TechnologySection';
import { SystemStatusSection } from './SystemStatusSection';
import { GallerySection } from './GallerySection';
import { ContactSection } from './ContactSection';
import { PublicFooter } from './PublicFooter';
import { Eye, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

interface LandingPageProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNavigate: (route: string) => void;
  currentUser?: any;
  token?: string;
  isPreviewMode?: boolean;
  onPublishDraft?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  toggleTheme,
  onNavigate,
  currentUser,
  token,
  isPreviewMode = false,
  onPublishDraft
}) => {
  const [cmsData, setCmsData] = useState<CmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const fetchCms = async () => {
      setLoading(true);
      try {
        const endpoint = isPreviewMode ? '/api/v1/cms/draft' : '/api/v1/cms/public';
        const headers: Record<string, string> = {};
        if (isPreviewMode && token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(endpoint, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.cms) {
            setCmsData(json.cms);
            if (json.cms.seo?.title) {
              document.title = json.cms.seo.title;
            }
          }
        }
      } catch (err) {
        console.warn('CMS yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCms();
  }, [isPreviewMode, token]);

  const handlePublish = async () => {
    if (!token) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/v1/cms/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ summary: 'Preview rejimidan to\'g\'ridan-to\'g\'ri nashr qilindi' })
      });
      if (res.ok) {
        if (onPublishDraft) onPublishDraft();
        alert('Tabriklaymiz! Sayt o\'zgarishlari muvaffaqiyatli nashr qilindi!');
        onNavigate('/');
      }
    } catch (_) {
      alert('Nashr qilishda xatolik yuz berdi');
    } finally {
      setPublishing(false);
    }
  };

  if (loading && !cmsData) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            SMART CHILD yuklanmoqda...
          </span>
        </div>
      </div>
    );
  }

  const cms = cmsData || ({} as CmsData);

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Preview Mode Bar (Super Admin Only) */}
      {isPreviewMode && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-4 py-3 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <Eye className="w-4 h-4 text-white animate-pulse" />
            <span>
              QORALAMA (PREVIEW) REJIMI — Ushbu o'zgarishlar faqat sizga ko'rinmoqda, nashr qilingandan so'ng hamma ko'radi.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>CMS Boshqaruviga qaytish</span>
            </button>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-colors"
            >
              {publishing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Bir zumda nashr qilish</span>
            </button>
          </div>
        </div>
      )}

      {/* Top CMS Announcement Banner */}
      {cms.banner && <TopBanner banner={cms.banner} />}

      {/* Main Header */}
      <PublicHeader
        navigation={cms.navigation}
        appearance={cms.appearance}
        theme={theme}
        toggleTheme={toggleTheme}
        onNavigate={onNavigate}
        currentUser={currentUser}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {cms.hero && (
          <HeroSection
            hero={cms.hero}
            onExplore={() => {
              const el = document.querySelector('#features');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onLogin={() => onNavigate('/login')}
          />
        )}

        {cms.about && <AboutSection about={cms.about} />}

        {cms.features && <FeaturesSection features={cms.features} />}

        {cms.howItWorks && <HowItWorksSection howItWorks={cms.howItWorks} />}

        {cms.forSchools && <ForSchoolsSection forSchools={cms.forSchools} />}

        {cms.technology && <TechnologySection technology={cms.technology} />}

        <SystemStatusSection />

        {cms.gallery && <GallerySection gallery={cms.gallery} />}

        {cms.contact && <ContactSection contact={cms.contact} />}
      </main>

      {/* Public Footer */}
      <PublicFooter
        navigation={cms.navigation}
        contact={cms.contact}
        appearance={cms.appearance}
        onNavigate={onNavigate}
      />

    </div>
  );
};
