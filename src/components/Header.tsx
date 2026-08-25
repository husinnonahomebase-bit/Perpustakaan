import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Cloud, 
  RefreshCw, 
  Menu, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { NotificationItem, SyncConfig, UserSession } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  syncConfig: SyncConfig;
  onTriggerSync: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  language: 'id' | 'en';
  onToggleLanguage: () => void;
  user: UserSession;
  onToggleMobileSidebar: () => void;
  onSelectNotificationLink?: (tab: string) => void;
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
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header 
      id="main-header" 
      className="h-16 px-6 bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20"
    >
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
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
      <div className="flex items-center gap-3">
        {/* Real-time Google Apps Script Sync Trigger Button */}
        <button
          id="btn-cloud-sync"
          onClick={onTriggerSync}
          disabled={syncConfig.syncStatus === 'syncing'}
          title="Sinkronkan dengan Google Sheets / Apps Script Webhook"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 border border-slate-700/80 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncConfig.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span>{syncConfig.syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </button>

        {/* Language Switcher */}
        <button
          id="btn-toggle-language"
          onClick={onToggleLanguage}
          title="Ganti Bahasa / Switch Language"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase">{language}</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="btn-toggle-theme"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-300 border border-slate-700/80 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            id="btn-notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 relative transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Modal / Popover */}
          {showNotifications && (
            <div 
              id="notification-popover" 
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-semibold text-sm text-white">Notifikasi Sistem</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    {unreadCount} Baru
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onClearAllNotifications}
                    className="text-xs text-slate-400 hover:text-emerald-400 transition"
                  >
                    Tandai Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada notifikasi saat ini.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        if (n.linkTab && onSelectNotificationLink) {
                          onSelectNotificationLink(n.linkTab);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-800/60 transition cursor-pointer flex gap-3 ${
                        !n.isRead ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {n.type === 'alert' && (
                          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                        {n.type === 'success' && (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {n.type === 'info' && (
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Notifikasi Cloud & WhatsApp Real-Time Aktif
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
