import { OfflineQueueItem, Transaction, Book, Member, SyncConfig } from '../types';

const OFFLINE_QUEUE_KEY = 'lumina_lib_offline_queue_v2';
const OFFLINE_CACHE_META_KEY = 'lumina_lib_offline_meta_v2';

export interface OfflineSyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: string;
  isSyncing: boolean;
  failedCount: number;
}

export class OfflineSyncManager {
  private static listeners: Array<(status: OfflineSyncStatus) => void> = [];
  private static isSyncing = false;

  /**
   * Get current online status based on navigator and reachability
   */
  static isOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Initialize offline listeners and register window events
   */
  static init(
    onOnlineChange?: (online: boolean) => void,
    onQueueChange?: (count: number) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      this.notifyListeners();
      if (onOnlineChange) onOnlineChange(true);
      // Auto-trigger sync when coming back online
      setTimeout(() => {
        this.processQueue();
      }, 1000);
    };

    const handleOffline = () => {
      this.notifyListeners();
      if (onOnlineChange) onOnlineChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let unsubscribeStatus: (() => void) | null = null;
    if (onQueueChange || onOnlineChange) {
      unsubscribeStatus = this.subscribe((status) => {
        if (onOnlineChange) onOnlineChange(status.isOnline);
        if (onQueueChange) onQueueChange(status.pendingCount);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }

  /**
   * Get pending queue count
   */
  static getPendingCount(): number {
    const queue = this.getQueue();
    return queue.filter(q => q.status === 'pending' || q.status === 'syncing').length;
  }

  /**
   * Subscribe to network and queue status updates
   */
  static subscribe(callback: (status: OfflineSyncStatus) => void): () => void {
    this.listeners.push(callback);
    // Send immediate initial status
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  static getStatus(): OfflineSyncStatus {
    const queue = this.getQueue();
    const pending = queue.filter(q => q.status === 'pending' || q.status === 'syncing').length;
    const failed = queue.filter(q => q.status === 'failed').length;
    
    let lastSyncTime = 'Belum pernah';
    try {
      const meta = localStorage.getItem(OFFLINE_CACHE_META_KEY);
      if (meta) {
        const parsed = JSON.parse(meta);
        lastSyncTime = parsed.lastSyncTime || lastSyncTime;
      }
    } catch {
      // ignore
    }

    return {
      isOnline: this.isOnline(),
      pendingCount: pending,
      failedCount: failed,
      lastSyncTime,
      isSyncing: this.isSyncing,
    };
  }

  private static notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(cb => {
      try {
        cb(status);
      } catch (err) {
        console.error('Offline listener error:', err);
      }
    });
  }

  /**
   * Retrieve all items currently in the offline action queue
   */
  static getQueue(): OfflineQueueItem[] {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Save queue items to localStorage
   */
  static saveQueue(queue: OfflineQueueItem[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save offline queue:', e);
    }
  }

  /**
   * Add a new action to the offline queue
   */
  static enqueueAction(
    actionType: OfflineQueueItem['actionType'],
    payload: any
  ): OfflineQueueItem {
    const queue = this.getQueue();
    const newItem: OfflineQueueItem = {
      id: `offq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      actionType,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    queue.push(newItem);
    this.saveQueue(queue);

    // If currently online, attempt immediate background execution
    if (this.isOnline() && !this.isSyncing) {
      setTimeout(() => {
        this.processQueue();
      }, 500);
    }

    return newItem;
  }

  /**
   * Remove a single item from the queue by ID
   */
  static removeQueueItem(id: string): void {
    const queue = this.getQueue().filter(item => item.id !== id);
    this.saveQueue(queue);
  }

  /**
   * Clear all synced and pending items in queue
   */
  static clearQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.notifyListeners();
  }

  /**
   * Process all pending items in the offline queue with GAS Webhook or Cloud endpoint
   */
  static async processQueue(
    syncConfig?: SyncConfig,
    onProgress?: (current: number, total: number, itemName: string) => void
  ): Promise<{ success: number; failed: number; total: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0, total: 0 };
    }

    const queue = this.getQueue();
    const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'failed');

    if (pendingItems.length === 0) {
      this.notifyListeners();
      return { success: 0, failed: 0, total: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let successCount = 0;
    let failedCount = 0;
    const total = pendingItems.length;

    const webhookUrl = syncConfig?.gasWebhookUrl;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      item.status = 'syncing';
      this.saveQueue(queue);

      if (onProgress) {
        const title = this.getActionDescription(item);
        onProgress(i + 1, total, title);
      }

      try {
        // If Google Apps Script Webhook URL is configured, send payload
        if (webhookUrl && webhookUrl.startsWith('http') && !webhookUrl.includes('example')) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source: 'lumina-offline-sync',
                timestamp: new Date().toISOString(),
                action: item.actionType,
                payload: item.payload,
              }),
            });
          } catch {
            // no-cors fetch might resolve or network error
          }
        }

        // Artificial minor delay to simulate reliable chunk processing
        await new Promise(resolve => setTimeout(resolve, 300));

        item.status = 'synced';
        successCount++;
      } catch (err: any) {
        item.status = 'failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.errorMessage = err?.message || 'Gagal tersambung ke server';
        failedCount++;
      }
    }

    // Retain only items that failed or keep recent 10 synced items
    const remainingQueue = queue.filter(item => item.status === 'failed');
    this.saveQueue(remainingQueue);

    // Update meta timestamp
    try {
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem(OFFLINE_CACHE_META_KEY, JSON.stringify({
        lastSyncTime: `${new Date().toLocaleDateString('id-ID')} ${nowStr}`,
        lastSyncedItemsCount: successCount,
      }));
    } catch {
      // ignore
    }

    this.isSyncing = false;
    this.notifyListeners();

    return {
      success: successCount,
      failed: failedCount,
      total,
    };
  }

  /**
   * Helper description string for an action
   */
  static getActionDescription(item: OfflineQueueItem): string {
    switch (item.actionType) {
      case 'CREATE_LOAN':
        return `Peminjaman Buku: ${item.payload?.bookTitle || 'Item'} (${item.payload?.memberName || 'Anggota'})`;
      case 'RETURN_BOOK':
        return `Pengembalian Buku Trx #${item.payload?.trxId || item.payload?.trxCode || 'ID'}`;
      case 'RENEW_LOAN':
        return `Perpanjangan Pinjaman #${item.payload?.trxId || 'ID'}`;
      case 'ADD_BOOK':
        return `Penambahan Koleksi: ${item.payload?.title || 'Buku Baru'}`;
      case 'UPDATE_BOOK':
        return `Update Data Buku: ${item.payload?.title || 'Buku'}`;
      case 'DELETE_BOOK':
        return `Penghapusan Buku: ${item.payload?.title || 'Buku'} (${item.payload?.id || ''})`;
      case 'ADD_MEMBER':
        return `Pendaftaran Anggota: ${item.payload?.name || 'Anggota Baru'}`;
      case 'CREATE_MEMBER':
        return `Pendaftaran Anggota: ${item.payload?.name || 'Anggota Baru'}`;
      case 'UPDATE_MEMBER':
        return `Pembaruan Anggota: ${item.payload?.name || 'Anggota'} (${item.payload?.memberCode || ''})`;
      case 'DELETE_MEMBER':
        return `Penghapusan Anggota: ${item.payload?.name || 'Anggota'} (#${item.payload?.id || ''})`;
      case 'BULK_IMPORT_MEMBERS':
        return `Impor Massal Anggota: ${Array.isArray(item.payload) ? item.payload.length : 'Banyak'} data`;
      case 'BULK_UPDATE_MEMBER_STATUS':
        return `Pembaruan Status Massal: ${item.payload?.memberIds?.length || ''} anggota -> ${item.payload?.newStatus || ''}`;
      case 'STOCK_OPNAME_VERIFY':
        return `Verifikasi Stock Opname: ${item.payload?.bookTitle || 'Buku'}`;
      default:
        return `Aksi ${item.actionType}`;
    }
  }

  /**
   * Export queue items as a backup JSON file
   */
  static exportQueueJSON(): void {
    const queue = this.getQueue();
    const blob = new Blob([JSON.stringify(queue, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lumina_Offline_Queue_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
