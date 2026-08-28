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

export type BookCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Dalam Perawatan' | 'Hilang';
export type StockOpnameStatus = 'Verified' | 'Pending' | 'Discrepancy';

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
  price?: number; // Nilai Aset Satuan Buku (Rp)
  condition?: BookCondition;
  sourceOfFund?: 'Dana BOS' | 'APBD / Pemerintah' | 'Hibah / Donasi' | 'Yayasan' | 'Pembelian Mandiri';
  inventoryNumber?: string; // No. Registrasi Inventaris, misal INV/2026/LMN-001
  stockOpnameStatus?: StockOpnameStatus;
  lastStockOpnameDate?: string;
  notes?: string;
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

export interface KopSuratConfig {
  enabled: boolean;
  governingBody: string; // misal: "PEMERINTAH PROVINSI JAWA BARAT / DINAS PENDIDIKAN"
  institutionName: string; // misal: "SMA NEGERI 1 TELADAN NUSANTARA"
  unitName: string; // misal: "UPT PERPUSTAKAAN DIGITAL LUMINA"
  addressLine: string; // misal: "Jl. Pendidikan No. 45, Kompleks Lembah Ilmu"
  contactLine: string; // misal: "Telp: (021) 7890-1234 | Email: perpus@sman1teladan.sch.id"
  postalCode: string; // "12345"
  letterCodePrefix: string; // "005/DISDIK/PERPUS/2026"
  logoLeftUrl?: string;
  logoRightUrl?: string;
  borderStyle: 'double' | 'solid' | 'emerald';
}

export interface BookAIAnalysis {
  summary: string;
  targetAge?: string;
  ageRecommendation?: string;
  genreCategory?: string;
  genres?: string[];
  keyThemes?: string[];
  coreThemes?: string[];
  educationalValue?: string;
  educationalValues?: string[];
  contentRating?: string;
  shelfRecommendation?: string;
  discussionQuestions?: string[];
  readingLevel?: 'Mudah' | 'Menengah' | 'Tinggi / Akademik';
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
  kopSurat?: KopSuratConfig;
}

export interface UserSession {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  isAuthenticated: boolean;
  token?: string;
  memberCode?: string;
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
  userName?: string;
  role?: string;
  resource?: string;
  details?: string;
  ipAddress: string;
  device: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface OfflineQueueItem {
  id: string;
  actionType: 
    | 'CREATE_LOAN' 
    | 'CREATE_TRANSACTION'
    | 'RETURN_BOOK' 
    | 'RENEW_LOAN' 
    | 'ADD_BOOK' 
    | 'CREATE_BOOK'
    | 'UPDATE_BOOK' 
    | 'DELETE_BOOK'
    | 'ADD_MEMBER' 
    | 'CREATE_MEMBER'
    | 'UPDATE_MEMBER'
    | 'DELETE_MEMBER'
    | 'BULK_IMPORT_MEMBERS'
    | 'BULK_UPDATE_MEMBER_STATUS'
    | 'STOCK_OPNAME_VERIFY';
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  errorMessage?: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'catalog'
  | 'circulation'
  | 'members'
  | 'analytics'
  | 'workspace-hub'
  | 'branches-map'
  | 'messages'
  | 'school-profile'
  | 'settings';
