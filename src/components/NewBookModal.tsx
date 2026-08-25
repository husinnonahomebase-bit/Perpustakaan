import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Plus, 
  Image as ImageIcon,
  MapPin,
  Tag
} from 'lucide-react';
import { Book, BookCategory } from '../types';

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Omit<Book, 'id' | 'addedAt'>) => void;
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

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onAddBook,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState<string>('Fiksi Ilmiah');
  const [copiesTotal, setCopiesTotal] = useState(5);
  const [shelfLocation, setShelfLocation] = useState('Rak SF-05');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('Klasik, Pilihan');

  if (!isOpen) return null;

  const generateIsbn = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setIsbn(`978-602-${randomSuffix}-${Math.floor(10 + Math.random() * 90)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    onAddBook({
      title,
      author,
      isbn: isbn || `978-602-00-${Math.floor(1000 + Math.random() * 9000)}`,
      publisher: publisher || 'Penerbit Mandiri',
      year: Number(year),
      category,
      copiesTotal: Number(copiesTotal),
      copiesAvailable: Number(copiesTotal),
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      shelfLocation: shelfLocation || 'Rak A-01',
      description: description || 'Buku koleksi perpustakaan.',
      rating: 4.8,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Tambah Koleksi Buku Baru</h3>
              <p className="text-[11px] text-slate-400">Registrasi judul baru ke arsip digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Judul Buku</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sang Pemimpi"
              required
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Nama Pengarang / Penulis</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Contoh: Andrea Hirata"
                required
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300">Nomor ISBN</label>
                <button
                  type="button"
                  onClick={generateIsbn}
                  className="text-[10px] text-emerald-400 font-bold hover:underline"
                >
                  + Generate
                </button>
              </div>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-602-..."
                className="w-full px-3.5 py-2 font-mono bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Kategori / Genre</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Jumlah Eksemplar (Stok)</label>
              <input
                type="number"
                min={1}
                max={500}
                value={copiesTotal}
                onChange={(e) => setCopiesTotal(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Lokasi Rak Simpan</label>
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="Contoh: Rak ST-04"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Tahun Terbit</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">URL Sampul Buku (Cover Image)</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Sinopsis Singkat</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tulis ringkasan singkat buku..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Tag & Kata Kunci (Dipisahkan Koma)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Contoh: Sains, Kosmologi, Populer"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              Simpan Buku
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
