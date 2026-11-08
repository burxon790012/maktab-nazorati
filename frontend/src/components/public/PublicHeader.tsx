import React, { useState, useEffect } from 'react';
import { CmsNavigation, CmsAppearance } from '@/types/cms';
import { Shield, LogIn, Menu, X, Sun, Moon, LayoutDashboard, ChevronRight } from 'lucide-react';

interface PublicHeaderProps {
  navigation: CmsNavigation;
  appearance: CmsAppearance;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNavigate: (route: string) => void;
  currentUser?: any;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  navigation,
  appearance,
  theme,
  toggleTheme,
  onNavigate,
  currentUser
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = navigation?.headerLinks || [
    { id: 'home', label: 'Asosiy', href: '#hero' },
    { id: 'about', label: 'Biz haqimizda', href: '#about' },
    { id: 'features', label: 'Imkoniyatlar', href: '#features' },
    { id: 'how', label: 'Qanday ishlaydi', href: '#how-it-works' },
    { id: 'schools', label: 'Maktablar uchun', href: '#for-schools' },
    { id: 'tech', label: 'Texnologiya', href: '#technology' },
    { id: 'status', label: 'Tizim holati', href: '#status' },
    { id: 'gallery', label: 'Galereya', href: '#gallery' },
    { id: 'contact', label: 'Bog\'lanish', href: '#contact' }
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
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
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#0b1220]/90 backdrop-blur-md border-b border-white/10 shadow-xl shadow-black/20'
          : 'bg-[#0b1220]/70 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero')}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg p-1"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                {appearance?.brandName || 'SMART CHILD'}
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              </span>
              <span className="text-[11px] font-semibold text-cyan-400 tracking-wider uppercase hidden sm:block">
                Bolalar xavfsizligi
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {links.map((link) => (
              <a
                key={link.id || link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3 py-2 text-xs xl:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons: Theme Toggle & Login CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Mavzuni almashtirish"
              title="Mavzuni almashtirish"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-300" />}
            </button>

            {/* Single Official Login Button */}
            <button
              onClick={() => onNavigate('/login')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <LogIn className="w-4 h-4" />
              <span>Kirish</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-300"
              aria-label="Mavzu"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-300" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0b1220]/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-3 pb-6 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-1">
            {links.map((link) => (
              <a
                key={link.id || link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-4 py-3 rounded-xl text-base font-medium text-slate-200 hover:bg-white/10 hover:text-cyan-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/login');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Tizimga kirish</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

