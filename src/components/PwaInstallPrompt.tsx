import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  WifiOff, 
  Layers,
  ArrowRight,
  Info,
  HelpCircle,
  Laptop
} from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface PwaInstallPromptProps {
  appName?: string;
  showModalInitially?: boolean;
  onModalClose?: () => void;
  // External control for opening modal directly from header/sidebar
  isModalOpenExternal?: boolean;
  setIsModalOpenExternal?: (isOpen: boolean) => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  appName = 'Lumina Library PRO',
  isModalOpenExternal,
  setIsModalOpenExternal,
}) => {
  const {
    canInstallNative,
    isInstalled,
    isStandalone,
    isIOS,
    isIframe,
    isDismissed,
    triggerInstall,
    dismissPrompt,
    resetDismiss,
  } = usePwaInstall();

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'auto' | 'chrome' | 'ios' | 'android'>(
    isIOS ? 'ios' : canInstallNative ? 'auto' : 'chrome'
  );
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isModalOpen = isModalOpenExternal !== undefined ? isModalOpenExternal : internalModalOpen;
  const setModalOpen = (open: boolean) => {
    if (setIsModalOpenExternal) {
      setIsModalOpenExternal(open);
    } else {
      setInternalModalOpen(open);
    }
  };

  const handleNativeInstall = async () => {
    setIsInstalling(true);
    const outcome = await triggerInstall();
    setIsInstalling(false);
    if (outcome === 'accepted') {
      setShowSuccessToast(true);
      setModalOpen(false);
      setTimeout(() => setShowSuccessToast(false), 5000);
    }
  };

  const handleOpenInNewTab = () => {
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  // If already running standalone and installed, do not show floating banner
  const shouldShowFloatingBanner = !isStandalone && !isInstalled && !isDismissed && !isModalOpen;

  return (
    <>
      {/* 1. Success Toast after successful installation */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950 border border-emerald-500/50 shadow-2xl text-white max-w-sm flex items-start gap-3.5 backdrop-blur-xl"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-emerald-200">Aplikasi Berhasil Terpasang!</h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {appName} sekarang dapat diakses langsung dari desktop/layar utama perangkat Anda.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Non-Intrusive Floating Banner (Bottom-Right / Bottom-Center) */}
      <AnimatePresence>
        {shouldShowFloatingBanner && (
          <motion.div
            id="pwa-install-banner"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-5 right-4 sm:right-6 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-auto p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/40 text-slate-100"
          >
            <div className="flex items-start gap-3.5">
              {/* App Icon */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 text-slate-950">
                <Download className="w-6 h-6 stroke-[2.5]" />
              </div>

              {/* Text & Actions */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">Pasang {appName}</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    PWA App
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  Pasang sebagai aplikasi mandiri untuk akses instan dari desktop/HP dan dukungan offline.
                </p>

                <div className="flex items-center gap-2 mt-3">
                  {canInstallNative ? (
                    <button
                      id="btn-pwa-install-native-banner"
                      onClick={handleNativeInstall}
                      disabled={isInstalling}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isInstalling ? 'Memasang...' : 'Pasang Sekarang'}</span>
                    </button>
                  ) : (
                    <button
                      id="btn-pwa-open-guide-banner"
                      onClick={() => setModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Pasang ke Layar Utama</span>
                    </button>
                  )}

                  <button
                    id="btn-pwa-details-banner"
                    onClick={() => setModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
                  >
                    Petunjuk
                  </button>
                </div>
              </div>

              {/* Close / Dismiss Button */}
              <button
                id="btn-pwa-dismiss-banner"
                onClick={() => dismissPrompt(3)}
                title="Tutup pemberitahuan (ingatkan 3 hari lagi)"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Comprehensive Installation Modal & Step-by-Step Guide */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            id="pwa-install-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <motion.div
              id="pwa-install-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-2.5 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                    <Download className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">Pasang Aplikasi {appName}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Desktop & Mobile PWA
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gunakan aplikasi tanpa bilah browser dengan kecepatan maksimal dan dukungan offline
                    </p>
                  </div>
                </div>

                <button
                  id="btn-close-pwa-modal"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body with Benefits & Instructions */}
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                {/* 3 Core Value Props */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white">Performa Instan</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Membuka aplikasi secepat kilat langsung dari desktop atau beranda HP tanpa membuka browser.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                      <WifiOff className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white">Dukungan Offline</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Katalog, sirkulasi peminjaman, dan data buku tetap dapat diakses saat jaringan terputus.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white">Tampilan Standalone</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Bebas dari tab browser, menu navigasi browser, dan memberikan pengalaman aplikasi asli.
                    </p>
                  </div>
                </div>

                {/* If Running in Iframe Notice */}
                {isIframe && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="font-bold">Mode Pratinjau Terdeteksi (Embedded iFrame)</p>
                      <p className="text-[11px] text-amber-300/90 leading-relaxed">
                        Browser melarang dialog instalasi PWA di dalam frame pratinjau. Untuk memasang aplikasi ke desktop/HP Anda dalam 1-klik, buka aplikasi di Tab Baru.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenInNewTab}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka di Tab Baru untuk Memasang</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Direct Native Install Action if ready */}
                {canInstallNative && !isIframe && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-sm text-white">Browser Siap Memasang Aplikasi</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Browser Anda mendukung pemasangan langsung 1-klik tanpa konfigurasi tambahan.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-modal-install-native"
                      onClick={handleNativeInstall}
                      disabled={isInstalling}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] shrink-0 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isInstalling ? 'Memproses Pemasangan...' : 'Pasang Aplikasi Sekarang'}</span>
                    </button>
                  </div>
                )}

                {/* Tabbed Installation Guides per Platform */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Petunjuk Pemasangan Manual Berdasarkan Perangkat:
                    </span>
                  </div>

                  {/* Tabs Header */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActivePlatformTab('chrome')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        activePlatformTab === 'chrome'
                          ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Desktop (Chrome / Edge / Mac)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePlatformTab('android')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        activePlatformTab === 'android'
                          ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Android (Chrome)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePlatformTab('ios')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        activePlatformTab === 'ios'
                          ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>iPhone & iPad (Safari)</span>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
                    {activePlatformTab === 'chrome' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold">
                          <Laptop className="w-4 h-4 text-emerald-400" />
                          <span>Pemasangan di Laptop / Komputer (Windows, Mac, Linux):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-2 text-slate-300">
                          <li>
                            Buka aplikasi di browser <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, atau <strong>Brave</strong>.
                          </li>
                          <li>
                            Lihat di <strong>bilah alamat (address bar)</strong> di pojok kanan atas, klik ikon <strong>Install / Pasang Aplikasi</strong> <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-emerald-400 border border-slate-700">⊕</span> atau klik menu titik tiga <span className="font-mono text-slate-400">⋮</span>.
                          </li>
                          <li>
                            Pilih menu <strong>"Pasang Lumina Library..." (Install Lumina Library)</strong>.
                          </li>
                          <li>
                            Aplikasi akan muncul sebagai jendela aplikasi desktop mandiri dan ikon akan ditambahkan ke Desktop & Menu Start.
                          </li>
                        </ol>
                      </div>
                    )}

                    {activePlatformTab === 'android' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold">
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                          <span>Pemasangan di HP Android (Google Chrome):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-2 text-slate-300">
                          <li>
                            Buka tautan perpustakaan melalui aplikasi <strong>Chrome</strong> di ponsel Anda.
                          </li>
                          <li>
                            Ketuk ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas browser.
                          </li>
                          <li>
                            Pilih opsi <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Application"</strong>.
                          </li>
                          <li>
                            Konfirmasi dengan menekan <strong>"Pasang" (Install)</strong>. Ikon Lumina Library akan langsung muncul di beranda aplikasi Android Anda.
                          </li>
                        </ol>
                      </div>
                    )}

                    {activePlatformTab === 'ios' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold">
                          <Share2 className="w-4 h-4 text-emerald-400" />
                          <span>Pemasangan di Apple iPhone & iPad (Safari):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-2.5 text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-emerald-400">1.</span>
                            <span>Buka tautan ini di peramban <strong>Safari</strong> (iOS mengharuskan Safari untuk pemasangan ke beranda).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-emerald-400">2.</span>
                            <span className="flex-1">
                              Ketuk tombol <strong>Bagikan (Share)</strong> <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[10px] border border-slate-700">⎋ atau [↑]</span> di bilah bawah peramban.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-emerald-400">3.</span>
                            <span className="flex-1">
                              Gulir ke bawah dan ketuk opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] border border-slate-700">[+]</span>.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-emerald-400">4.</span>
                            <span>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas. Aplikasi siap dibuka kapan saja dari layar iPhone Anda!</span>
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">PWA Standard v2.1 • Siap Offline & Sinkronisasi Cloud</span>
                  <span className="sm:hidden">PWA Standard v2.1</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Buka Tab Baru</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
