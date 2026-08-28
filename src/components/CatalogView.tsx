import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  BookOpen, 
  Star, 
  Download, 
  FileText, 
  Tag, 
  Layers, 
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Eye
} from 'lucide-react';
import { Book, BookCategory, SchoolProfile, Transaction } from '../types';
import { exportCatalogToPDF, exportToCSV } from '../utils/exportUtils';
import { EditBookModal } from './EditBookModal';
import { DeleteBookModal } from './DeleteBookModal';

interface CatalogViewProps {
  books: Book[];
  school: SchoolProfile;
  transactions?: Transaction[];
  searchQuery?: string;
  onOpenNewBookModal: () => void;
  onSelectBook?: (book: Book) => void;
  onSelectBookDetail?: (book: Book) => void;
  onOpenNewLoanModalForBook?: (book: Book) => void;
  onOpenLoanModal?: (book: Book) => void;
  onUpdateBook?: (updatedBook: Book) => void;
  onDeleteBook?: (bookId: string) => void;
  onNotify?: (title: string, message: string, type?: 'info' | 'warning' | 'success' | 'alert') => void;
}

const CATEGORIES: BookCategory[] = [
  'Semua Kategori',
  'Fiksi Ilmiah',
  'Teknologi & Komputer',
  'Sastra & Novel',
  'Sains & Matematika',
  'Sejarah & Biografi',
  'Filsafat & Pengembangan Diri',
  'Buku Pelajaran & Referensi'
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  books,
  school,
  transactions = [],
  searchQuery: initialSearchQuery = '',
  onOpenNewBookModal,
  onSelectBook,
  onSelectBookDetail,
  onOpenNewLoanModalForBook,
  onOpenLoanModal,
  onUpdateBook,
  onDeleteBook,
  onNotify,
}) => {
  const handleSelectBook = (book: Book) => {
    if (onSelectBook) onSelectBook(book);
    else if (onSelectBookDetail) onSelectBookDetail(book);
  };

  const handleOpenLoan = (book: Book) => {
    if (onOpenNewLoanModalForBook) onOpenNewLoanModalForBook(book);
    else if (onOpenLoanModal) onOpenLoanModal(book);
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'rating' | 'stock'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals for editing and deleting books
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // Filtered & Sorted Books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Category
        if (selectedCategory !== 'Semua Kategori' && book.category !== selectedCategory) {
          return false;
        }
        // Availability
        if (availabilityFilter === 'available' && book.copiesAvailable === 0) {
          return false;
        }
        if (availabilityFilter === 'out' && book.copiesAvailable > 0) {
          return false;
        }
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = book.title.toLowerCase().includes(q);
          const matchAuthor = book.author.toLowerCase().includes(q);
          const matchIsbn = book.isbn.toLowerCase().includes(q);
          const matchTag = book.tags.some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchAuthor && !matchIsbn && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'stock') return b.copiesAvailable - a.copiesAvailable;
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });
  }, [books, selectedCategory, availabilityFilter, searchQuery, sortBy]);

  const handleExportPDF = () => {
    exportCatalogToPDF(filteredBooks, school);
  };

  const handleExportCSV = () => {
    const csvData = filteredBooks.map((b) => ({
      ISBN: b.isbn,
      Judul: b.title,
      Pengarang: b.author,
      Penerbit: b.publisher,
      Tahun: b.year,
      Kategori: b.category,
      Total_Stok: b.copiesTotal,
      Stok_Tersedia: b.copiesAvailable,
      Lokasi_Rak: b.shelfLocation,
      Rating: b.rating
    }));
    exportToCSV(csvData, 'Katalog_Buku_Lumina');
  };

  return (
    <div id="catalog-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Catalog Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Koleksi Digital
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total {filteredBooks.length} dari {books.length} Buku
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Katalog & Arsip Pustaka</h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola data buku, nomor ISBN, lokasi rak penyimpanan, dan stok sirkulasi</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-catalog-pdf"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="Cetak format PDF resmi"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh PDF</span>
          </button>
          <button
            id="btn-export-catalog-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="Ekspor ke Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            id="btn-add-new-book"
            onClick={onOpenNewBookModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filter Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Availability Filter */}
            <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-xs font-medium">
              <button
                onClick={() => setAvailabilityFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  availabilityFilter === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setAvailabilityFilter('available')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  availabilityFilter === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tersedia
              </button>
              <button
                onClick={() => setAvailabilityFilter('out')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  availabilityFilter === 'out' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Habis
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="newest">Urutan: Terbaru</option>
              <option value="title">Judul (A - Z)</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="stock">Stok Terbanyak</option>
            </select>
          </div>

          {/* Search within catalog & View Mode switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, ISBN, tag..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-slate-400">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-slate-700 text-emerald-400' : 'hover:text-slate-200'}`}
                title="Tampilan Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-slate-700 text-emerald-400' : 'hover:text-slate-200'}`}
                title="Tampilan List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Grid / List */}
      {filteredBooks.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-semibold text-white">Tidak ada buku yang cocok</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter kategori dan status ketersediaan.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isOutOfStock = book.copiesAvailable === 0;
            return (
              <div
                key={book.id}
                id={`book-card-${book.id}`}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition duration-200 overflow-hidden shadow-lg flex flex-col group"
              >
                {/* Cover Image Banner */}
                <div 
                  onClick={() => onSelectBook(book)}
                  className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                  
                  {/* Category Chip */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                    {book.category}
                  </span>

                  {/* Rating */}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-300 flex items-center gap-1 border border-amber-500/30">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {book.rating}
                  </span>

                  {/* Shelf Location */}
                  <span className="absolute bottom-2 left-3 text-[10px] font-mono font-medium text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    {book.shelfLocation}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 
                      onClick={() => handleSelectBook(book)}
                      className="font-bold text-sm text-white line-clamp-1 group-hover:text-emerald-400 transition cursor-pointer"
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{book.author}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">ISBN: {book.isbn}</p>

                    {/* Stock Bar Indicator */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span className="text-slate-400">Stok Ketersediaan</span>
                        <span className={isOutOfStock ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {book.copiesAvailable} / {book.copiesTotal} Eks.
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${(book.copiesAvailable / Math.max(book.copiesTotal, 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                    <button
                      type="button"
                      id={`btn-detail-book-${book.id}`}
                      onClick={() => handleSelectBook(book)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700 transition active:scale-95"
                    >
                      Detail
                    </button>
                    <button
                      type="button"
                      id={`btn-loan-book-${book.id}`}
                      onClick={() => handleOpenLoan(book)}
                      disabled={isOutOfStock}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isOutOfStock ? 'Dipinjam' : 'Pinjam'}
                    </button>
                    <button
                      type="button"
                      id={`btn-edit-book-${book.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBook(book);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition active:scale-95"
                      title="Edit Data Buku"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`btn-delete-book-${book.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingBook(book);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 transition active:scale-95"
                      title="Hapus Data Buku"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider bg-slate-900/80">
                <th className="p-4 font-semibold">Buku & Pengarang</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">ISBN</th>
                <th className="p-4 font-semibold">Lokasi Rak</th>
                <th className="p-4 font-semibold">Stok</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded-lg ring-1 ring-slate-700 shrink-0 bg-slate-950"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div>
                        <p 
                          onClick={() => handleSelectBook(book)}
                          className="font-semibold text-xs text-white hover:text-emerald-400 cursor-pointer"
                        >
                          {book.title}
                        </p>
                        <p className="text-[11px] text-slate-400">{book.author} ({book.year})</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-300">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-emerald-400 border border-slate-700">
                      {book.category}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-400">{book.isbn}</td>
                  <td className="p-4 text-xs font-mono text-cyan-400">{book.shelfLocation}</td>
                  <td className="p-4 text-xs">
                    <span className={`font-bold ${book.copiesAvailable > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {book.copiesAvailable} / {book.copiesTotal}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        id={`btn-detail-book-list-${book.id}`}
                        onClick={() => handleSelectBook(book)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        id={`btn-loan-book-list-${book.id}`}
                        onClick={() => handleOpenLoan(book)}
                        disabled={book.copiesAvailable === 0}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 transition"
                      >
                        Pinjam
                      </button>
                      <button
                        type="button"
                        id={`btn-edit-book-list-${book.id}`}
                        onClick={() => setEditingBook(book)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition"
                        title="Edit Data Buku"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-book-list-${book.id}`}
                        onClick={() => setDeletingBook(book)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 transition"
                        title="Hapus Data Buku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Book Modal */}
      <EditBookModal
        isOpen={Boolean(editingBook)}
        book={editingBook}
        onClose={() => setEditingBook(null)}
        onSave={(updated) => {
          if (onUpdateBook) {
            onUpdateBook(updated);
          }
          if (onNotify) {
            onNotify('Data Buku Diperbarui', `Buku "${updated.title}" berhasil diperbarui.`, 'success');
          }
        }}
      />

      {/* Delete Book Modal */}
      <DeleteBookModal
        isOpen={Boolean(deletingBook)}
        book={deletingBook}
        transactions={transactions}
        onClose={() => setDeletingBook(null)}
        onConfirmDelete={(bookId) => {
          if (onDeleteBook) {
            onDeleteBook(bookId);
          }
          if (onNotify && deletingBook) {
            onNotify('Buku Dihapus', `Buku "${deletingBook.title}" telah dihapus dari katalog.`, 'info');
          }
        }}
      />
    </div>
  );
};
