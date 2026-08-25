import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Download, 
  FileText, 
  TrendingUp, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  BarChart3, 
  Filter, 
  Sparkles,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Printer
} from 'lucide-react';
import { Book, Member, Transaction, SchoolProfile } from '../types';
import { exportMonthlyReportToPDF, exportMonthlyReportToCSV } from '../utils/exportUtils';

interface MonthlyReportViewProps {
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  school: SchoolProfile;
  onNotify?: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

const MONTH_NAMES = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const AVAILABLE_YEARS = [2024, 2025, 2026, 2023];

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  books,
  members,
  transactions,
  school,
  onNotify,
}) => {
  const currentDate = new Date();
  const defaultMonth = String(currentDate.getMonth() + 1).padStart(2, '0'); // current month or '05'
  const defaultYear = 2024; // Default dataset contains 2024 entries

  const [selectedMonth, setSelectedMonth] = useState<string>('05'); // Mei 2024 has rich data
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrowed' | 'returned' | 'overdue'>('all');

  const monthLabel = useMemo(() => {
    return MONTH_NAMES.find(m => m.value === selectedMonth)?.label || 'Bulan Terpilih';
  }, [selectedMonth]);

  // Filter transactions belonging to the selected month & year
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.borrowDate) return false;
      const [y, m] = t.borrowDate.split('-');
      return parseInt(y) === selectedYear && m === selectedMonth;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalBorrows = monthlyTransactions.length;
    const totalReturns = monthlyTransactions.filter(t => t.status === 'returned').length;
    const totalOverdue = monthlyTransactions.filter(t => t.status === 'overdue').length;
    const totalActive = monthlyTransactions.filter(t => t.status === 'borrowed').length;
    const totalFines = monthlyTransactions.reduce((acc, t) => acc + (t.fineAmount || 0), 0);
    const onTimeRate = totalBorrows > 0 ? Math.round((totalReturns / (totalReturns + totalOverdue || 1)) * 100) : 100;

    return {
      totalBorrows,
      totalReturns,
      totalOverdue,
      totalActive,
      totalFines,
      onTimeRate,
    };
  }, [monthlyTransactions]);

  // Category Distribution in this month
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
      const book = books.find(b => b.id === t.bookId || b.isbn === t.bookIsbn);
      const cat = book ? book.category : 'Umum / Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([category, count]) => ({
      category,
      count,
      percentage: summary.totalBorrows > 0 ? Math.round((count / summary.totalBorrows) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    return entries;
  }, [monthlyTransactions, books, summary.totalBorrows]);

  // Top Borrowers in this month
  const topBorrowers = useMemo(() => {
    const memberMap: Record<string, { name: string; code: string; count: number; avatar: string }> = {};
    monthlyTransactions.forEach(t => {
      if (!memberMap[t.memberId]) {
        memberMap[t.memberId] = {
          name: t.memberName,
          code: t.memberCode,
          count: 0,
          avatar: t.memberAvatar,
        };
      }
      memberMap[t.memberId].count += 1;
    });
    return Object.values(memberMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [monthlyTransactions]);

  // Filtered List for Table
  const tableData = useMemo(() => {
    if (statusFilter === 'all') return monthlyTransactions;
    return monthlyTransactions.filter(t => t.status === statusFilter);
  }, [monthlyTransactions, statusFilter]);

  const handleExportPDF = () => {
    exportMonthlyReportToPDF(monthLabel, selectedYear, monthlyTransactions, books, members, school);
    if (onNotify) {
      onNotify(
        'Laporan Bulanan PDF Terunduh',
        `Laporan resmi ${monthLabel} ${selectedYear} telah berhasil digenerate lengkap dengan kop surat dan tanda tangan.`,
        'success'
      );
    }
  };

  const handleExportCSV = () => {
    exportMonthlyReportToCSV(monthLabel, selectedYear, monthlyTransactions, summary);
    if (onNotify) {
      onNotify(
        'Ekspor CSV Berhasil',
        `File Excel CSV untuk rekapitulasi ${monthLabel} ${selectedYear} telah diunduh.`,
        'success'
      );
    }
  };

  return (
    <div id="monthly-report-section" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Laporan Bulanan Resmi
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Periode: {monthLabel} {selectedYear}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Rekapitulasi Sirkulasi & Pelayanan Bulanan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Laporan komprehensif peminjaman, pengembalian tepat waktu, denda, dan distribusi koleksi buku
          </p>
        </div>

        {/* Month, Year Pickers and Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              {MONTH_NAMES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* PDF Export Button */}
          <button
            id="btn-export-monthly-pdf"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/15 transition active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF Laporan</span>
          </button>

          {/* CSV Export Button */}
          <button
            id="btn-export-monthly-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Borrows */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Peminjaman</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">{summary.totalBorrows} Buku</h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{summary.totalActive} aktif pinjam</span>
            <span>di bulan {monthLabel}</span>
          </p>
        </div>

        {/* Total Returns */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pengembalian Tuntas</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-cyan-400 mt-2">{summary.totalReturns} Transaksi</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Kepatuhan tepat waktu: <strong className="text-cyan-300">{summary.onTimeRate}%</strong>
          </p>
        </div>

        {/* Overdue Count */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Keterlambatan (Overdue)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-rose-400 mt-2">{summary.totalOverdue} Transaksi</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.totalOverdue > 0 ? 'Perlu tindakan notifikasi' : 'Tidak ada catatan overdue'}
          </p>
        </div>

        {/* Fines Collected */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Akumulasi Denda Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-amber-400 mt-2">
            Rp {summary.totalFines.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Tarif sirkulasi: Rp 1.000 / hari
          </p>
        </div>
      </div>

      {/* Middle Section: Category Breakdown & Top Borrowers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Progress Bars (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Distribusi Peminjaman per Kategori ({monthLabel} {selectedYear})</h3>
            </div>
            <span className="text-xs text-slate-400">{categoryStats.length} Kategori Aktif</span>
          </div>

          {categoryStats.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Belum ada transaksi peminjaman pada bulan {monthLabel} {selectedYear}.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {categoryStats.map((item, idx) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{item.category}</span>
                    <span className="text-slate-400 font-mono">
                      {item.count} buku ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? 'bg-emerald-500'
                          : idx === 1
                            ? 'bg-teal-400'
                            : idx === 2
                              ? 'bg-cyan-400'
                              : 'bg-indigo-400'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Active Borrowers (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">Pemustaka Teraktif</h3>
            </div>
            <span className="text-xs text-emerald-400 font-bold">Top 5</span>
          </div>

          <div className="space-y-3">
            {topBorrowers.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Tidak ada data peminjam di bulan ini.</p>
            ) : (
              topBorrowers.map((b, index) => (
                <div key={b.code} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-emerald-400 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white truncate">{b.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{b.code}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold shrink-0">
                    {b.count} Pinjam
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Transactions Ledger Table */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-white">Buku Induk Sirkulasi Bulan {monthLabel} {selectedYear}</h3>
            <p className="text-xs text-slate-400">Daftar lengkap transaksi yang dicatat selama periode bulanan ini</p>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Semua ({monthlyTransactions.length})
            </button>
            <button
              onClick={() => setStatusFilter('borrowed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'borrowed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-950 text-slate-400 hover:text-emerald-400'
              }`}
            >
              Dipinjam ({summary.totalActive})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-950 text-slate-400 hover:text-rose-400'
              }`}
            >
              Terlambat ({summary.totalOverdue})
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'returned' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-950 text-slate-400 hover:text-blue-400'
              }`}
            >
              Dikembalikan ({summary.totalReturns})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Kode Trx</th>
                <th className="p-3">Nama Peminjam</th>
                <th className="p-3">Judul Buku</th>
                <th className="p-3">Tanggal Pinjam</th>
                <th className="p-3">Batas Tempo</th>
                <th className="p-3">Status</th>
                <th className="p-3">Denda (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada catatan transaksi pada filter bulan ini.
                  </td>
                </tr>
              ) : (
                tableData.map((trx, index) => (
                  <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-400 font-mono">{index + 1}</td>
                    <td className="p-3 font-mono font-medium text-slate-300">{trx.trxCode}</td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{trx.memberName}</p>
                      <p className="text-[10px] text-slate-400">{trx.memberCode}</p>
                    </td>
                    <td className="p-3 text-slate-200 max-w-xs truncate">{trx.bookTitle}</td>
                    <td className="p-3 text-slate-300">{trx.borrowDate}</td>
                    <td className="p-3 text-slate-300">{trx.dueDate}</td>
                    <td className="p-3">
                      {trx.status === 'borrowed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Dipinjam
                        </span>
                      )}
                      {trx.status === 'overdue' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Terlambat
                        </span>
                      )}
                      {trx.status === 'returned' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Kembali
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {trx.fineAmount > 0 ? (
                        <span className="text-rose-400 font-bold">Rp {trx.fineAmount.toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
