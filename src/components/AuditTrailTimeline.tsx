import React, { useState } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Lock, 
  Key, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  User, 
  ArrowUpRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { SecurityAuditLog } from '../types';

interface AuditTrailTimelineProps {
  logs: SecurityAuditLog[];
}

export const AuditTrailTimeline: React.FC<AuditTrailTimelineProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Helper to categorize log action
  const getActionCategory = (action: string): 'create' | 'update' | 'delete' | 'auth' | 'backup' | 'other' => {
    const act = (action || '').toLowerCase();
    if (act.includes('tambah') || act.includes('create') || act.includes('add') || act.includes('pinjam') || act.includes('insert')) {
      return 'create';
    }
    if (act.includes('edit') || act.includes('update') || act.includes('ubah') || act.includes('perpanjang') || act.includes('kembali')) {
      return 'update';
    }
    if (act.includes('hapus') || act.includes('delete') || act.includes('remove') || act.includes('purge')) {
      return 'delete';
    }
    if (act.includes('login') || act.includes('auth') || act.includes('password') || act.includes('token') || act.includes('akses')) {
      return 'auth';
    }
    if (act.includes('backup') || act.includes('restore') || act.includes('export') || act.includes('unduh')) {
      return 'backup';
    }
    return 'other';
  };

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'create':
        return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'update':
        return <Pencil className="w-4 h-4 text-amber-400" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'auth':
        return <Lock className="w-4 h-4 text-cyan-400" />;
      case 'backup':
        return <Download className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'create':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            TAMBAH
          </span>
        );
      case 'update':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            EDIT
          </span>
        );
      case 'delete':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            HAPUS
          </span>
        );
      case 'auth':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            KEAMANAN
          </span>
        );
      case 'backup':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            CADANGAN
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            AKTIVITAS
          </span>
        );
    }
  };

  const getCategoryDotBg = (category: string) => {
    switch (category) {
      case 'create':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-emerald-500/20';
      case 'update':
        return 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-amber-500/20';
      case 'delete':
        return 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-rose-500/20';
      case 'auth':
        return 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-cyan-500/20';
      case 'backup':
        return 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-purple-500/20';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  // Filter and sort chronologically (most recent first)
  const sortedLogs = [...logs].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeB - timeA;
  });

  const filteredLogs = sortedLogs.filter((log) => {
    const category = getActionCategory(log.action);
    const matchesFilter = filterType === 'all' || category === filterType;
    const q = searchQuery.toLowerCase().trim();
    const userDisplayName = log.userName || log.user || 'Admin';
    const detailText = log.details || log.action || '';
    const matchesSearch = 
      !q || 
      log.action.toLowerCase().includes(q) || 
      userDisplayName.toLowerCase().includes(q) || 
      detailText.toLowerCase().includes(q) ||
      (log.resource && log.resource.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes} mnt yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Audit Trail Timeline</h3>
              <p className="text-[11px] text-slate-400">Pemantauan kronologis aktivitas admin & integritas sirkulasi</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            {filteredLogs.length} Aktivitas Tercatat
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'create', label: 'Tambah Data', icon: PlusCircle, color: 'text-emerald-400' },
            { id: 'update', label: 'Edit / Sirkulasi', icon: Pencil, color: 'text-amber-400' },
            { id: 'delete', label: 'Hapus Data', icon: Trash2, color: 'text-rose-400' },
            { id: 'auth', label: 'Keamanan', icon: Lock, color: 'text-cyan-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`tab-audit-filter-${tab.id}`}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-slate-800 text-white shadow border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon && <tab.icon className={`w-3.5 h-3.5 ${tab.color}`} />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas, admin, entitas..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Vertical Chronological Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">Tidak ada log aktivitas audit yang sesuai filter.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-slate-800">
          {filteredLogs.map((log, index) => {
            const category = getActionCategory(log.action);
            const isExpanded = expandedLogId === log.id;

            return (
              <div 
                key={log.id || index} 
                className="relative group transition"
              >
                {/* Timeline node icon */}
                <div 
                  className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 z-10 ${getCategoryDotBg(category)}`}
                >
                  {getActionIcon(category)}
                </div>

                {/* Event Card */}
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isExpanded 
                      ? 'bg-slate-800/90 border-cyan-500/40 shadow-lg' 
                      : 'bg-slate-950/60 border-slate-800/90 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(category)}
                        <span className="font-bold text-xs text-white">
                          {log.action}
                        </span>
                        {log.resource && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                            {log.resource}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {log.details || `Aktivitas tercatat pada sistem perpustakaan: ${log.action}`}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <User className="w-3 h-3 text-cyan-400" />
                          {log.userName || log.user || 'Admin'} {log.role ? `(${log.role})` : ''}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {formatRelativeTime(log.timestamp)}
                        </span>
                        {log.ipAddress && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              IP: {log.ipAddress}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-500 group-hover:text-slate-300 transition pt-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded metadata drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2 text-xs animate-in fade-in duration-150">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[9px]">ID Audit:</span>
                          <span className="text-slate-300 truncate block">{log.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">Waktu Lengkap:</span>
                          <span className="text-slate-300 block">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">Status Hasil:</span>
                          <span className="text-emerald-400 font-bold block">SUCCESS (200 OK)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
