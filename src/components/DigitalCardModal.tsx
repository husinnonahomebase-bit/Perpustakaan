import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Printer, 
  Building2, 
  QrCode, 
  Barcode, 
  Sparkles, 
  CheckCircle2,
  History,
  Clock,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { Member, SchoolProfile, Transaction, Book } from '../types';

interface DigitalCardModalProps {
  member: Member | null;
  school: SchoolProfile;
  transactions?: Transaction[];
  books?: Book[];
  onClose: () => void;
  onOpenQRModal?: (member: Member) => void;
}

export const DigitalCardModal: React.FC<DigitalCardModalProps> = ({
  member,
  school,
  transactions = [],
  books = [],
  onClose,
  onOpenQRModal,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'history'>('card');
  const [cardCodeMode, setCardCodeMode] = useState<'barcode' | 'qrcode'>('qrcode');
  const [qrCardUrl, setQrCardUrl] = useState<string>('');

  useEffect(() => {
    if (member) {
      QRCode.toDataURL(
        member.memberCode,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#020617',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (err, url) => {
          if (!err && url) {
            setQrCardUrl(url);
          }
        }
      );
    }
  }, [member]);

  if (!member) return null;

  // Filter transactions for this specific member and sort chronologically (newest first)
  const memberTransactions = transactions
    .filter((t) => t.memberId === member.id || t.memberCode === member.memberCode)
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());

  // Metrics summary
  const totalBorrowed = memberTransactions.length;
  const activeLoans = memberTransactions.filter((t) => t.status === 'borrowed' || t.status === 'overdue' || t.status === 'renewed').length;
  const returnedLoans = memberTransactions.filter((t) => t.status === 'returned').length;
  const overdueCount = memberTransactions.filter((t) => t.status === 'overdue' || (t.fineAmount && t.fineAmount > 0)).length;
  const totalFines = memberTransactions.reduce((acc, t) => acc + (t.fineAmount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="digital-card-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="digital-card-modal-dialog"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Kartu Pemustaka & Riwayat Aktivitas</h3>
              <p className="text-[11px] text-slate-400">Identitas digital dan rekam jejak sirkulasi buku</p>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-850/60 px-6 pt-2 shrink-0">
          <button
            type="button"
            id="tab-btn-digital-card"
            onClick={() => setActiveTab('card')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'card'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kartu Pemustaka Fisik/Digital</span>
          </button>

          <button
            type="button"
            id="tab-btn-activity-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Aktivitas ({memberTransactions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
          {activeTab === 'card' ? (
            /* Digital Card View */
            <div className="flex flex-col items-center space-y-4">
              {/* Code Mode Switch: Barcode vs QR Code */}
              <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setCardCodeMode('qrcode')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    cardCodeMode === 'qrcode'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardCodeMode('barcode')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    cardCodeMode === 'barcode'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Barcode 1D</span>
                </button>
              </div>

              {/* Physical Card Simulation (CR80 Standard Ratio) */}
              <div 
                id="printable-library-card"
                className="w-full max-w-md h-60 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-900 to-emerald-950 p-5 border border-emerald-500/40 shadow-2xl relative flex flex-col justify-between overflow-hidden"
              >
                {/* Background glow watermark */}
                <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* Card Top: School Info */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    {school.logoUrl ? (
                      <img 
                        src={school.logoUrl} 
                        alt="Logo Sekolah" 
                        className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-white uppercase tracking-tight leading-none">
                        {school.schoolName}
                      </h4>
                      <p className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
                        KARTU PEMUSTAKA DIGITAL
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">NPSN: {school.npsn}</span>
                </div>

                {/* Card Body: Member Info */}
                <div className="flex items-center gap-3.5 my-auto">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-500/50 shadow-md flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white truncate">{member.name}</h3>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        member.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {member.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                      {member.role} {member.classOrDept ? `(${member.classOrDept})` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{member.email}</p>
                  </div>
                </div>

                {/* Card Bottom: Barcode or QR & ID */}
                <div className="flex items-end justify-between pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Nomor Anggota</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">{member.memberCode}</span>
                  </div>

                  {cardCodeMode === 'qrcode' && qrCardUrl ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={qrCardUrl} 
                        alt="QR Code" 
                        className="w-10 h-10 bg-white p-0.5 rounded-lg shadow-sm"
                      />
                      <span className="text-[8px] text-slate-400 font-mono leading-tight">
                        SCAN<br/>DESK
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-[2px] h-6 px-2 py-0.5 bg-white rounded">
                        {[4,2,3,1,4,2,1,3,2,4,1,2,3,2,1,4,2,3,1,4].map((h, i) => (
                          <div 
                            key={i} 
                            className="bg-slate-950 w-[2px]" 
                            style={{ height: `${h * 4 + 4}px` }}
                          ></div>
                        ))}
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono mt-0.5">BERLAKU HINGGA 2026</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Summary Info Box */}
              <div className="w-full max-w-md grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Status Pinjam</span>
                  <p className="text-sm font-bold text-white mt-0.5">{member.activeLoansCount} / {member.maxBorrowLimit}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Total Riwayat</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{memberTransactions.length} Kali</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Tunggakan Denda</span>
                  <p className={`text-sm font-bold mt-0.5 ${member.totalFinesUnpaid > 0 ? 'text-red-400 font-mono' : 'text-slate-400'}`}>
                    {member.totalFinesUnpaid > 0 ? `Rp ${member.totalFinesUnpaid.toLocaleString('id-ID')}` : 'Rp 0'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Activity History Vertical Timeline View */
            <div className="space-y-4" id="member-activity-history-section">
              {/* Timeline Header Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Total Transaksi</span>
                  <p className="text-base font-bold text-white mt-0.5">{totalBorrowed}</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-400">Sedang Dipinjam</span>
                  <p className="text-base font-bold text-cyan-400 mt-0.5">{activeLoans}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400">Selesai Dikembalikan</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{returnedLoans}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <span className="text-[10px] text-red-400">Keterlambatan/Denda</span>
                  <p className="text-base font-bold text-red-400 mt-0.5">{overdueCount}</p>
                </div>
              </div>

              {/* Vertical Timeline Component */}
              {memberTransactions.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                  {memberTransactions.map((trx) => {
                    const isReturned = trx.status === 'returned';
                    const isOverdue = trx.status === 'overdue';
                    const isRenewed = trx.status === 'renewed';

                    return (
                      <div 
                        key={trx.id} 
                        id={`timeline-item-${trx.id}`}
                        className="relative group"
                      >
                        {/* Timeline Node Icon Indicator */}
                        <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center border shadow-md ${
                          isReturned 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' 
                            : isOverdue 
                            ? 'bg-red-500/20 text-red-400 border-red-500' 
                            : isRenewed
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500'
                        }`}>
                          {isReturned ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isOverdue ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : isRenewed ? (
                            <RefreshCw className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                        </div>

                        {/* Timeline Item Card */}
                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-750 hover:border-slate-600 transition shadow-lg space-y-2.5">
                          {/* Top Row: Book Title + Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img 
                                src={trx.bookCover} 
                                alt={trx.bookTitle}
                                className="w-9 h-12 rounded object-cover shadow shrink-0" 
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition">
                                  {trx.bookTitle}
                                </h4>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  ISBN: {trx.bookIsbn} • Trx: #{trx.trxCode}
                                </p>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isReturned 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : isOverdue 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                : isRenewed
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {trx.status.toUpperCase()}
                            </span>
                          </div>

                          {/* Date Details Strip */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-[11px]">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Tgl Pinjam:</span>
                              <span className="font-mono text-slate-300 font-medium">{trx.borrowDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Tenggat Waktu:</span>
                              <span className="font-mono text-slate-300 font-medium">{trx.dueDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Tgl Pengembalian:</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {trx.returnDate || <span className="text-cyan-400 font-normal">Belum Kembali</span>}
                              </span>
                            </div>
                          </div>

                          {/* Fine or Notes */}
                          {trx.fineAmount > 0 && (
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-[11px] text-red-300">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Denda Keterlambatan:
                              </span>
                              <span className="font-mono font-bold">Rp {trx.fineAmount.toLocaleString('id-ID')}</span>
                            </div>
                          )}

                          {trx.notes && (
                            <p className="text-[10px] text-slate-400 italic">
                              Catatan: "{trx.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-xs">Belum Ada Riwayat Aktivitas Peminjaman</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Anggota ini belum memiliki transaksi peminjaman buku yang tercatat di sistem sirkulasi.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            {onOpenQRModal && (
              <button
                type="button"
                id="btn-open-qr-from-card"
                onClick={() => onOpenQRModal(member)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Scanner ID</span>
              </button>
            )}

            <button
              type="button"
              id="btn-print-library-card"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
