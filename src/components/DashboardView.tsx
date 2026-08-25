import React from 'react';
import { 
  BookOpen, 
  ArrowLeftRight, 
  AlertCircle, 
  UserPlus, 
  QrCode, 
  PlusCircle, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Shield, 
  Sparkles, 
  Calendar, 
  Database,
  CloudCheck,
  RotateCcw
} from 'lucide-react';
import { Book, Member, Transaction, SyncConfig, SchoolProfile } from '../types';

interface DashboardViewProps {
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  syncConfig: SyncConfig;
  school: SchoolProfile;
  onOpenNewMemberModal: () => void;
  onOpenNewBookModal: () => void;
  onOpenNewTransactionModal: () => void;
  onOpenScanner: () => void;
  onSelectBook: (book: Book) => void;
  onReturnBook: (trxId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  books,
  members,
  transactions,
  syncConfig,
  school,
  onOpenNewMemberModal,
  onOpenNewBookModal,
  onOpenNewTransactionModal,
  onOpenScanner,
  onSelectBook,
  onReturnBook,
  onNavigateTab,
}) => {
  // Calculated Metrics
  const totalBooksCount = books.reduce((acc, b) => acc + b.copiesTotal, 0);
  const activeLoansCount = transactions.filter(t => t.status === 'borrowed').length;
  const overdueCount = transactions.filter(t => t.status === 'overdue').length;
  const totalMembersCount = members.length;

  const featuredBook = books.find(b => b.isFeatured) || books[0];
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Greeting & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Sistem Aktif & Terhubung
            </span>
            <span className="text-xs text-slate-400 font-mono">NPSN: {school.npsn}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Selamat Datang di {school.schoolName}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            {school.motto}
          </p>
        </div>

        {/* Quick Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-dash-new-loan"
            onClick={onOpenNewTransactionModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pinjam Buku Baru</span>
          </button>
          <button
            id="btn-dash-scanner"
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Pindai Pengembalian</span>
          </button>
          <button
            id="btn-dash-new-member"
            onClick={onOpenNewMemberModal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Total Koleksi */}
        <div 
          id="stat-total-books"
          onClick={() => onNavigateTab('catalog')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Koleksi Buku</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {totalBooksCount.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12.4%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">24.592 judul terarsip digital</p>
        </div>

        {/* Metric 2: Peminjaman Aktif */}
        <div 
          id="stat-active-loans"
          onClick={() => onNavigateTab('circulation')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Peminjaman Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center group-hover:scale-110 transition">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {activeLoansCount.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-teal-400">Sirkulasi Lancar</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Batas tempo rata-rata 14 hari</p>
        </div>

        {/* Metric 3: Terlambat */}
        <div 
          id="stat-overdue-loans"
          onClick={() => onNavigateTab('circulation')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-red-500/50 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pengembalian Terlambat</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center group-hover:scale-110 transition">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-400 tracking-tight">
              {overdueCount}
            </span>
            <span className="text-xs font-semibold text-red-400 px-1.5 py-0.5 rounded bg-red-500/20">
              Perlu Tindakan
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Denda berjalan Rp 1.000 / hari</p>
        </div>

        {/* Metric 4: Anggota Baru */}
        <div 
          id="stat-total-members"
          onClick={() => onNavigateTab('members')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Anggota Terdaftar</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {totalMembersCount}
            </span>
            <span className="text-xs font-semibold text-cyan-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +8.2%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">156 pendaftar baru bulan ini</p>
        </div>
      </div>

      {/* Main Content Grid: Recent Transactions & Trending Book */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base text-white">Transaksi Sirkulasi Terkini</h3>
                <p className="text-xs text-slate-400">Peminjaman dan pengembalian buku waktu-nyata</p>
              </div>
              <button
                id="btn-view-all-circulation"
                onClick={() => onNavigateTab('circulation')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                Lihat Semua Sirkulasi <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Peminjam</th>
                    <th className="pb-3 font-semibold">Judul Buku</th>
                    <th className="pb-3 font-semibold">Tenggat Waktu</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={trx.memberAvatar} 
                            alt={trx.memberName} 
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" 
                          />
                          <div>
                            <p className="font-medium text-xs text-white">{trx.memberName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{trx.memberCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 max-w-[180px]">
                        <p className="font-medium text-xs text-slate-200 truncate">{trx.bookTitle}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{trx.bookIsbn}</p>
                      </td>
                      <td className="py-3.5 text-xs text-slate-300 font-mono">
                        {trx.dueDate}
                      </td>
                      <td className="py-3.5">
                        {trx.status === 'borrowed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Dipinjam
                          </span>
                        )}
                        {trx.status === 'overdue' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
                            Terlambat
                          </span>
                        )}
                        {trx.status === 'returned' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Kembali
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {trx.status !== 'returned' ? (
                          <button
                            id={`btn-return-${trx.id}`}
                            onClick={() => onReturnBook(trx.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-emerald-400 transition"
                          >
                            Kembalikan
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cloud & Realtime System Health Status Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Google Apps Script & Cloud Storage</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Online 99.9%
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Enkripsi AES-256 Aktif • Terakhir Disinkron: <span className="text-slate-300 font-mono">{syncConfig.lastSyncedAt || 'Waktu Nyata'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('settings')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              Pengaturan Webhook
            </button>
          </div>
        </div>

        {/* Right 1 Col: Trending Spotlight & Popular Categories */}
        <div className="space-y-6">
          {/* Spotlight Featured Book Card */}
          {featuredBook && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sedang Tren
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {featuredBook.copiesAvailable} Eks. Tersedia
                </span>
              </div>

              <div className="flex gap-4">
                <img 
                  src={featuredBook.coverImage} 
                  alt={featuredBook.title}
                  className="w-24 h-36 object-cover rounded-xl shadow-lg ring-1 ring-slate-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    {featuredBook.category}
                  </span>
                  <h4 className="font-bold text-base text-white truncate mt-0.5">{featuredBook.title}</h4>
                  <p className="text-xs text-slate-400">{featuredBook.author}</p>
                  
                  <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs font-semibold">
                    <span>★ {featuredBook.rating}</span>
                    <span className="text-slate-500 font-normal">/ 5.0</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {featuredBook.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  id="btn-spotlight-view"
                  onClick={() => onSelectBook(featuredBook)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
                >
                  Detail Buku
                </button>
                <button
                  id="btn-spotlight-borrow"
                  onClick={onOpenNewTransactionModal}
                  disabled={featuredBook.copiesAvailable === 0}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                >
                  Pinjam Sekarang
                </button>
              </div>
            </div>
          )}

          {/* Quick Category Ratios */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <h4 className="font-bold text-sm text-white">Distribusi Koleksi Kategori</h4>
            
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Fiksi Ilmiah & Sastra</span>
                  <span className="font-mono text-emerald-400">42%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Teknologi & Komputer</span>
                  <span className="font-mono text-teal-400">28%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Sains & Matematika</span>
                  <span className="font-mono text-cyan-400">18%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Filsafat & Lainnya</span>
                  <span className="font-mono text-amber-400">12%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
