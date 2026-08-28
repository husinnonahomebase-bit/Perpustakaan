import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  getAllBooks, 
  upsertBook, 
  deleteBook, 
  getAllMembers, 
  upsertMember, 
  deleteMember,
  getAllTransactions, 
  upsertTransaction, 
  getAllBranches, 
  getSyncLogs, 
  recordSyncLog,
  seedDatabaseIfEmpty 
} from './src/db/queries.ts';
import { optionalAuth, AuthRequest } from './src/middleware/auth.ts';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

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

  // Gemini Smart Book Analysis Endpoint
  app.post('/api/gemini/analyze-book', async (req, res) => {
    try {
      const { title, isbn, author, category, description } = req.body;
      if (!title && !isbn) {
        return res.status(400).json({ error: 'Judul atau ISBN buku harus disertakan untuk analisis.' });
      }

      const ai = getGeminiClient();
      const prompt = `Lakukan analisis literatur dan kurasi perpustakaan sekolah yang mendalam dan komprehensif untuk buku berikut:
Judul Buku: "${title || '-'}"
Nomor ISBN: "${isbn || '-'}"
Pengarang/Penulis: "${author || '-'}"
Kategori Awal: "${category || '-'}"
Deskripsi Singkat: "${description || '-'}"

Hasilkan data kurasi dalam format JSON terstruktur dengan bahasa Indonesia yang formal, edukatif, dan menarik untuk pustakawan serta siswa sekolah.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah seorang Kurator Pustaka Sekolah dan Pakar Sastra Perpustakaan Nasional Indonesia. Tugas Anda adalah memberikan analisis kurasi buku yang presisi, rekomendasi usia pembaca, analisis genre, nilai edukasi, dan ringkasan komprehensif.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Ringkasan esensial isi buku (2-3 paragraf deskriptif dalam Bahasa Indonesia)'
              },
              targetAge: {
                type: Type.STRING,
                description: 'Saran rentang usia pembaca (contoh: "12-15 Tahun (SMP)", "15-18 Tahun (SMA/SMK)", "Semua Umur")'
              },
              genreCategory: {
                type: Type.STRING,
                description: 'Kategori genre sastra/ilmiah spesifik buku (contoh: "Fiksi Ilmiah & Distopia", "Sains Populer & Astronomi")'
              },
              keyThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 sampai 5 tema sentral atau nilai moral dari buku tersebut'
              },
              contentRating: {
                type: Type.STRING,
                description: 'Rating konten perpustakaan (contoh: "SU (Semua Umur)", "13+ (Bimbingan Orang Tua/Guru)", "17+")'
              },
              educationalValue: {
                type: Type.STRING,
                description: 'Alasan nilai edukatif dan manfaat membaca buku ini bagi peserta didik'
              },
              shelfRecommendation: {
                type: Type.STRING,
                description: 'Saran klasifikasi DDC atau penempatan rak buku yang ideal di perpustakaan'
              }
            },
            required: ['summary', 'targetAge', 'genreCategory', 'keyThemes', 'contentRating', 'educationalValue', 'shelfRecommendation']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (error: any) {
      console.error('Error in POST /api/gemini/analyze-book:', error);
      res.status(500).json({ 
        error: error.message || 'Gagal menganalisis buku dengan Gemini AI.',
        fallbackSummary: 'Buku ini merupakan referensi literasi penting di perpustakaan sekolah.',
        fallbackTargetAge: '12-18 Tahun (Remaja & Dewasa)',
        fallbackGenre: 'Literasi Umum & Pengetahuan',
        fallbackKeyThemes: ['Edukasi', 'Pengembangan Diri', 'Literasi Membaca'],
        fallbackEducationalValue: 'Meningkatkan minat baca dan wawasan pengetahuan umum siswa.'
      });
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

  app.delete('/api/members/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await deleteMember(id);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Error in DELETE /api/members/:id:', error);
      res.status(500).json({ error: error.message || 'Failed to delete member' });
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
