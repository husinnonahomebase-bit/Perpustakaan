import { Book, Member, Transaction, SchoolProfile, NotificationItem, ChatMessage, SecurityAuditLog, SyncConfig } from '../types';
import { LibraryStore } from './storage';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  triggerType: 'auto_interval' | 'manual' | 'circulation_change' | 'system_restore';
  booksCount: number;
  membersCount: number;
  transactionsCount: number;
  sizeKb: number;
  description: string;
  payload: {
    version: string;
    exportedAt: string;
    school: SchoolProfile;
    books: Book[];
    members: Member[];
    transactions: Transaction[];
    notifications: NotificationItem[];
    chats: ChatMessage[];
    auditLogs: SecurityAuditLog[];
    syncConfig: SyncConfig;
  };
}

export interface AutoBackupSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 15, 30, 60, 360, 1440
  autoDownloadOnSchedule: boolean;
  backupOnCirculationEvents: boolean;
  maxSnapshotsToKeep: number;
  lastBackupAt: string | null;
}

const BACKUP_SETTINGS_KEY = 'lumina_auto_backup_settings_v1';
const BACKUP_SNAPSHOTS_KEY = 'lumina_backup_snapshots_v1';

export const DEFAULT_AUTO_BACKUP_SETTINGS: AutoBackupSettings = {
  enabled: true,
  intervalMinutes: 30,
  autoDownloadOnSchedule: false,
  backupOnCirculationEvents: true,
  maxSnapshotsToKeep: 10,
  lastBackupAt: null,
};

export class AutoBackupManager {
  static getSettings(): AutoBackupSettings {
    try {
      const raw = localStorage.getItem(BACKUP_SETTINGS_KEY);
      if (!raw) return DEFAULT_AUTO_BACKUP_SETTINGS;
      return { ...DEFAULT_AUTO_BACKUP_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_AUTO_BACKUP_SETTINGS;
    }
  }

  static saveSettings(settings: AutoBackupSettings): void {
    localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settings));
  }

  static getSnapshots(): BackupSnapshot[] {
    try {
      const raw = localStorage.getItem(BACKUP_SNAPSHOTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static createSnapshot(
    triggerType: BackupSnapshot['triggerType'] = 'manual',
    customDesc?: string
  ): BackupSnapshot {
    const fullJson = LibraryStore.exportFullBackup();
    const parsed = JSON.parse(fullJson);

    const sizeKb = Math.round((new Blob([fullJson]).size / 1024) * 10) / 10;
    const now = new Date();
    const timestampStr = now.toISOString();

    const snapshot: BackupSnapshot = {
      id: `bkp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timestampStr,
      triggerType,
      booksCount: parsed.books?.length || 0,
      membersCount: parsed.members?.length || 0,
      transactionsCount: parsed.transactions?.length || 0,
      sizeKb,
      description: customDesc || this.getDefaultDescription(triggerType, now),
      payload: parsed,
    };

    const currentSnapshots = this.getSnapshots();
    const settings = this.getSettings();

    const updated = [snapshot, ...currentSnapshots].slice(0, settings.maxSnapshotsToKeep || 10);
    localStorage.setItem(BACKUP_SNAPSHOTS_KEY, JSON.stringify(updated));

    // Update settings lastBackupAt
    this.saveSettings({
      ...settings,
      lastBackupAt: timestampStr,
    });

    return snapshot;
  }

  static deleteSnapshot(id: string): void {
    const current = this.getSnapshots();
    const filtered = current.filter(s => s.id !== id);
    localStorage.setItem(BACKUP_SNAPSHOTS_KEY, JSON.stringify(filtered));
  }

  static clearAllSnapshots(): void {
    localStorage.removeItem(BACKUP_SNAPSHOTS_KEY);
  }

  static downloadSnapshotAsFile(snapshot: BackupSnapshot): void {
    const jsonString = JSON.stringify(snapshot.payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanDate = snapshot.timestamp.slice(0, 19).replace(/[:T]/g, '-');
    link.download = `Lumina_Library_Backup_${cleanDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static restoreFromSnapshot(snapshot: BackupSnapshot): boolean {
    try {
      const jsonString = JSON.stringify(snapshot.payload);
      const success = LibraryStore.importFullBackup(jsonString);
      if (success) {
        this.createSnapshot('system_restore', `Pemulihan otomatis dari snapshot [${snapshot.id}]`);
      }
      return success;
    } catch {
      return false;
    }
  }

  private static getDefaultDescription(type: BackupSnapshot['triggerType'], date: Date): string {
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    switch (type) {
      case 'auto_interval':
        return `Backup otomatis terjadwal (${timeStr})`;
      case 'circulation_change':
        return `Snapshot otomatis sirkulasi transaksi (${timeStr})`;
      case 'system_restore':
        return `Snapshot pra-pemulihan sistem (${timeStr})`;
      default:
        return `Backup manual pustakawan (${timeStr})`;
    }
  }
}
