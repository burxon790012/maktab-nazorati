import React, { useState } from 'react';
import { CmsContact } from '@/types/cms';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface ContactSectionProps {
  contact: CmsContact;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ contact }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', phone: '', message: '' });
    }, 2500);
  };

  return (
    <section id="contact" className="py-20 md:py-28 relative bg-[#0b1220]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ALOQA VA BOG'LANISH</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Savollaringiz bormi? Mutaxassislarimiz yordam berishga tayyor
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Platformani maktabingizga joriy etish, sinovdan o'tkazish yoki aqlli soatlar yetkazib berish bo'yicha biz bilan bog'laning.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Contact Info Cards */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefon raqamlari</h4>
                <div className="mt-1 space-y-0.5">
                  <a href={`tel:${contact?.phone}`} className="block text-base font-bold text-white hover:text-cyan-400 transition-colors">
                    {contact?.phone || "+998 71 200-50-50"}
                  </a>
                  {contact?.mobile && (
                    <a href={`tel:${contact.mobile}`} className="block text-sm text-slate-300 hover:text-cyan-400 transition-colors">
                      {contact.mobile}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Elektron pochta</h4>
                <a href={`mailto:${contact?.email}`} className="mt-1 block text-base font-bold text-white hover:text-cyan-400 transition-colors">
                  {contact?.email || "info@smartchild.uz"}
                </a>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bosh ofis manzili</h4>
                <p className="mt-1 text-sm font-medium text-slate-200 leading-relaxed">
                  {contact?.address || "O'zbekiston, Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi, 42-uy"}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ish vaqti</h4>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {contact?.workingHours || "Dushanba - Shanba: 08:30 - 18:30"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                Tezkor xabar yuborish
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Qisqa xabar qoldiring, mas'ul mutaxassis tez orada siz bilan bog'lanadi.
              </p>

              {submitted ? (
                <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Xabaringiz yuborildi!</h4>
                  <p className="text-xs text-slate-300">Tez orada operatorimiz siz bilan bog'lanadi.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ismingiz
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="To'liq ismingiz"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Telefon raqamingiz
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+998 90 123 45 67"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Xabar yoki savolingiz
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Qanday ma'lumot olishni istaysiz?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Xabarni yuborish</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
