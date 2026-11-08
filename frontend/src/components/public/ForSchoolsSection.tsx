import React, { useState } from 'react';
import { CmsForSchools } from '@/types/cms';
import { School, CheckCircle, Send, Sparkles, Building, Phone, Mail, User } from 'lucide-react';

interface ForSchoolsSectionProps {
  forSchools: CmsForSchools;
}

export const ForSchoolsSection: React.FC<ForSchoolsSectionProps> = ({ forSchools }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    directorName: '',
    phone: '',
    email: '',
    studentCount: '500'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setFormData({ schoolName: '', directorName: '', phone: '', email: '', studentCount: '500' });
    }, 2000);
  };

  return (
    <section id="for-schools" className="py-20 md:py-28 relative bg-[#0b1220]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Card */}
        <div className="relative rounded-3xl p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-blue-950/80 via-slate-900 to-slate-950 border border-cyan-500/30 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                <School className="w-3.5 h-3.5" />
                <span>{forSchools.badge || "MAKTABLAR VA DIREKTORLAR UCHUN"}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {forSchools.title || "Ta'lim muassasasi uchun zamonaviy xavfsizlik standarti"}
              </h2>

              <p className="text-base text-slate-300 leading-relaxed font-normal">
                {forSchools.subtitle ||
                  "Maktab nufuzini oshirish, ota-onalar ishonchini qozonish va har bir o'quvchining xavfsizligini kafolatlash"}
              </p>

              {/* Benefits Checklist */}
              <div className="space-y-3.5 pt-2">
                {(forSchools.benefits || []).map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-400 mt-0.5 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">{b.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Maktabingizni ulash uchun ariza qoldiring
                </button>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl space-y-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Maktab administratori nimalarga ega bo'ladi?
                </h3>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Real-vaqt rejimida barcha o'quvchilar xaritasi</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Barcha sinflar bo'yicha bir zumda avtomatik davomat</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Xavfli zonalardan chiqishda audio signalizatsiya</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Vazirlik va ta'lim boshqarmasi uchun tayyor hisobotlar</span>
                  </li>
                </ul>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                  🛡️ Barcha hisobotlar va telemetriya ma'lumotlari O'zbekiston serverlarida xavfsiz shifrlangan holatda saqlanadi.
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Inquiry Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-left">
            <h3 className="text-2xl font-bold text-white mb-2">
              Maktabni ulash uchun ariza
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Ma'lumotlarni qoldiring, mutaxassislarimiz 24 soat ichida siz bilan bog'lanib bepul namoyish o'tkazadilar.
            </p>

            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Arizangiz qabul qilindi!</h4>
                <p className="text-xs text-slate-300">Tez orada mas'ul menejerimiz sizga qo'ng'iroq qiladi.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Maktab nomi yoki raqami
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Urganch shahar 30-maktab"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Direktor yoki mas'ul shaxs F.I.Sh.
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ism familiya"
                      value={formData.directorName}
                      onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Telefon raqami
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="+998 90 123 45 67"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Elektron pochta
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        placeholder="maktab@mail.uz"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-colors"
                  >
                    Bekor qilish
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Arizani yuborish</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
