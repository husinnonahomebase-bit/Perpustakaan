import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Barcode, 
  Camera, 
  CheckCircle2, 
  BookOpen, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Book, Member, Transaction } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  onProcessReturn: (trxId: string) => void;
  onSelectBookForLoan: (book: Book) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  books,
  members,
  transactions,
  onProcessReturn,
  onSelectBookForLoan,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    type: 'book' | 'member' | 'transaction' | 'none';
    data?: any;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleScanCode = (codeToScan: string) => {
    const code = codeToScan.trim().toUpperCase();
    if (!code) return;

    // Check if code matches an active transaction or book ISBN or Member Code
    const foundTrx = transactions.find(
      t => t.trxCode.toUpperCase() === code || t.bookIsbn.toUpperCase() === code
    );
    const foundBook = books.find(
      b => b.isbn.toUpperCase() === code || b.id.toUpperCase() === code
    );
    const foundMember = members.find(
      m => m.memberCode.toUpperCase() === code || m.id.toUpperCase() === code
    );

    if (foundTrx && foundTrx.status !== 'returned') {
      setScannedResult({
        type: 'transaction',
        data: foundTrx,
        message: `Transaksi Peminjaman Ditemukan: ${foundTrx.bookTitle} oleh ${foundTrx.memberName}`,
      });
    } else if (foundBook) {
      setScannedResult({
        type: 'book',
        data: foundBook,
        message: `Koleksi Buku Ditemukan: ${foundBook.title} (${foundBook.copiesAvailable} Eks. Tersedia)`,
      });
    } else if (foundMember) {
      setScannedResult({
        type: 'member',
        data: foundMember,
        message: `Anggota Ditemukan: ${foundMember.name} (${foundMember.role})`,
      });
    } else {
      setScannedResult({
        type: 'none',
        message: `Kode "${code}" tidak terdaftar di sistem.`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Pemindai Barcode & QR Optik</h3>
              <p className="text-[11px] text-slate-400">Pindai kode buku (ISBN) atau kartu pemustaka</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner Viewport Simulation */}
        <div className="p-6 space-y-5">
          <div className="relative h-48 bg-slate-950 rounded-2xl border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center overflow-hidden">
            {/* Animated Laser Scan Line */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-pulse"></div>
            
            <Camera className="w-10 h-10 text-emerald-400/60 mb-2 animate-bounce" />
            <p className="text-xs text-slate-300 font-medium">Arahkan Kamera ke Barcode atau QR Code</p>
            <p className="text-[10px] text-slate-500">Mendukung ISBN-10, ISBN-13, EAN-13, dan Code-128</p>
          </div>

          {/* Quick Simulation Presets (for instant 1-click test scan) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Simulasi Uji Cepat Barcode:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setManualCode('TRX-2024-0089');
                  handleScanCode('TRX-2024-0089');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 border border-slate-700 text-[11px] font-mono transition"
              >
                Scan TRX-2024-0089
              </button>
              <button
                onClick={() => {
                  setManualCode('978-0-441-56959-5');
                  handleScanCode('978-0-441-56959-5');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-500/20 text-teal-400 border border-slate-700 text-[11px] font-mono transition"
              >
                Scan ISBN Neuromancer
              </button>
              <button
                onClick={() => {
                  setManualCode('LMN-2024-0101');
                  handleScanCode('LMN-2024-0101');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 border border-slate-700 text-[11px] font-mono transition"
              >
                Scan Kartu Eleanor
              </button>
            </div>
          </div>

          {/* Manual Input Field */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Masukkan kode ISBN / No TRX / ID Anggota..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={() => handleScanCode(manualCode)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              Proses
            </button>
          </div>

          {/* Scan Result Card */}
          {scannedResult && (
            <div className={`p-4 rounded-2xl border text-xs space-y-3 animate-in fade-in ${
              scannedResult.type !== 'none' 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/30 border-red-500/40 text-red-300'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{scannedResult.message}</span>
              </div>

              {scannedResult.type === 'transaction' && (
                <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="text-[11px]">Jatuh Tempo: {scannedResult.data.dueDate}</span>
                  <button
                    onClick={() => {
                      onProcessReturn(scannedResult.data.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
                  >
                    Konfirmasi Pengembalian
                  </button>
                </div>
              )}

              {scannedResult.type === 'book' && (
                <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="text-[11px]">Stok: {scannedResult.data.copiesAvailable} Eks.</span>
                  <button
                    onClick={() => {
                      onSelectBookForLoan(scannedResult.data);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
                  >
                    Lanjutkan Peminjaman
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
