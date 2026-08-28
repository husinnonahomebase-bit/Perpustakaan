import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ArrowLeftRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Calendar, 
  Share2, 
  FileText, 
  Download, 
  MessageSquare,
  Sparkles,
  Phone,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, SchoolProfile } from '../types';
import { exportTransactionsToPDF, exportTransactionsToCSV, exportToCSV } from '../utils/exportUtils';

interface CirculationViewProps {
  transactions: Transaction[];
  school: SchoolProfile;
  onOpenNewTransactionModal: () => void;
  onReturnBook: (trxId: string) => void;
  onRenewLoan: (trxId: string, daysToAdd: number) => void;
  onSendReminder: (trx: Transaction) => void;
  onPrintReceipt?: (trx: Transaction) => void;
}

export const CirculationView: React.FC<CirculationViewProps> = ({
  transactions,
  school,
  onOpenNewTransactionModal,
  onReturnBook,
  onRenewLoan,
  onSendReminder,
  onPrintReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrowed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions
  const filteredTransactions = transactions.filter((trx) => {
    // Tab
    if (activeTab === 'active') {
      if (trx.status === 'returned') return false;
      if (statusFilter === 'borrowed' && trx.status !== 'borrowed') return false;
      if (statusFilter === 'overdue' && trx.status !== 'overdue') return false;
    } else {
      if (trx.status !== 'returned') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMember = trx.memberName.toLowerCase().includes(q) || trx.memberCode.toLowerCase().includes(q);
      const matchBook = trx.bookTitle.toLowerCase().includes(q) || trx.bookIsbn.toLowerCase().includes(q);
      const matchTrx = trx.trxCode.toLowerCase().includes(q);
      if (!matchMember && !matchBook && !matchTrx) return false;
    }

    return true;
  });

  const handleReturnWithConfetti = (trxId: string) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#14B8A6', '#06B6D4']
    });
    onReturnBook(trxId);
  };

  const handleExportPDF = () => {
    exportTransactionsToPDF(filteredTransactions, school);
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(
      filteredTransactions,
      `Data_Sirkulasi_${activeTab === 'active' ? 'Aktif' : 'Riwayat'}`
    );
  };

  return (
    <div id="circulation-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Sirkulasi & Peminjaman
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredTransactions.length} Transaksi Ditampilkan
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Sirkulasi Buku</h2>
          <p className="text-xs text-slate-400 mt-0.5">Pantau masa pinjam, perhitungan denda otomatis, perpanjangan, dan pengembalian</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-circulation-pdf"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh Laporan PDF</span>
          </button>
          <button
            id="btn-export-circulation-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            id="btn-create-circulation-trx"
            onClick={onOpenNewTransactionModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Pinjamkan Buku</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Main Tab Switcher */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'active' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Peminjaman Aktif ({transactions.filter(t => t.status !== 'returned').length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'history' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Riwayat Pengembalian ({transactions.filter(t => t.status === 'returned').length})
            </button>
          </div>

          {/* Sub Filter (for Active Tab) & Search */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {activeTab === 'active' && (
              <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-xs font-medium">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === 'all' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('borrowed')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === 'borrowed' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  Dipinjam
                </button>
                <button
                  onClick={() => setStatusFilter('overdue')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === 'overdue' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  Terlambat
                </button>
              </div>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi, anggota, buku..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      {filteredTransactions.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <ArrowLeftRight className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-semibold text-white">Tidak ada transaksi ditemukan</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tidak ada data transaksi yang cocok dengan filter atau kata kunci pencarian yang dipilih.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider bg-slate-900/80">
                  <th className="p-4 font-semibold">No. Transaksi</th>
                  <th className="p-4 font-semibold">Anggota / Peminjam</th>
                  <th className="p-4 font-semibold">Buku Yang Dipinjam</th>
                  <th className="p-4 font-semibold">Tgl Pinjam & Tenggat</th>
                  <th className="p-4 font-semibold">Status & Denda</th>
                  <th className="p-4 font-semibold text-right">Aksi Sirkulasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((trx) => {
                  const isOverdue = trx.status === 'overdue';
                  return (
                    <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 align-top">
                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {trx.trxCode}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Petugas: {trx.processedBy}</p>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex items-center gap-3">
                          <img 
                            src={trx.memberAvatar} 
                            alt={trx.memberName} 
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700" 
                          />
                          <div>
                            <p className="font-semibold text-xs text-white">{trx.memberName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{trx.memberCode}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top max-w-xs">
                        <div className="flex items-center gap-3">
                          <img 
                            src={trx.bookCover} 
                            alt={trx.bookTitle} 
                            className="w-8 h-12 object-cover rounded shadow-sm ring-1 ring-slate-700 flex-shrink-0" 
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-slate-200 truncate">{trx.bookTitle}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">ISBN: {trx.bookIsbn}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top text-xs font-mono">
                        <div className="space-y-1">
                          <div className="text-slate-400 flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Pinjam:</span>
                            <span>{trx.borrowDate}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 font-bold ${isOverdue ? 'text-red-400' : 'text-slate-200'}`}>
                            <span className="text-[10px] uppercase text-slate-500">Tempo:</span>
                            <span>{trx.dueDate}</span>
                          </div>
                          {trx.returnDate && (
                            <div className="text-blue-400 flex items-center gap-1.5 font-bold">
                              <span className="text-[10px] uppercase text-slate-500">Kembali:</span>
                              <span>{trx.returnDate}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        {trx.status === 'borrowed' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <Clock className="w-3 h-3" /> Sedang Dipinjam
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">Denda: Rp 0</p>
                          </div>
                        )}
                        {trx.status === 'overdue' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                              <AlertCircle className="w-3 h-3" /> Terlambat
                            </span>
                            <p className="text-[11px] font-mono font-bold text-red-400 mt-1">
                              Denda: Rp {trx.fineAmount.toLocaleString('id-ID')}
                            </p>
                          </div>
                        )}
                        {trx.status === 'returned' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Selesai Kembali
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">Telah diarsipkan</p>
                          </div>
                        )}
                      </td>

                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onPrintReceipt && (
                            <button
                              id={`btn-print-receipt-${trx.id}`}
                              onClick={() => onPrintReceipt(trx)}
                              title="Cetak Slip Tanda Terima"
                              className="p-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {trx.status !== 'returned' ? (
                            <>
                              <button
                                id={`btn-renew-${trx.id}`}
                                onClick={() => onRenewLoan(trx.id, 7)}
                                title="Perpanjang 7 Hari"
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
                              >
                                +7 Hari
                              </button>

                              <button
                                id={`btn-remind-${trx.id}`}
                                onClick={() => onSendReminder(trx)}
                                title="Kirim Notifikasi / WhatsApp"
                                className="p-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 border border-slate-700 transition"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>

                              <button
                                id={`btn-complete-return-${trx.id}`}
                                onClick={() => handleReturnWithConfetti(trx.id)}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition"
                              >
                                Kembalikan
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono px-2 py-1">
                              TRX Selesai
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
