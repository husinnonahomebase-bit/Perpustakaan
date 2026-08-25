import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  FileText, 
  Calendar, 
  BookOpen, 
  Users, 
  Sparkles, 
  CheckCircle2,
  Award,
  Layers,
  ArrowUpRight,
  PieChart,
  FileSpreadsheet,
  Package,
  ShieldCheck
} from 'lucide-react';
import { Book, Member, Transaction, SchoolProfile } from '../types';
import { exportTransactionsToPDF, exportToCSV, exportCatalogToPDF, exportInventoryReportToPDF } from '../utils/exportUtils';
import { MonthlyReportView } from './MonthlyReportView';
import { InventoryReportView } from './InventoryReportView';

interface AnalyticsViewProps {
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  school: SchoolProfile;
  onUpdateBook?: (book: Book) => void;
  onNotify?: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  books,
  members,
  transactions,
  school,
  onUpdateBook,
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'monthly' | 'inventory' | 'trends'>('inventory');

  const monthlyCirculationData = [
    { month: 'Jan', borrows: 310, returns: 290 },
    { month: 'Feb', borrows: 380, returns: 350 },
    { month: 'Mar', borrows: 460, returns: 420 },
    { month: 'Apr', borrows: 520, returns: 490 },
    { month: 'Mei', borrows: 610, returns: 570 },
    { month: 'Jun', borrows: 490, returns: 460 },
  ];

  const maxVal = 700;

  const topBooks = [
    { title: 'Neuromancer', author: 'William Gibson', count: 184, category: 'Fiksi Ilmiah' },
    { title: 'Dune: Putra Arrakis', author: 'Frank Herbert', count: 162, category: 'Fiksi Ilmiah' },
    { title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', count: 155, category: 'Sastra & Novel' },
    { title: 'Clean Code', author: 'Robert C. Martin', count: 128, category: 'Teknologi' },
    { title: 'Filosofi Teras', author: 'Henry Manampiring', count: 119, category: 'Filsafat' },
  ];

  const handleExportAllTrxPDF = () => {
    exportTransactionsToPDF(transactions, school, 'LAPORAN REKAPITULASI SIRKULASI PERPUSTAKAAN');
    if (onNotify) {
      onNotify('Laporan Sirkulasi PDF Dibuat', 'Seluruh rekapitulasi data sirkulasi telah digenerate ke PDF.', 'success');
    }
  };

  const handleExportCatalogPDF = () => {
    exportCatalogToPDF(books, school);
    if (onNotify) {
      onNotify('Katalog Koleksi PDF Dibuat', 'Buku induk katalog koleksi perpustakaan telah digenerate ke PDF.', 'success');
    }
  };

  const handleExportInventoryPDF = () => {
    exportInventoryReportToPDF(books, school);
    if (onNotify) {
      onNotify('Laporan Inventaris PDF Dibuat', 'Dokumen Berita Acara & Laporan Inventaris resmi telah digenerate ke PDF.', 'success');
    }
  };

  return (
    <div id="analytics-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Sub-tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'inventory'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Laporan Inventaris & Aset</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'monthly'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Laporan Bulanan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('trends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'trends'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tren Analitik</span>
          </button>
        </div>

        {/* Global PDF Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportInventoryPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-sm shadow-emerald-600/20"
            title="Cetak Berita Acara & Laporan Inventaris ke Dokumen PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Inventaris</span>
          </button>

          <button
            type="button"
            onClick={handleExportAllTrxPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="Cetak Seluruh Rekapitulasi Sirkulasi ke Dokumen PDF"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF Sirkulasi</span>
          </button>

          <button
            type="button"
            onClick={handleExportCatalogPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="Cetak Buku Induk Katalog Koleksi ke Dokumen PDF"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            <span>PDF Katalog</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Laporan Inventaris (Inventory & Valuation Report) */}
      {activeSubTab === 'inventory' && (
        <InventoryReportView
          books={books}
          school={school}
          onUpdateBook={onUpdateBook}
          onNotify={onNotify}
        />
      )}

      {/* Subtab 2: Laporan Bulanan (Monthly Report) */}
      {activeSubTab === 'monthly' && (
        <MonthlyReportView
          books={books}
          members={members}
          transactions={transactions}
          school={school}
          onNotify={onNotify}
        />
      )}

      {/* Subtab 3: Tren Analitik Tahunan / Semester */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 3 Summary Highlight Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400">Total Sirkulasi Semester Ini</span>
                <h3 className="text-2xl font-bold text-white mt-1">2.770 Transaksi</h3>
                <span className="text-xs font-semibold text-emerald-400 flex items-center mt-1">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> +14.8% dari semester lalu
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400">Tingkat Pengembalian Tepat Waktu</span>
                <h3 className="text-2xl font-bold text-cyan-400 mt-1">94.2%</h3>
                <span className="text-xs font-semibold text-slate-400 mt-1">
                  Hanya 5.8% keterlambatan
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400">Kategori Paling Diminati</span>
                <h3 className="text-2xl font-bold text-amber-300 mt-1">Fiksi Ilmiah & Sastra</h3>
                <span className="text-xs font-semibold text-slate-400 mt-1">
                  42% dari seluruh sirkulasi
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Circulation Trend Chart & Leaderboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Monthly Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white">Tren Sirkulasi Peminjaman Bulanan</h3>
                  <p className="text-xs text-slate-400">Perbandingan jumlah buku dipinjam vs dikembalikan</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span> Dipinjam
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-3 h-3 rounded bg-teal-400"></span> Dikembalikan
                  </span>
                </div>
              </div>

              {/* Pure CSS Responsive Bar Chart */}
              <div className="pt-6 pb-2">
                <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 px-2 border-b border-slate-800">
                  {monthlyCirculationData.map((d) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                        {/* Borrow Bar */}
                        <div className="w-1/2 flex flex-col items-center">
                          <span className="text-[10px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition mb-1">
                            {d.borrows}
                          </span>
                          <div 
                            className="w-full bg-emerald-500 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                            style={{ height: `${(d.borrows / maxVal) * 100}%` }}
                          ></div>
                        </div>

                        {/* Return Bar */}
                        <div className="w-1/2 flex flex-col items-center">
                          <span className="text-[10px] font-mono text-teal-400 opacity-0 group-hover:opacity-100 transition mb-1">
                            {d.returns}
                          </span>
                          <div 
                            className="w-full bg-teal-400 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                            style={{ height: `${(d.returns / maxVal) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition">
                        {d.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Top 5 Books Leaderboard */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">5 Buku Terfavorit</h3>
                <span className="text-xs text-amber-400 font-mono">Berdasarkan Sirkulasi</span>
              </div>

              <div className="space-y-3">
                {topBooks.map((book, index) => (
                  <div 
                    key={book.title}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-400 text-slate-950' : index === 1 ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white truncate">{book.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{book.author} • {book.category}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-xs font-bold text-emerald-400">{book.count}x</span>
                      <p className="text-[9px] text-slate-500">Dipinjam</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
