import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  User, 
  Sparkles,
  ShieldCheck,
  Building2,
  Share2
} from 'lucide-react';
import QRCode from 'qrcode';
import { Member, SchoolProfile } from '../types';

interface MemberQRCodeModalProps {
  isOpen: boolean;
  member: Member | null;
  school: SchoolProfile;
  onClose: () => void;
}

export const MemberQRCodeModal: React.FC<MemberQRCodeModalProps> = ({
  isOpen,
  member,
  school,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !member) return;

    // Generate QR Code data
    // Format payload with member code for circulation desk barcode/QR scanners
    const qrPayload = member.memberCode;

    QRCode.toDataURL(
      qrPayload,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#020617', // Slate 950
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );

    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrPayload,
        {
          width: 240,
          margin: 1,
          color: {
            dark: '#020617',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('QR code canvas error:', error);
        }
      );
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(member.memberCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Anggota_${member.memberCode}_${member.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Pemustaka - ${member.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #fff;
              color: #0f172a;
            }
            .ticket {
              width: 300px;
              padding: 24px;
              border: 2px dashed #94a3b8;
              border-radius: 16px;
              text-align: center;
            }
            .school-name {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .sub-title {
              font-size: 10px;
              color: #059669;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 16px;
            }
            .qr-image {
              width: 180px;
              height: 180px;
              margin: 0 auto 12px;
              display: block;
            }
            .member-name {
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 2px;
            }
            .member-meta {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .code-badge {
              display: inline-block;
              font-family: monospace;
              font-size: 13px;
              font-weight: 700;
              background: #f1f5f9;
              padding: 4px 12px;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="school-name">${school.schoolName}</div>
            <div class="sub-title">KARTU AKSES SCANNER SIRKULASI</div>
            <img class="qr-image" src="${qrDataUrl}" alt="QR Code" />
            <div class="member-name">${member.name}</div>
            <div class="member-meta">${member.role} ${member.classOrDept ? '• ' + member.classOrDept : ''}</div>
            <div class="code-badge">${member.memberCode}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      id="member-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="member-qr-modal-dialog"
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">QR Code ID Pemustaka</h3>
              <p className="text-[10px] text-slate-400">Verifikasi instan di meja sirkulasi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4 text-xs">
          {/* Member mini card banner */}
          <div className="w-full p-3 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center gap-3 text-left">
            <img 
              src={member.avatar} 
              alt={member.name}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/40 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white truncate">{member.name}</h4>
              <p className="text-[11px] text-slate-400 truncate">
                {member.role} {member.classOrDept ? `• ${member.classOrDept}` : ''}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {member.memberCode}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  member.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {member.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl shadow-xl shadow-emerald-500/5 border border-slate-200 flex flex-col items-center">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt={`QR Code ${member.memberCode}`}
                className="w-48 h-48 object-contain"
              />
            ) : (
              <canvas ref={canvasRef} className="w-48 h-48" />
            )}
            <div className="mt-2 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">
                {member.memberCode}
              </span>
            </div>
          </div>

          {/* Copyable Member Code Pill */}
          <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700/80">
            <span className="text-slate-400 text-[11px]">Payload Scanner:</span>
            <div className="flex items-center gap-1.5">
              <code className="font-mono font-bold text-emerald-400 text-xs">{member.memberCode}</code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
                title="Salin Kode"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Arahkan QR Code ini ke kamera pemindai barcode di meja sirkulasi untuk mempercepat peminjaman atau pengembalian buku.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintQR}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh QR (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
