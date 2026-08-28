import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  BookOpen, 
  Layers
} from 'lucide-react';
import { Book, Transaction } from '../types';

interface DeleteBookModalProps {
  isOpen: boolean;
  book: Book | null;
  transactions?: Transaction[];
  onClose: () => void;
  onConfirmDelete: (bookId: string) => void;
}

export const DeleteBookModal: React.FC<DeleteBookModalProps> = ({
  isOpen,
  book,
  transactions = [],
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !book) return null;

  // Check active borrowings for this book
  const activeLoans = transactions.filter(
    (t) => (t.bookId === book.id || t.bookTitle.toLowerCase() === book.title.toLowerCase()) && t.status === 'borrowed'
  );
  const hasActiveLoans = activeLoans.length > 0;
  const isBorrowedOut = (book.copiesTotal - book.copiesAvailable) > 0;

  const handleConfirm = () => {
    onConfirmDelete(book.id);
    onClose();
  };

  return (
    <div 
      id="delete-book-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="delete-book-modal-dialog"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Hapus Data Buku</h3>
              <p className="text-[11px] text-slate-400">Konfirmasi penghapusan koleksi pustaka</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-delete-book-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Book Summary Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <img 
              src={book.coverImage} 
              alt={book.title} 
              className="w-12 h-16 rounded-xl object-cover ring-1 ring-slate-700 shrink-0 bg-slate-950" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white truncate">{book.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{book.author} ({book.year})</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[10px] text-slate-400">ISBN: {book.isbn}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[10px] text-emerald-400">{book.copiesTotal} Eksemplar</span>
              </div>
            </div>
          </div>

          {/* Active Loans Safeguard Warning */}
          {(hasActiveLoans || isBorrowedOut) ? (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Peringatan Sirkulasi Aktif!</span>
              </div>
              <p className="text-[11px] text-red-300/90 leading-relaxed">
                Buku ini tercatat memiliki <strong>{activeLoans.length || (book.copiesTotal - book.copiesAvailable)} eksemplar yang sedang dipinjam</strong> pemustaka. Menghapus buku ini akan mempengaruhi riwayat pengembalian di masa mendatang.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-slate-300 space-y-1">
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Apakah Anda yakin ingin menghapus buku <strong>"{book.title}"</strong> dari katalog perpustakaan? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          )}

          {/* Confirmation Prompt */}
          <p className="text-[11px] text-slate-400 italic text-center pt-1">
            Data buku dan barcode yang terhapus tidak dapat dipinjamkan kembali.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-2.5">
          <button
            type="button"
            id="btn-cancel-delete-book"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-confirm-delete-book"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Buku</span>
          </button>
        </div>
      </div>
    </div>
  );
};
