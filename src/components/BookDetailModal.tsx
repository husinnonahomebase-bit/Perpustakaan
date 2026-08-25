import React from 'react';
import { 
  X, 
  BookOpen, 
  Star, 
  MapPin, 
  Calendar, 
  Building, 
  Tag, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { Book } from '../types';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onOpenLoanModal: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onOpenLoanModal,
}) => {
  if (!book) return null;

  const isOutOfStock = book.copiesAvailable === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Image Banner & Header */}
        <div className="relative p-6 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex gap-5">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-28 h-40 object-cover rounded-2xl shadow-2xl ring-2 ring-slate-700 flex-shrink-0"
          />

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {book.category}
                </span>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-lg font-bold text-white mt-1.5 line-clamp-2">{book.title}</h2>
              <p className="text-xs text-slate-300 mt-0.5">{book.author}</p>
              <p className="text-[11px] font-mono text-slate-400 mt-1">ISBN: {book.isbn}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {book.rating} / 5.0
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {book.shelfLocation}
              </span>
            </div>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs custom-scrollbar">
          {/* Stock Meter */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-0.5">Ketersediaan Sirkulasi</span>
              <span className={`text-base font-bold font-mono ${isOutOfStock ? 'text-red-400' : 'text-emerald-400'}`}>
                {book.copiesAvailable} dari {book.copiesTotal} Eksemplar Tersedia
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isOutOfStock ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {isOutOfStock ? 'HABIS DIPINJAM' : 'SIAP PINJAM'}
            </span>
          </div>

          {/* Book Synopsis */}
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-1.5">Sinopsis Buku</h4>
            <p className="text-slate-300 leading-relaxed text-xs">
              {book.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Penerbit</span>
              <span className="text-slate-200 font-medium">{book.publisher}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Tahun Terbit</span>
              <span className="text-slate-200 font-medium">{book.year}</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-2">Tag & Kata Kunci</h4>
            <div className="flex flex-wrap gap-1.5">
              {book.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              onOpenLoanModal(book);
              onClose();
            }}
            disabled={isOutOfStock}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-40"
          >
            {isOutOfStock ? 'Tidak Tersedia' : 'Pinjamkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
};
