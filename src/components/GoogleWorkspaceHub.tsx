import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  HardDrive, 
  Mail, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Download, 
  FolderPlus, 
  Clock, 
  ShieldCheck,
  Sparkles,
  Database
} from 'lucide-react';
import { Book, Transaction, Member } from '../types.ts';
import { createLuminaSpreadsheet, syncBooksToSheet, syncTransactionsToSheet } from '../services/googleSheets.ts';
import { listDriveFiles, uploadJsonToDrive, createDriveFolder, DriveFile } from '../services/googleDrive.ts';
import { sendGmailNotice, generateOverdueEmailHtml } from '../services/gmail.ts';
import { signInWithGoogle, getCachedAccessToken } from '../lib/firebase.ts';

interface GoogleWorkspaceHubProps {
  books: Book[];
  transactions: Transaction[];
  members: Member[];
  onRefreshData?: () => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  books,
  transactions,
  members,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'drive' | 'gmail'>('sheets');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Gmail Sender State
  const [selectedRecipient, setSelectedRecipient] = useState<string>(members[0]?.email || '');
  const [emailSubject, setEmailSubject] = useState<string>('Pemberitahuan Perpustakaan: Buku Jatuh Tempo');
  const [emailBody, setEmailBody] = useState<string>('Halo, mohon segera mengembalikan buku yang dipinjam ke perpustakaan.');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const getValidToken = async (): Promise<string> => {
    let token = getCachedAccessToken();
    if (!token) {
      const authRes = await signInWithGoogle();
      token = authRes?.accessToken || null;
    }
    if (!token) {
      throw new Error('Silakan Masuk dengan Akun Google untuk mengakses Google Workspace.');
    }
    return token;
  };

  // Google Sheets Handlers
  const handleCreateAndSyncSheet = async () => {
    try {
      setIsSyncingSheets(true);
      setStatusMessage({ type: 'info', text: 'Menghubungkan ke Google Sheets API...' });
      const token = await getValidToken();

      let targetSheetId = spreadsheetId;
      let targetSheetUrl = spreadsheetUrl;

      if (!targetSheetId) {
        const newSheet = await createLuminaSpreadsheet(token, `Lumina Library Data - ${new Date().toLocaleDateString('id-ID')}`);
        targetSheetId = newSheet.spreadsheetId;
        targetSheetUrl = newSheet.spreadsheetUrl;
        setSpreadsheetId(targetSheetId);
        setSpreadsheetUrl(targetSheetUrl);
      }

      await syncBooksToSheet(token, targetSheetId, books);
      await syncTransactionsToSheet(token, targetSheetId, transactions);

      setStatusMessage({
        type: 'success',
        text: `Berhasil menyinkronkan ${books.length} buku dan ${transactions.length} transaksi ke Google Sheets!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal sinkronisasi ke Google Sheets.' });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Google Drive Handlers
  const handleLoadDriveFiles = async () => {
    try {
      setIsLoadingDrive(true);
      const token = await getValidToken();
      const files = await listDriveFiles(token);
      setDriveFiles(files);
      setStatusMessage({ type: 'success', text: `Ditemukan ${files.length} berkas di Google Drive.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal membaca Google Drive.' });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleBackupToDrive = async () => {
    try {
      setIsExportingDrive(true);
      setStatusMessage({ type: 'info', text: 'Mengunggah cadangan data perpustakaan ke Google Drive...' });
      const token = await getValidToken();

      const backupPayload = {
        app: 'Lumina Library Management System',
        exportedAt: new Date().toISOString(),
        totalBooks: books.length,
        totalMembers: members.length,
        totalTransactions: transactions.length,
        books,
        members,
        transactions,
      };

      const fileName = `Lumina_Library_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      const uploadedFile = await uploadJsonToDrive(token, fileName, backupPayload);

      setStatusMessage({
        type: 'success',
        text: `Berkas cadangan "${uploadedFile.name}" berhasil disimpan ke Google Drive!`,
      });
      handleLoadDriveFiles();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mencadangkan ke Google Drive.' });
    } finally {
      setIsExportingDrive(false);
    }
  };

  // Gmail Handlers
  const handleSendOverdueNotice = async (trx: Transaction) => {
    try {
      setIsSendingEmail(true);
      const token = await getValidToken();

      const member = members.find((m) => m.id === trx.memberId);
      const targetEmail = member?.email || trx.memberPhone || 'perpustakaan@lumina.edu';

      const emailHtml = generateOverdueEmailHtml(
        trx.memberName,
        trx.bookTitle,
        trx.dueDate,
        trx.fineAmount,
        trx.trxCode
      );

      await sendGmailNotice(token, {
        to: targetEmail,
        subject: `[PERINGATAN JATUH TEMPO] Pengembalian Buku "${trx.bookTitle}" - Perpustakaan Lumina`,
        bodyHtml: emailHtml,
      });

      setStatusMessage({
        type: 'success',
        text: `Surat peringatan jatuh tempo via Gmail berhasil dikirim ke ${targetEmail}!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mengirim email via Gmail.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const overdueTransactions = transactions.filter((t) => t.status === 'overdue');

  return (
    <div id="google-workspace-hub" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Workspace Native Integration Suite</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Google Drive, Sheets & Gmail Cloud Hub
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Sinkronisasi data katalog secara real-time ke Google Spreadsheet, backup otomatis ke Google Drive, dan kirim surat peringatan sirkulasi via Gmail resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateAndSyncSheet}
              disabled={isSyncingSheets}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Sinkronkan Google Sheets'}</span>
            </button>
            <button
              onClick={handleBackupToDrive}
              disabled={isExportingDrive}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              <span>{isExportingDrive ? 'Cadangkan...' : 'Backup ke Drive'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('sheets')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'sheets'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Sheets Live Data ({books.length} Buku, {transactions.length} Trx)</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('drive');
            handleLoadDriveFiles();
          }}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'drive'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive Cloud Storage</span>
        </button>
        <button
          onClick={() => setActiveSubTab('gmail')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'gmail'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail Overdue Dispatcher ({overdueTransactions.length} Jatuh Tempo)</span>
        </button>
      </div>

      {/* Subtab Content */}
      {activeSubTab === 'sheets' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Google Spreadsheet Data Stream
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sinkronisasi langsung tabel `Katalog Buku` dan `Sirkulasi Transaksi` ke Google Sheets.
                </p>
              </div>

              {spreadsheetUrl ? (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Google Spreadsheet</span>
                </a>
              ) : (
                <button
                  onClick={handleCreateAndSyncSheet}
                  disabled={isSyncingSheets}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                  <span>Buat & Sinkronkan Spreadsheet Baru</span>
                </button>
              )}
            </div>

            {/* Quick Preview Table */}
            <div className="mt-6 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-100 dark:border-slate-800 font-semibold text-xs text-slate-600 dark:text-slate-300 uppercase tracking-wider flex justify-between items-center">
                <span>Pratinjau Data Sinkronisasi ({books.length} Judul Buku)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Auto-Format GSheets</span>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-3">ISBN</th>
                      <th className="p-3">Judul Buku</th>
                      <th className="p-3">Pengarang</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3 text-center">Stok</th>
                      <th className="p-3">Lokasi Rak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {books.slice(0, 6).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-slate-500">{b.isbn}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{b.title}</td>
                        <td className="p-3">{b.author}</td>
                        <td className="p-3">{b.category}</td>
                        <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{b.copiesAvailable}/{b.copiesTotal}</td>
                        <td className="p-3 font-mono">{b.shelfLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab Drive */}
      {activeSubTab === 'drive' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Google Drive Cloud Backup & Arsip
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Arsipkan seluruh riwayat sirkulasi dan katalog ke Google Drive pribadi/institusi.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadDriveFiles}
                  disabled={isLoadingDrive}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                  <span>Segarkan Drive</span>
                </button>
                <button
                  onClick={handleBackupToDrive}
                  disabled={isExportingDrive}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Cadangkan Sekarang</span>
                </button>
              </div>
            </div>

            {/* File List */}
            <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {driveFiles.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <HardDrive className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Klik "Segarkan Drive" untuk memuat daftar berkas Google Drive Anda.</p>
                </div>
              ) : (
                driveFiles.map((file) => (
                  <div key={file.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        📄
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
                        <p className="text-[11px] text-slate-400">Tipe: {file.mimeType}</p>
                      </div>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka di Drive</span>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab Gmail */}
      {activeSubTab === 'gmail' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Pengiriman Surat Peringatan Sirkulasi via Gmail
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kirim notifikasi jatuh tempo otomatis atau manual ke email siswa/guru langsung melalui akun Gmail terverifikasi.
            </p>

            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daftar Transaksi Jatuh Tempo ({overdueTransactions.length})
              </h4>

              {overdueTransactions.length === 0 ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tidak ada peminjaman buku yang melewati tanggal jatuh tempo hari ini.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueTransactions.map((trx) => (
                    <div
                      key={trx.id}
                      className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
                          <span className="font-mono">{trx.trxCode}</span>
                          <span>•</span>
                          <span>{trx.memberName}</span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{trx.bookTitle}</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                          Jatuh Tempo: <strong className="text-rose-600">{trx.dueDate}</strong> | Denda: <strong>Rp {trx.fineAmount.toLocaleString('id-ID')}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleSendOverdueNotice(trx)}
                        disabled={isSendingEmail}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Surat via Gmail</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
