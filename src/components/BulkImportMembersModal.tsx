import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText,
  Users,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Member, MemberStatus } from '../types';

interface BulkImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  onImportMembers: (newMembers: Member[]) => void;
}

interface ParsedMemberRow {
  index: number;
  memberCode: string;
  name: string;
  email: string;
  phone: string;
  role: 'Siswa' | 'Guru' | 'Staff' | 'Umum';
  classOrDept?: string;
  status: MemberStatus;
  maxBorrowLimit: number;
  avatar: string;
  isValid: boolean;
  errorReason?: string;
  isDuplicateInSystem?: boolean;
  isDuplicateInFile?: boolean;
}

export const BulkImportMembersModal: React.FC<BulkImportMembersModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  onImportMembers,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFileName('');
    setRawText('');
    setParsedRows([]);
    setParseError('');
  };

  const handleDownloadTemplate = () => {
    const csvContent = 
      'Kode_Anggota,Nama_Lengkap,Peran,Kelas_Departemen,Email,Telepon,Status,Batas_Pinjam\r\n' +
      'LMN-2026-101,Ahmad Fauzi,Siswa,Kelas X MIPA 1,ahmad.fauzi@student.lumina.edu,+62 812-3456-7891,active,5\r\n' +
      'LMN-2026-102,Siti Rahmawati S.Pd,Guru,Pendidik Bahasa Indonesia,siti.rahmawati@lumina.sch.id,+62 813-9876-5432,active,10\r\n' +
      'LMN-2026-103,Budi Santoso,Staff,Tata Usaha,budi.staff@lumina.sch.id,+62 856-1122-3344,active,7\r\n' +
      'LMN-2026-104,Dr. Hendra Wijaya,Umum,Alumni Lumina,hendra.wijaya@gmail.com,+62 818-7654-3210,active,5\r\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Template_Import_Anggota_Lumina_${new Date().getFullYear()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSVContent = (content: string) => {
    setParseError('');
    if (!content.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParseError('File atau teks CSV kosong.');
      setParsedRows([]);
      return;
    }

    // Determine delimiter (comma, semicolon, or tab)
    const firstLine = lines[0];
    let delimiter = ',';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
    else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

    // Parse header row
    const parseLine = (lineStr: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < lineStr.length; i++) {
        const char = lineStr[i];
        if (char === '"') {
          if (inQuotes && lineStr[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerCells = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Map column indexes
    let codeIdx = headerCells.findIndex(h => h.includes('kode') || h.includes('code') || h.includes('nisn') || h.includes('nim') || h.includes('id'));
    let nameIdx = headerCells.findIndex(h => h.includes('nama') || h.includes('name'));
    let roleIdx = headerCells.findIndex(h => h.includes('peran') || h.includes('role') || h.includes('kategori') || h.includes('tipe'));
    let classIdx = headerCells.findIndex(h => h.includes('kelas') || h.includes('dept') || h.includes('unit') || h.includes('jurusan') || h.includes('class'));
    let emailIdx = headerCells.findIndex(h => h.includes('email') || h.includes('surel') || h.includes('mail'));
    let phoneIdx = headerCells.findIndex(h => h.includes('telepon') || h.includes('telp') || h.includes('phone') || h.includes('hp') || h.includes('wa'));
    let statusIdx = headerCells.findIndex(h => h.includes('status'));
    let limitIdx = headerCells.findIndex(h => h.includes('limit') || h.includes('pinjam') || h.includes('max'));

    // Fallbacks if header line was not recognized
    const hasHeader = nameIdx !== -1 || codeIdx !== -1;
    const startIndex = hasHeader ? 1 : 0;
    if (!hasHeader) {
      codeIdx = 0;
      nameIdx = 1;
      roleIdx = 2;
      classIdx = 3;
      emailIdx = 4;
      phoneIdx = 5;
      statusIdx = 6;
      limitIdx = 7;
    }

    const existingCodeSet = new Set(existingMembers.map(m => m.memberCode.trim().toLowerCase()));
    const fileCodeCount: Record<string, number> = {};
    const parsedData: ParsedMemberRow[] = [];

    // First pass: collect codes in file to find duplicate codes within the CSV itself
    for (let i = startIndex; i < lines.length; i++) {
      const cells = parseLine(lines[i]);
      if (cells.length === 0 || cells.every(c => c === '')) continue;
      const codeVal = (cells[codeIdx] || '').trim().toLowerCase();
      if (codeVal) {
        fileCodeCount[codeVal] = (fileCodeCount[codeVal] || 0) + 1;
      }
    }

    // Second pass: process each row with validation
    const seenCodesInThisRun = new Set<string>();

    for (let i = startIndex; i < lines.length; i++) {
      const cells = parseLine(lines[i]);
      if (cells.length === 0 || cells.every(c => c === '')) continue;

      const rawCode = (cells[codeIdx] || '').trim();
      const rawName = (cells[nameIdx] || '').trim();
      const rawRole = (cells[roleIdx] || '').trim();
      const rawClass = classIdx !== -1 ? (cells[classIdx] || '').trim() : '';
      const rawEmail = emailIdx !== -1 ? (cells[emailIdx] || '').trim() : '';
      const rawPhone = phoneIdx !== -1 ? (cells[phoneIdx] || '').trim() : '';
      const rawStatus = statusIdx !== -1 ? (cells[statusIdx] || '').trim().toLowerCase() : 'active';
      const rawLimit = limitIdx !== -1 ? parseInt(cells[limitIdx]) : NaN;

      // Auto generate code if missing
      const finalCode = rawCode || `LMN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const normalizedCode = finalCode.toLowerCase();

      // Normalize Role
      let finalRole: 'Siswa' | 'Guru' | 'Staff' | 'Umum' = 'Siswa';
      if (rawRole.toLowerCase().includes('guru') || rawRole.toLowerCase().includes('teacher') || rawRole.toLowerCase().includes('pendidik')) {
        finalRole = 'Guru';
      } else if (rawRole.toLowerCase().includes('staff') || rawRole.toLowerCase().includes('karyawan') || rawRole.toLowerCase().includes('tu')) {
        finalRole = 'Staff';
      } else if (rawRole.toLowerCase().includes('umum') || rawRole.toLowerCase().includes('tamu') || rawRole.toLowerCase().includes('public')) {
        finalRole = 'Umum';
      }

      // Normalize Status
      let finalStatus: MemberStatus = 'active';
      if (rawStatus.includes('suspend') || rawStatus.includes('tangguh') || rawStatus.includes('denda')) {
        finalStatus = 'suspended';
      } else if (rawStatus.includes('expir') || rawStatus.includes('mati') || rawStatus.includes('nonaktif')) {
        finalStatus = 'expired';
      }

      // Borrow limit
      const defaultLimit = finalRole === 'Guru' ? 10 : finalRole === 'Staff' ? 7 : 5;
      const finalLimit = !isNaN(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;

      // Generate realistic email if empty
      const finalEmail = rawEmail || `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.lumina.edu`;
      const finalPhone = rawPhone || '+62 812-0000-0000';

      // Validation Checks
      let isValid = true;
      let errorReason = '';
      let isDuplicateInSystem = false;
      let isDuplicateInFile = false;

      if (!rawName) {
        isValid = false;
        errorReason = 'Nama anggota wajib diisi.';
      } else if (existingCodeSet.has(normalizedCode)) {
        isValid = false;
        isDuplicateInSystem = true;
        errorReason = `Kode "${finalCode}" sudah terdaftar di sistem.`;
      } else if (seenCodesInThisRun.has(normalizedCode)) {
        isValid = false;
        isDuplicateInFile = true;
        errorReason = `Kode "${finalCode}" duplikat di dalam file CSV.`;
      }

      if (isValid) {
        seenCodesInThisRun.add(normalizedCode);
      }

      // Avatar selection
      const avatarList = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      ];
      const assignedAvatar = avatarList[parsedData.length % avatarList.length];

      parsedData.push({
        index: parsedData.length + 1,
        memberCode: finalCode,
        name: rawName,
        email: finalEmail,
        phone: finalPhone,
        role: finalRole,
        classOrDept: rawClass || undefined,
        status: finalStatus,
        maxBorrowLimit: finalLimit,
        avatar: assignedAvatar,
        isValid,
        errorReason,
        isDuplicateInSystem,
        isDuplicateInFile,
      });
    }

    if (parsedData.length === 0) {
      setParseError('Tidak ditemukan baris data yang dapat diproses.');
    }

    setParsedRows(parsedData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    const eligibleRows = parsedRows.filter(r => r.isValid);
    if (eligibleRows.length === 0) {
      alert('Tidak ada data anggota valid yang dapat diimpor.');
      return;
    }

    const newMembersList: Member[] = eligibleRows.map((r, idx) => ({
      id: `MBR-${Date.now()}-${idx + 1}`,
      memberCode: r.memberCode,
      name: r.name,
      email: r.email,
      phone: r.phone,
      avatar: r.avatar,
      role: r.role,
      classOrDept: r.classOrDept,
      joinedDate: new Date().toISOString().slice(0, 10),
      status: r.status,
      activeLoansCount: 0,
      totalFinesUnpaid: 0,
      maxBorrowLimit: r.maxBorrowLimit,
    }));

    onImportMembers(newMembersList);
    onClose();
    resetState();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const duplicateSystemCount = parsedRows.filter(r => r.isDuplicateInSystem).length;
  const duplicateFileCount = parsedRows.filter(r => r.isDuplicateInFile).length;

  return (
    <div 
      id="bulk-import-members-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="bulk-import-members-dialog"
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Impor Massal Data Anggota (CSV)</h3>
              <p className="text-[11px] text-slate-400">Unggah daftar pemustaka dalam jumlah banyak sekaligus dengan validasi kode unik</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Top Actions: Template Download & Input Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveInputMode('upload')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  activeInputMode === 'upload'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Upload File CSV
              </button>
              <button
                type="button"
                onClick={() => setActiveInputMode('paste')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  activeInputMode === 'paste'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Salin & Tempel Teks
              </button>
            </div>

            <button
              type="button"
              id="btn-download-csv-template"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-teal-400 border border-teal-500/30 font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Format Template CSV</span>
            </button>
          </div>

          {/* Input Method: Upload or Paste */}
          {activeInputMode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer transition flex flex-col items-center justify-center text-center space-y-2 ${
                  dragActive 
                    ? 'border-emerald-400 bg-emerald-500/10' 
                    : fileName 
                    ? 'border-emerald-500/40 bg-slate-800/40' 
                    : 'border-slate-700 hover:border-slate-600 bg-slate-850/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">
                    {fileName ? `File Terpilih: ${fileName}` : 'Klik untuk pilih file atau seret file CSV ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mendukung format .csv dengan pemisah koma (,) atau titik-koma (;)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                Tempel Data CSV / Spreadsheet:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  parseCSVContent(e.target.value);
                }}
                rows={5}
                placeholder="Kode_Anggota,Nama_Lengkap,Peran,Kelas_Departemen,Email,Telepon&#10;LMN-2026-101,Ahmad Fauzi,Siswa,Kelas X MIPA 1,ahmad@lumina.edu,+628123456"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500 custom-scrollbar"
              />
            </div>
          )}

          {/* Parse Errors */}
          {parseError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Validation & Preview Summary */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium">Total Baris CSV</span>
                  <p className="text-base font-bold text-white mt-0.5">{parsedRows.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-medium">Siap Diimpor (Valid)</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{validCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <span className="text-[10px] text-red-400 font-medium">Duplikat Sistem</span>
                  <p className="text-base font-bold text-red-400 mt-0.5">{duplicateSystemCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 font-medium">Duplikat File / Error</span>
                  <p className="text-base font-bold text-amber-400 mt-0.5">{invalidCount - duplicateSystemCount}</p>
                </div>
              </div>

              {/* Duplicate Protection Callout */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:outline-none bg-slate-700 border-slate-600"
                  />
                  <span className="text-slate-300 font-medium">
                    Lewati data kode duplikat dan impor data yang valid saja
                  </span>
                </label>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {validCount} Data Terverifikasi
                </span>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-2.5 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-[11px]">
                    Pratinjau Data Impor ({parsedRows.length} baris):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Hijau = Valid • Merah/Kuning = Ditolak/Duplikat
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-850 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-2 pl-3">No</th>
                        <th className="p-2">Kode Anggota</th>
                        <th className="p-2">Nama</th>
                        <th className="p-2">Peran</th>
                        <th className="p-2">Kelas/Unit</th>
                        <th className="p-2">Email</th>
                        <th className="p-2 pr-3">Status Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {parsedRows.map((row) => (
                        <tr 
                          key={row.index} 
                          className={row.isValid ? 'hover:bg-slate-800/40' : 'bg-red-500/5 hover:bg-red-500/10'}
                        >
                          <td className="p-2 pl-3 font-mono text-slate-400">{row.index}</td>
                          <td className="p-2 font-mono font-bold text-white">{row.memberCode}</td>
                          <td className="p-2 font-medium text-slate-200">{row.name || '-'}</td>
                          <td className="p-2">{row.role}</td>
                          <td className="p-2 text-slate-400">{row.classOrDept || '-'}</td>
                          <td className="p-2 truncate max-w-[120px] text-slate-400">{row.email}</td>
                          <td className="p-2 pr-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                <AlertTriangle className="w-3 h-3" /> {row.errorReason}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-medium"
          >
            Batal
          </button>

          <div className="flex items-center gap-2.5">
            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={resetState}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              id="btn-confirm-import-members"
              disabled={validCount === 0}
              onClick={handleConfirmImport}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                validCount > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>Impor {validCount} Anggota Valid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
