import React, { useState } from 'react';
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
  QrCode
} from 'lucide-react';
import { Member, SchoolProfile } from '../types';
import { exportToCSV } from '../utils/exportUtils';

interface MembersViewProps {
  members: Member[];
  school: SchoolProfile;
  onOpenNewMemberModal: () => void;
  onSelectMemberCard: (member: Member) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  school,
  onOpenNewMemberModal,
  onSelectMemberCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Siswa' | 'Guru' | 'Staff' | 'Umum'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const filteredMembers = members.filter((m) => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchCode = m.memberCode.toLowerCase().includes(q);
      const matchEmail = m.email.toLowerCase().includes(q);
      const matchClass = (m.classOrDept || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchEmail && !matchClass) return false;
    }
    return true;
  });

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
      Tunggakan_Denda: m.totalFinesUnpaid
    }));
    exportToCSV(csvData, 'Data_Anggota_Perpustakaan');
  };

  return (
    <div id="members-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Direktori Anggota
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total {filteredMembers.length} Anggota Terdaftar
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Data Anggota & Kartu Digital</h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola data pemustaka, kartu perpustakaan digital dengan barcode, dan status keanggotaan</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-members-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            id="btn-add-member"
            onClick={onOpenNewMemberModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrasi Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Peran</option>
            <option value="Siswa">Siswa</option>
            <option value="Guru">Guru / Tenaga Pendidik</option>
            <option value="Staff">Staff</option>
            <option value="Umum">Umum</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Status Aktif</option>
            <option value="suspended">Ditangguhkan / Denda</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, ID anggota, kelas..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Members Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredMembers.map((member) => {
          const isSuspended = member.status === 'suspended';
          return (
            <div
              key={member.id}
              id={`member-card-${member.id}`}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-xl flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Top Row: Avatar + Role + Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/30" 
                    />
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {member.role} {member.classOrDept ? `• ${member.classOrDept}` : ''}
                      </p>
                      <span className="inline-block mt-1 font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                        {member.memberCode}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isSuspended ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isSuspended ? 'DITANGGUHKAN' : 'AKTIF'}
                  </span>
                </div>

                {/* Contact & Stats Details */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-500" /> Email:
                    </span>
                    <span className="truncate max-w-[170px]">{member.email}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500" /> Telp:
                    </span>
                    <span>{member.phone}</span>
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

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => onSelectMemberCard(member)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-xs font-semibold text-slate-200 border border-slate-700 hover:border-emerald-400 transition active:scale-[0.98]"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Kartu Anggota Digital</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
