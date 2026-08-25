import React from 'react';
import { 
  X, 
  CreditCard, 
  Printer, 
  Building2, 
  QrCode, 
  Barcode, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { Member, SchoolProfile } from '../types';

interface DigitalCardModalProps {
  member: Member | null;
  school: SchoolProfile;
  onClose: () => void;
}

export const DigitalCardModal: React.FC<DigitalCardModalProps> = ({
  member,
  school,
  onClose,
}) => {
  if (!member) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Kartu Anggota Perpustakaan Digital</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Physical Card Simulation (CR80 Standard Ratio) */}
        <div className="p-6 flex flex-col items-center">
          <div 
            id="printable-library-card"
            className="w-full h-56 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900 to-emerald-950 p-5 border border-emerald-500/40 shadow-2xl relative flex flex-col justify-between overflow-hidden"
          >
            {/* Background watermark */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Card Top: School Info */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-tight leading-none">
                    {school.schoolName}
                  </h4>
                  <p className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
                    KARTU PEMUSTAKA DIGITAL
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400">{school.npsn}</span>
            </div>

            {/* Card Body: Member Info */}
            <div className="flex items-center gap-3.5 my-auto">
              <img 
                src={member.avatar} 
                alt={member.name} 
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-500/50 shadow-md flex-shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white truncate">{member.name}</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {member.role} {member.classOrDept ? `(${member.classOrDept})` : ''}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.email}</p>
              </div>
            </div>

            {/* Card Bottom: Barcode Simulation & ID */}
            <div className="flex items-end justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Nomor Anggota</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{member.memberCode}</span>
              </div>

              {/* Barcode Visual Bars */}
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
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            Gunakan kartu ini untuk meminjam buku dan melakukan pemindaian otomatis di meja sirkulasi.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
