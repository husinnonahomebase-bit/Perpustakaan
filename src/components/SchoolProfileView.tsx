import React, { useState, useRef } from 'react';
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
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Layers,
  FileCheck,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { SchoolProfile, KopSuratConfig } from '../types';
import { exportSampleLetterheadPDF } from '../utils/exportUtils';
import { LibraryStore } from '../utils/storage';

interface SchoolProfileViewProps {
  school: SchoolProfile;
  onSaveSchoolProfile: (profile: SchoolProfile) => void;
}

// Standard Indonesian Education & Regional Presets
const PRESET_LOGOS = [
  {
    name: 'Pemerintah Kabupaten / Daerah',
    category: 'Kabupaten/Kota',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Coat_of_arms_of_Indonesia_Garuda_Pancasila.svg',
    desc: 'Lambang Resmi Pemkab / Pemkot / Dinas Pendidikan'
  },
  {
    name: 'Tut Wuri Handayani (Kemendikbud)',
    category: 'Nasional',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg',
    desc: 'Standar Nasional Pendidikan SD/SMP/SMA/SMK'
  },
  {
    name: 'Kementerian Agama (Kemenag)',
    category: 'Kemenag',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Kementerian_Agama_Indonesia.svg',
    desc: 'Standar Madrasah MI/MTs/MA/Pesantren'
  },
  {
    name: 'Perpustakaan Nasional RI (Perpusnas)',
    category: 'Perpusnas',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Perpustakaan_Nasional_RI.png',
    desc: 'Logo Pembina Perpustakaan Nasional'
  }
];

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({
  school,
  onSaveSchoolProfile,
}) => {
  const defaultKopSurat: KopSuratConfig = school.kopSurat || {
    enabled: true,
    governingBody: 'PEMERINTAH KABUPATEN / PROVINSI\nDINAS PENDIDIKAN DAN KEBUDAYAAN',
    institutionName: school.schoolName || 'SMA NEGERI LUMINA BANGSA',
    unitName: 'UNIT PELAKSANA TEKNIS (UPT) PERPUSTAKAAN DIGITAL LUMINA',
    addressLine: school.address || 'Jl. Merdeka Cendekia No. 45, Kebayoran Baru, Jakarta Selatan',
    contactLine: `Telp: ${school.phone || '(021) 7890-1234'} | Email: ${school.email || 'perpustakaan@sekolah.sch.id'} | Website: ${school.website || 'www.perpustakaan-sekolah.sch.id'}`,
    postalCode: '12160',
    letterCodePrefix: '421.3/PERPUS-LMN/2026',
    borderStyle: 'double',
    logoLeftUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Coat_of_arms_of_Indonesia_Garuda_Pancasila.svg',
    logoRightUrl: school.logoUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=200&q=80'
  };

  const [formData, setFormData] = useState<SchoolProfile>({
    ...school,
    kopSurat: defaultKopSurat
  });

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'kop-surat'>('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const mainLogoInputRef = useRef<HTMLInputElement>(null);
  const leftLogoInputRef = useRef<HTMLInputElement>(null);
  const rightLogoInputRef = useRef<HTMLInputElement>(null);

  const currentKop = formData.kopSurat || defaultKopSurat;

  const handleKopChange = <K extends keyof KopSuratConfig>(field: K, value: KopSuratConfig[K]) => {
    setFormData(prev => {
      const updated: SchoolProfile = {
        ...prev,
        kopSurat: {
          ...currentKop,
          [field]: value
        }
      };
      LibraryStore.saveSchoolProfile(updated);
      return updated;
    });
  };

  /**
   * Helper to validate image format (PNG/JPG only), file size,
   * and perform client-side canvas resizing to optimize storage in LibraryStore.
   */
  const processAndResizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 1. Basic Format Validation (PNG, JPG, JPEG)
      const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isValidExt = fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg';

      if (!validMimeTypes.includes(file.type) && !isValidExt) {
        reject(new Error('Format file tidak didukung! Harap unggah berkas gambar berformat PNG (.png) atau JPG/JPEG (.jpg/.jpeg).'));
        return;
      }

      // 2. File Size Validation (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Ukuran file terlalu besar! Maksimum ukuran gambar adalah 5 MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Client-side resizing: max dimension 300px while maintaining aspect ratio
          const maxDim = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Enable high-quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Use PNG if original is PNG (supports transparency), otherwise JPEG
          const isPng = file.type === 'image/png' || fileExt === 'png';
          const outputMime = isPng ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputMime, 0.90);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Gagal memproses berkas gambar. Pastikan file tidak rusak.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    target: 'schoolLogo' | 'logoLeft' | 'logoRight'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setUploadSuccessMessage(null);

    try {
      setIsUploading(target);
      const dataUrl = await processAndResizeImage(file);

      let targetLabel = '';
      if (target === 'schoolLogo') {
        targetLabel = 'Logo Sekolah Utama';
        setFormData(prev => {
          const updated: SchoolProfile = {
            ...prev,
            logoUrl: dataUrl,
            kopSurat: prev.kopSurat ? {
              ...prev.kopSurat,
              logoRightUrl: dataUrl
            } : prev.kopSurat
          };
          LibraryStore.saveSchoolProfile(updated);
          return updated;
        });
      } else if (target === 'logoLeft') {
        targetLabel = 'Logo Kabupaten / Pemda (Kiri Kop Surat)';
        handleKopChange('logoLeftUrl', dataUrl);
      } else if (target === 'logoRight') {
        targetLabel = 'Logo Sekolah (Kanan Kop Surat)';
        handleKopChange('logoRightUrl', dataUrl);
      }

      setUploadSuccessMessage(`${targetLabel} berhasil divalidasi, dioptimasi (resizing kanvas), dan disimpan.`);
      setTimeout(() => setUploadSuccessMessage(null), 4000);
    } catch (err: any) {
      setValidationError(err.message || 'Gagal memproses file logo.');
    } finally {
      setIsUploading(null);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchoolProfile(formData);
    LibraryStore.saveSchoolProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestPdfExport = () => {
    exportSampleLetterheadPDF(formData);
  };

  return (
    <div id="school-profile-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Profil Kelembagaan & Dokumen Resmi
            </span>
            <span className="text-xs text-slate-400 font-mono">NPSN: {formData.npsn}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Identitas Sekolah & Pengaturan Kop Surat</h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola identitas instansi, validasi logo kabupaten & sekolah, dan format kop surat dinas untuk seluruh berkas PDF & slip</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-test-pdf-header"
            onClick={handleTestPdfExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-[0.98]"
            title="Download Contoh Surat dengan Kop Surat & Logo Terbaru"
          >
            <Download className="w-4 h-4" />
            <span>Uji Ekspor PDF Kop Surat</span>
          </button>

          {isSaved && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Tersimpan!</span>
            </div>
          )}
        </div>
      </div>

      {/* Validation Feedback Banners */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
          <button 
            type="button"
            onClick={() => setValidationError(null)}
            className="text-xs text-rose-400 hover:text-rose-200 font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {uploadSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{uploadSuccessMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setUploadSuccessMessage(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200 font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl w-fit">
        <button
          type="button"
          id="tab-school-profile"
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'profile'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Informasi Pokok & Logo Sekolah</span>
        </button>
        <button
          type="button"
          id="tab-kop-surat"
          onClick={() => setActiveSubTab('kop-surat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'kop-surat'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pengaturan Kop Surat & Logo Naskah</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          {activeSubTab === 'profile' ? (
            <>
              {/* Visual Preview Area: Logo Sekolah & Logo Kabupaten */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">Visual Preview & Unggahan Logo Resmi (PNG/JPG)</h4>
                      <p className="text-[10px] text-slate-400">Validasi format otomatis & kompresi kanvas sebelum disimpan ke sistem</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Logo Kabupaten (Kiri Kop Surat) Visual Preview & Upload */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                        <h5 className="font-bold text-xs text-white">Logo Kabupaten / Pemda</h5>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Sisi Kiri Kop Surat
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Lambang resmi Pemerintah Kabupaten/Kota atau Dinas Pendidikan pembina.
                    </p>

                    <div className="flex items-center gap-3">
                      {/* Visual Preview Box */}
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-inner relative group">
                        {currentKop.logoLeftUrl ? (
                          <img 
                            src={currentKop.logoLeftUrl} 
                            alt="Visual Preview Logo Kabupaten (Kiri)" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/8/87/Coat_of_arms_of_Indonesia_Garuda_Pancasila.svg';
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-slate-500 text-center font-mono">Belum Diunggah</span>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <input
                          ref={leftLogoInputRef}
                          type="file"
                          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'logoLeft')}
                        />
                        <button
                          type="button"
                          id="btn-upload-kabupaten-logo"
                          onClick={() => leftLogoInputRef.current?.click()}
                          disabled={isUploading === 'logoLeft'}
                          className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading === 'logoLeft' ? 'Memvalidasi & Kompresi...' : 'Unggah Logo Kabupaten (PNG/JPG)'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={currentKop.logoLeftUrl || ''}
                            onChange={(e) => handleKopChange('logoLeftUrl', e.target.value)}
                            placeholder="Atau tautan URL lambang..."
                            className="w-full px-2 py-1 text-[10px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                          />
                          {currentKop.logoLeftUrl && (
                            <button
                              type="button"
                              onClick={() => handleKopChange('logoLeftUrl', '')}
                              className="px-1.5 py-1 text-[10px] text-rose-400 hover:text-rose-300 font-semibold shrink-0"
                              title="Hapus Logo Kabupaten"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                      <span>Format: PNG/JPG (Maks. 5MB)</span>
                      <span className="text-cyan-400 font-mono font-medium">Auto-Resize (300px)</span>
                    </div>
                  </div>

                  {/* 2. Logo Sekolah (Kanan Kop Surat & Kartu) Visual Preview & Upload */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <h5 className="font-bold text-xs text-white">Logo Resmi Sekolah</h5>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Sisi Kanan Kop Surat
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Lambang unit sekolah untuk kop surat, kartu pemustaka, dan identitas sistem.
                    </p>

                    <div className="flex items-center gap-3">
                      {/* Visual Preview Box */}
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-inner relative group">
                        {formData.logoUrl ? (
                          <img 
                            src={formData.logoUrl} 
                            alt="Visual Preview Logo Sekolah (Kanan)" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-slate-500 text-center font-mono">Belum Diunggah</span>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <input
                          ref={mainLogoInputRef}
                          type="file"
                          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'schoolLogo')}
                        />
                        <button
                          type="button"
                          id="btn-upload-school-logo"
                          onClick={() => mainLogoInputRef.current?.click()}
                          disabled={isUploading === 'schoolLogo'}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading === 'schoolLogo' ? 'Memvalidasi & Kompresi...' : 'Unggah Logo Sekolah (PNG/JPG)'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={formData.logoUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const updated: SchoolProfile = {
                                  ...prev,
                                  logoUrl: val,
                                  kopSurat: prev.kopSurat ? { ...prev.kopSurat, logoRightUrl: val } : prev.kopSurat
                                };
                                LibraryStore.saveSchoolProfile(updated);
                                return updated;
                              });
                            }}
                            placeholder="Atau tautan URL gambar..."
                            className="w-full px-2 py-1 text-[10px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                          {formData.logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, logoUrl: '' }));
                                handleKopChange('logoRightUrl', '');
                              }}
                              className="px-1.5 py-1 text-[10px] text-rose-400 hover:text-rose-300 font-semibold shrink-0"
                              title="Hapus Logo Sekolah"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                      <span>Format: PNG/JPG (Maks. 5MB)</span>
                      <span className="text-emerald-400 font-mono font-medium">Auto-Resize (300px)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input Identitas Pokok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Resmi Sekolah / Lembaga Pendidikan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: SMA NEGERI 1 JAKARTA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nomor Pokok Sekolah Nasional (NPSN)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.npsn}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    placeholder="8 Digit NPSN Resmi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kode Registrasi Perpustakaan (NPP)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.libraryCode}
                    onChange={(e) => setFormData({ ...formData, libraryCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: 3174.11B.2024.001"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alamat Lengkap Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Nama jalan, nomor, kelurahan, kecamatan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nomor Telepon / Kontak
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alamat Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Kepala Perpustakaan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.librarianName}
                    onChange={(e) => setFormData({ ...formData, librarianName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.principalName}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* SubTab 2: Pengaturan Kop Surat Resmi & Tata Naskah */}
              <div className="space-y-6">
                {/* Switch Enable Kop */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-white">Aktifkan Kop Surat Resmi (Standar Dokumen Dinas)</h4>
                    <p className="text-[10px] text-slate-400">
                      Gunakan format naskah dinas resmi dengan logo daerah & lambang sekolah untuk ekspor PDF
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentKop.enabled}
                      onChange={(e) => handleKopChange('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Preset Lambang Resmi */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Pilihan Lambang Resmi Pendidikan & Pemerintahan
                    </span>
                    <span className="text-[10px] text-slate-500">Klik untuk menerapkan ke Kop Surat Kiri</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleKopChange('logoLeftUrl', preset.url);
                          setUploadSuccessMessage(`Lambang ${preset.name} berhasil diterapkan ke Kop Surat Sisi Kiri!`);
                          setTimeout(() => setUploadSuccessMessage(null), 3000);
                        }}
                        className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 flex items-center gap-2.5 text-left transition group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center shrink-0">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                            {preset.name}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            {preset.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dual Logo Configuration Area */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Konfigurasi Logo Kop Surat (Kiri & Kanan)
                    </span>
                    <span className="text-[10px] text-slate-400">Validasi otomatis PNG/JPG</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logo Kiri (Kabupaten / Daerah / Pembina) */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          Logo Kabupaten / Daerah (Kiri)
                        </span>
                        {currentKop.logoLeftUrl && (
                          <button
                            type="button"
                            onClick={() => handleKopChange('logoLeftUrl', '')}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {currentKop.logoLeftUrl ? (
                            <img 
                              src={currentKop.logoLeftUrl} 
                              alt="Logo Kabupaten Kiri" 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/8/87/Coat_of_arms_of_Indonesia_Garuda_Pancasila.svg';
                              }}
                            />
                          ) : (
                            <span className="text-[8px] text-slate-500 font-mono text-center">Kosong</span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <input
                            ref={leftLogoInputRef}
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'logoLeft')}
                          />
                          <button
                            type="button"
                            id="btn-upload-logo-left-tab2"
                            onClick={() => leftLogoInputRef.current?.click()}
                            disabled={isUploading === 'logoLeft'}
                            className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm"
                          >
                            <Upload className="w-3 h-3" />
                            <span>{isUploading === 'logoLeft' ? 'Memvalidasi...' : 'Unggah Logo Kabupaten (PNG/JPG)'}</span>
                          </button>

                          <input
                            type="text"
                            value={currentKop.logoLeftUrl || ''}
                            onChange={(e) => handleKopChange('logoLeftUrl', e.target.value)}
                            placeholder="Atau tautan URL lambang..."
                            className="w-full px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Kanan (Sekolah / Lembaga) */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          Logo Sekolah / Unit (Kanan)
                        </span>
                        {currentKop.logoRightUrl && (
                          <button
                            type="button"
                            onClick={() => handleKopChange('logoRightUrl', '')}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {currentKop.logoRightUrl ? (
                            <img 
                              src={currentKop.logoRightUrl} 
                              alt="Logo Kanan" 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=200&q=80';
                              }}
                            />
                          ) : (
                            <span className="text-[8px] text-slate-500 font-mono text-center">Kosong</span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <input
                            ref={rightLogoInputRef}
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'logoRight')}
                          />
                          <button
                            type="button"
                            id="btn-upload-logo-right"
                            onClick={() => rightLogoInputRef.current?.click()}
                            disabled={isUploading === 'logoRight'}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm"
                          >
                            <Upload className="w-3 h-3" />
                            <span>{isUploading === 'logoRight' ? 'Memvalidasi...' : 'Unggah Logo Sekolah (PNG/JPG)'}</span>
                          </button>

                          <input
                            type="text"
                            value={currentKop.logoRightUrl || ''}
                            onChange={(e) => handleKopChange('logoRightUrl', e.target.value)}
                            placeholder="Atau tautan URL logo..."
                            className="w-full px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Isian Teks Kop Surat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Instansi Pembina / Pemerintahan (Baris Atas)
                    </label>
                    <textarea
                      rows={2}
                      value={currentKop.governingBody}
                      onChange={(e) => handleKopChange('governingBody', e.target.value)}
                      placeholder="Contoh: PEMERINTAH KABUPATEN BOGOR&#10;DINAS PENDIDIKAN"
                      className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nama Sekolah / Lembaga Pendidikan (Baris Utama)
                    </label>
                    <input
                      type="text"
                      value={currentKop.institutionName}
                      onChange={(e) => handleKopChange('institutionName', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nama Unit / UPT Perpustakaan (Baris Ketiga)
                    </label>
                    <input
                      type="text"
                      value={currentKop.unitName}
                      onChange={(e) => handleKopChange('unitName', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Alamat Lengkap Instansi (Baris Keempat)
                    </label>
                    <input
                      type="text"
                      value={currentKop.addressLine}
                      onChange={(e) => handleKopChange('addressLine', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Baris Kontak (Telepon, Email, Website)
                    </label>
                    <input
                      type="text"
                      value={currentKop.contactLine}
                      onChange={(e) => handleKopChange('contactLine', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kode Pos Wilayah
                    </label>
                    <input
                      type="text"
                      value={currentKop.postalCode}
                      onChange={(e) => handleKopChange('postalCode', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Prefix Kode Penomoran Surat Resmi
                    </label>
                    <input
                      type="text"
                      value={currentKop.letterCodePrefix}
                      onChange={(e) => handleKopChange('letterCodePrefix', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Gaya Garis Pembatas Kop Surat
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleKopChange('borderStyle', 'double')}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          currentKop.borderStyle === 'double'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        Garis Ganda (Standar Dinas)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKopChange('borderStyle', 'solid')}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          currentKop.borderStyle === 'solid'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        Garis Tunggal Tebal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKopChange('borderStyle', 'emerald')}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          currentKop.borderStyle === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        Aksen Warna Emerald Modern
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              id="btn-save-school-profile"
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas & Kop Surat</span>
            </button>
          </div>
        </form>

        {/* Right 1 Col: Live Letterhead Preview */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pratinjau Kop Surat Resmi</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {currentKop.postalCode ? `Kode Pos: ${currentKop.postalCode}` : ''}
              </span>
            </div>

            {/* Official Indonesian Kop Surat Layout */}
            <div className="flex items-center gap-3 relative">
              {/* Left Logo (Kabupaten / Daerah) */}
              <div className="flex flex-col items-center shrink-0">
                {currentKop.logoLeftUrl ? (
                  <img
                    src={currentKop.logoLeftUrl}
                    alt="Logo Kabupaten (Kiri)"
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <span className="text-[7.5px] font-bold text-cyan-800 tracking-tight uppercase mt-0.5">
                  Logo Pemda (Kiri)
                </span>
              </div>

              <div className="flex-1 text-center min-w-0">
                {currentKop.governingBody && (
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-tight whitespace-pre-line tracking-wide">
                    {currentKop.governingBody}
                  </p>
                )}
                <h4 className="font-extrabold text-xs uppercase text-slate-950 tracking-tight mt-0.5">
                  {currentKop.institutionName || formData.schoolName}
                </h4>
                <p className="text-[9.5px] font-bold text-emerald-800 tracking-tight">
                  {currentKop.unitName}
                </p>
                <p className="text-[8.5px] text-slate-600 leading-tight mt-0.5">
                  {currentKop.addressLine}
                </p>
                <p className="text-[8px] text-slate-500 leading-tight">
                  {currentKop.contactLine}
                </p>
              </div>

              {/* Right Logo (Sekolah / Unit) */}
              <div className="flex flex-col items-center shrink-0">
                {currentKop.logoRightUrl ? (
                  <img
                    src={currentKop.logoRightUrl}
                    alt="Logo Sekolah (Kanan)"
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <span className="text-[7.5px] font-bold text-emerald-800 tracking-tight uppercase mt-0.5">
                  Logo Sekolah (Kanan)
                </span>
              </div>
            </div>

            {/* Boundary line */}
            <div className="mt-3">
              {currentKop.borderStyle === 'double' && (
                <div className="space-y-0.5">
                  <div className="h-[2px] bg-slate-900 w-full" />
                  <div className="h-[0.8px] bg-slate-700 w-full" />
                </div>
              )}
              {currentKop.borderStyle === 'solid' && (
                <div className="h-[2.5px] bg-slate-950 w-full" />
              )}
              {currentKop.borderStyle === 'emerald' && (
                <div className="space-y-0.5">
                  <div className="h-[2px] bg-emerald-600 w-full" />
                  <div className="h-[1px] bg-slate-300 w-full" />
                </div>
              )}
            </div>

            {/* Sample Document Body Placeholder with Direct PDF Test Button */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-700 block">
                Nomor: {currentKop.letterCodePrefix || '421.3/PERPUS/2026'}
              </span>
              <p className="text-[9px] text-slate-500 italic">
                Format kop surat dan logo di atas otomatis diterapkan pada Surat Bebas Pustaka, Bukti Peminjaman, Kartu Anggota, dan Laporan Rekapitulasi Tahunan.
              </p>
              <button
                type="button"
                onClick={handleTestPdfExport}
                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Contoh Hasil Cetak PDF</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Standar Tata Naskah Dinas Perpustakaan</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Format kop surat resmi mematuhi regulasi tata naskah dinas kearsipan dan perpustakaan sekolah nasional dengan dukungan logo daerah & lambang sekolah beresolusi tinggi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
