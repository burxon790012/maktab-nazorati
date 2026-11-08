import React, { useState } from 'react';
import { Shield, ArrowLeft, LogIn, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { User } from '@/types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // First-time password change state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const [tempToken, setTempToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Kirishda xatolik yuz berdi');
        setLoading(false);
        return;
      }

      // Check if first-time password change required
      if (data.user?.mustChangePassword) {
        setTempUser(data.user);
        setTempToken(data.token);
        setMustChangePassword(true);
        setLoading(false);
        return;
      }

      // Successful direct login
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage('Server bilan bog\'lanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.user?.mustChangePassword) {
          setTempUser(data.user);
          setTempToken(data.token);
          setMustChangePassword(true);
        } else {
          onLoginSuccess(data.user, data.token);
        }
      } else {
        setErrorMessage(data.message || 'Rol bo\'yicha kirishda xato');
      }
    } catch (_) {
      setErrorMessage('Server bilan aloqa uzildi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');

    if (newPassword.length < 8) {
      setChangeError('Yangi parol kamida 8 ta belgidan iborat bo\'lishi shart');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('Parollar bir-biriga mos kelmadi');
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const finalToken = data.token || tempToken;
        const updatedUser = { ...tempUser, mustChangePassword: false };
        onLoginSuccess(updatedUser, finalToken);
      } else {
        setChangeError(data.message || 'Parolni o\'zgartirishda xatolik yuz berdi');
      }
    } catch (_) {
      setChangeError('Server bilan aloqada xatolik');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar with Back to Home button */}
      <header className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Bosh sahifaga qaytish</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight hidden sm:inline-block">
              SMART CHILD
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          
          {mustChangePassword ? (
            /* First Login Password Change Box */
            <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <KeyRound className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-black text-white">
                Dastlabki parolni o'zgartirish
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Xavfsizlik talablariga muvofiq, birinchi marta tizimga kirganingizda parolni yangi maxfiy parolga almashtirishingiz shart.
              </p>

              {changeError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{changeError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Yangi parol (kamida 8 ta belgi)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Yangi parolni qayta kiriting
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPass}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg transition-all mt-6"
                >
                  {changingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Parolni yangilash va tizimga kirish</span>
                </button>
              </form>
            </div>
          ) : (
            /* Standard Login Form */
            <div className="rounded-3xl bg-slate-900/85 border border-white/10 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl text-left">
              
              <div className="text-center space-y-2 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 mx-auto">
                  <Shield className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Tizimga kirish
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-normal">
                  SMART CHILD maktab xavfsizlik va monitoring platformasi
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Elektron pochta (Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="nomingiz@smartchild.uz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Parol
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>Tizimga kirish</span>
                  </button>
                </div>
              </form>

              {/* Quick Admin Helper Button */}
              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('burxonturayev7900@gmail.com');
                  }}
                  className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Bosh Super Admin pochtasini to'ldirish (burxonturayev7900@gmail.com)</span>
                </button>
              </div>

              {/* Demo Role Switcher */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
                  Tezkor namoyish rejimi (Demo Login):
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('SUPER_ADMIN')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium hover:text-cyan-400 transition-colors text-center"
                  >
                    Super Admin
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('SCHOOL_ADMIN')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium hover:text-blue-400 transition-colors text-center"
                  >
                    Maktab Admini
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('TEACHER')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium hover:text-emerald-400 transition-colors text-center"
                  >
                    O'qituvchi
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('PARENT')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium hover:text-amber-400 transition-colors text-center"
                  >
                    Ota-ona
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="p-6 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} SMART CHILD. Maktab va bolalar xavfsizlik platformasi.
      </footer>

    </div>
  );
};
