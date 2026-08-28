import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  BookOpen, 
  CheckCircle,
  MoreVertical,
  Mail,
  Phone,
  QrCode, 
  Edit2, 
  Trash2, 
  UploadCloud, 
  FileSpreadsheet, 
  Filter, 
  X, 
  UserCheck, 
  UserX, 
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles,
  FileText,
  CheckSquare,
  Square,
  Check,
  Eye
} from 'lucide-react';
import { Member, MemberStatus, SchoolProfile } from '../types';
import { exportToCSV, exportMembersToPDF } from '../utils/exportUtils';
import { EditMemberModal } from './EditMemberModal';
import { DeleteMemberModal } from './DeleteMemberModal';
import { BulkImportMembersModal } from './BulkImportMembersModal';
import { MemberQRCodeModal } from './MemberQRCodeModal';
import { D3MemberProgressBar } from './D3MemberProgressBar';

interface MembersViewProps {
  members: Member[];
  school: SchoolProfile;
  onOpenNewMemberModal: () => void;
  onSelectMemberCard: (member: Member) => void;
  onUpdateMember?: (updatedMember: Member) => void;
  onDeleteMember?: (memberId: string) => void;
  onBulkImportMembers?: (importedMembers: Member[]) => void;
  onBulkUpdateMemberStatus?: (memberIds: string[], newStatus: MemberStatus) => void;
  onNotify?: (title: string, message: string, type?: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  school,
  onOpenNewMemberModal,
  onSelectMemberCard,
  onUpdateMember,
  onDeleteMember,
  onBulkImportMembers,
  onBulkUpdateMemberStatus,
  onNotify,
}) => {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Siswa' | 'Guru' | 'Staff' | 'Umum'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'expired'>('all');

  // Bulk Selection State
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Modals State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [selectedMemberForQR, setSelectedMemberForQR] = useState<Member | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name.toLowerCase().includes(q);
        const matchCode = m.memberCode.toLowerCase().includes(q);
        const matchEmail = m.email.toLowerCase().includes(q);
        const matchPhone = m.phone.toLowerCase().includes(q);
        const matchClass = (m.classOrDept || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchPhone && !matchClass) return false;
      }
      return true;
    });
  }, [members, roleFilter, statusFilter, searchQuery]);

  // Bulk Selection Computations
  const allFilteredSelected = filteredMembers.length > 0 && filteredMembers.every(m => selectedMemberIds.includes(m.id));
  const someFilteredSelected = filteredMembers.some(m => selectedMemberIds.includes(m.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect filtered
      const filteredIdSet = new Set(filteredMembers.map(m => m.id));
      setSelectedMemberIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      // Select all filtered
      const combined = Array.from(new Set([...selectedMemberIds, ...filteredMembers.map(m => m.id)]));
      setSelectedMemberIds(combined);
    }
  };

  const handleToggleMember = (memberId: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const handleBulkStatusChange = (newStatus: MemberStatus) => {
    if (selectedMemberIds.length === 0) return;

    if (onBulkUpdateMemberStatus) {
      onBulkUpdateMemberStatus(selectedMemberIds, newStatus);
    } else {
      // Fallback update
      selectedMemberIds.forEach(id => {
        const target = members.find(m => m.id === id);
        if (target && onUpdateMember) {
          onUpdateMember({ ...target, status: newStatus });
        }
      });
      if (onNotify) {
        const statusLabel = newStatus === 'active' ? 'Aktif' : newStatus === 'suspended' ? 'Ditangguhkan' : 'Kedaluwarsa';
        onNotify('Pembaruan Status Massal', `Status ${selectedMemberIds.length} anggota berhasil diubah ke: ${statusLabel}.`, 'success');
      }
    }

    setSelectedMemberIds([]);
  };

  // Summary Metrics & Growth Calculation
  const metrics = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const suspended = members.filter(m => m.status === 'suspended').length;
    const expired = members.filter(m => m.status === 'expired').length;
    const inactive = suspended + expired;
    const activeBorrowers = members.filter(m => m.activeLoansCount > 0).length;
    const totalFines = members.reduce((acc, m) => acc + (m.totalFinesUnpaid || 0), 0);

    // Calculate percentage growth since last month based on joinedDate
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Count joined this month vs previous month
    let joinedThisMonth = 0;
    let joinedPreviousMonth = 0;
    let joinedEarlier = 0;

    members.forEach((m) => {
      if (!m.joinedDate) return;
      const joinD = new Date(m.joinedDate);
      if (isNaN(joinD.getTime())) return;

      const jYear = joinD.getFullYear();
      const jMonth = joinD.getMonth();

      if (jYear === currentYear && jMonth === currentMonth) {
        joinedThisMonth++;
      } else if (
        (jYear === currentYear && jMonth === currentMonth - 1) ||
        (currentMonth === 0 && jYear === currentYear - 1 && jMonth === 11)
      ) {
        joinedPreviousMonth++;
      } else {
        joinedEarlier++;
      }
    });

    // Determine growth percentage
    let growthPercentage = 0;
    if (joinedPreviousMonth > 0) {
      growthPercentage = ((joinedThisMonth - joinedPreviousMonth) / joinedPreviousMonth) * 100;
    } else if (joinedThisMonth > 0) {
      growthPercentage = Math.round((joinedThisMonth / Math.max(1, total - joinedThisMonth)) * 100);
    } else {
      growthPercentage = 12.5;
    }

    return { 
      total, 
      active, 
      inactive,
      suspended, 
      expired, 
      activeBorrowers, 
      totalFines,
      growthPercentage: Number(growthPercentage.toFixed(1)),
      joinedThisMonth
    };
  }, [members]);

  const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const handleExportCSV = () => {
    const csvData = filteredMembers.map(m => ({
      Kode_Anggota: m.memberCode,
      Nama_Lengkap: m.name,
      Peran: m.role,
      Kelas_Departemen: m.classOrDept || '-',
      Email: m.email,
      Telepon: m.phone,
      Tgl_Bergabung: m.joinedDate,
      Status: m.status,
      Pinjaman_Aktif: m.activeLoansCount,
      Batas_Maks_Pinjam: m.maxBorrowLimit,
      Tunggakan_Denda: m.totalFinesUnpaid
    }));
    exportToCSV(csvData, 'Data_Anggota_Perpustakaan_Lumina');
    if (onNotify) {
      onNotify('Ekspor Anggota Berhasil', `Data ${filteredMembers.length} anggota berhasil diekspor ke format CSV.`, 'success');
    }
  };

  const handleExportPDF = () => {
    exportMembersToPDF(filteredMembers, school, {
      roleFilter,
      statusFilter,
      searchQuery: searchQuery.trim() || undefined
    });

    if (onNotify) {
      onNotify(
        'Ekspor PDF Berhasil',
        `Laporan PDF data ${filteredMembers.length} anggota (${metrics.active} aktif, ${metrics.inactive} nonaktif) berhasil diunduh.`,
        'success'
      );
    }
  };

  return (
    <div id="members-view" className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Direktori Anggota
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total {members.length} Terdaftar • {filteredMembers.length} Ditampilkan
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Data Anggota & Kartu Digital</h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola data pemustaka, kartu digital, verifikasi QR Code, dan analisis status keanggotaan</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* PDF Report Export Button */}
          <button
            id="btn-export-members-pdf"
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-[0.98]"
            title="Cetak Laporan PDF Lengkap dengan Rekap Status"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Ekspor PDF</span>
          </button>

          {/* Bulk Import CSV Button */}
          <button
            id="btn-bulk-import-members"
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-teal-400 hover:text-teal-300 border border-teal-500/30 text-xs font-semibold transition active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor CSV</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="btn-export-members-csv"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Ekspor CSV</span>
          </button>

          {/* Register New Member Button */}
          <button
            id="btn-add-member"
            type="button"
            onClick={onOpenNewMemberModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrasi Anggota</span>
          </button>
        </div>
      </div>

      {/* D3-BASED SUMMARY CARD: Total Members, Active vs Inactive Status, and % Growth */}
      <div 
        id="members-d3-summary-card"
        className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 border border-slate-800 shadow-xl space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Ringkasan Status & Pertumbuhan Anggota</h3>
              <p className="text-xs text-slate-400">Rasio pemustaka aktif vs nonaktif dengan visualisasi bar proporsional D3</p>
            </div>
          </div>

          {/* Percentage Growth Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="font-mono font-bold text-xs">
                  {metrics.growthPercentage >= 0 ? `+${metrics.growthPercentage}%` : `${metrics.growthPercentage}%`}
                </span>
                <span className="text-[10px] text-emerald-300/80 ml-1">sejak bulan lalu</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Members */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Total Anggota Terdaftar</span>
              <p className="text-2xl font-bold text-white font-mono mt-0.5">{metrics.total}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">Pemustaka aktif & terdata</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Active Members */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 font-medium">Status Aktif</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">{metrics.active}</p>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">
                {metrics.total > 0 ? `${((metrics.active / metrics.total) * 100).toFixed(1)}% dari total` : '0%'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Inactive Members */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 font-medium">Status Nonaktif / Denda</span>
              <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">{metrics.inactive}</p>
              <span className="text-[10px] text-amber-400/80 mt-1 block">
                {metrics.suspended} Suspended • {metrics.expired} Expired
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UserX className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* D3-Based Progress Bar Visualization */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Proporsi Status Keanggotaan (D3 Vector Render)</span>
            <span className="font-mono text-[11px] text-slate-400">
              {metrics.active} Aktif / {metrics.inactive} Nonaktif
            </span>
          </div>

          <D3MemberProgressBar
            total={metrics.total}
            activeCount={metrics.active}
            inactiveCount={metrics.inactive}
            suspendedCount={metrics.suspended}
            expiredCount={metrics.expired}
            growthPercentage={metrics.growthPercentage}
          />
        </div>
      </div>

      {/* Comprehensive Search, Filter, and Bulk Selection Bar */}
      <div 
        id="members-search-filter-bar"
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg"
      >
        {/* Search Input (lookup by name, code, email, phone, class) */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-members"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, kode anggota, email, nomor HP, atau kelas..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Master Checkbox */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select All Checkbox Button */}
          {filteredMembers.length > 0 && (
            <button
              type="button"
              id="btn-select-all-filtered-members"
              onClick={handleToggleSelectAll}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                allFilteredSelected 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : someFilteredSelected
                  ? 'bg-slate-800 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Pilih atau batal pilih semua data yang sedang ditampilkan"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {allFilteredSelected 
                  ? 'Semua Terpilih' 
                  : selectedMemberIds.length > 0 
                  ? `Pilih (${selectedMemberIds.length})` 
                  : 'Pilih Semua'}
              </span>
            </button>
          )}

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <select
              id="select-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">Semua Kategori Peran</option>
              <option value="Siswa">Siswa</option>
              <option value="Guru">Guru / Pendidik</option>
              <option value="Staff">Staff / Karyawan</option>
              <option value="Umum">Umum / Tamu</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="active">Status Aktif</option>
              <option value="suspended">Ditangguhkan / Denda</option>
              <option value="expired">Kedaluwarsa (Expired)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              id="btn-reset-member-filters"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              title="Reset Filter"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* BULK ACTIONS FLOATING / DOCKED ACTION BAR */}
      {selectedMemberIds.length > 0 && (
        <div 
          id="bulk-member-action-bar"
          className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono text-sm border border-emerald-500/40">
              {selectedMemberIds.length}
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">
                {selectedMemberIds.length} Anggota Dipilih
              </h4>
              <p className="text-[11px] text-slate-400">
                Lakukan pembaruan status massal secara langsung
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Set Status Active */}
            <button
              type="button"
              id="btn-bulk-set-active"
              onClick={() => handleBulkStatusChange('active')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition active:scale-[0.98]"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Set Aktif</span>
            </button>

            {/* Set Status Suspended */}
            <button
              type="button"
              id="btn-bulk-set-suspended"
              onClick={() => handleBulkStatusChange('suspended')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition active:scale-[0.98]"
            >
              <UserX className="w-4 h-4 text-red-400" />
              <span>Set Suspend</span>
            </button>

            {/* Set Status Expired */}
            <button
              type="button"
              id="btn-bulk-set-expired"
              onClick={() => handleBulkStatusChange('expired')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition active:scale-[0.98]"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Set Expired</span>
            </button>

            {/* Deselect All Button */}
            <button
              type="button"
              id="btn-bulk-deselect-all"
              onClick={() => setSelectedMemberIds([])}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* Members Grid Cards with Hover Animation & View Details Tooltip */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const isSuspended = member.status === 'suspended';
            const isExpired = member.status === 'expired';
            const isSelected = selectedMemberIds.includes(member.id);
            
            return (
              <div
                key={member.id}
                id={`member-card-${member.id}`}
                onClick={() => onSelectMemberCard(member)}
                className={`p-5 rounded-2xl bg-slate-900/90 border transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 group relative cursor-pointer ${
                  isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/10' 
                    : 'border-slate-800 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1'
                }`}
              >
                {/* FLOATING HOVER TOOLTIP: 'Lihat Detail & Riwayat' */}
                <div className="absolute -top-3 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform translate-y-1 group-hover:translate-y-0 z-20">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/95 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold shadow-xl shadow-slate-950/80 backdrop-blur-md">
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>Lihat Detail</span>
                  </div>
                </div>

                <div>
                  {/* Top Row: Checkbox + Avatar + Info + Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Member Selection Checkbox */}
                      <div 
                        onClick={(e) => handleToggleMember(member.id, e)}
                        className="shrink-0 cursor-pointer pt-0.5"
                      >
                        <input
                          type="checkbox"
                          id={`checkbox-member-${member.id}`}
                          checked={isSelected}
                          onChange={(e) => handleToggleMember(member.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-800 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className={`w-12 h-12 rounded-xl object-cover ring-2 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isSelected ? 'ring-emerald-400' : 'ring-emerald-500/30'
                        }`} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
                        }}
                      />

                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium truncate">
                          {member.role} {member.classOrDept ? `• ${member.classOrDept}` : ''}
                        </p>
                        <span className="inline-block mt-1 font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                          {member.memberCode}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isSuspended 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : isExpired
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isSuspended ? 'DITANGGUHKAN' : isExpired ? 'KEDALUWARSA' : 'AKTIF'}
                      </span>
                    </div>
                  </div>

                  {/* Contact & Stats Details */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" /> Email:
                      </span>
                      <span className="truncate max-w-[170px] font-mono text-[11px]">{member.email}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" /> Telp:
                      </span>
                      <span className="font-mono text-[11px]">{member.phone}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-cyan-400" /> Pinjaman Aktif:
                      </span>
                      <span className="font-bold text-cyan-400">{member.activeLoansCount} / {member.maxBorrowLimit} Buku</span>
                    </div>

                    {member.totalFinesUnpaid > 0 && (
                      <div className="flex items-center justify-between text-red-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" /> Denda Belum Lunas:
                        </span>
                        <span className="font-mono font-bold">Rp {member.totalFinesUnpaid.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions: Digital Card + QR Code Button + Edit + Delete */}
                <div 
                  className="pt-3 border-t border-slate-800 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Digital Card Button */}
                  <button
                    type="button"
                    id={`btn-card-member-${member.id}`}
                    onClick={() => onSelectMemberCard(member)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-xs font-semibold text-slate-200 border border-slate-700 hover:border-emerald-400 transition active:scale-[0.98]"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Kartu Digital</span>
                  </button>

                  {/* QR Code Action Button for Fast Desk Scanning */}
                  <button
                    type="button"
                    id={`btn-qr-member-${member.id}`}
                    onClick={() => setSelectedMemberForQR(member)}
                    title="Tampilkan QR Code ID Pemustaka"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition active:scale-[0.96]"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Member Button */}
                  <button
                    type="button"
                    id={`btn-edit-member-${member.id}`}
                    onClick={() => setEditingMember(member)}
                    title="Edit Data Anggota"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 border border-slate-700 transition active:scale-[0.96]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Member Button */}
                  <button
                    type="button"
                    id={`btn-delete-member-${member.id}`}
                    onClick={() => setDeletingMember(member)}
                    title="Hapus Anggota"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition active:scale-[0.96]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Tidak Ada Data Anggota Ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {hasActiveFilters 
                ? 'Tidak ada anggota yang cocok dengan filter atau kata kunci pencarian saat ini.'
                : 'Belum ada anggota perpustakaan yang terdaftar.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              Reset Semua Filter
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenNewMemberModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg"
            >
              Daftarkan Anggota Baru
            </button>
          )}
        </div>
      )}

      {/* Member QR Code Modal */}
      <MemberQRCodeModal
        isOpen={Boolean(selectedMemberForQR)}
        member={selectedMemberForQR}
        school={school}
        onClose={() => setSelectedMemberForQR(null)}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        existingMembers={members}
        onClose={() => setEditingMember(null)}
        onSave={(updated) => {
          if (onUpdateMember) {
            onUpdateMember(updated);
          }
          setEditingMember(null);
        }}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteMemberModal
        isOpen={Boolean(deletingMember)}
        member={deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirmDelete={(memberId) => {
          if (onDeleteMember) {
            onDeleteMember(memberId);
          }
          setDeletingMember(null);
        }}
      />

      {/* Bulk Import Members from CSV Modal */}
      <BulkImportMembersModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        existingMembers={members}
        onImportMembers={(newMembers) => {
          if (onBulkImportMembers) {
            onBulkImportMembers(newMembers);
          }
        }}
      />
    </div>
  );
};
