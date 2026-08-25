import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Upload, 
  Check, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { SchoolProfile } from '../types';

interface SchoolProfileViewProps {
  school: SchoolProfile;
  onSaveSchoolProfile: (profile: SchoolProfile) => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({
  school,
  onSaveSchoolProfile,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>(school);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchoolProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div id="school-profile-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Profil Kelembagaan
            </span>
            <span className="text-xs text-slate-400 font-mono">NPSN: {formData.npsn}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Identitas Sekolah & Perpustakaan</h2>
          <p className="text-xs text-slate-400 mt-0.5">Informasi instansi ini otomatis disematkan pada kop surat laporan resmi dan kartu anggota</p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Perubahan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">
            Informasi Pokok Sekolah
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Sekolah / Instansi</label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nomor Pokok Sekolah Nasional (NPSN)</label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Kepala Perpustakaan</label>
              <input
                type="text"
                value={formData.librarianName}
                onChange={(e) => setFormData({ ...formData, librarianName: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Motto / Semboyan Perpustakaan</label>
              <input
                type="text"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Lengkap</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kota / Kabupaten</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Provinsi</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nomor Telepon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Resmi</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              id="btn-save-school-profile"
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>

        {/* Right 1 Col: Live Letterhead Preview */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                  Pratinjau Kop Surat Resmi
                </span>
                <p className="text-[10px] text-slate-500 font-mono">Kode: {formData.libraryCode}</p>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">
                {formData.schoolName}
              </h4>
              <p className="text-[11px] font-semibold text-emerald-800">
                PERPUSTAKAAN DIGITAL TERPADU
              </p>
              <p className="text-[10px] text-slate-600">
                NPSN: {formData.npsn} | Telp: {formData.phone}
              </p>
              <p className="text-[10px] text-slate-500">
                {formData.address}, {formData.city}, {formData.province}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <p className="text-[10px] italic text-slate-500">"{formData.motto}"</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Validasi Identitas Nasional</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Semua dokumen ekspor PDF (Kartu Anggota, Bukti Peminjaman, dan Laporan Rekapitulasi Tahunan) akan otomatis menggunakan format kop surat resmi di atas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
