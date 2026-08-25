import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  ArrowLeftRight, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Building2, 
  Settings, 
  Cloud, 
  LogOut, 
  Sparkles, 
  QrCode, 
  HardDrive, 
  MapPin, 
  Download, 
  AlertTriangle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { ActiveTab, UserSession, SyncConfig } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserSession;
  syncConfig?: SyncConfig;
  onOpenScanner: () => void;
  onLogout: () => void;
  unreadChatCount: number;
  onExportTransactionsCSV?: () => void;
  overdueCount?: number;
  onOpenDueDateWarning?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  syncConfig,
  onOpenScanner,
  onLogout,
  unreadChatCount,
  onExportTransactionsCSV,
  overdueCount = 0,
  onOpenDueDateWarning,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'catalog' as ActiveTab, label: 'Katalog Buku', icon: BookOpen },
    { 
      id: 'circulation' as ActiveTab, 
      label: 'Sirkulasi Transaksi', 
      icon: ArrowLeftRight,
      badge: overdueCount > 0 ? `${overdueCount} tempo` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'members' as ActiveTab, label: 'Data Anggota', icon: Users },
    { id: 'analytics' as ActiveTab, label: 'Laporan & Analitik', icon: BarChart3 },
    { id: 'workspace-hub' as ActiveTab, label: 'Workspace Hub', icon: HardDrive },
    { id: 'branches-map' as ActiveTab, label: 'Peta Lokasi Layanan', icon: MapPin },
    { 
      id: 'messages' as ActiveTab, 
      label: 'Pesan & Layanan', 
      icon: MessageSquare, 
      badge: unreadChatCount > 0 ? `${unreadChatCount}` : undefined,
      badgeColor: 'bg-emerald-500 text-slate-950'
    },
    { id: 'school-profile' as ActiveTab, label: 'Identitas Sekolah', icon: Building2 },
    { id: 'settings' as ActiveTab, label: 'Pengaturan & Backup', icon: Settings },
  ];

  return (
    <aside 
      id="main-sidebar" 
      className="w-64 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 select-none"
    >
      {/* Brand Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">Lumina</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">PRO</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Digital Library System</p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <button
          id="btn-quick-scan"
          onClick={onOpenScanner}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm shadow-md shadow-emerald-500/15 transition-all duration-200 active:scale-[0.98]"
        >
          <QrCode className="w-4 h-4" />
          <span>Pindai Barcode / QR</span>
        </button>

        {/* Due Date Warning quick launcher */}
        {onOpenDueDateWarning && overdueCount > 0 && (
          <button
            id="btn-sidebar-due-date-alert"
            onClick={onOpenDueDateWarning}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Peringatan Tempo</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
              {overdueCount}
            </span>
          </button>
        )}

        {onExportTransactionsCSV && (
          <button
            id="btn-sidebar-export-csv"
            onClick={onExportTransactionsCSV}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-medium text-xs border border-emerald-500/30 hover:border-emerald-500/50 transition active:scale-[0.98]"
            title="Ekspor seluruh data transaksi sirkulasi ke file CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor ke CSV</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Menu Navigasi
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor || 'bg-emerald-500 text-slate-950'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cloud & Realtime Sync Status Pill */}
      <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Apps Script</span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Sinkron Real-time</span>
          <span className="text-emerald-400 font-mono font-medium">{syncConfig?.lastSyncedAt || 'Aktif'}</span>
        </div>
      </div>

      {/* User Session & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/50 transition">
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700" 
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-emerald-400 capitalize truncate">{user.role} Perpustakaan</p>
            </div>
          </div>
          <button
            id="btn-logout"
            onClick={onLogout}
            title="Keluar / Ganti Akun"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
