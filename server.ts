import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  getAllBooks, 
  upsertBook, 
  deleteBook, 
  getAllMembers, 
  upsertMember, 
  getAllTransactions, 
  upsertTransaction, 
  getAllBranches, 
  getSyncLogs, 
  recordSyncLog,
  seedDatabaseIfEmpty 
} from './src/db/queries.ts';
import { optionalAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Seed DB on start
  seedDatabaseIfEmpty().catch(() => {});

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'PostgreSQL Cloud SQL' });
  });

  // Books Endpoints
  app.get('/api/books', async (req, res) => {
    try {
      const books = await getAllBooks();
      res.json(books);
    } catch (error: any) {
      console.error('Error in GET /api/books:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch books' });
    }
  });

  app.post('/api/books', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const bookData = req.body;
      const savedBook = await upsertBook(bookData);
      res.json(savedBook);
    } catch (error: any) {
      console.error('Error in POST /api/books:', error);
      res.status(500).json({ error: error.message || 'Failed to save book' });
    }
  });

  app.delete('/api/books/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await deleteBook(id);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Error in DELETE /api/books/:id:', error);
      res.status(500).json({ error: error.message || 'Failed to delete book' });
    }
  });

  // Members Endpoints
  app.get('/api/members', async (req, res) => {
    try {
      const members = await getAllMembers();
      res.json(members);
    } catch (error: any) {
      console.error('Error in GET /api/members:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch members' });
    }
  });

  app.post('/api/members', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const memberData = req.body;
      const savedMember = await upsertMember(memberData);
      res.json(savedMember);
    } catch (error: any) {
      console.error('Error in POST /api/members:', error);
      res.status(500).json({ error: error.message || 'Failed to save member' });
    }
  });

  // Transactions Endpoints
  app.get('/api/transactions', async (req, res) => {
    try {
      const transactions = await getAllTransactions();
      res.json(transactions);
    } catch (error: any) {
      console.error('Error in GET /api/transactions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
    }
  });

  app.get('/api/transactions/export-csv', async (req, res) => {
    try {
      const transactions = await getAllTransactions();
      const statusLabels: Record<string, string> = {
        borrowed: 'DIPINJAM (Aktif)',
        overdue: 'TERLAMBAT (Jatuh Tempo)',
        returned: 'DIKEMBALIKAN',
        renewed: 'DIPERPANJANG',
      };
      const rows = transactions.map((t, index) => ({
        'No.': index + 1,
        'Kode Transaksi': t.trxCode,
        'Nama Peminjam': t.memberName,
        'Nomor Anggota': t.memberCode,
        'No. Kontak / HP': t.memberPhone || '-',
        'Judul Buku': t.bookTitle,
        'ISBN': t.bookIsbn,
        'Tanggal Pinjam': t.borrowDate,
        'Batas Jatuh Tempo': t.dueDate,
        'Tanggal Pengembalian': t.returnDate || '-',
        'Status Sirkulasi': statusLabels[t.status] || t.status.toUpperCase(),
        'Akumulasi Denda (Rp)': t.fineAmount,
        'Petugas Sirkulasi': t.processedBy,
        'Catatan': t.notes || '-',
      }));

      const headers = Object.keys(rows[0] || {});
      const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')];
      for (const row of rows) {
        const vals = headers.map(h => `"${('' + ((row as any)[h] ?? '')).replace(/"/g, '""')}"`);
        csvRows.push(vals.join(','));
      }
      const csvString = '\uFEFF' + csvRows.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Data_Transaksi_Sirkulasi_${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csvString);
    } catch (error: any) {
      console.error('Error in GET /api/transactions/export-csv:', error);
      res.status(500).json({ error: error.message || 'Failed to export CSV' });
    }
  });

  app.post('/api/transactions', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const trxData = req.body;
      const savedTrx = await upsertTransaction(trxData);
      res.json(savedTrx);
    } catch (error: any) {
      console.error('Error in POST /api/transactions:', error);
      res.status(500).json({ error: error.message || 'Failed to save transaction' });
    }
  });

  // Branches Endpoints (Google Maps)
  app.get('/api/branches', async (req, res) => {
    try {
      const branches = await getAllBranches();
      res.json(branches);
    } catch (error: any) {
      console.error('Error in GET /api/branches:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch branches' });
    }
  });

  // Sync Logs Endpoints
  app.get('/api/sync-logs', async (req, res) => {
    try {
      const logs = await getSyncLogs();
      res.json(logs);
    } catch (error: any) {
      console.error('Error in GET /api/sync-logs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch sync logs' });
    }
  });

  app.post('/api/sync-logs', async (req, res) => {
    try {
      const log = req.body;
      const savedLog = await recordSyncLog(log);
      res.json(savedLog);
    } catch (error: any) {
      console.error('Error in POST /api/sync-logs:', error);
      res.status(500).json({ error: error.message || 'Failed to record sync log' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumina Library Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
