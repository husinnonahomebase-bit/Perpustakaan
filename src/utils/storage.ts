import { 
  Book, 
  Member, 
  Transaction, 
  SchoolProfile, 
  UserSession, 
  NotificationItem, 
  ChatMessage, 
  SecurityAuditLog, 
  SyncConfig 
} from '../types';
import { 
  INITIAL_BOOKS, 
  INITIAL_MEMBERS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SCHOOL_PROFILE, 
  INITIAL_USER, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_CHAT_MESSAGES, 
  INITIAL_AUDIT_LOGS 
} from '../data/mockData';

const STORAGE_KEYS = {
  BOOKS: 'lumina_lib_books_v1',
  MEMBERS: 'lumina_lib_members_v1',
  TRANSACTIONS: 'lumina_lib_transactions_v1',
  SCHOOL_PROFILE: 'lumina_lib_school_v1',
  USER: 'lumina_lib_user_v1',
  NOTIFICATIONS: 'lumina_lib_notifs_v1',
  CHATS: 'lumina_lib_chats_v1',
  AUDIT_LOGS: 'lumina_lib_audit_v1',
  SYNC_CONFIG: 'lumina_lib_sync_v1',
  THEME: 'lumina_lib_theme_v1',
  LANG: 'lumina_lib_lang_v1',
  APP_ICON: 'lumina_custom_app_icon_v1',
};

export const INITIAL_SYNC_CONFIG: SyncConfig = {
  gasWebhookUrl: 'https://script.google.com/macros/s/AKfycbz_LuminaSpreadsheet_v4/exec',
  sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  autoSyncInterval: 30, // seconds
  lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  syncStatus: 'synced',
  pendingQueueCount: 0,
  encryptionEnabled: true,
  apiSecretKey: 'lmn_sec_aes256_99218e77a11',
  pushNotificationsEnabled: true,
  offlineCacheEnabled: true,
};

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') return defaultValue;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return defaultValue;
    if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
      return { ...defaultValue, ...parsed };
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota or serialization handled
  }
}

export class LibraryStore {
  // Books
  static getBooks(): Book[] {
    return getStoredData(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
  }
  static saveBooks(books: Book[]): void {
    setStoredData(STORAGE_KEYS.BOOKS, books);
  }

  // Members
  static getMembers(): Member[] {
    return getStoredData(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  }
  static saveMembers(members: Member[]): void {
    setStoredData(STORAGE_KEYS.MEMBERS, members);
  }

  // Transactions
  static getTransactions(): Transaction[] {
    return getStoredData(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }
  static saveTransactions(transactions: Transaction[]): void {
    setStoredData(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  // School Profile
  static getSchoolProfile(): SchoolProfile {
    return getStoredData(STORAGE_KEYS.SCHOOL_PROFILE, INITIAL_SCHOOL_PROFILE);
  }
  static saveSchoolProfile(profile: SchoolProfile): void {
    setStoredData(STORAGE_KEYS.SCHOOL_PROFILE, profile);
  }

  // User
  static getUser(): UserSession {
    return getStoredData(STORAGE_KEYS.USER, INITIAL_USER);
  }
  static saveUser(user: UserSession): void {
    setStoredData(STORAGE_KEYS.USER, user);
  }

  // Notifications
  static getNotifications(): NotificationItem[] {
    return getStoredData(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
  static saveNotifications(notifications: NotificationItem[]): void {
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  // Chats
  static getChats(): ChatMessage[] {
    return getStoredData(STORAGE_KEYS.CHATS, INITIAL_CHAT_MESSAGES);
  }
  static saveChats(chats: ChatMessage[]): void {
    setStoredData(STORAGE_KEYS.CHATS, chats);
  }

  // Audit Logs
  static getAuditLogs(): SecurityAuditLog[] {
    return getStoredData(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }
  static saveAuditLogs(logs: SecurityAuditLog[]): void {
    setStoredData(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Sync Config
  static getSyncConfig(): SyncConfig {
    const config = getStoredData(STORAGE_KEYS.SYNC_CONFIG, INITIAL_SYNC_CONFIG);
    return {
      ...INITIAL_SYNC_CONFIG,
      ...(config || {}),
      lastSyncedAt: (config && config.lastSyncedAt) ? config.lastSyncedAt : (INITIAL_SYNC_CONFIG.lastSyncedAt || 'Aktif'),
      syncStatus: (config && config.syncStatus) ? config.syncStatus : 'synced',
    };
  }
  static saveSyncConfig(config: SyncConfig): void {
    setStoredData(STORAGE_KEYS.SYNC_CONFIG, config);
  }

  // Theme & Language
  static getTheme(): 'dark' | 'light' {
    return getStoredData(STORAGE_KEYS.THEME, 'dark');
  }
  static saveTheme(theme: 'dark' | 'light'): void {
    setStoredData(STORAGE_KEYS.THEME, theme);
  }

  static getLanguage(): 'id' | 'en' {
    return getStoredData(STORAGE_KEYS.LANG, 'id');
  }
  static saveLanguage(lang: 'id' | 'en'): void {
    setStoredData(STORAGE_KEYS.LANG, lang);
  }

  // Reset to initial Demo Data
  static resetToDefault(): void {
    localStorage.clear();
    setStoredData(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
    setStoredData(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    setStoredData(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    setStoredData(STORAGE_KEYS.SCHOOL_PROFILE, INITIAL_SCHOOL_PROFILE);
    setStoredData(STORAGE_KEYS.USER, INITIAL_USER);
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setStoredData(STORAGE_KEYS.CHATS, INITIAL_CHAT_MESSAGES);
    setStoredData(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStoredData(STORAGE_KEYS.SYNC_CONFIG, INITIAL_SYNC_CONFIG);
  }

  // Full Database Backup Export
  static exportFullBackup(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      school: this.getSchoolProfile(),
      books: this.getBooks(),
      members: this.getMembers(),
      transactions: this.getTransactions(),
      notifications: this.getNotifications(),
      chats: this.getChats(),
      auditLogs: this.getAuditLogs(),
      syncConfig: this.getSyncConfig(),
    };
    return JSON.stringify(backup, null, 2);
  }

  // Full Database Restore
  static importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.books) this.saveBooks(parsed.books);
      if (parsed.members) this.saveMembers(parsed.members);
      if (parsed.transactions) this.saveTransactions(parsed.transactions);
      if (parsed.school) this.saveSchoolProfile(parsed.school);
      if (parsed.notifications) this.saveNotifications(parsed.notifications);
      if (parsed.chats) this.saveChats(parsed.chats);
      if (parsed.auditLogs) this.saveAuditLogs(parsed.auditLogs);
      return true;
    } catch {
      return false;
    }
  }
}
