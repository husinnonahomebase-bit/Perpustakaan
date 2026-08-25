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
  KeyRound,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { UserSession } from '../types';
import { signInWithGoogle, syncUserProfileToFirestore } from '../lib/firebase';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await signInWithGoogle();
      if (res && res.user) {
        const userObj: UserSession = {
          id: res.user.uid,
          uid: res.user.uid,
          name: res.user.displayName || 'Pengguna Lumina',
          email: res.user.email || 'user@lumina.edu',
          role: res.user.email === 'husinnonahomebase@gmail.com' ? 'admin' : 'librarian',
          avatar: res.user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
          title: res.user.email === 'husinnonahomebase@gmail.com' ? 'Kepala / Administrator' : 'Pustakawan Lumina',
          isAuthenticated: true,
          token: res.idToken,
        };

        // Sync user profile to Firestore
        await syncUserProfileToFirestore(userObj);

        onLoginSuccess(userObj);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk dengan Akun Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (role: 'librarian' | 'admin' | 'member') => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      let userObj: UserSession;
      if (role === 'librarian') {
        userObj = {
          id: 'usr-001',
          uid: 'usr-001',
          name: 'Siti Rahmawati, S.I.Pust.',
          email: 'siti.librarian@lumina.edu',
          role: 'librarian',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
          title: 'Kepala Pelayanan Perpustakaan',
          isAuthenticated: true,
          token: 'lmn_auth_token_8892f3ac09',
        };
      } else if (role === 'admin') {
        userObj = {
          id: 'usr-002',
          uid: 'usr-002',
          name: 'Dr. H. Bambang Suryono',
          email: 'admin.lumina@lumina.edu',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
          title: 'Administrator Utama & IT Perpustakaan',
          isAuthenticated: true,
          token: 'lmn_auth_token_admin_993a',
        };
      } else {
        userObj = {
          id: 'mbr-001',
          uid: 'mbr-001',
          name: 'Eleanor Vance',
          email: 'eleanor.vance@student.lumina.edu',
          role: 'member',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
          title: 'Anggota Aktif (Siswa)',
          isAuthenticated: true,
          token: 'lmn_auth_token_student_101',
        };
      }
      onLoginSuccess(userObj);
      onClose();
    }, 300);
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
          <p className="text-xs text-slate-400 mt-1">Firebase Authentication & Cloud Database</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-In with Firebase Auth */}
          <button
            type="button"
            id="btn-firebase-google-auth"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isSubmitting ? 'Menghubungkan...' : 'Masuk dengan Google (Firebase Auth)'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-[1px] bg-slate-800 flex-1"></div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Atau Mode Pengujian Cepat</span>
            <div className="h-[1px] bg-slate-800 flex-1"></div>
          </div>

          {/* Quick Demo Logins Selection */}
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
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tersinkronisasi ke Firebase Firestore & Cloud SQL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
