/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { NewTransactionModal } from './components/NewTransactionModal';
import { NewBookModal } from './components/NewBookModal';
import { NewMemberModal } from './components/NewMemberModal';
import { BookDetailModal } from './components/BookDetailModal';
import { DigitalCardModal } from './components/DigitalCardModal';
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

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
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

  // Persist Data Changes
  useEffect(() => {
    LibraryStore.saveBooks(books);
  }, [books]);

  useEffect(() => {
    LibraryStore.saveMembers(members);
  }, [members]);

  useEffect(() => {
    LibraryStore.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    LibraryStore.saveSchoolProfile(school);
  }, [school]);

  useEffect(() => {
    LibraryStore.saveUser(user);
  }, [user]);

  useEffect(() => {
    LibraryStore.saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    LibraryStore.saveChats(chats);
  }, [chats]);

  useEffect(() => {
    LibraryStore.saveAuditLogs(auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    LibraryStore.saveSyncConfig(syncConfig);
  }, [syncConfig]);

  // Push Notification Simulation Audio Effect
  const triggerNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Add Notification Helper
  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert', linkTab?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Baru saja',
      isRead: false,
      linkTab,
    };
    setNotifications(prev => [newNotif, ...prev]);
    triggerNotificationSound();
  };

  // Add Audit Log Helper
  const addAuditLog = (action: string, status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS') => {
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action,
      user: user.email,
      ipAddress: '180.252.164.88 (Verified)',
      device: 'Chrome / Web Engine',
      status,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Trigger Google Apps Script Real-Time Sync
  const handleTriggerSync = () => {
    setSyncConfig(prev => ({ ...prev, syncStatus: 'syncing' }));
    setTimeout(() => {
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setSyncConfig(prev => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncedAt: nowTime,
      }));
      addNotification(
        'Sinkronisasi Real-Time Berhasil',
        `Data sirkulasi dan 24.592 katalog berhasil diselaraskan dengan Google Spreadsheet (${nowTime}).`,
        'success',
        'settings'
      );
      addAuditLog('Sinkronisasi Google Apps Script Webhook');
    }, 1200);
  };

  // Circulation Actions: Create New Loan
  const handleCreateTransaction = ({
    bookId,
    memberId,
    durationDays,
    notes,
  }: {
    bookId: string;
    memberId: string;
    durationDays: number;
    notes?: string;
  }) => {
    const book = books.find(b => b.id === bookId);
    const member = members.find(m => m.id === memberId);
    if (!book || !member) return;

    const borrowDate = new Date().toISOString().slice(0, 10);
    const dueD = new Date();
    dueD.setDate(dueD.getDate() + durationDays);
    const dueDate = dueD.toISOString().slice(0, 10);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trxCode = `TRX-${new Date().getFullYear()}-${randomSuffix}`;

    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      trxCode,
      bookId: book.id,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      bookCover: book.coverImage,
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      memberAvatar: member.avatar,
      memberPhone: member.phone,
      borrowDate,
      dueDate,
      status: 'borrowed',
      fineAmount: 0,
      notes,
      processedBy: user.name,
    };

    // Update state
    setTransactions(prev => [newTrx, ...prev]);

    // Decrement available copies of book
    setBooks(prev =>
      prev.map(b => (b.id === book.id ? { ...b, copiesAvailable: Math.max(0, b.copiesAvailable - 1) } : b))
    );

    // Increment member active loans
    setMembers(prev =>
      prev.map(m => (m.id === member.id ? { ...m, activeLoansCount: m.activeLoansCount + 1 } : m))
    );

    addNotification(
      'Peminjaman Buku Berhasil',
      `Buku "${book.title}" berhasil dipinjamkan kepada ${member.name} (Tenggat: ${dueDate}).`,
      'success',
      'circulation'
    );
    addAuditLog(`Peminjaman Buku: ${book.title} (${trxCode})`);
  };

  // Circulation Actions: Return Book
  const handleReturnBook = (trxId: string) => {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx || trx.status === 'returned') return;

    const returnDate = new Date().toISOString().slice(0, 10);

    // Update transaction
    setTransactions(prev =>
      prev.map(t =>
        t.id === trxId
          ? {
              ...t,
              status: 'returned',
              returnDate,
            }
          : t
      )
    );

    // Increment available copies of book
    setBooks(prev =>
      prev.map(b => (b.id === trx.bookId ? { ...b, copiesAvailable: b.copiesAvailable + 1 } : b))
    );

    // Decrement member active loans
    setMembers(prev =>
      prev.map(m =>
        m.id === trx.memberId ? { ...m, activeLoansCount: Math.max(0, m.activeLoansCount - 1) } : m
      )
    );

    addNotification(
      'Pengembalian Buku Selesai',
      `Buku "${trx.bookTitle}" telah dikembalikan oleh ${trx.memberName}.`,
      'info',
      'circulation'
    );
    addAuditLog(`Pengembalian Buku: ${trx.bookTitle} (${trx.trxCode})`);
  };

  // Circulation Actions: Renew Loan
  const handleRenewLoan = (trxId: string, daysToAdd: number = 7) => {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx) return;

    const currentDue = new Date(trx.dueDate);
    currentDue.setDate(currentDue.getDate() + daysToAdd);
    const newDueDate = currentDue.toISOString().slice(0, 10);

    setTransactions(prev =>
      prev.map(t =>
        t.id === trxId
          ? {
              ...t,
              dueDate: newDueDate,
              status: 'borrowed',
              fineAmount: 0,
            }
          : t
      )
    );

    addNotification(
      'Masa Pinjam Diperpanjang',
      `Transaksi ${trx.trxCode} ("${trx.bookTitle}") diperpanjang hingga ${newDueDate}.`,
      'success',
      'circulation'
    );
  };

  // Circulation Actions: Send Reminder
  const handleSendReminder = (trx: Transaction) => {
    const message = `Pemberitahuan Perpustakaan Lumina: Halo ${trx.memberName}, buku "${trx.bookTitle}" jatuh tempo pada ${trx.dueDate}. Mohon kembalikan tepat waktu.`;
    addNotification('Pemberitahuan Terkirim', `Pesan pengingat dikirim ke nomor ${trx.memberPhone || trx.memberName}.`, 'info');
    
    // Also add to chat
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      patronId: trx.memberId,
      patronName: trx.memberName,
      patronAvatar: trx.memberAvatar,
      sender: 'system',
      text: message,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
    setChats(prev => [...prev, newMsg]);
  };

  // Chat Actions: Send Message
  const handleSendMessage = (patronId: string, text: string) => {
    const patron = members.find(m => m.id === patronId);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      patronId,
      patronName: patron?.name || 'Pemustaka',
      patronAvatar: patron?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      sender: 'librarian',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
    setChats(prev => [...prev, newMsg]);
  };

  // Chat Actions: Approve Extension
  const handleApproveExtension = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    setChats(prev =>
      prev.map(c => (c.id === chatId ? { ...c, status: 'approved' } : c))
    );

    if (chat.trxId) {
      handleRenewLoan(chat.trxId, chat.extensionDays || 7);
    }

    // Auto reply in chat
    const replyMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      patronId: chat.patronId,
      patronName: chat.patronName,
      patronAvatar: chat.patronAvatar,
      sender: 'librarian',
      text: `Permintaan perpanjangan masa pinjam buku telah disetujui selama ${chat.extensionDays || 7} hari. Selamat melanjutkan membaca!`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
    setChats(prev => [...prev, replyMsg]);
  };

  const handleRejectExtension = (chatId: string) => {
    setChats(prev =>
      prev.map(c => (c.id === chatId ? { ...c, status: 'rejected' } : c))
    );
  };

  // Add Book
  const handleAddBook = (bookData: Omit<Book, 'id' | 'addedAt'>) => {
    const newBook: Book = {
      ...bookData,
      id: `bk-${Date.now()}`,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    setBooks(prev => [newBook, ...prev]);
    addNotification('Koleksi Buku Baru Ditambahkan', `Buku "${newBook.title}" berhasil didaftarkan di ${newBook.shelfLocation}.`, 'success', 'catalog');
    addAuditLog(`Registrasi Buku: ${newBook.title}`);
  };

  // Add Member
  const handleAddMember = (memberData: Omit<Member, 'id' | 'joinedDate' | 'activeLoansCount' | 'totalFinesUnpaid'>) => {
    const newMember: Member = {
      ...memberData,
      id: `mbr-${Date.now()}`,
      joinedDate: new Date().toISOString().slice(0, 10),
      activeLoansCount: 0,
      totalFinesUnpaid: 0,
    };
    setMembers(prev => [newMember, ...prev]);
    addNotification('Pendaftaran Anggota Baru', `${newMember.name} berhasil terdaftar sebagai anggota aktif (${newMember.memberCode}).`, 'success', 'members');
    addAuditLog(`Registrasi Anggota: ${newMember.name} (${newMember.memberCode})`);
  };

  // Database Reset
  const handleResetDatabase = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh data ke data bawaan demo pabrik?')) {
      LibraryStore.resetToDefault();
      setBooks(LibraryStore.getBooks());
      setMembers(LibraryStore.getMembers());
      setTransactions(LibraryStore.getTransactions());
      setSchool(LibraryStore.getSchoolProfile());
      setUser(LibraryStore.getUser());
      setNotifications(LibraryStore.getNotifications());
      setChats(LibraryStore.getChats());
      setAuditLogs(LibraryStore.getAuditLogs());
      setSyncConfig(LibraryStore.getSyncConfig());
      addNotification('Sistem Direset', 'Seluruh data telah dikembalikan ke pengaturan demo awal.', 'info');
    }
  };

  // Database Restore
  const handleRestoreBackup = (jsonString: string) => {
    const success = LibraryStore.importFullBackup(jsonString);
    if (success) {
      setBooks(LibraryStore.getBooks());
      setMembers(LibraryStore.getMembers());
      setTransactions(LibraryStore.getTransactions());
      setSchool(LibraryStore.getSchoolProfile());
      setNotifications(LibraryStore.getNotifications());
      setChats(LibraryStore.getChats());
      setAuditLogs(LibraryStore.getAuditLogs());
      alert('Pemulihan database berhasil!');
    } else {
      alert('Gagal memulihkan database. Format file JSON tidak valid.');
    }
  };

  const unreadChatCount = chats.filter(c => c.isExtensionRequest && c.status === 'pending').length;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex transition-colors duration-200`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          syncConfig={syncConfig}
          onOpenScanner={() => setIsScannerOpen(true)}
          onLogout={() => setIsAuthModalOpen(true)}
          unreadChatCount={unreadChatCount}
        />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
          <div className="relative z-50">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              user={user}
              syncConfig={syncConfig}
              onOpenScanner={() => {
                setIsScannerOpen(true);
                setMobileSidebarOpen(false);
              }}
              onLogout={() => {
                setIsAuthModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              unreadChatCount={unreadChatCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          notifications={notifications}
          onMarkNotificationRead={(id) => {
            setNotifications(prev =>
              prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
            );
          }}
          onClearAllNotifications={() => {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          }}
          syncConfig={syncConfig}
          onTriggerSync={handleTriggerSync}
          theme={theme}
          onToggleTheme={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
          language={language}
          onToggleLanguage={() => setLanguage(prev => (prev === 'id' ? 'en' : 'id'))}
          user={user}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          onSelectNotificationLink={(tab) => setActiveTab(tab as ActiveTab)}
        />

        {/* View Switcher */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              books={books}
              members={members}
              transactions={transactions}
              syncConfig={syncConfig}
              school={school}
              onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
              onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
              onOpenNewTransactionModal={() => {
                setPreSelectedBookForLoan(null);
                setIsNewTransactionModalOpen(true);
              }}
              onOpenScanner={() => setIsScannerOpen(true)}
              onSelectBook={(book) => setSelectedBookForDetail(book)}
              onReturnBook={handleReturnBook}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              books={books}
              school={school}
              onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
              onSelectBook={(book) => setSelectedBookForDetail(book)}
              onOpenNewLoanModalForBook={(book) => {
                setPreSelectedBookForLoan(book);
                setIsNewTransactionModalOpen(true);
              }}
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
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              members={members}
              school={school}
              onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
              onSelectMemberCard={(member) => setSelectedMemberForCard(member)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              books={books}
              members={members}
              transactions={transactions}
              school={school}
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
