export type UserRole = 'admin' | 'librarian' | 'member';

export type BookCategory = 
  | 'Semua Kategori'
  | 'Fiksi Ilmiah'
  | 'Teknologi & Komputer'
  | 'Sastra & Novel'
  | 'Sains & Matematika'
  | 'Sejarah & Biografi'
  | 'Filsafat & Pengembangan Diri'
  | 'Buku Pelajaran & Referensi';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: BookCategory | string;
  copiesTotal: number;
  copiesAvailable: number;
  coverImage: string;
  shelfLocation: string;
  description: string;
  rating: number;
  isFeatured?: boolean;
  tags: string[];
  addedAt: string;
}

export type MemberStatus = 'active' | 'suspended' | 'expired';

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'Siswa' | 'Guru' | 'Staff' | 'Umum';
  classOrDept?: string;
  joinedDate: string;
  status: MemberStatus;
  activeLoansCount: number;
  totalFinesUnpaid: number;
  maxBorrowLimit: number;
}

export type TransactionStatus = 'borrowed' | 'returned' | 'overdue' | 'renewed';

export interface Transaction {
  id: string;
  trxCode: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  bookCover: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  memberAvatar: string;
  memberPhone?: string;
  borrowDate: string; // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  status: TransactionStatus;
  fineAmount: number;
  notes?: string;
  processedBy: string;
}

export interface SchoolProfile {
  schoolName: string;
  npsn: string;
  principalName: string;
  librarianName: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  motto: string;
  libraryCode: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  isAuthenticated: boolean;
  token?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
  data?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  patronId: string;
  patronName: string;
  patronAvatar: string;
  sender: 'patron' | 'librarian' | 'system';
  text: string;
  timestamp: string;
  isExtensionRequest?: boolean;
  extensionDays?: number;
  bookTitle?: string;
  trxId?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface SyncConfig {
  gasWebhookUrl: string;
  sheetId: string;
  autoSyncInterval: number; // in seconds, 0 = manual
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  pendingQueueCount: number;
  encryptionEnabled: boolean;
  apiSecretKey: string;
  pushNotificationsEnabled: boolean;
  offlineCacheEnabled: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  ipAddress: string;
  device: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export type ActiveTab = 
  | 'dashboard'
  | 'catalog'
  | 'circulation'
  | 'members'
  | 'analytics'
  | 'messages'
  | 'school-profile'
  | 'settings';
