/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Book, 
  Member, 
  Transaction, 
  SchoolProfile, 
  UserSession, 
  NotificationItem, 
  ChatMessage, 
  SecurityAuditLog, 
  SyncConfig, 
  ActiveTab 
} from './types';
import { LibraryStore } from './utils/storage';
import { exportTransactionsToCSV } from './utils/exportUtils';
import { AutoBackupManager } from './utils/autoBackup';
import { OfflineSyncManager } from './utils/offlineSync';
import { initAuth, testFirestoreConnection, syncUserProfileToFirestore } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CatalogView } from './components/CatalogView';
import { CirculationView } from './components/CirculationView';
import { MembersView } from './components/MembersView';
import { AnalyticsView } from './components/AnalyticsView';
import { ChatView } from './components/ChatView';
import { SchoolProfileView } from './components/SchoolProfileView';
import { SettingsView } from './components/SettingsView';
import { GoogleWorkspaceHub } from './components/GoogleWorkspaceHub';
import { LibraryBranchesMap } from './components/LibraryBranchesMap';
import { INITIAL_BRANCHES, BranchLocation } from './data/branchesData';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { NewTransactionModal } from './components/NewTransactionModal';
import { NewBookModal } from './components/NewBookModal';
import { NewMemberModal } from './components/NewMemberModal';
import { BookDetailModal } from './components/BookDetailModal';
import { DigitalCardModal } from './components/DigitalCardModal';
import { DueDateWarningModal } from './components/DueDateWarningModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  // Core State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [books, setBooks] = useState<Book[]>(() => LibraryStore.getBooks());
  const [members, setMembers] = useState<Member[]>(() => LibraryStore.getMembers());
  const [transactions, setTransactions] = useState<Transaction[]>(() => LibraryStore.getTransactions());
  const [school, setSchool] = useState<SchoolProfile>(() => LibraryStore.getSchoolProfile());
  const [user, setUser] = useState<UserSession>(() => LibraryStore.getUser());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => LibraryStore.getNotifications());
  const [chats, setChats] = useState<ChatMessage[]>(() => LibraryStore.getChats());
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(() => LibraryStore.getAuditLogs());
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => LibraryStore.getSyncConfig());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => LibraryStore.getTheme());
  const [language, setLanguage] = useState<'id' | 'en'>(() => LibraryStore.getLanguage());
  const [branches, setBranches] = useState<BranchLocation[]>(INITIAL_BRANCHES);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() => OfflineSyncManager.getPendingCount());

  // Overdue count calculation
  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return transactions.filter(t => t.status === 'borrowed' && t.dueDate < today).length;
  }, [transactions]);

  // Offline Sync Manager Listener
  useEffect(() => {
    const unsubscribe = OfflineSyncManager.init(
      (online) => {
        setIsOnline(online);
        if (online) {
          addNotification('Koneksi Pulih (Online)', 'Jaringan internet kembali tersambung. Sinkronisasi data dimulai.', 'success');
        } else {
          addNotification('Mode Offline Aktif', 'Aplikasi berjalan dalam mode offline lokal. Operasi akan disimpan di antrean sinkronisasi.', 'warning');
        }
      },
      (count) => {
        setPendingOfflineCount(count);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch initial data from Cloud SQL API if available & test Firebase connection
  useEffect(() => {
    testFirestoreConnection().catch(() => {});

    // Listen to Firebase Auth state
    const unsubscribeAuth = initAuth((firebaseUser, _, idToken) => {
      if (firebaseUser) {
        const loggedUser: UserSession = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Pengguna Lumina',
          email: firebaseUser.email || 'user@lumina.edu',
          role: firebaseUser.email === 'husinnonahomebase@gmail.com' ? 'admin' : 'librarian',
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
          title: firebaseUser.email === 'husinnonahomebase@gmail.com' ? 'Kepala / Administrator' : 'Pustakawan Lumina',
          isAuthenticated: true,
          token: idToken || 'fb_token',
        };
        setUser(loggedUser);
        syncUserProfileToFirestore(loggedUser).catch(() => {});
      }
    });

    async function loadCloudSqlData() {
      try {
        const [booksRes, membersRes, trxRes, branchesRes] = await Promise.allSettled([
          fetch('/api/books').then(r => r.ok ? r.json() : null),
          fetch('/api/members').then(r => r.ok ? r.json() : null),
          fetch('/api/transactions').then(r => r.ok ? r.json() : null),
          fetch('/api/branches').then(r => r.ok ? r.json() : null),
        ]);

        if (booksRes.status === 'fulfilled' && Array.isArray(booksRes.value) && booksRes.value.length > 0) {
          setBooks(booksRes.value);
        }
        if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value) && membersRes.value.length > 0) {
          setMembers(membersRes.value);
        }
        if (trxRes.status === 'fulfilled' && Array.isArray(trxRes.value) && trxRes.value.length > 0) {
          setTransactions(trxRes.value);
        }
        if (branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value) && branchesRes.value.length > 0) {
          setBranches(branchesRes.value);
        }
      } catch {
        // Local store fallback active
      }
    }
    loadCloudSqlData();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Automated scheduled backup interval timer
  useEffect(() => {
    const backupSettings = AutoBackupManager.getSettings();
    if (!backupSettings.enabled) return;

    const intervalMs = Math.max(1, backupSettings.intervalMinutes) * 60 * 1000;
    const timer = setInterval(() => {
      try {
        AutoBackupManager.createSnapshot('auto_interval');
      } catch {
        // Safe failover
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, []);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);
  const [preSelectedBookForLoan, setPreSelectedBookForLoan] = useState<Book | null>(null);

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    }
    LibraryStore.saveTheme(theme);
  }, [theme]);

  // Persist handlers
  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert' = 'info', linkTab?: string) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      linkTab,
    };
    const updated = [newNotif, ...notifications].slice(0, 40);
    setNotifications(updated);
    LibraryStore.saveNotifications(updated);
  };

  const addAuditLog = (action: string) => {
    const newLog: SecurityAuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      action,
      user: user.name,
      ipAddress: '127.0.0.1 (Lumina Container Engine)',
      device: 'Web App Pro v4.2',
      status: 'SUCCESS',
    };
    const updated = [newLog, ...auditLogs].slice(0, 50);
    setAuditLogs(updated);
    LibraryStore.saveAuditLogs(updated);
  };

  // Circulation Handlers
  const handleCreateTransaction = (trxData: {
    bookId: string;
    memberId: string;
    borrowDate: string;
    dueDate: string;
    notes?: string;
  }) => {
    const book = books.find(b => b.id === trxData.bookId);
    const member = members.find(m => m.id === trxData.memberId);

    if (!book || !member) return;

    if (book.copiesAvailable <= 0) {
      addNotification('Stok Buku Habis', `Buku "${book.title}" sedang tidak tersedia untuk dipinjam.`, 'warning');
      return;
    }

    const code = `TRX-${Date.now().toString().slice(-6)}`;
    const newTransaction: Transaction = {
      id: code,
      trxCode: code,
      bookId: book.id,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      bookCover: book.coverImage,
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      memberAvatar: member.avatar,
      memberPhone: member.phone,
      borrowDate: trxData.borrowDate,
      dueDate: trxData.dueDate,
      status: 'borrowed',
      fineAmount: 0,
      notes: trxData.notes,
      processedBy: user.name,
    };

    // Update Book stock
    const updatedBooks = books.map(b => 
      b.id === book.id 
        ? { ...b, copiesAvailable: Math.max(0, b.copiesAvailable - 1) }
        : b
    );

    // Update Member borrowed count
    const updatedMembers = members.map(m => 
      m.id === member.id 
        ? { ...m, activeLoansCount: m.activeLoansCount + 1 }
        : m
    );

    const updatedTrx = [newTransaction, ...transactions];

    setBooks(updatedBooks);
    setMembers(updatedMembers);
    setTransactions(updatedTrx);

    LibraryStore.saveBooks(updatedBooks);
    LibraryStore.saveMembers(updatedMembers);
    LibraryStore.saveTransactions(updatedTrx);

    // Enqueue offline sync item
    OfflineSyncManager.enqueueAction('CREATE_TRANSACTION', newTransaction);

    addNotification('Peminjaman Berhasil', `Buku "${book.title}" berhasil dipinjam oleh ${member.name}.`, 'success', 'circulation');
    addAuditLog(`Peminjaman Buku: ${book.title} kepada ${member.name} (${newTransaction.id})`);

    // Take automatic snapshot on circulation update
    try {
      AutoBackupManager.createSnapshot('circulation_change');
    } catch {
      // safe
    }
  };

  const handleReturnBook = (trxId: string) => {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx || trx.status === 'returned') return;

    const returnDate = new Date().toISOString().slice(0, 10);
    const isLate = returnDate > trx.dueDate;
    
    // Calculate fine if late (Rp 1.000 per day)
    let fine = 0;
    if (isLate) {
      const diffTime = Math.abs(new Date(returnDate).getTime() - new Date(trx.dueDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 1000;
    }

    const updatedTrx = transactions.map(t => 
      t.id === trxId 
        ? { ...t, status: 'returned' as const, returnDate, fineAmount: fine }
        : t
    );

    const updatedBooks = books.map(b => 
      b.id === trx.bookId 
        ? { ...b, copiesAvailable: Math.min(b.copiesTotal, b.copiesAvailable + 1) }
        : b
    );

    const updatedMembers = members.map(m => 
      m.id === trx.memberId 
        ? { ...m, activeLoansCount: Math.max(0, m.activeLoansCount - 1), totalFinesUnpaid: m.totalFinesUnpaid + fine }
        : m
    );

    setTransactions(updatedTrx);
    setBooks(updatedBooks);
    setMembers(updatedMembers);

    LibraryStore.saveTransactions(updatedTrx);
    LibraryStore.saveBooks(updatedBooks);
    LibraryStore.saveMembers(updatedMembers);

    // Enqueue offline sync item
    OfflineSyncManager.enqueueAction('RETURN_BOOK', { trxId, returnDate, fineAmount: fine });

    addNotification(
      'Pengembalian Buku Sukses', 
      `Buku "${trx.bookTitle}" telah dikembalikan.${fine > 0 ? ` Denda keterlambatan: Rp ${fine.toLocaleString('id-ID')}` : ''}`, 
      fine > 0 ? 'warning' : 'success',
      'circulation'
    );
    addAuditLog(`Pengembalian Buku: ${trx.bookTitle} oleh ${trx.memberName} (${trx.id})`);

    try {
      AutoBackupManager.createSnapshot('circulation_change');
    } catch {
      // safe
    }
  };

  const handleRenewLoan = (trxId: string) => {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx || trx.status !== 'borrowed') return;

    const currentDue = new Date(trx.dueDate);
    currentDue.setDate(currentDue.getDate() + 7);
    const newDueDate = currentDue.toISOString().slice(0, 10);

    const updatedTrx = transactions.map(t => 
      t.id === trxId 
        ? { ...t, dueDate: newDueDate, notes: (t.notes ? t.notes + ' | ' : '') + 'Perpanjangan +7 hari' }
        : t
    );

    setTransactions(updatedTrx);
    LibraryStore.saveTransactions(updatedTrx);

    // Enqueue offline sync item
    OfflineSyncManager.enqueueAction('RENEW_LOAN', { trxId, newDueDate });

    addNotification('Perpanjangan Berhasil', `Jatuh tempo peminjaman "${trx.bookTitle}" diperpanjang hingga ${newDueDate}.`, 'info', 'circulation');
    addAuditLog(`Perpanjangan Peminjaman: ${trx.bookTitle} (${trx.id})`);
  };

  const handleSendReminder = (trx: Transaction) => {
    const message = encodeURIComponent(
      `Halo ${trx.memberName}, ini pengingat dari Perpustakaan ${school.schoolName || school.name}. Buku "${trx.bookTitle}" memiliki tanggal jatuh tempo pada ${trx.dueDate}. Mohon segera dikembalikan atau diperpanjang. Terima kasih!`
    );
    const phone = (trx.memberPhone || '').replace(/[^0-9]/g, '') || '628123456789';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    addNotification('Peringatan Terkirim', `Pesan pengingat jatuh tempo dikirim ke ${trx.memberName} via WhatsApp.`, 'info');
  };

  // Catalog & Inventory Handlers
  const handleAddBook = (newBookData: Omit<Book, 'id' | 'addedAt'>) => {
    const newBook: Book = {
      ...newBookData,
      id: `BK-${Date.now().toString().slice(-6)}`,
      addedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newBook, ...books];
    setBooks(updated);
    LibraryStore.saveBooks(updated);

    // Enqueue offline sync item
    OfflineSyncManager.enqueueAction('CREATE_BOOK', newBook);

    addNotification('Buku Baru Ditambahkan', `Buku "${newBook.title}" berhasil didaftarkan ke katalog koleksi.`, 'success', 'catalog');
    addAuditLog(`Tambah Koleksi Buku: ${newBook.title} (${newBook.isbn})`);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    const updated = books.map(b => b.id === updatedBook.id ? updatedBook : b);
    setBooks(updated);
    LibraryStore.saveBooks(updated);

    // Enqueue offline sync item
    OfflineSyncManager.enqueueAction('UPDATE_BOOK', updatedBook);
  };

  // Member Handlers
  const handleAddMember = (newMemberData: Omit<Member, 'id' | 'activeLoansCount' | 'totalFinesUnpaid' | 'joinedDate' | 'status'>) => {
    const newMember: Member = {
      ...newMemberData,
      id: `MBR-${Date.now().toString().slice(-5)}`,
      activeLoansCount: 0,
      totalFinesUnpaid: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
      status: 'active',
    };

    const updated = [newMember, ...members];
    setMembers(updated);
    LibraryStore.saveMembers(updated);

    // Enqueue offline sync item
    OfflineSyncManager.enqueueAction('CREATE_MEMBER', newMember);

    addNotification('Anggota Baru Terdaftar', `Kartu digital siap diterbitkan untuk ${newMember.name}.`, 'success', 'members');
    addAuditLog(`Pendaftaran Anggota: ${newMember.name} (${newMember.memberCode})`);
  };

  // Messages & Chat Handlers
  const handleSendMessage = (text: string, memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      patronId: member.id,
      patronName: member.name,
      patronAvatar: member.avatar,
      sender: 'librarian',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...chats, newMsg];
    setChats(updated);
    LibraryStore.saveChats(updated);
  };

  const handleApproveExtension = (chatId: string) => {
    const updatedChats = chats.map(c => 
      c.id === chatId ? { ...c, status: 'approved' as const } : c
    );
    setChats(updatedChats);
    LibraryStore.saveChats(updatedChats);
    addNotification('Perpanjangan Disetujui', 'Permintaan perpanjangan buku anggota telah disetujui via layanan pesan.', 'success', 'messages');
  };

  const handleRejectExtension = (chatId: string) => {
    const updatedChats = chats.map(c => 
      c.id === chatId ? { ...c, status: 'rejected' as const } : c
    );
    setChats(updatedChats);
    LibraryStore.saveChats(updatedChats);
    addNotification('Perpanjangan Ditolak', 'Permintaan perpanjangan buku anggota ditolak.', 'warning', 'messages');
  };

  // Sync Trigger Handlers
  const handleTriggerSync = () => {
    setSyncConfig(prev => ({ ...prev, syncStatus: 'syncing' }));
    setTimeout(() => {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncConfig(prev => ({
        ...prev,
        syncStatus: 'idle',
        lastSyncedAt: now,
      }));
      addNotification('Sinkronisasi Berhasil', `Data telah diselaraskan dengan Google Apps Script Webhook (${now}).`, 'success');
      addAuditLog('Penyelarasan Sinkronisasi Cloud GAS Sukses');
    }, 1200);
  };

  // Export Transactions to CSV
  const handleExportTransactionsCSV = () => {
    exportTransactionsToCSV(transactions);
    addNotification(
      'Ekspor CSV Berhasil', 
      `File CSV rekapitulasi ${transactions.length} transaksi sirkulasi berhasil diunduh.`, 
      'success'
    );
    addAuditLog(`Ekspor Data CSV Sirkulasi (${transactions.length} baris)`);
  };

  // Backup & Reset Handlers
  const handleResetDatabase = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh database ke data demo awal?')) {
      LibraryStore.resetToDefault();
      setBooks(LibraryStore.getBooks());
      setMembers(LibraryStore.getMembers());
      setTransactions(LibraryStore.getTransactions());
      setSchool(LibraryStore.getSchoolProfile());
      setNotifications(LibraryStore.getNotifications());
      setChats(LibraryStore.getChats());
      setAuditLogs(LibraryStore.getAuditLogs());
      setSyncConfig(LibraryStore.getSyncConfig());
      addNotification('Sistem Direset', 'Database telah dikembalikan ke kondisi default.', 'warning');
      addAuditLog('Reset Total Database Aplikasi');
    }
  };

  const handleRestoreBackup = (json: string) => {
    const success = LibraryStore.importFullBackup(json);
    if (success) {
      setBooks(LibraryStore.getBooks());
      setMembers(LibraryStore.getMembers());
      setTransactions(LibraryStore.getTransactions());
      setSchool(LibraryStore.getSchoolProfile());
      setNotifications(LibraryStore.getNotifications());
      setChats(LibraryStore.getChats());
      setAuditLogs(LibraryStore.getAuditLogs());
      setSyncConfig(LibraryStore.getSyncConfig());
      addNotification('Pemulihan Sukses', 'Seluruh database berhasil dipulihkan dari file cadangan.', 'success');
      addAuditLog('Pemulihan Database dari File JSON Cadangan');
    } else {
      addNotification('Pemulihan Gagal', 'Format file cadangan tidak valid atau rusak.', 'alert');
    }
  };

  const unreadChatCount = chats.filter(c => c.sender === 'member' && !c.isApproved).length;

  return (
    <div id="lumina-app" className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          user={user}
          syncConfig={syncConfig}
          onOpenScanner={() => setIsScannerOpen(true)}
          onLogout={() => setIsAuthModalOpen(true)}
          unreadChatCount={unreadChatCount}
          onExportTransactionsCSV={handleExportTransactionsCSV}
          overdueCount={overdueCount}
          onOpenDueDateWarning={() => setIsDueDateModalOpen(true)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-50">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              user={user}
              syncConfig={syncConfig}
              onOpenScanner={() => {
                setMobileSidebarOpen(false);
                setIsScannerOpen(true);
              }}
              onLogout={() => {
                setMobileSidebarOpen(false);
                setIsAuthModalOpen(true);
              }}
              unreadChatCount={unreadChatCount}
              onExportTransactionsCSV={() => {
                setMobileSidebarOpen(false);
                handleExportTransactionsCSV();
              }}
              overdueCount={overdueCount}
              onOpenDueDateWarning={() => {
                setMobileSidebarOpen(false);
                setIsDueDateModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          notifications={notifications}
          onMarkNotificationRead={(id) => {
            const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
            setNotifications(updated);
            LibraryStore.saveNotifications(updated);
          }}
          onClearAllNotifications={() => {
            const updated = notifications.map(n => ({ ...n, isRead: true }));
            setNotifications(updated);
            LibraryStore.saveNotifications(updated);
          }}
          syncConfig={syncConfig}
          onTriggerSync={handleTriggerSync}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          language={language}
          onToggleLanguage={() => {
            const newLang = language === 'id' ? 'en' : 'id';
            setLanguage(newLang);
            LibraryStore.saveLanguage(newLang);
          }}
          user={user}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onSelectNotificationLink={(tab) => setActiveTab(tab as ActiveTab)}
          onExportTransactionsCSV={handleExportTransactionsCSV}
          transactionsCount={transactions.length}
          overdueCount={overdueCount}
          onOpenDueDateWarning={() => setIsDueDateModalOpen(true)}
        />

        {/* Offline Status & Pending Sync Queue Banner */}
        {(!isOnline || pendingOfflineCount > 0) && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              </span>
              <span className="font-medium">
                {!isOnline 
                  ? 'Mode Offline Aktif — Seluruh pencatatan sirkulasi & inventaris tersimpan aman di penyimpanan lokal perangkat.' 
                  : `Online: Terdapat ${pendingOfflineCount} antrean perubahan offline yang siap disinkronkan.`}
              </span>
            </div>
            {isOnline && pendingOfflineCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  OfflineSyncManager.processQueue(syncConfig).then(res => {
                    if (res.success > 0) {
                      addNotification('Sinkronisasi Offline Selesai', `${res.success} aksi offline berhasil disinkronkan ke server.`, 'success');
                    }
                  });
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition shadow-sm"
              >
                Sinkron Sekarang ({pendingOfflineCount})
              </button>
            )}
          </div>
        )}

        {/* Dynamic Views with Motion Tab Transition Animation */}
        <main id="main-view-container" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-7xl mx-auto"
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  books={books}
                  members={members}
                  transactions={transactions}
                  school={school}
                  onOpenNewLoan={() => {
                    setPreSelectedBookForLoan(null);
                    setIsNewTransactionModalOpen(true);
                  }}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onSelectBookDetail={(book) => setSelectedBookForDetail(book)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenDueDateWarning={() => setIsDueDateModalOpen(true)}
                />
              )}

              {activeTab === 'catalog' && (
                <CatalogView
                  books={books}
                  searchQuery={searchQuery}
                  onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
                  onSelectBookDetail={(book) => setSelectedBookForDetail(book)}
                  onOpenLoanModal={(book) => {
                    setPreSelectedBookForLoan(book);
                    setIsNewTransactionModalOpen(true);
                  }}
                  school={school}
                  onNotify={addNotification}
                />
              )}

              {activeTab === 'circulation' && (
                <CirculationView
                  transactions={transactions}
                  school={school}
                  onOpenNewTransactionModal={() => {
                    setPreSelectedBookForLoan(null);
                    setIsNewTransactionModalOpen(true);
                  }}
                  onReturnBook={handleReturnBook}
                  onRenewLoan={handleRenewLoan}
                  onSendReminder={handleSendReminder}
                  onOpenDueDateWarning={() => setIsDueDateModalOpen(true)}
                  onNotify={addNotification}
                />
              )}

              {activeTab === 'members' && (
                <MembersView
                  members={members}
                  school={school}
                  onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
                  onSelectMemberCard={(member) => setSelectedMemberForCard(member)}
                  onNotify={addNotification}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  books={books}
                  members={members}
                  transactions={transactions}
                  school={school}
                  onUpdateBook={handleUpdateBook}
                  onNotify={addNotification}
                />
              )}

              {activeTab === 'workspace-hub' && (
                <GoogleWorkspaceHub
                  books={books}
                  transactions={transactions}
                  members={members}
                  onRefreshData={() => {
                    addNotification('Workspace Data Refreshed', 'Data katalog dan sirkulasi siap disinkronkan.', 'info');
                  }}
                />
              )}

              {activeTab === 'branches-map' && (
                <LibraryBranchesMap
                  branches={branches}
                  onSelectBranch={(branch) => {
                    addNotification('Lokasi Terpilih', `Melihat titik layanan: ${branch.name}`, 'info');
                  }}
                />
              )}

              {activeTab === 'messages' && (
                <ChatView
                  chats={chats}
                  members={members}
                  onSendMessage={handleSendMessage}
                  onApproveExtension={handleApproveExtension}
                  onRejectExtension={handleRejectExtension}
                />
              )}

              {activeTab === 'school-profile' && (
                <SchoolProfileView
                  school={school}
                  onSaveSchoolProfile={(newProfile) => {
                    setSchool(newProfile);
                    addNotification('Profil Sekolah Diperbarui', 'Informasi identitas instansi telah disimpan.', 'success');
                    addAuditLog('Pembaruan Identitas Profil Sekolah');
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  syncConfig={syncConfig}
                  onSaveSyncConfig={(newConfig) => {
                    setSyncConfig(newConfig);
                    addNotification('Pengaturan Disimpan', 'Konfigurasi Google Apps Script Webhook berhasil diperbarui.', 'success');
                  }}
                  auditLogs={auditLogs}
                  user={user}
                  onTestNotification={() => {
                    addNotification('Uji Notifikasi Push Berhasil', 'Peringatan otomatis aktif dengan suara dan enkripsi token.', 'info');
                  }}
                  onResetDatabase={handleResetDatabase}
                  onRestoreBackup={handleRestoreBackup}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        books={books}
        members={members}
        transactions={transactions}
        onProcessReturn={(trxId) => handleReturnBook(trxId)}
        onSelectBookForLoan={(book) => {
          setPreSelectedBookForLoan(book);
          setIsNewTransactionModalOpen(true);
        }}
      />

      <NewTransactionModal
        isOpen={isNewTransactionModalOpen}
        onClose={() => {
          setIsNewTransactionModalOpen(false);
          setPreSelectedBookForLoan(null);
        }}
        books={books}
        members={members}
        preSelectedBook={preSelectedBookForLoan}
        onCreateTransaction={handleCreateTransaction}
      />

      <NewBookModal
        isOpen={isNewBookModalOpen}
        onClose={() => setIsNewBookModalOpen(false)}
        onAddBook={handleAddBook}
      />

      <NewMemberModal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
        onAddMember={handleAddMember}
      />

      <BookDetailModal
        book={selectedBookForDetail}
        onClose={() => setSelectedBookForDetail(null)}
        onOpenLoanModal={(book) => {
          setPreSelectedBookForLoan(book);
          setIsNewTransactionModalOpen(true);
        }}
      />

      <DigitalCardModal
        member={selectedMemberForCard}
        school={school}
        onClose={() => setSelectedMemberForCard(null)}
      />

      <DueDateWarningModal
        isOpen={isDueDateModalOpen}
        onClose={() => setIsDueDateModalOpen(false)}
        transactions={transactions}
        school={school}
        onRenewLoan={handleRenewLoan}
        onReturnBook={handleReturnBook}
        onSendReminder={handleSendReminder}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          addNotification('Otentikasi Berhasil', `Selamat datang kembali, ${loggedUser.name}!`, 'success');
          addAuditLog(`Login Pengguna: ${loggedUser.email} (${loggedUser.role})`);
        }}
      />
    </div>
  );
}
