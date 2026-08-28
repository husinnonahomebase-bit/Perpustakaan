import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Image as ImageIcon,
  MapPin,
  Tag,
  Save,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Book, BookCategory } from '../types';

interface EditBookModalProps {
  isOpen: boolean;
  book: Book | null;
  onClose: () => void;
  onSave: (updatedBook: Book) => void;
}

const CATEGORIES: BookCategory[] = [
  'Fiksi Ilmiah',
  'Teknologi & Komputer',
  'Sastra & Novel',
  'Sains & Matematika',
  'Sejarah & Biografi',
  'Filsafat & Pengembangan Diri',
  'Buku Pelajaran & Referensi'
];

export const EditBookModal: React.FC<EditBookModalProps> = ({
  isOpen,
  book,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState<string>('Fiksi Ilmiah');
  const [copiesTotal, setCopiesTotal] = useState(5);
  const [shelfLocation, setShelfLocation] = useState('Rak SF-05');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [rating, setRating] = useState(4.8);

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setIsbn(book.isbn || '');
      setPublisher(book.publisher || '');
      setYear(book.year || new Date().getFullYear());
      setCategory(book.category || 'Fiksi Ilmiah');
      setCopiesTotal(book.copiesTotal || 1);
      setShelfLocation(book.shelfLocation || '');
      setCoverImage(book.coverImage || '');
      setDescription(book.description || '');
      setTags(Array.isArray(book.tags) ? book.tags.join(', ') : '');
      setRating(book.rating || 4.8);
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const newTotal = Math.max(1, Number(copiesTotal));
    // Calculate currently borrowed copies
    const currentlyBorrowed = Math.max(0, (book.copiesTotal || 0) - (book.copiesAvailable || 0));
    // Available cannot be negative and cannot exceed new total
    const newAvailable = Math.max(0, newTotal - currentlyBorrowed);

    const updated: Book = {
      ...book,
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim() || book.isbn,
      publisher: publisher.trim() || book.publisher,
      year: Number(year),
      category,
      copiesTotal: newTotal,
      copiesAvailable: newAvailable,
      coverImage: coverImage.trim() || book.coverImage,
      shelfLocation: shelfLocation.trim() || book.shelfLocation,
      description: description.trim() || book.description,
      rating: Number(rating),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div 
      id="edit-book-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="edit-book-modal-dialog"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Edit Informasi Buku</h3>
              <p className="text-[11px] text-slate-400">Pembaruan data metadata dan stok koleksi</p>
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          {/* Cover Preview & Title */}
          <div className="flex gap-4 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 items-center">
            <img
              src={coverImage || book.coverImage}
              alt={title || 'Cover Preview'}
              className="w-14 h-20 object-cover rounded-xl shadow-md border border-slate-700 shrink-0 bg-slate-950"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 font-mono">ID: {book.id}</span>
              <p className="font-bold text-white text-xs truncate mt-0.5">{title || 'Judul Buku'}</p>
              <p className="text-[11px] text-slate-400 truncate">{author || 'Nama Penulis'}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {category}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Judul Buku</label>
            <input
              type="text"
              id="input-edit-book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengantar Algoritma dan Struktur Data"
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Penulis / Pengarang</label>
              <input
                type="text"
                id="input-edit-book-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Contoh: Dr. Ir. Rinaldi Munir"
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">ISBN</label>
              <input
                type="text"
                id="input-edit-book-isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-602-00-1234-5"
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-300 mb-1.5">Penerbit</label>
              <input
                type="text"
                id="input-edit-book-publisher"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Contoh: Informatika Bandung"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Tahun Terbit</label>
              <input
                type="number"
                id="input-edit-book-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={1900}
                max={2099}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Kategori Buku</label>
              <select
                id="select-edit-book-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Lokasi Rak</label>
              <input
                type="text"
                id="input-edit-book-shelf"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="Contoh: Rak TK-01"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Jumlah Total Eksemplar</label>
              <input
                type="number"
                id="input-edit-book-copies"
                value={copiesTotal}
                onChange={(e) => setCopiesTotal(Math.max(1, Number(e.target.value)))}
                min={1}
                max={999}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Rating (1.0 - 5.0)</label>
              <input
                type="number"
                id="input-edit-book-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                min={1.0}
                max={5.0}
                step={0.1}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">URL Sampul Buku (Cover Image)</label>
            <input
              type="url"
              id="input-edit-book-cover"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Sinopsis / Ringkasan Buku</label>
            <textarea
              id="textarea-edit-book-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat konten buku..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Tag & Kata Kunci (Pisahkan dengan koma)</label>
            <input
              type="text"
              id="input-edit-book-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Contoh: Algoritma, Pemrograman, C++, Kuliah"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-edit-book"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-submit-edit-book"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
