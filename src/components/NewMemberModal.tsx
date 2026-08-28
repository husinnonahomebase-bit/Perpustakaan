import React, { useState, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  Sparkles, 
  Mail, 
  Phone, 
  Building,
  RefreshCw,
  Hash,
  Check
} from 'lucide-react';
import { Member } from '../types';

interface NewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Omit<Member, 'id' | 'joinedDate' | 'activeLoansCount' | 'totalFinesUnpaid'>) => void;
}

export const NewMemberModal: React.FC<NewMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+62 ');
  const [role, setRole] = useState<'Siswa' | 'Guru' | 'Staff' | 'Umum'>('Siswa');
  const [classOrDept, setClassOrDept] = useState('Kelas X MIPA 1');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80');

  // Auto-generation toggle & custom code state
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);
  const [randomSuffix, setRandomSuffix] = useState(() => Math.floor(100 + Math.random() * 900));
  const [manualCode, setManualCode] = useState('');

  // Extract initials from name
  const nameInitials = useMemo(() => {
    if (!name.trim()) return 'MBR';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }
    const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
    return initials.slice(0, 4);
  }, [name]);

  // Compute date string YYYYMMDD
  const dateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }, []);

  // Computed Auto Member Code (e.g., LMN-20260827-MR-524)
  const computedAutoCode = useMemo(() => {
    return `LMN-${dateStr}-${nameInitials}-${randomSuffix}`;
  }, [dateStr, nameInitials, randomSuffix]);

  const activeMemberCode = autoGenerateCode ? computedAutoCode : manualCode.trim();

  const handleRegenerateSuffix = () => {
    setRandomSuffix(Math.floor(100 + Math.random() * 900));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const finalMemberCode = autoGenerateCode 
      ? computedAutoCode 
      : (manualCode.trim() || `LMN-${dateStr}-${nameInitials}-${randomSuffix}`);

    onAddMember({
      memberCode: finalMemberCode,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+62 812-0000-0000',
      avatar: avatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      role,
      classOrDept: classOrDept.trim(),
      status: 'active',
      maxBorrowLimit: role === 'Guru' ? 10 : role === 'Staff' ? 7 : 5,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Registrasi Pemustaka Baru</h3>
              <p className="text-[11px] text-slate-400">Penerbitan kartu anggota digital & kode pemustaka unik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Member Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Nama Lengkap Pemustaka</label>
            <input
              type="text"
              id="input-new-member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Muhammad Rayhan Pratama"
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* AUTO-GENERATE MEMBER CODE TOGGLE & CARD */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Generate Kode Anggota Otomatis</span>
                  <span className="text-[10px] text-slate-400">Berdasarkan tanggal hari ini ({dateStr}) dan inisial nama ({nameInitials})</span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                id="toggle-auto-member-code"
                onClick={() => setAutoGenerateCode(!autoGenerateCode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoGenerateCode ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={autoGenerateCode}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoGenerateCode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {autoGenerateCode ? (
              /* Auto-generated Preview Box */
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Kode Anggota Unik Terbitan:</span>
                    <span className="font-mono font-bold text-xs text-emerald-400 tracking-wider">
                      {computedAutoCode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-reroll-code"
                  onClick={handleRegenerateSuffix}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium transition"
                  title="Generate Acak Ulang Suffix"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>Acak Ulang</span>
                </button>
              </div>
            ) : (
              /* Manual Input Field */
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-[11px] font-medium text-slate-300">
                  Kode Anggota Kustom / NISN / NIP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-manual-member-code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: LMN-2026-904 atau NISN-00812948"
                    required={!autoGenerateCode}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Peran / Kategori</label>
              <select
                id="select-new-member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Siswa">Siswa</option>
                <option value="Guru">Guru</option>
                <option value="Staff">Staff</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Kelas / Unit Kerja</label>
              <input
                type="text"
                id="input-new-member-class"
                value={classOrDept}
                onChange={(e) => setClassOrDept(e.target.value)}
                placeholder="Contoh: Kelas XI MIPA 2"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Alamat Email</label>
            <input
              type="email"
              id="input-new-member-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama.siswa@student.lumina.edu"
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Nomor WhatsApp / HP</label>
            <input
              type="text"
              id="input-new-member-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 812-3456-7890"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">URL Foto Profil</label>
            <input
              type="url"
              id="input-new-member-avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              id="btn-cancel-add-member"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-submit-add-member"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              Daftarkan Anggota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

