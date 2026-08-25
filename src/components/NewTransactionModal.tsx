import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  BookOpen, 
  User, 
  Calendar, 
  Check, 
  Search, 
  Sparkles,
  Clock
} from 'lucide-react';
import { Book, Member, Transaction } from '../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  members: Member[];
  preSelectedBook?: Book | null;
  onCreateTransaction: (data: {
    bookId: string;
    memberId: string;
    durationDays: number;
    notes?: string;
  }) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  books,
  members,
  preSelectedBook,
  onCreateTransaction,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [selectedBookId, setSelectedBookId] = useState<string>(preSelectedBook?.id || books[0]?.id || '');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (preSelectedBook) {
      setSelectedBookId(preSelectedBook.id);
    }
  }, [preSelectedBook]);

  if (!isOpen) return null;

  const availableBooks = books.filter(b => b.copiesAvailable > 0);
  const selectedBook = books.find(b => b.id === selectedBookId);
  const selectedMember = members.find(m => m.id === selectedMemberId);

  const calculateDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d.toISOString().slice(0, 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedMemberId) return;

    onCreateTransaction({
      bookId: selectedBookId,
      memberId: selectedMemberId,
      durationDays,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Formulir Peminjaman Baru</h3>
              <p className="text-[11px] text-slate-400">Terbitkan nomor transaksi sirkulasi baru</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Member Selection */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Pilih Pemustaka / Anggota</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} disabled={m.status === 'suspended'}>
                  {m.name} ({m.memberCode}) • {m.role} {m.status === 'suspended' ? '⚠️ DITANGGUHKAN' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Book Selection */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Pilih Koleksi Buku</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} • {b.copiesAvailable} Eks. Tersedia ({b.shelfLocation})
                </option>
              ))}
            </select>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Durasi Masa Pinjam</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDurationDays(7)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  durationDays === 7 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                7 Hari (1 Minggu)
              </button>
              <button
                type="button"
                onClick={() => setDurationDays(14)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  durationDays === 14 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                14 Hari (Standar)
              </button>
              <button
                type="button"
                onClick={() => setDurationDays(28)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  durationDays === 28 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                28 Hari (Pendidik)
              </button>
            </div>
          </div>

          {/* Calculated Due Date Preview */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Tenggat Pengembalian:
            </span>
            <span className="font-mono font-bold text-emerald-400">{calculateDueDate()}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Catatan Khusus (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Untuk keperluan tugas riset akhir..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              Terbitkan Peminjaman
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
