import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  BookOpen, 
  UserX,
  CreditCard
} from 'lucide-react';
import { Member } from '../types';

interface DeleteMemberModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onConfirmDelete: (memberId: string) => void;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !member) return null;

  const hasActiveLoans = member.activeLoansCount > 0;
  const hasUnpaidFines = member.totalFinesUnpaid > 0;

  const handleConfirm = () => {
    onConfirmDelete(member.id);
    onClose();
  };

  return (
    <div 
      id="delete-member-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="delete-member-modal-dialog"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Hapus Data Anggota</h3>
              <p className="text-[11px] text-slate-400">Konfirmasi pencabutan keanggotaan perpustakaan</p>
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

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Member Card Summary */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-800 flex items-center gap-3.5">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-red-500/30 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white truncate">{member.name}</h4>
              <p className="text-slate-400 text-xs">{member.role} {member.classOrDept ? `• ${member.classOrDept}` : ''}</p>
              <span className="inline-block mt-1 font-mono text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/30">
                {member.memberCode}
              </span>
            </div>
          </div>

          {/* Active Loans or Fines Warning */}
          {hasActiveLoans && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs text-amber-300">Peringatan: Peminjaman Aktif</p>
                <p className="text-[11px] leading-relaxed">
                  Anggota ini masih tercatat meminjam <span className="font-bold text-amber-300">{member.activeLoansCount} buku</span>. Pastikan buku telah dikembalikan sebelum menghapus akun untuk menjaga akurasi sirkulasi.
                </p>
              </div>
            </div>
          )}

          {hasUnpaidFines && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-red-300">
              <span className="text-[11px]">Tunggakan Denda Belum Lunas:</span>
              <span className="font-mono font-bold">Rp {member.totalFinesUnpaid.toLocaleString('id-ID')}</span>
            </div>
          )}

          <p className="text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus data anggota <strong className="text-white">{member.name}</strong> ({member.memberCode})? Tindakan ini akan menghapus kartu keanggotaan dan dicatat dalam audit log sistem.
          </p>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Anggota</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
