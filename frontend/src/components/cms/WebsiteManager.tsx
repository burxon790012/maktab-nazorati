import React, { useState, useEffect } from 'react';
import { CmsData, CmsFeature, CmsGalleryItem, CmsNewsItem, CmsHistoryItem } from '@/types/cms';
import {
  Globe,
  Home,
  Info,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Megaphone,
  Newspaper,
  Phone,
  Compass,
  Search,
  Palette,
  CheckCircle2,
  Save,
  Eye,
  Send,
  History,
  Trash2,
  Plus,
  Upload,
  RotateCcw,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface WebsiteManagerProps {
  token: string;
  onPreview: () => void;
}

export const WebsiteManager: React.FC<WebsiteManagerProps> = ({ token, onPreview }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('homepage');
  const [draft, setDraft] = useState<CmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Version History & Audit state
  const [historyList, setHistoryList] = useState<CmsHistoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Fetch current draft CMS
  const fetchDraft = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/cms/draft', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data.cms);
      }
    } catch (err) {
      console.error('Draft yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch version history
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/v1/cms/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchDraft();
    fetchHistory();
  }, [token]);

  // Save specific section to draft
  const saveSectionDraft = async (section: keyof CmsData, data: any) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/v1/cms/draft', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ section, data })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setDraft(resData.draft);
        setStatusMessage({ type: 'success', text: `"${section}" bo'limi qoralamada muvaffaqiyatli saqlandi!` });
        fetchHistory();
      } else {
        setStatusMessage({ type: 'error', text: resData.message || 'Saqlashda xatolik yuz berdi' });
      }
    } catch (_) {
      setStatusMessage({ type: 'error', text: 'Server bilan aloqa uzildi' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Publish Draft -> Live Website
  const handlePublish = async (summaryText?: string) => {
    setPublishing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/v1/cms/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ summary: summaryText || 'Super Admin tomonidan sayt yangilandi' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: 'Tabriklaymiz! Barcha o\'zgarishlar jonli veb-saytda rasman nashr qilindi!' });
        fetchHistory();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Nashr qilishda xato' });
      }
    } catch (_) {
      setStatusMessage({ type: 'error', text: 'Server xatosi' });
    } finally {
      setPublishing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Restore previous version
  const handleRestore = async (versionId: string) => {
    if (!confirm('Haqiqatan ham ushbu versiyani qayta tiklamoqchimisiz? Joriy qoralama ushbu versiyaga almashtiriladi.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/cms/restore/${versionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDraft(data.cms);
        setStatusMessage({ type: 'success', text: data.message });
        fetchHistory();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Tiklashda xatolik' });
      }
    } catch (_) {
      setStatusMessage({ type: 'error', text: 'Server xatosi' });
    } finally {
      setLoading(false);
    }
  };

  // Image upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'heroImage' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Rasm hajmi 5MB dan katta bo\'lmasligi kerak');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setUploading(true);
      try {
        const res = await fetch('/api/v1/cms/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            data: base64Data,
            filename: file.name,
            title: file.name.split('.')[0],
            category: 'schools',
            alt: file.name
          })
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          if (target === 'heroImage' && draft) {
            const updatedHero = { ...draft.hero, heroImage: resData.url };
            saveSectionDraft('hero', updatedHero);
          } else if (target === 'gallery' && draft) {
            setDraft({
              ...draft,
              gallery: [resData.item, ...(draft.gallery || [])]
            });
            setStatusMessage({ type: 'success', text: 'Yangi rasm galereyaga muvaffaqiyatli qo\'shildi' });
          }
        } else {
          alert(resData.message || 'Yuklashda xato');
        }
      } catch (err: any) {
        alert('Server bilan xatolik: ' + err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete media item from gallery
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Ushbu rasmni galereyadan o\'chirishga ishonchingiz komilmi?')) return;
    try {
      const res = await fetch(`/api/v1/cms/media/${mediaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (draft) {
          setDraft({
            ...draft,
            gallery: (draft.gallery || []).filter(g => g.id !== mediaId)
          });
        }
        setStatusMessage({ type: 'success', text: 'Rasm galereyadan o\'chirildi' });
      }
    } catch (_) {}
  };

  if (loading && !draft) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="ml-3 text-sm text-slate-300">CMS boshqaruv paneli yuklanmoqda...</span>
      </div>
    );
  }

  if (!draft) return null;

  const subTabs = [
    { id: 'homepage', label: 'A. Asosiy sahifa (Hero)', icon: Home },
    { id: 'about', label: 'B. Biz haqimizda', icon: Info },
    { id: 'features', label: 'C. Imkoniyatlar (12 ta)', icon: Sparkles },
    { id: 'heroImage', label: 'D. Hero surati', icon: ImageIcon },
    { id: 'gallery', label: 'E. Galereya', icon: Layers },
    { id: 'banner', label: 'F. E\'lon banneri', icon: Megaphone },
    { id: 'news', label: 'G. Yangiliklar', icon: Newspaper },
    { id: 'contact', label: 'H. Aloqa ma\'lumotlari', icon: Phone },
    { id: 'navigation', label: 'I. Navigatsiya', icon: Compass },
    { id: 'seo', label: 'J. SEO sozlamalari', icon: Search },
    { id: 'appearance', label: 'K. Tashqi ko\'rinish', icon: Palette },
    { id: 'publish', label: 'L. Nashr & Tarix', icon: History }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Top CMS Header & Action Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>WEBSITE MANAGEMENT (CMS)</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Veb-sayt Kontentini Boshqarish Tizimi
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Barcha ommaviy matnlar, rasmlar, bannerlar va bo'limlarni dinamik tahrirlang hamda bir zumda nashr qiling.
          </p>
        </div>

        {/* Global Workflow Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-colors"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Saytda ko'rish (Preview)</span>
          </button>

          <button
            onClick={() => handlePublish()}
            disabled={publishing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Bir zumda nashr qilish (Publish)</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main CMS Grid: Subsections Sidebar + Content Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Subsections Menu (Left) */}
        <div className="lg:col-span-3 space-y-1.5 p-3 rounded-2xl bg-slate-900/60 border border-white/10">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Bo'limlar (A - L)
          </div>
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Subsection Editor Box (Right) */}
        <div className="lg:col-span-9 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-6">
          
          {/* ================= A. HOMEPAGE HERO EDITOR ================= */}
          {activeSubTab === 'homepage' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-cyan-400" />
                <span>Asosiy sahifa (Hero) matnlari</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Yuqori nishon (Badge matni)
                </label>
                <input
                  type="text"
                  value={draft.hero.badge}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, badge: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Asosiy sarlavha (Headline)
                </label>
                <input
                  type="text"
                  value={draft.hero.headline}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, headline: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quyi sarlavha (Subtitle)
                </label>
                <textarea
                  rows={3}
                  value={draft.hero.subtitle}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Asosiy CTA tugma matni
                  </label>
                  <input
                    type="text"
                    value={draft.hero.primaryCta?.text || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          primaryCta: { ...draft.hero.primaryCta, text: e.target.value }
                        }
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ikkinchi CTA tugma matni
                  </label>
                  <input
                    type="text"
                    value={draft.hero.secondaryCta?.text || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          secondaryCta: { ...draft.hero.secondaryCta, text: e.target.value }
                        }
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('hero', draft.hero)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Qoralamani saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= B. ABOUT US EDITOR ================= */}
          {activeSubTab === 'about' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                <span>Biz haqimizda (About Us) bo'limi</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bo'lim sarlavhasi
                </label>
                <input
                  type="text"
                  value={draft.about.title}
                  onChange={(e) => setDraft({ ...draft, about: { ...draft.about, title: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bo'lim tavsifi (Subtitle)
                </label>
                <input
                  type="text"
                  value={draft.about.subtitle}
                  onChange={(e) => setDraft({ ...draft, about: { ...draft.about, subtitle: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Platformaning yaratilish maqsadi (Hikoya)
                </label>
                <textarea
                  rows={4}
                  value={draft.about.story}
                  onChange={(e) => setDraft({ ...draft, about: { ...draft.about, story: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('about', draft.about)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Qoralamani saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= C. FEATURES MANAGER ================= */}
          {activeSubTab === 'features' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span>Imkoniyatlar va afzalliklar ({draft.features?.length || 0} ta)</span>
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    const newFeat: CmsFeature = {
                      id: `feat-${Date.now()}`,
                      title: 'Yangi imkoniyat',
                      desc: 'Imkoniyat tavsifi...',
                      icon: 'Compass',
                      tag: 'Yangi',
                      enabled: true
                    };
                    const updated = [newFeat, ...(draft.features || [])];
                    setDraft({ ...draft, features: updated });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi karta qo'shish</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {(draft.features || []).map((feat, idx) => (
                  <div
                    key={feat.id || idx}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={feat.title}
                          placeholder="Karta nomi"
                          onChange={(e) => {
                            const updated = [...draft.features];
                            updated[idx].title = e.target.value;
                            setDraft({ ...draft, features: updated });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-bold"
                        />
                        <input
                          type="text"
                          value={feat.tag || ''}
                          placeholder="Teg (masalan: Real-vaqt)"
                          onChange={(e) => {
                            const updated = [...draft.features];
                            updated[idx].tag = e.target.value;
                            setDraft({ ...draft, features: updated });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = draft.features.filter((_, i) => i !== idx);
                          setDraft({ ...draft, features: updated });
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={feat.desc}
                      placeholder="Imkoniyat batafsil tavsifi"
                      onChange={(e) => {
                        const updated = [...draft.features];
                        updated[idx].desc = e.target.value;
                        setDraft({ ...draft, features: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('features', draft.features)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Imkoniyatlarni saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= D. HERO IMAGE MANAGER ================= */}
          {activeSubTab === 'heroImage' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <span>Hero surati va vizual kompozitsiya</span>
              </h3>

              <div className="relative rounded-2xl overflow-hidden border border-white/15 h-64 bg-slate-950">
                <img
                  src={draft.hero.heroImage}
                  alt="Joriy Hero surati"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-xs text-slate-300">
                    Joriy faol rasm: <span className="font-mono text-cyan-400">{draft.hero.heroImage}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Yangi rasm yuklash (Kompyuteringizdan, max 5MB):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'heroImage')}
                  disabled={uploading}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Yoki rasm URL manzilini to'g'ridan-to'g'ri kiriting:
                </label>
                <input
                  type="text"
                  value={draft.hero.heroImage}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: { ...draft.hero, heroImage: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('hero', draft.hero)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Hero rasmini saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= E. GALLERY MANAGER ================= */}
          {activeSubTab === 'gallery' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Media va fotogalereya boshqaruvi</span>
                </h3>

                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors cursor-pointer shadow">
                  <Upload className="w-4 h-4" />
                  <span>Yangi rasm yuklash</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'gallery')}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {(draft.gallery || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-800/90 border border-white/10 space-y-2 flex flex-col justify-between"
                  >
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black">
                      <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={item.title}
                      placeholder="Sarlavha"
                      onChange={(e) => {
                        const updated = draft.gallery.map(g => g.id === item.id ? { ...g, title: e.target.value } : g);
                        setDraft({ ...draft, gallery: updated });
                      }}
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                    />

                    <select
                      value={item.category}
                      onChange={(e) => {
                        const updated = draft.gallery.map(g => g.id === item.id ? { ...g, category: e.target.value as any } : g);
                        setDraft({ ...draft, gallery: updated });
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs"
                    >
                      <option value="schools">Maktablar</option>
                      <option value="watches">Aqlli soatlar</option>
                      <option value="platform">Platforma</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('gallery', draft.gallery)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Galereyani saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= F. BANNER MANAGER ================= */}
          {activeSubTab === 'banner' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cyan-400" />
                <span>Yuqori e'lon banneri (Top Banner)</span>
              </h3>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800 border border-white/10">
                <input
                  type="checkbox"
                  id="bannerToggle"
                  checked={draft.banner.enabled}
                  onChange={(e) => setDraft({ ...draft, banner: { ...draft.banner, enabled: e.target.checked } })}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <label htmlFor="bannerToggle" className="text-xs sm:text-sm font-semibold text-white cursor-pointer">
                  Bannerni veb-saytning eng tepasida ko'rsatish
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Banner nishoni (Badge)
                </label>
                <input
                  type="text"
                  value={draft.banner.badge}
                  onChange={(e) => setDraft({ ...draft, banner: { ...draft.banner, badge: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E'lon matni
                </label>
                <textarea
                  rows={2}
                  value={draft.banner.text}
                  onChange={(e) => setDraft({ ...draft, banner: { ...draft.banner, text: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('banner', draft.banner)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Bannerni saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= G. NEWS MANAGER ================= */}
          {activeSubTab === 'news' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-cyan-400" />
                  <span>Yangiliklar va e'lonlar</span>
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    const newItem: CmsNewsItem = {
                      id: `news-${Date.now()}`,
                      title: 'Yangi xabar sarlavhasi',
                      date: new Date().toISOString().split('T')[0],
                      summary: 'Qisqa e\'lon mazmuni...'
                    };
                    setDraft({ ...draft, news: [newItem, ...(draft.news || [])] });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>E'lon qo'shish</span>
                </button>
              </div>

              <div className="space-y-3">
                {(draft.news || []).map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-800 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...draft.news];
                          updated[idx].title = e.target.value;
                          setDraft({ ...draft, news: updated });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-bold"
                      />
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => {
                          const updated = [...draft.news];
                          updated[idx].date = e.target.value;
                          setDraft({ ...draft, news: updated });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = draft.news.filter((_, i) => i !== idx);
                          setDraft({ ...draft, news: updated });
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={item.summary}
                      onChange={(e) => {
                        const updated = [...draft.news];
                        updated[idx].summary = e.target.value;
                        setDraft({ ...draft, news: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('news', draft.news)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Yangiliklarni saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= H. CONTACT INFORMATION ================= */}
          {activeSubTab === 'contact' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-cyan-400" />
                <span>Aloqa va manzil ma'lumotlari</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Asosiy telefon
                  </label>
                  <input
                    type="text"
                    value={draft.contact.phone}
                    onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Qo'shimcha telefon
                  </label>
                  <input
                    type="text"
                    value={draft.contact.mobile}
                    onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, mobile: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Elektron pochta
                  </label>
                  <input
                    type="email"
                    value={draft.contact.email}
                    onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Telegram havola
                  </label>
                  <input
                    type="text"
                    value={draft.contact.telegram}
                    onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, telegram: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bosh ofis manzili
                </label>
                <input
                  type="text"
                  value={draft.contact.address}
                  onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, address: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('contact', draft.contact)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Aloqa ma'lumotlarini saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= I. NAVIGATION MANAGER ================= */}
          {activeSubTab === 'navigation' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <span>Navigatsiya va menyu havolalari</span>
              </h3>

              <div className="space-y-2.5">
                {(draft.navigation?.headerLinks || []).map((link, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-white/10">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => {
                        const updated = [...draft.navigation.headerLinks];
                        updated[idx].label = e.target.value;
                        setDraft({
                          ...draft,
                          navigation: { ...draft.navigation, headerLinks: updated }
                        });
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => {
                        const updated = [...draft.navigation.headerLinks];
                        updated[idx].href = e.target.value;
                        setDraft({
                          ...draft,
                          navigation: { ...draft.navigation, headerLinks: updated }
                        });
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-cyan-400 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('navigation', draft.navigation)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Menyuni saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= J. SEO SETTINGS ================= */}
          {activeSubTab === 'seo' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" />
                <span>Qidiruv tizimi (SEO) va OpenGraph sozlamalari</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sahifa sarlavhasi (Meta Title)
                </label>
                <input
                  type="text"
                  value={draft.seo.title}
                  onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, title: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta tavsif (Meta Description)
                </label>
                <textarea
                  rows={3}
                  value={draft.seo.description}
                  onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, description: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kalit so'zlar (Keywords)
                </label>
                <input
                  type="text"
                  value={draft.seo.keywords}
                  onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, keywords: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ijtimoiy tarmoqlar rasmi (OpenGraph OG Image)
                </label>
                <input
                  type="text"
                  value={draft.seo.ogImage}
                  onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, ogImage: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('seo', draft.seo)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>SEO sozlamalarini saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= K. APPEARANCE SETTINGS ================= */}
          {activeSubTab === 'appearance' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <span>Veb-sayt tashqi ko'rinishi</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brend nomi (Logo matni)
                </label>
                <input
                  type="text"
                  value={draft.appearance.brandName}
                  onChange={(e) => setDraft({ ...draft, appearance: { ...draft.appearance, brandName: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Asosiy rang aksenti (Hex)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draft.appearance.primaryColor || '#22d3ee'}
                    onChange={(e) => setDraft({ ...draft, appearance: { ...draft.appearance, primaryColor: e.target.value } })}
                    className="w-12 h-10 rounded-xl bg-slate-800 border border-white/10 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={draft.appearance.primaryColor || '#22d3ee'}
                    onChange={(e) => setDraft({ ...draft, appearance: { ...draft.appearance, primaryColor: e.target.value } })}
                    className="w-48 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveSectionDraft('appearance', draft.appearance)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Ko'rinishni saqlash</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= L. PUBLISH / DRAFT MANAGEMENT ================= */}
          {activeSubTab === 'publish' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <span>Nashr qilish va versiyalar tarixi (Publish Workflow)</span>
              </h3>

              {/* Publish CTA Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Qoralamadagi barcha o'zgarishlarni nashr qilish</h4>
                    <p className="text-xs text-slate-300">
                      Ushbu tugma bosilganda saytning jonli nusxasi darhol yangilanadi va ommaviy tashrif buyuruvchilarga taqdim etiladi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handlePublish('Super Admin tomonidan rasmiy nashr')}
                    disabled={publishing}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                  >
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Jonli saytga nashr qilish</span>
                  </button>

                  <button
                    onClick={onPreview}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Qoralamani ko'rish (Preview)</span>
                  </button>
                </div>
              </div>

              {/* Version History List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Nashr qilingan versiyalar arxivi:</h4>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {historyList.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-3.5 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-400 font-mono">{ver.version}</span>
                          <span className="text-slate-400 font-normal">
                            ({new Date(ver.publishedAt).toLocaleString('uz-UZ')})
                          </span>
                        </div>
                        <p className="text-slate-300 mt-0.5">{ver.summary}</p>
                        <p className="text-[11px] text-slate-400">Nashr qiluvchi: {ver.publishedBy}</p>
                      </div>

                      <button
                        onClick={() => handleRestore(ver.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Tiklash</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Logs */}
              {auditLogs.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    CMS Harakatlar jurnali (Audit Log):
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-400">
                    {auditLogs.slice(0, 15).map((log) => (
                      <div key={log.id} className="p-2 rounded bg-black/30 border border-white/5">
                        <span className="text-cyan-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="text-emerald-400">{log.action}</span> - {log.details} ({log.updatedBy})
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
