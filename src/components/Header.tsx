import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  RefreshCw, 
  Menu, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Clock,
  Printer
} from 'lucide-react';
import { NotificationItem, SyncConfig, UserSession } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  syncConfig?: SyncConfig;
  onTriggerSync: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  language: 'id' | 'en';
  onToggleLanguage: () => void;
  user: UserSession;
  onToggleMobileSidebar: () => void;
  onSelectNotificationLink?: (tab: string) => void;
  onExportTransactionsCSV?: () => void;
  transactionsCount?: number;
  overdueCount?: number;
  onOpenDueDateWarning?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  syncConfig,
  onTriggerSync,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  user,
  onToggleMobileSidebar,
  onSelectNotificationLink,
  onExportTransactionsCSV,
  transactionsCount,
  overdueCount = 0,
  onOpenDueDateWarning,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header 
      id="main-header" 
      className="h-16 px-4 sm:px-6 bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20"
    >
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          id="btn-mobile-menu"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari judul buku, pengarang, ISBN, atau anggota...' : 'Search books, authors, ISBN, or patrons...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-700"
            >
              ESC
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Peringatan Jatuh Tempo Button */}
        {onOpenDueDateWarning && (
          <button
            id="btn-header-due-date-warnings"
            type="button"
            onClick={onOpenDueDateWarning}
            title="Pusat Peringatan Jatuh Tempo & Pengembalian Buku"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-[0.98] ${
              overdueCount > 0
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${overdueCount > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="hidden md:inline">Jatuh Tempo</span>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-md bg-rose-500 text-white">
                {overdueCount}
              </span>
            )}
          </button>
        )}

        {/* Ekspor ke CSV Button */}
        {onExportTransactionsCSV && (
          <button
            id="btn-main-export-csv"
            type="button"
            onClick={onExportTransactionsCSV}
            title={language === 'id' ? 'Ekspor seluruh data sirkulasi & transaksi ke file CSV' : 'Export all circulation & transaction data to CSV'}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 transition shadow-sm active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Ekspor CSV</span>
            <span className="md:hidden">CSV</span>
            {transactionsCount !== undefined && (
              <span className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-md bg-emerald-500/20 text-emerald-300">
                {transactionsCount}
              </span>
            )}
          </button>
        )}

        {/* Real-time Google Apps Script Sync Trigger Button */}
        <button
          id="btn-cloud-sync"
          type="button"
          onClick={onTriggerSync}
          disabled={syncConfig?.syncStatus === 'syncing'}
          title="Sinkronkan dengan Google Sheets / Apps Script Webhook"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 border border-slate-700/80 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncConfig?.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">{syncConfig?.syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </button>

        {/* Language Switcher */}
        <button
          id="btn-toggle-language"
          type="button"
          onClick={onToggleLanguage}
          title="Ganti Bahasa / Switch Language"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase">{language}</span>
        </button>

        {/* Theme Switcher */}
        <button
          id="btn-toggle-theme"
          type="button"
          onClick={onToggleTheme}
          title="Ganti Mode Gelap/Terang"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            id="btn-notifications-toggle"
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 relative transition"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div 
              id="notifications-popover"
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Notifikasi Sistem</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onClearAllNotifications}
                    className="text-xs text-slate-400 hover:text-emerald-400 transition"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Tidak ada notifikasi saat ini.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkNotificationRead(notif.id);
                        if (notif.linkTab && onSelectNotificationLink) {
                          onSelectNotificationLink(notif.linkTab);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/50 cursor-pointer transition ${
                        !notif.isRead ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {notif.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-slate-500 mt-1 block font-mono">
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-xl object-cover border border-slate-700 ring-2 ring-emerald-500/20"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{user.name.split(' ')[0]}</p>
            <p className="text-[10px] text-emerald-400 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
