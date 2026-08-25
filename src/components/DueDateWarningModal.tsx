import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  Send, 
  FileText, 
  RotateCw, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Search, 
  Calendar,
  AlertCircle,
  Copy,
  ExternalLink,
  Filter,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Transaction, SchoolProfile } from '../types';
import { exportDueDateNoticePDF } from '../utils/exportUtils';

interface DueDateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  school: SchoolProfile;
  onRenewLoan: (trxId: string) => void;
  onReturnBook: (trxId: string) => void;
  onNotifySuccess?: (msg: string) => void;
}

export const DueDateWarningModal: React.FC<DueDateWarningModalProps> = ({
  isOpen,
  onClose,
  transactions,
  school,
  onRenewLoan,
  onReturnBook,
  onNotifySuccess,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute status and days difference for each transaction
  const enrichedLoans = useMemo(() => {
    const active = transactions.filter(t => t.status === 'borrowed' || t.status === 'overdue');
    const today = new Date(todayStr);

    return active.map(trx => {
      const dueDate = new Date(trx.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // negative means overdue

      let urgency: 'overdue' | 'today' | 'upcoming' | 'normal' = 'normal';
      if (diffDays < 0 || trx.status === 'overdue') {
        urgency = 'overdue';
      } else if (diffDays === 0) {
        urgency = 'today';
      } else if (diffDays <= 3) {
        urgency = 'upcoming';
      }

      return {
        ...trx,
        diffDays,
        urgency,
      };
    }).sort((a, b) => a.diffDays - b.diffDays);
  }, [transactions, todayStr]);

  const overdueList = enrichedLoans.filter(l => l.urgency === 'overdue');
  const todayList = enrichedLoans.filter(l => l.urgency === 'today');
  const upcomingList = enrichedLoans.filter(l => l.urgency === 'upcoming');
  const attentionCount = overdueList.length + todayList.length + upcomingList.length;

  const filteredLoans = useMemo(() => {
    return enrichedLoans.filter(item => {
      if (filterType === 'overdue' && item.urgency !== 'overdue') return false;
      if (filterType === 'today' && item.urgency !== 'today') return false;
      if (filterType === 'upcoming' && item.urgency !== 'upcoming') return false;
      if (filterType === 'all' && item.urgency === 'normal') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.memberName.toLowerCase().includes(q) ||
          item.bookTitle.toLowerCase().includes(q) ||
          item.memberCode.toLowerCase().includes(q) ||
          item.trxCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedLoans, filterType, searchQuery]);

  if (!isOpen) return null;

  const generateWhatsAppMessage = (loan: typeof enrichedLoans[0]) => {
    const isOverdue = loan.diffDays < 0;
    const statusText = isOverdue 
      ? `telah TERLAMBAT ${Math.abs(loan.diffDays)} hari (Batas: ${loan.dueDate})`
      : loan.diffDays === 0 
        ? `JATUH TEMPO HARI INI (${loan.dueDate})`
        : `akan jatuh tempo dalam ${loan.diffDays} hari (${loan.dueDate})`;

    const fineText = loan.fineAmount > 0 
      ? `\n*Akumulasi Denda:* Rp ${loan.fineAmount.toLocaleString('id-ID')}` 
      : '';

    return `Halo *${loan.memberName}* (${loan.memberCode}),\n\n` +
      `Pemberitahuan dari Perpustakaan *${school.schoolName}*:\n` +
      `Buku yang Anda pinjam:\n` +
      `📖 *${loan.bookTitle}*\n` +
      `Kode Transaksi: ${loan.trxCode}\n` +
      `Status: *${statusText}*${fineText}\n\n` +
      `Mohon segera melakukan pengembalian atau perpanjangan di loket perpustakaan. Terima kasih! 🙏`;
  };

  const handleOpenWhatsApp = (loan: typeof enrichedLoans[0]) => {
    const msg = generateWhatsAppMessage(loan);
    let phoneClean = (loan.memberPhone || '').replace(/[^0-9]/g, '');
    if (phoneClean.startsWith('0')) {
      phoneClean = '62' + phoneClean.slice(1);
    }
    const waUrl = phoneClean 
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    if (onNotifySuccess) {
      onNotifySuccess(`Membuka WhatsApp untuk ${loan.memberName}`);
    }
  };

  const handleCopyMessage = (loan: typeof enrichedLoans[0]) => {
    const msg = generateWhatsAppMessage(loan);
    navigator.clipboard.writeText(msg);
    setCopiedId(loan.id);
    setTimeout(() => setCopiedId(null), 2500);
    if (onNotifySuccess) {
      onNotifySuccess(`Teks pengingat untuk ${loan.memberName} berhasil disalin`);
    }
  };

  const handlePrintPDF = (loan: typeof enrichedLoans[0]) => {
    exportDueDateNoticePDF(loan, school, loan.diffDays);
    if (onNotifySuccess) {
      onNotifySuccess(`Surat Peringatan PDF untuk ${loan.memberName} berhasil dibuat.`);
    }
  };

  const handleBroadcastAll = () => {
    if (filteredLoans.length === 0) return;
    const sample = filteredLoans[0];
    handleCopyMessage(sample);
    if (onNotifySuccess) {
      onNotifySuccess(`Peringatan otomatis siap dibagikan ke ${filteredLoans.length} peminjam.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Pusat Peringatan Jatuh Tempo</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {attentionCount} Perhatian
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola notifikasi WhatsApp, cetak surat peringatan PDF, dan proses perpanjangan instan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter Summary Pills */}
        <div className="p-4 sm:px-6 bg-slate-950/50 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`p-3 rounded-2xl border text-left transition ${
              filterType === 'all'
                ? 'bg-slate-800 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-[11px] font-medium block">Semua Perhatian</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{attentionCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('overdue')}
            className={`p-3 rounded-2xl border text-left transition ${
              filterType === 'overdue'
                ? 'bg-rose-500/15 border-rose-500 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-[11px] font-medium block text-rose-400">🚨 Terlambat (Overdue)</span>
            <span className="text-lg font-bold text-rose-400 mt-0.5 block">{overdueList.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('today')}
            className={`p-3 rounded-2xl border text-left transition ${
              filterType === 'today'
                ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-[11px] font-medium block text-amber-400">⚠️ Jatuh Tempo Hari Ini</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">{todayList.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('upcoming')}
            className={`p-3 rounded-2xl border text-left transition ${
              filterType === 'upcoming'
                ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-[11px] font-medium block text-cyan-400">🔔 Mendekati (H-3)</span>
            <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{upcomingList.length}</span>
          </button>
        </div>

        {/* Search & Bulk Action Bar */}
        <div className="p-4 sm:px-6 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama peminjam, judul buku, kode..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleBroadcastAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Salin Teks Broadcast Masal</span>
            </button>
          </div>
        </div>

        {/* Loan Items List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-white">Tidak Ada Peringatan Kritis</h3>
              <p className="text-xs text-slate-400 mt-1">
                Seluruh peminjaman buku dalam kondisi aman dan belum mendekati masa jatuh tempo.
              </p>
            </div>
          ) : (
            filteredLoans.map((loan) => {
              const isOverdue = loan.urgency === 'overdue';
              const isToday = loan.urgency === 'today';

              return (
                <div
                  key={loan.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverdue
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                      : isToday
                        ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Member & Book Details */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <img
                        src={loan.bookCover}
                        alt={loan.bookTitle}
                        className="w-12 h-16 object-cover rounded-lg border border-slate-700 shrink-0 shadow"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-slate-400">{loan.trxCode}</span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Terlambat {Math.abs(loan.diffDays)} Hari
                            </span>
                          )}
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Jatuh Tempo Hari Ini
                            </span>
                          )}
                          {loan.urgency === 'upcoming' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Sisa {loan.diffDays} Hari
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-white truncate">{loan.bookTitle}</h4>
                        <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-emerald-400">{loan.memberName}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{loan.memberCode}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                          <span>Pinjam: {loan.borrowDate}</span>
                          <span>Batas: <strong className={isOverdue ? 'text-rose-400' : 'text-slate-200'}>{loan.dueDate}</strong></span>
                          {loan.fineAmount > 0 && (
                            <span className="text-rose-400 font-bold">
                              Denda: Rp {loan.fineAmount.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      {/* WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(loan)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition"
                        title="Kirim Peringatan Langsung ke WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Copy Text Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(loan)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px] font-medium transition"
                        title="Salin Teks Pesan Pengingat"
                      >
                        {copiedId === loan.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      {/* Cetak Surat PDF */}
                      <button
                        type="button"
                        onClick={() => handlePrintPDF(loan)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px] font-medium transition"
                        title="Unduh Surat Peringatan Jatuh Tempo (PDF)"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>PDF</span>
                      </button>

                      {/* Perpanjang */}
                      <button
                        type="button"
                        onClick={() => onRenewLoan(loan.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition"
                        title="Perpanjang Masa Pinjam 7 Hari"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Perpanjang</span>
                      </button>

                      {/* Kembalikan */}
                      <button
                        type="button"
                        onClick={() => onReturnBook(loan.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition"
                        title="Tandai Pengembalian Buku"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kembalikan</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Tarif denda standar sirkulasi: Rp 1.000 / hari keterlambatan</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
