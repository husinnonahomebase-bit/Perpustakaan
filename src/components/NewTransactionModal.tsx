import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  BookOpen, 
  User, 
  Calendar, 
  Check, 
  Search, 
  Sparkles,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  UserCheck,
  Building
} from 'lucide-react';
import { Book, Member, Transaction } from '../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  members: Member[];
  preSelectedBook?: Book | null;
  onCreateTransaction: (data: {
    bookId: string;
    memberId: string;
    durationDays: number;
    notes?: string;
  }) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  books,
  members,
  preSelectedBook,
  onCreateTransaction,
}) => {
  // Member selection state & autocomplete
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [highlightedMemberIndex, setHighlightedMemberIndex] = useState(0);

  // Book selection state
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preSelectedBook) {
        setSelectedBookId(preSelectedBook.id);
      } else {
        const firstAvailable = books.find(b => b.copiesAvailable > 0);
        setSelectedBookId(firstAvailable?.id || books[0]?.id || '');
      }

      // Default to first active member if available
      const firstActiveMember = members.find(m => m.status === 'active') || members[0] || null;
      setSelectedMember(firstActiveMember);
      setMemberSearchQuery('');
      setIsMemberDropdownOpen(false);
      setValidationError('');
      setNotes('');
    }
  }, [isOpen, preSelectedBook, members, books]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const availableBooks = books.filter(b => b.copiesAvailable > 0);
  const selectedBook = books.find(b => b.id === selectedBookId);

  // Autocomplete filtered members from existing members state
  const filteredMembers = members.filter(m => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase().trim();
    return (
      m.name.toLowerCase().includes(q) ||
      m.memberCode.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      (m.classOrDept && m.classOrDept.toLowerCase().includes(q)) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const calculateDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d.toISOString().slice(0, 10);
  };

  const handleSelectMember = (member: Member) => {
    if (member.status === 'suspended') {
      setValidationError(`Anggota ${member.name} sedang berstatus DITANGGUHKAN karena denda/sanksi dan tidak dapat meminjam buku.`);
      return;
    }
    if (member.activeLoansCount >= member.maxBorrowLimit) {
      setValidationError(`Anggota ${member.name} telah mencapai batas kuota pinjam maksimal (${member.maxBorrowLimit} buku).`);
      return;
    }

    setSelectedMember(member);
    setMemberSearchQuery('');
    setIsMemberDropdownOpen(false);
    setValidationError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isMemberDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsMemberDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedMemberIndex(prev => 
        prev < filteredMembers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedMemberIndex(prev => 
        prev > 0 ? prev - 1 : filteredMembers.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMembers[highlightedMemberIndex]) {
        handleSelectMember(filteredMembers[highlightedMemberIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsMemberDropdownOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedMember) {
      setValidationError('Silakan pilih anggota pemustaka yang valid.');
      return;
    }

    if (selectedMember.status === 'suspended') {
      setValidationError('Anggota berstatus DITANGGUHKAN tidak dapat melakukan peminjaman buku.');
      return;
    }

    if (selectedMember.activeLoansCount >= selectedMember.maxBorrowLimit) {
      setValidationError(`Anggota telah mencapai batas maksimal peminjaman (${selectedMember.maxBorrowLimit} buku).`);
      return;
    }

    if (!selectedBookId) {
      setValidationError('Silakan pilih buku yang akan dipinjam.');
      return;
    }

    onCreateTransaction({
      bookId: selectedBookId,
      memberId: selectedMember.id,
      durationDays,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div 
      id="new-transaction-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        id="new-transaction-modal-dialog"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Formulir Peminjaman Baru</h3>
              <p className="text-[11px] text-slate-400">Pencarian anggota instan dengan fitur autocomplete</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Member Search & Autocomplete Combobox */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Pilih Pemustaka / Anggota <span className="text-red-400">*</span>
              </label>
              {selectedMember && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  Kuota: {selectedMember.activeLoansCount}/{selectedMember.maxBorrowLimit} Buku
                </span>
              )}
            </div>

            {/* Selected Member Display Card or Autocomplete Search Input */}
            {selectedMember && !isMemberDropdownOpen ? (
              <div 
                id="selected-member-card"
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 flex items-center justify-between gap-3 transition cursor-pointer"
                onClick={() => {
                  setIsMemberDropdownOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-emerald-500/40 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-xs truncate">{selectedMember.name}</h4>
                      <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        {selectedMember.memberCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {selectedMember.role} {selectedMember.classOrDept ? `• ${selectedMember.classOrDept}` : ''} • {selectedMember.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-emerald-400 font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    Ganti
                  </span>
                </div>
              </div>
            ) : null}

            {/* Search Input with Live Dropdown */}
            {(!selectedMember || isMemberDropdownOpen) && (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    id="input-member-autocomplete"
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      setIsMemberDropdownOpen(true);
                      setHighlightedMemberIndex(0);
                    }}
                    onFocus={() => setIsMemberDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik nama, kode anggota (misal LMN-2026), email, atau kelas..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-emerald-500 rounded-xl text-white placeholder-slate-400 focus:outline-none ring-2 ring-emerald-500/20"
                    autoFocus
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List */}
                {isMemberDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl divide-y divide-slate-800/80">
                    <div className="p-2 bg-slate-850 text-[10px] text-slate-400 flex items-center justify-between border-b border-slate-800">
                      <span>Ditemukan {filteredMembers.length} anggota dari total {members.length} data:</span>
                      <span>Gunakan panah & Enter</span>
                    </div>

                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((m, index) => {
                        const isSuspended = m.status === 'suspended';
                        const isMaxLimit = m.activeLoansCount >= m.maxBorrowLimit;
                        const isHighlighted = index === highlightedMemberIndex;
                        const isSelected = selectedMember?.id === m.id;

                        return (
                          <div
                            key={m.id}
                            id={`autocomplete-item-${m.id}`}
                            onClick={() => handleSelectMember(m)}
                            onMouseEnter={() => setHighlightedMemberIndex(index)}
                            className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                              isHighlighted 
                                ? 'bg-emerald-500/15 text-white' 
                                : isSelected 
                                ? 'bg-slate-800/90' 
                                : 'hover:bg-slate-800/50 text-slate-300'
                            } ${isSuspended ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={m.avatar}
                                alt={m.name}
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
                                }}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs truncate">{m.name}</span>
                                  <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                                    {m.memberCode}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {m.role} {m.classOrDept ? `(${m.classOrDept})` : ''} • {m.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {isSuspended ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                  DITANGGUHKAN
                                </span>
                              ) : isMaxLimit ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  KUOTA PENUH ({m.activeLoansCount})
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-emerald-400">
                                  {m.activeLoansCount}/{m.maxBorrowLimit} Pinjam
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        Tidak ada anggota yang cocok dengan pencarian "{memberSearchQuery}".
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Book Selection */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Pilih Koleksi Buku <span className="text-red-400">*</span>
            </label>
            <select
              id="select-book-transaction"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {availableBooks.length > 0 ? (
                availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} • {b.copiesAvailable} Eks. Tersedia (Rak: {b.shelfLocation})
                  </option>
                ))
              ) : (
                <option value="" disabled>Tidak ada stok buku yang tersedia untuk dipinjam</option>
              )}
            </select>

            {selectedBook && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center gap-2.5">
                <img 
                  src={selectedBook.coverImage} 
                  alt={selectedBook.title}
                  className="w-8 h-10 object-cover rounded shadow shrink-0" 
                />
                <div className="min-w-0">
                  <p className="font-bold text-white truncate text-xs">{selectedBook.title}</p>
                  <p className="text-[10px] text-slate-400">{selectedBook.author} • ISBN: {selectedBook.isbn}</p>
                </div>
              </div>
            )}
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Durasi Masa Pinjam</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-duration-7"
                onClick={() => setDurationDays(7)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  durationDays === 7 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                7 Hari (1 Minggu)
              </button>
              <button
                type="button"
                id="btn-duration-14"
                onClick={() => setDurationDays(14)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  durationDays === 14 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                14 Hari (Standar)
              </button>
              <button
                type="button"
                id="btn-duration-28"
                onClick={() => setDurationDays(28)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  durationDays === 28 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                28 Hari (Pendidik)
              </button>
            </div>
          </div>

          {/* Calculated Due Date Preview */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Tenggat Pengembalian:
            </span>
            <span className="font-mono font-bold text-emerald-400">{calculateDueDate()}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Catatan Khusus (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Keperluan tugas riset akhir, referensi ujian, dll..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Slip tanda terima siap dicetak otomatis</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-submit-loan-transaction"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
              >
                Terbitkan Peminjaman
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
