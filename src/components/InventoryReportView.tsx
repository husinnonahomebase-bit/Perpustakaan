import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Coins, 
  Layers, 
  Archive, 
  TrendingUp,
  RefreshCw,
  Edit3,
  Check,
  X,
  Info,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { Book, SchoolProfile, BookCondition, StockOpnameStatus } from '../types';
import { exportInventoryReportToPDF, exportStockOpnameReportToPDF, exportInventoryToCSV } from '../utils/exportUtils';
import { OfflineSyncManager } from '../utils/offlineSync';

interface InventoryReportViewProps {
  books: Book[];
  school: SchoolProfile;
  onUpdateBook?: (book: Book) => void;
  onNotify?: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const InventoryReportView: React.FC<InventoryReportViewProps> = ({
  books,
  school,
  onUpdateBook,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'stock-opname' | 'distribution'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');
  const [selectedCondition, setSelectedCondition] = useState<string>('Semua');
  const [selectedShelf, setSelectedShelf] = useState<string>('Semua Rak');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  
  // Stock opname single edit state
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCondition, setEditCondition] = useState<BookCondition>('Baik');
  const [editStockStatus, setEditStockStatus] = useState<StockOpnameStatus>('Verified');
  const [editNotes, setEditNotes] = useState<string>('');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => set.add(b.category));
    return ['Semua Kategori', ...Array.from(set)];
  }, [books]);

  // Shelves list
  const shelves = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => set.add(b.shelfLocation));
    return ['Semua Rak', ...Array.from(set)];
  }, [books]);

  // Global calculations
  const totalTitles = books.length;
  const totalCopies = books.reduce((acc, b) => acc + (b.copiesTotal || 0), 0);
  const availableCopies = books.reduce((acc, b) => acc + (b.copiesAvailable || 0), 0);
  const borrowedCopies = totalCopies - availableCopies;
  
  const totalAssetValue = books.reduce((acc, b) => {
    const unitPrice = b.price || 95000;
    return acc + (unitPrice * (b.copiesTotal || 1));
  }, 0);

  const avgPricePerBook = totalCopies > 0 ? Math.round(totalAssetValue / totalCopies) : 0;
  const utilizationRate = totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0;

  // Conditions count
  const conditionStats = useMemo(() => {
    let good = 0;
    let slight = 0;
    let heavy = 0;
    let maintenance = 0;
    let lost = 0;

    books.forEach(b => {
      const copies = b.copiesTotal || 1;
      const cond = b.condition || 'Baik';
      if (cond === 'Baik') good += copies;
      else if (cond === 'Rusak Ringan') slight += copies;
      else if (cond === 'Rusak Berat') heavy += copies;
      else if (cond === 'Dalam Perawatan') maintenance += copies;
      else if (cond === 'Hilang') lost += copies;
    });

    return { good, slight, heavy, maintenance, lost };
  }, [books]);

  // Stock Opname counts
  const stockOpnameStats = useMemo(() => {
    const verified = books.filter(b => b.stockOpnameStatus === 'Verified').length;
    const pending = books.filter(b => !b.stockOpnameStatus || b.stockOpnameStatus === 'Pending').length;
    const discrepancy = books.filter(b => b.stockOpnameStatus === 'Discrepancy').length;
    return { verified, pending, discrepancy };
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        !searchQuery ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.inventoryNumber && b.inventoryNumber.toLowerCase().includes(q)) ||
        b.shelfLocation.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'Semua Kategori' || b.category === selectedCategory;
      const matchCond = selectedCondition === 'Semua' || (b.condition || 'Baik') === selectedCondition;
      const matchShelf = selectedShelf === 'Semua Rak' || b.shelfLocation === selectedShelf;
      const matchStatus = selectedStatus === 'Semua' || (b.stockOpnameStatus || 'Verified') === selectedStatus;

      return matchQuery && matchCat && matchCond && matchShelf && matchStatus;
    });
  }, [books, searchQuery, selectedCategory, selectedCondition, selectedShelf, selectedStatus]);

  // Handlers for export
  const handleExportPDF = () => {
    exportInventoryReportToPDF(filteredBooks, school, selectedCategory);
    if (onNotify) {
      onNotify('Laporan Inventaris PDF Dibuat', `Dokumen PDF berisi ${filteredBooks.length} data koleksi inventaris berhasil diunduh.`, 'success');
    }
  };

  const handleExportStockOpnamePDF = () => {
    exportStockOpnameReportToPDF(filteredBooks, school);
    if (onNotify) {
      onNotify('Berita Acara Stock Opname Dibuat', 'Berita Acara Stock Opname resmi dengan kop sekolah berhasil digenerate.', 'success');
    }
  };

  const handleExportCSV = () => {
    exportInventoryToCSV(filteredBooks, school);
    if (onNotify) {
      onNotify('Ekspor Data Inventaris CSV', `${filteredBooks.length} data inventaris berhasil diekspor ke format Excel/CSV.`, 'success');
    }
  };

  // Stock opname verification click
  const handleQuickVerify = (book: Book) => {
    const updated: Book = {
      ...book,
      stockOpnameStatus: 'Verified',
      lastStockOpnameDate: new Date().toISOString().slice(0, 10),
    };

    if (onUpdateBook) {
      onUpdateBook(updated);
    }

    // Record offline sync queue action
    OfflineSyncManager.enqueueAction('STOCK_OPNAME_VERIFY', {
      bookId: book.id,
      bookTitle: book.title,
      inventoryNumber: book.inventoryNumber,
      status: 'Verified',
      date: new Date().toISOString(),
    });

    if (onNotify) {
      onNotify('Koleksi Terverifikasi', `Fisik buku "${book.title}" berhasil ditandai valid pada stock opname.`, 'success');
    }
  };

  const startEdit = (book: Book) => {
    setEditingBookId(book.id);
    setEditPrice(book.price || 95000);
    setEditCondition(book.condition || 'Baik');
    setEditStockStatus(book.stockOpnameStatus || 'Verified');
    setEditNotes(book.notes || '');
  };

  const saveEdit = (book: Book) => {
    const updated: Book = {
      ...book,
      price: editPrice,
      condition: editCondition,
      stockOpnameStatus: editStockStatus,
      notes: editNotes,
      lastStockOpnameDate: new Date().toISOString().slice(0, 10),
    };

    if (onUpdateBook) {
      onUpdateBook(updated);
    }

    OfflineSyncManager.enqueueAction('UPDATE_BOOK', updated);

    setEditingBookId(null);
    if (onNotify) {
      onNotify('Inventaris Diperbarui', `Informasi inventaris & kondisi buku "${book.title}" berhasil disimpan.`, 'success');
    }
  };

  return (
    <div id="inventory-report-view" className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Navigation & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Laporan Inventarisasi & Aset Koleksi
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Resmi Pustaka
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pencatatan buku induk inventaris, valuasi aset pustaka, pemantauan kondisi fisik, dan berita acara stock opname
            </p>
          </div>
        </div>

        {/* Global Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-600/20"
            title="Cetak Berita Acara & Laporan Inventaris ke Format Dokumen PDF Resmi"
          >
            <FileText className="w-4 h-4" />
            <span>Ekspor PDF Inventaris</span>
          </button>

          <button
            type="button"
            onClick={handleExportStockOpnamePDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition"
            title="Cetak Berita Acara Stock Opname & Audit Fisik PDF"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>PDF Stock Opname</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="Unduh Seluruh Data Kolom Inventaris ke Spreadsheet CSV/Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Titles & Copies */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Koleksi Terdaftar</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-white">{totalTitles}</h3>
              <span className="text-xs font-semibold text-slate-400">Judul</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              {totalCopies} Eksemplar Fisik
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Archive className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Asset Valuation */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Estimasi Nilai Total Aset</span>
            <h3 className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              Rp {totalAssetValue.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Rata-rata: <span className="font-mono text-slate-300">Rp {avgPricePerBook.toLocaleString('id-ID')}</span> / eks
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Physical Condition */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Kondisi Fisik Baik</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-cyan-400">
                {totalCopies > 0 ? Math.round((conditionStats.good / totalCopies) * 100) : 100}%
              </h3>
              <span className="text-xs text-slate-400">({conditionStats.good} eks)</span>
            </div>
            <p className="text-[11px] text-amber-400/90 font-medium mt-1">
              {conditionStats.slight + conditionStats.heavy + conditionStats.maintenance} eks perlu perbaikan/perawatan
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Circulation & Utilization Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Tingkat Utilisasi Koleksi</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-amber-300">{utilizationRate}%</h3>
              <span className="text-xs text-slate-400">Dipinjam</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">{availableCopies} eks</span> siap di rak baca
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-300 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Buku Induk Inventaris</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {filteredBooks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stock-opname')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'stock-opname'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit & Stock Opname</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            stockOpnameStats.pending > 0 ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-300'
          }`}>
            {stockOpnameStats.pending} Pending
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('distribution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'distribution'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Distribusi Rak & Valuasi</span>
        </button>
      </div>

      {/* 4. Tab 1 & 2: Inventory & Stock Opname Table Content */}
      {(activeTab === 'inventory' || activeTab === 'stock-opname') && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul, ISBN, no. inv, rak..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                aria-label="Filter Kategori"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Shelf Filter */}
            <div>
              <select
                value={selectedShelf}
                onChange={e => setSelectedShelf(e.target.value)}
                aria-label="Filter Lokasi Rak"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {shelves.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Condition or Status Filter */}
            <div>
              {activeTab === 'inventory' ? (
                <select
                  value={selectedCondition}
                  onChange={e => setSelectedCondition(e.target.value)}
                  aria-label="Filter Kondisi Koleksi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="Semua">Semua Kondisi Fisik</option>
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                  <option value="Dalam Perawatan">Dalam Perawatan</option>
                  <option value="Hilang">Hilang</option>
                </select>
              ) : (
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  aria-label="Filter Status Audit Stock Opname"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="Semua">Semua Status Audit</option>
                  <option value="Verified">Terverifikasi (Valid)</option>
                  <option value="Pending">Belum Diperiksa (Pending)</option>
                  <option value="Discrepancy">Terdapat Selisih</option>
                </select>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. Registrasi</th>
                  <th className="py-3.5 px-4">Buku & Pengarang</th>
                  <th className="py-3.5 px-4">Kategori & Rak</th>
                  <th className="py-3.5 px-4">Eksemplar</th>
                  <th className="py-3.5 px-4">Nilai Aset</th>
                  <th className="py-3.5 px-4">Kondisi Fisik</th>
                  <th className="py-3.5 px-4">{activeTab === 'stock-opname' ? 'Audit Opname' : 'Sumber Dana'}</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Tidak ditemukan data koleksi inventaris yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((book, idx) => {
                    const isEditing = editingBookId === book.id;
                    const unitPrice = book.price || 95000;
                    const totalAsset = unitPrice * (book.copiesTotal || 1);
                    const cond = book.condition || 'Baik';
                    const stStatus = book.stockOpnameStatus || 'Verified';

                    return (
                      <tr key={book.id} className="hover:bg-slate-900/60 transition group">
                        {/* No. Registrasi */}
                        <td className="py-3 px-4 align-top">
                          <span className="font-mono text-emerald-400 font-bold block text-[11px]">
                            {book.inventoryNumber || `INV-${book.id}`}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                            {book.isbn}
                          </span>
                        </td>

                        {/* Title & Author */}
                        <td className="py-3 px-4 align-top max-w-[240px]">
                          <div className="flex items-start gap-3">
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-10 h-14 rounded-lg object-cover flex-shrink-0 shadow-md border border-slate-700/60"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-white text-xs line-clamp-2">{book.title}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">{book.author} ({book.year})</p>
                              <span className="text-[10px] text-slate-500">{book.publisher}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Shelf */}
                        <td className="py-3 px-4 align-top">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium inline-block mb-1">
                            {book.category}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Building2 className="w-3 h-3 text-teal-400" />
                            <span>{book.shelfLocation}</span>
                          </div>
                        </td>

                        {/* Copies */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-mono text-xs">
                            <span className="text-emerald-400 font-bold">{book.copiesAvailable}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="text-white font-bold">{book.copiesTotal}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {(book.copiesTotal || 0) - (book.copiesAvailable || 0)} dipinjam
                          </span>
                        </td>

                        {/* Valuation */}
                        <td className="py-3 px-4 align-top">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={e => setEditPrice(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                              />
                              <span className="text-[9px] text-slate-500 block">per eksemplar</span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-mono font-bold text-emerald-400 block text-xs">
                                Rp {totalAsset.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 block">
                                @Rp {unitPrice.toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Physical Condition */}
                        <td className="py-3 px-4 align-top">
                          {isEditing ? (
                            <select
                              value={editCondition}
                              onChange={e => setEditCondition(e.target.value as BookCondition)}
                              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                            >
                              <option value="Baik">Baik</option>
                              <option value="Rusak Ringan">Rusak Ringan</option>
                              <option value="Rusak Berat">Rusak Berat</option>
                              <option value="Dalam Perawatan">Dalam Perawatan</option>
                              <option value="Hilang">Hilang</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              cond === 'Baik' 
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : cond === 'Rusak Ringan'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-red-500/15 text-red-300 border border-red-500/30'
                            }`}>
                              {cond}
                            </span>
                          )}
                        </td>

                        {/* Stock Opname / Source of Fund */}
                        <td className="py-3 px-4 align-top">
                          {activeTab === 'stock-opname' ? (
                            isEditing ? (
                              <select
                                value={editStockStatus}
                                onChange={e => setEditStockStatus(e.target.value as StockOpnameStatus)}
                                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                              >
                                <option value="Verified">Verified (Valid)</option>
                                <option value="Pending">Pending Audit</option>
                                <option value="Discrepancy">Discrepancy (Selisih)</option>
                              </select>
                            ) : (
                              <div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  stStatus === 'Verified'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : stStatus === 'Discrepancy'
                                    ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {stStatus === 'Verified' && <Check className="w-2.5 h-2.5" />}
                                  {stStatus === 'Discrepancy' && <AlertCircle className="w-2.5 h-2.5" />}
                                  {stStatus === 'Pending' && <Clock className="w-2.5 h-2.5" />}
                                  <span>{stStatus}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 block mt-1">
                                  {book.lastStockOpnameDate ? `Tgl: ${book.lastStockOpnameDate}` : 'Belum diaudit'}
                                </span>
                              </div>
                            )
                          ) : (
                            <div>
                              <span className="text-slate-300 text-xs font-medium block">
                                {book.sourceOfFund || 'Dana BOS'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Reg: {book.addedAt || '2024'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 align-top text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveEdit(book)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition"
                                title="Simpan Perubahan Inventaris"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBookId(null)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {activeTab === 'stock-opname' && stStatus !== 'Verified' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickVerify(book)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 text-[10px] font-bold transition flex items-center gap-1"
                                  title="Verifikasi Fisik Buku di Rak (1-Click Cepat)"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Verifikasi</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => startEdit(book)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                title="Edit Valuasi, Kondisi & Status Inventaris"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab 3: Distribution & Shelf Analytics */}
      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Category Asset Breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Valuasi Koleksi per Kategori</h3>
                <p className="text-xs text-slate-400">Sebaran nilai aset buku berdasarkan klasifikasi keilmuan</p>
              </div>
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-3.5">
              {categories.filter(c => c !== 'Semua Kategori').map(cat => {
                const catBooks = books.filter(b => b.category === cat);
                const catCopies = catBooks.reduce((acc, b) => acc + (b.copiesTotal || 0), 0);
                const catValue = catBooks.reduce((acc, b) => acc + ((b.price || 95000) * (b.copiesTotal || 1)), 0);
                const catPct = totalAssetValue > 0 ? Math.round((catValue / totalAssetValue) * 100) : 0;

                return (
                  <div key={cat} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{cat}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">({catBooks.length} Judul • {catCopies} Eks)</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        Rp {catValue.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${catPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Porsi Valuasi</span>
                      <span className="text-slate-300 font-semibold">{catPct}% dari total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Physical Condition & Shelf Location Breakdown */}
          <div className="space-y-6">
            {/* Shelf distribution */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Kapasitas Rak & Ruang Koleksi</h3>
                  <p className="text-xs text-slate-400">Pemetaan lokasi penyimpanan koleksi di perpustakaan</p>
                </div>
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shelves.filter(s => s !== 'Semua Rak').map(shelf => {
                  const shelfBooks = books.filter(b => b.shelfLocation === shelf);
                  const shelfCopies = shelfBooks.reduce((acc, b) => acc + (b.copiesTotal || 0), 0);
                  const available = shelfBooks.reduce((acc, b) => acc + (b.copiesAvailable || 0), 0);

                  return (
                    <div key={shelf} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs font-mono">{shelf}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{shelfBooks.length} Judul</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-emerald-400 font-bold text-xs">{available}</span>
                        <span className="text-slate-500 text-xs"> / {shelfCopies}</span>
                        <p className="text-[9px] text-slate-400">Eks di Rak</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Condition summary box */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-base">Rangkuman Kondisi Fisik Koleksi</h3>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] text-emerald-400 font-semibold block">Kondisi Baik</span>
                  <span className="text-lg font-bold text-white font-mono mt-1 block">{conditionStats.good}</span>
                  <span className="text-[9px] text-slate-400">Eksemplar</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[10px] text-amber-400 font-semibold block">Rusak Ringan</span>
                  <span className="text-lg font-bold text-white font-mono mt-1 block">{conditionStats.slight}</span>
                  <span className="text-[9px] text-slate-400">Perlu jilid/lem</span>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <span className="text-[10px] text-red-400 font-semibold block">Rusak Berat / Hilang</span>
                  <span className="text-lg font-bold text-white font-mono mt-1 block">{conditionStats.heavy + conditionStats.lost}</span>
                  <span className="text-[9px] text-slate-400">Perlu ganti/afkir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
