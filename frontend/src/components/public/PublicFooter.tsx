import React from 'react';
import { CmsNavigation, CmsContact, CmsAppearance } from '@/types/cms';
import { Shield, Send, Instagram, Youtube, Heart, ExternalLink } from 'lucide-react';

interface PublicFooterProps {
  navigation: CmsNavigation;
  contact: CmsContact;
  appearance: CmsAppearance;
  onNavigate: (route: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  navigation,
  contact,
  appearance,
  onNavigate
}) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(href);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info (2 columns) */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                {appearance?.brandName || 'SMART CHILD'}
              </span>
            </div>

            <p className="text-slate-400 max-w-sm text-xs sm:text-sm leading-relaxed">
              O'zbekiston maktablarida o'quvchilar xavfsizligi, GPS monitoring va aqlli soatlar orqali maktab hamda oilalarni bog'lovchi milliy intellektual ekotizim.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={contact?.telegram || "https://t.me/MMSA571"}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                aria-label="Telegram (@MMSA571)"
                title="Telegram (@MMSA571)"
              >
                <Send className="w-4 h-4" />
              </a>
              {contact?.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                  aria-label="Instagram profil"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {contact?.youtube && (
                <a
                  href={contact.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                  aria-label="YouTube kanal"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Nav Links Column */}
          <div className="text-left space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Bo'limlar
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#about" onClick={(e) => handleLinkClick(e, '#about')} className="hover:text-cyan-400 transition-colors">
                  Biz haqimizda
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleLinkClick(e, '#features')} className="hover:text-cyan-400 transition-colors">
                  Imkoniyatlar
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => handleLinkClick(e, '#how-it-works')} className="hover:text-cyan-400 transition-colors">
                  Qanday ishlaydi
                </a>
              </li>
              <li>
                <a href="#for-schools" onClick={(e) => handleLinkClick(e, '#for-schools')} className="hover:text-cyan-400 transition-colors">
                  Maktablar uchun
                </a>
              </li>
            </ul>
          </div>

          {/* Tech & System Status Column */}
          <div className="text-left space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Texnologiya & Holat
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#technology" onClick={(e) => handleLinkClick(e, '#technology')} className="hover:text-cyan-400 transition-colors">
                  Texnologiyalar
                </a>
              </li>
              <li>
                <a href="#status" onClick={(e) => handleLinkClick(e, '#status')} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Tizim holati (Uptime)</span>
                </a>
              </li>
              <li>
                <a href="#gallery" onClick={(e) => handleLinkClick(e, '#gallery')} className="hover:text-cyan-400 transition-colors">
                  Fotogalereya
                </a>
              </li>
              <li>
                <a href="/login" onClick={(e) => handleLinkClick(e, '/login')} className="hover:text-cyan-400 transition-colors text-cyan-300 font-semibold">
                  Tizimga kirish (Login)
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="text-left space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Aloqa
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {contact?.address || "O'zbekiston Respublikasi, Urganch sh., Xonqa ko'chasi, 26-uy"}
            </p>
            <div className="text-xs space-y-1">
              <a href="tel:+998972001279" className="block text-white hover:text-cyan-400 font-semibold">
                +998 97 200-12-79
              </a>
              <a href="mailto:burxonturayev7900@gmail.com" className="block text-slate-300 hover:text-cyan-400">
                burxonturayev7900@gmail.com
              </a>
              <a href="https://t.me/MMSA571" target="_blank" rel="noreferrer" className="block text-cyan-400 hover:text-cyan-300">
                Telegram: @MMSA571
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} SMART CHILD. Barcha huquqlar himoyalangan.</p>
          <p className="flex items-center gap-1">
            Farzandlarimiz xavfsizligi va tinchligi yo'lida ishlab chiqildi.
          </p>
        </div>
      </div>
    </footer>
  );
};

