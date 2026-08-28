import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Mail, 
  Phone, 
  Building, 
  ShieldCheck, 
  CreditCard,
  AlertCircle,
  Camera,
  Layers
} from 'lucide-react';
import { Member, MemberStatus } from '../types';

interface EditMemberModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onSave: (updatedMember: Member) => void;
  existingMembers: Member[];
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave,
  existingMembers,
}) => {
  const [name, setName] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Siswa' | 'Guru' | 'Staff' | 'Umum'>('Siswa');
  const [classOrDept, setClassOrDept] = useState('');
  const [status, setStatus] = useState<MemberStatus>('active');
  const [avatar, setAvatar] = useState('');
  const [maxBorrowLimit, setMaxBorrowLimit] = useState(5);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setMemberCode(member.memberCode);
      setEmail(member.email);
      setPhone(member.phone);
      setRole(member.role);
      setClassOrDept(member.classOrDept || '');
      setStatus(member.status);
      setAvatar(member.avatar);
      setMaxBorrowLimit(member.maxBorrowLimit || 5);
      setCodeError('');
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleRoleChange = (newRole: 'Siswa' | 'Guru' | 'Staff' | 'Umum') => {
    setRole(newRole);
    if (newRole === 'Guru') setMaxBorrowLimit(10);
    else if (newRole === 'Staff') setMaxBorrowLimit(7);
    else setMaxBorrowLimit(5);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !memberCode.trim()) return;

    // Check for duplicate member code in other members
    const trimmedCode = memberCode.trim();
    const duplicate = existingMembers.some(
      (m) => m.id !== member.id && m.memberCode.trim().toLowerCase() === trimmedCode.toLowerCase()
    );

    if (duplicate) {
      setCodeError(`Kode anggota "${trimmedCode}" sudah digunakan oleh anggota lain.`);
      return;
    }

    onSave({
      ...member,
      name: name.trim(),
      memberCode: trimmedCode,
      email: email.trim(),
      phone: phone.trim() || '+62 812-0000-0000',
      role,
      classOrDept: classOrDept.trim() || undefined,
      status,
      avatar: avatar.trim() || member.avatar,
      maxBorrowLimit: Number(maxBorrowLimit) || 5,
    });
    onClose();
  };

  return (
    <div 
      id="edit-member-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="edit-member-modal-dialog"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Edit Data Anggota</h3>
              <p className="text-[11px] text-slate-400">Perbarui profil, hak akses, dan status keanggotaan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          {codeError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{codeError}</span>
            </div>
          )}

          {/* Member Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Kode / Nomor Anggota <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={memberCode}
                onChange={(e) => {
                  setMemberCode(e.target.value);
                  setCodeError('');
                }}
                required
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Status Keanggotaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="active">Aktif (Dapat Meminjam)</option>
                <option value="suspended">Ditangguhkan / Kena Denda</option>
                <option value="expired">Kedaluwarsa (Nonaktif)</option>
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Muhammad Rayhan"
              required
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Role & Class/Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Kategori / Peran
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Siswa">Siswa</option>
                <option value="Guru">Guru / Pendidik</option>
                <option value="Staff">Staff / Karyawan</option>
                <option value="Umum">Umum / Tamu</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Kelas / Unit Kerja / Departemen
              </label>
              <input
                type="text"
                value={classOrDept}
                onChange={(e) => setClassOrDept(e.target.value)}
                placeholder="Contoh: Kelas XII MIPA 1"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Alamat Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812-3456-7890"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Max Borrow Limit & Avatar URL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Batas Maks Pinjam
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxBorrowLimit}
                onChange={(e) => setMaxBorrowLimit(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1.5">
                URL Foto Profil
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 truncate"
              />
            </div>
          </div>

          {/* Live Profile Preview Mini Box */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center gap-3">
            <img 
              src={avatar || member.avatar} 
              alt="Avatar Preview" 
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white truncate text-xs">{name || 'Nama Anggota'}</p>
              <p className="text-[11px] text-slate-400 font-mono">{memberCode || 'KODE-XXX'} • {role} {classOrDept ? `(${classOrDept})` : ''}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              status === 'active' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : status === 'suspended'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {status.toUpperCase()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] text-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
