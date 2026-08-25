import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  UserCheck, 
  ArrowRight,
  KeyRound
} from 'lucide-react';
import { UserSession } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('siti.librarian@lumina.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = (role: 'librarian' | 'admin' | 'member') => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (role === 'librarian') {
        onLoginSuccess({
          id: 'usr-001',
          name: 'Siti Rahmawati, S.I.Pust.',
          email: 'siti.librarian@lumina.edu',
          role: 'librarian',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
          title: 'Kepala Pelayanan Perpustakaan',
          isAuthenticated: true,
          token: 'lmn_auth_token_8892f3ac09',
        });
      } else if (role === 'admin') {
        onLoginSuccess({
          id: 'usr-002',
          name: 'Dr. H. Bambang Suryono',
          email: 'admin.lumina@lumina.edu',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
          title: 'Administrator Utama & IT Perpustakaan',
          isAuthenticated: true,
          token: 'lmn_auth_token_admin_993a',
        });
      } else {
        onLoginSuccess({
          id: 'mbr-001',
          name: 'Eleanor Vance',
          email: 'eleanor.vance@student.lumina.edu',
          role: 'member',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
          title: 'Anggota Aktif (Siswa)',
          isAuthenticated: true,
          token: 'lmn_auth_token_student_101',
        });
      }
      onClose();
    }, 400);
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    handleDemoLogin('librarian');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 text-center bg-gradient-to-b from-slate-800/60 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight">Otentikasi Lumina Library</h2>
          <p className="text-xs text-slate-400 mt-1">Sistem Manajemen Perpustakaan Terenkripsi</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Quick Demo Logins Selection */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Masuk Cepat Mode Demo:
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('librarian')}
                className="w-full p-2.5 rounded-xl bg-slate-800/90 hover:bg-emerald-500/20 border border-slate-700/80 hover:border-emerald-500/40 text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    P
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white group-hover:text-emerald-400">Siti Rahmawati, S.I.Pust.</p>
                    <p className="text-[10px] text-slate-400">Pustakawan & Sirkulasi (Akses Penuh)</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="w-full p-2.5 rounded-xl bg-slate-800/90 hover:bg-teal-500/20 border border-slate-700/80 hover:border-teal-500/40 text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white group-hover:text-teal-400">Dr. H. Bambang Suryono</p>
                    <p className="text-[10px] text-slate-400">Administrator Utama & Kepala Sekolah</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('member')}
                className="w-full p-2.5 rounded-xl bg-slate-800/90 hover:bg-cyan-500/20 border border-slate-700/80 hover:border-cyan-500/40 text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    S
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white group-hover:text-cyan-400">Eleanor Vance</p>
                    <p className="text-[10px] text-slate-400">Pemustaka / Siswa</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-[1px] bg-slate-800 flex-1"></div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Atau Masuk Kredensial</span>
            <div className="h-[1px] bg-slate-800 flex-1"></div>
          </div>

          {/* Standard Credentials Form */}
          <form onSubmit={handleStandardLogin} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email / NIP / ID Anggota</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] mt-2"
            >
              {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Dilindungi Token Akses AES-256 Cloud
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
