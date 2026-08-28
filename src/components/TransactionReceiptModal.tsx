import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Calendar, 
  BookOpen, 
  User, 
  QrCode, 
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Transaction, SchoolProfile } from '../types';
import { exportTransactionReceiptToPDF } from '../utils/exportUtils';

interface TransactionReceiptModalProps {
  transaction: Transaction | null;
  school: SchoolProfile;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  school,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    exportTransactionReceiptToPDF(transaction, school);
  };

  const handleCopyText = () => {
    const text = `
*TANDA TERIMA PEMINJAMAN PUSTAKA*
🏛️ *${school.schoolName}*
---------------------------------------
🔖 Kode Transaksi: ${transaction.trxCode}
👤 Peminjam: ${transaction.memberName} (${transaction.memberCode})
📱 No. Kontak: ${transaction.memberPhone || '-'}
---------------------------------------
📖 Judul: ${transaction.bookTitle}
🔢 ISBN: ${transaction.bookIsbn}
📅 Tgl Pinjam: ${transaction.borrowDate}
⏳ Batas Kembali: ${transaction.dueDate}
---------------------------------------
⚠️ *Ketentuan:* Keterlambatan dikenakan denda Rp 1.000/hari/buku.
Petugas: ${transaction.processedBy || school.librarianName}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const kop = school.kopSurat;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Tanda Terima Peminjaman</h3>
              <p className="text-[11px] text-slate-400 font-mono">{transaction.trxCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal/Slip Preview Canvas */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
          <div 
            id="receipt-print-area" 
            className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 font-sans text-xs space-y-3"
          >
            {/* Header Letterhead */}
            <div className="text-center pb-2 border-b border-slate-200 space-y-0.5">
              <div className="flex items-center justify-center gap-2 mb-1">
                {(kop?.logoLeftUrl || school.logoUrl) && (
                  <img 
                    src={kop?.logoLeftUrl || school.logoUrl} 
                    alt="Logo Instansi" 
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="text-center">
                  {kop?.governingBody && (
                    <p className="text-[9px] font-bold text-slate-700 uppercase leading-tight whitespace-pre-line">
                      {kop.governingBody}
                    </p>
                  )}
                  <h4 className="font-black text-xs uppercase text-slate-950 tracking-tight">
                    {kop?.institutionName || school.schoolName}
                  </h4>
                </div>
                {kop?.logoRightUrl && (
                  <img 
                    src={kop.logoRightUrl} 
                    alt="Logo Sekolah" 
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              <p className="text-[9px] font-semibold text-emerald-800">
                {kop?.unitName || 'UPT PERPUSTAKAAN DIGITAL LUMINA'}
              </p>
              <p className="text-[8.5px] text-slate-600">
                {kop?.addressLine || `${school.address}, ${school.city}`}
              </p>
              <p className="text-[8px] text-slate-500">
                Telp: {school.phone} | NPSN: {school.npsn}
              </p>

              {/* Decorative Border */}
              <div className="pt-1.5 space-y-0.5">
                <div className="h-[1.5px] bg-slate-900 w-full" />
                <div className="h-[0.5px] bg-slate-400 w-full" />
              </div>
            </div>

            {/* Slip Title & Code */}
            <div className="text-center py-1 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-[10px] tracking-wider uppercase text-slate-800 block">
                BUKTI RESMI PEMINJAMAN PUSTAKA
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700">
                {transaction.trxCode}
              </span>
            </div>

            {/* Member Details */}
            <div className="space-y-1 py-1 border-b border-dashed border-slate-300 text-[11px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                Identitas Pemustaka
              </span>
              <div className="flex justify-between">
                <span className="text-slate-600">Nama Peminjam:</span>
                <span className="font-bold text-slate-900">{transaction.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nomor Anggota:</span>
                <span className="font-mono text-slate-800">{transaction.memberCode}</span>
              </div>
              {transaction.memberPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-600">No. Handphone:</span>
                  <span className="font-mono text-slate-800">{transaction.memberPhone}</span>
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="space-y-1.5 py-1 border-b border-dashed border-slate-300 text-[11px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                Koleksi yang Dipinjam
              </span>
              <div>
                <span className="font-bold text-slate-950 text-xs block leading-tight">
                  {transaction.bookTitle}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  ISBN: {transaction.bookIsbn}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-600">Tanggal Pinjam:</span>
                <span className="font-medium text-slate-900">{transaction.borrowDate}</span>
              </div>
              <div className="flex justify-between p-1.5 rounded-lg bg-red-50 text-red-700 font-bold border border-red-200 text-xs">
                <span>Batas Jatuh Tempo:</span>
                <span>{transaction.dueDate}</span>
              </div>
            </div>

            {/* Fine Policy Box */}
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[9.5px] text-amber-900 space-y-0.5">
              <span className="font-bold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Ketentuan Perpustakaan:
              </span>
              <p className="leading-tight text-amber-800">
                • Denda keterlambatan Rp 1.000 / hari per eksemplar.
              </p>
              <p className="leading-tight text-amber-800">
                • Wajib menjaga buku dari kerusakan dan coretan.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-2 text-center text-[10px]">
              <div>
                <span className="text-slate-500 block">Pemustaka,</span>
                <div className="h-9" />
                <span className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 px-2 block truncate">
                  {transaction.memberName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Petugas Sirkulasi,</span>
                <div className="h-9" />
                <span className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 px-2 block truncate">
                  {transaction.processedBy || school.librarianName}
                </span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="pt-2 text-center text-[8px] text-slate-400 border-t border-slate-100 font-mono">
              Dicetak: {new Date().toLocaleString('id-ID')} • Lumina SIS Cloud
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak Slip</span>
            </button>
            <button
              type="button"
              id="btn-download-receipt-pdf"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
