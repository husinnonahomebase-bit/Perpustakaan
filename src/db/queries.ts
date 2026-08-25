import { db } from './index.ts';
import { books, members, transactions, branches, syncLogs, users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { INITIAL_BOOKS, INITIAL_MEMBERS, INITIAL_TRANSACTIONS } from '../data/mockData.ts';

// Initial Branches Data for Google Maps
export const INITIAL_BRANCHES = [
  {
    id: 'br-001',
    name: 'Perpustakaan Pusat SMA Negeri Lumina Bangsa',
    code: 'LMN-HQ-01',
    type: 'Main Library',
    address: 'Jl. Merdeka Cendekia No. 45, Kebayoran Baru',
    city: 'Jakarta Selatan',
    lat: -6.2415,
    lng: 106.8005,
    phone: '(021) 789-2041',
    openHours: '07:30 - 16:00 WIB',
    capacity: 12000,
    booksCount: 5400,
    librarianInCharge: 'Siti Rahmawati, S.I.Pust.',
    status: 'Operational',
    services: ['Sirkulasi Fisik', 'Studio Audio Visual', 'Laboratorium Digital', 'Koleksi Langka', 'Ruang Diskusi'],
  },
  {
    id: 'br-002',
    name: 'Lumina Smart Locker & Kios Pengembalian Mandiri',
    code: 'LMN-LKR-02',
    type: 'Smart Locker & Drop Box',
    address: 'Gedung Laboratorium Terpadu Lt. 1, Sayap Timur',
    city: 'Jakarta Selatan',
    lat: -6.2435,
    lng: 106.8030,
    phone: '(021) 789-2045',
    openHours: '24 Jam (Akses Kartu RFID)',
    capacity: 1500,
    booksCount: 800,
    librarianInCharge: 'Rian Hidayat (Staff Teknis)',
    status: 'Operational',
    services: ['Drop Box 24/7', 'Self Pick-up RFID', 'Barcode Kiosk', 'Fast Return'],
  },
  {
    id: 'br-003',
    name: 'Pojok Baca Komunitas & Taman Literasi Blok M',
    code: 'LMN-OUT-03',
    type: 'Community Reading Hub',
    address: 'Taman Literasi Martha Christina Tiahahu, Blok M',
    city: 'Jakarta Selatan',
    lat: -6.2442,
    lng: 106.7975,
    phone: '(021) 720-9912',
    openHours: '09:00 - 20:00 WIB',
    capacity: 3000,
    booksCount: 1650,
    librarianInCharge: 'Ahmad Fauzi, S.Kom.',
    status: 'Operational',
    services: ['Peminjaman Komunitas', 'Aktivitas Diskusi Literasi', 'Free Wi-Fi', 'Outdoor Reading'],
  },
  {
    id: 'br-004',
    name: 'Lumina Mobile Library Bus (Pustaka Keliling Senayan)',
    code: 'LMN-BUS-04',
    type: 'Mobile Library Bus',
    address: 'Plaza Parkir Timur Gelora Bung Karno, Senayan',
    city: 'Jakarta Pusat',
    lat: -6.2185,
    lng: 106.8028,
    phone: '(021) 789-2049',
    openHours: 'Sabtu - Minggu: 06:30 - 12:00 WIB',
    capacity: 2500,
    booksCount: 1200,
    librarianInCharge: 'Dedi Kurniawan',
    status: 'Operational',
    services: ['Pustaka Bergerak', 'Pendaftaran Anggota', 'Workshop Membaca Cepat', 'Donasi Buku'],
  },
];

// Seed Helper
export async function seedDatabaseIfEmpty() {
  try {
    const existingBooks = await db.select().from(books).limit(1);
    if (existingBooks.length === 0) {
      for (const b of INITIAL_BOOKS) {
        await db.insert(books).values({
          id: b.id,
          isbn: b.isbn,
          title: b.title,
          author: b.author,
          publisher: b.publisher,
          year: b.year,
          category: b.category,
          copiesTotal: b.copiesTotal,
          copiesAvailable: b.copiesAvailable,
          coverImage: b.coverImage,
          shelfLocation: b.shelfLocation,
          description: b.description,
          rating: b.rating,
          isFeatured: b.isFeatured || false,
          tags: b.tags,
          addedAt: b.addedAt,
        }).onConflictDoNothing();
      }
    }

    const existingMembers = await db.select().from(members).limit(1);
    if (existingMembers.length === 0) {
      for (const m of INITIAL_MEMBERS) {
        await db.insert(members).values({
          id: m.id,
          memberCode: m.memberCode,
          name: m.name,
          email: m.email,
          phone: m.phone,
          avatar: m.avatar,
          role: m.role,
          classOrDept: m.classOrDept,
          joinedDate: m.joinedDate,
          status: m.status,
          activeLoansCount: m.activeLoansCount,
          totalFinesUnpaid: m.totalFinesUnpaid,
          maxBorrowLimit: m.maxBorrowLimit,
        }).onConflictDoNothing();
      }
    }

    const existingTrx = await db.select().from(transactions).limit(1);
    if (existingTrx.length === 0) {
      for (const t of INITIAL_TRANSACTIONS) {
        await db.insert(transactions).values({
          id: t.id,
          trxCode: t.trxCode,
          bookId: t.bookId,
          bookTitle: t.bookTitle,
          bookIsbn: t.bookIsbn,
          bookCover: t.bookCover,
          memberId: t.memberId,
          memberName: t.memberName,
          memberCode: t.memberCode,
          memberAvatar: t.memberAvatar,
          memberPhone: t.memberPhone || '',
          borrowDate: t.borrowDate,
          dueDate: t.dueDate,
          returnDate: t.returnDate || null,
          status: t.status,
          fineAmount: t.fineAmount,
          notes: t.notes || '',
          processedBy: t.processedBy,
        }).onConflictDoNothing();
      }
    }

    const existingBranches = await db.select().from(branches).limit(1);
    if (existingBranches.length === 0) {
      for (const br of INITIAL_BRANCHES) {
        await db.insert(branches).values(br).onConflictDoNothing();
      }
    }
  } catch {
    // Seeding handled gracefully
  }
}

// Book Queries
export async function getAllBooks() {
  try {
    return await db.select().from(books).orderBy(desc(books.createdAt));
  } catch (error) {
    console.error('getAllBooks query error:', error);
    throw new Error('Gagal mengambil daftar buku dari database.', { cause: error });
  }
}

export async function upsertBook(bookData: typeof books.$inferInsert) {
  try {
    const res = await db.insert(books)
      .values(bookData)
      .onConflictDoUpdate({
        target: books.id,
        set: {
          isbn: bookData.isbn,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher,
          year: bookData.year,
          category: bookData.category,
          copiesTotal: bookData.copiesTotal,
          copiesAvailable: bookData.copiesAvailable,
          coverImage: bookData.coverImage,
          shelfLocation: bookData.shelfLocation,
          description: bookData.description,
          rating: bookData.rating,
          tags: bookData.tags,
        },
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('upsertBook error:', error);
    throw new Error('Gagal menyimpan buku ke database.', { cause: error });
  }
}

export async function deleteBook(id: string) {
  try {
    return await db.delete(books).where(eq(books.id, id));
  } catch (error) {
    console.error('deleteBook error:', error);
    throw new Error('Gagal menghapus buku dari database.', { cause: error });
  }
}

// Member Queries
export async function getAllMembers() {
  try {
    return await db.select().from(members).orderBy(desc(members.createdAt));
  } catch (error) {
    console.error('getAllMembers query error:', error);
    throw new Error('Gagal mengambil data anggota dari database.', { cause: error });
  }
}

export async function upsertMember(memberData: typeof members.$inferInsert) {
  try {
    const res = await db.insert(members)
      .values(memberData)
      .onConflictDoUpdate({
        target: members.id,
        set: {
          memberCode: memberData.memberCode,
          name: memberData.name,
          email: memberData.email,
          phone: memberData.phone,
          avatar: memberData.avatar,
          role: memberData.role,
          classOrDept: memberData.classOrDept,
          status: memberData.status,
          activeLoansCount: memberData.activeLoansCount,
          totalFinesUnpaid: memberData.totalFinesUnpaid,
        },
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('upsertMember error:', error);
    throw new Error('Gagal menyimpan anggota ke database.', { cause: error });
  }
}

// Transaction Queries
export async function getAllTransactions() {
  try {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  } catch (error) {
    console.error('getAllTransactions query error:', error);
    throw new Error('Gagal mengambil riwayat transaksi dari database.', { cause: error });
  }
}

export async function upsertTransaction(trxData: typeof transactions.$inferInsert) {
  try {
    const res = await db.insert(transactions)
      .values(trxData)
      .onConflictDoUpdate({
        target: transactions.id,
        set: {
          status: trxData.status,
          returnDate: trxData.returnDate,
          fineAmount: trxData.fineAmount,
          notes: trxData.notes,
        },
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('upsertTransaction error:', error);
    throw new Error('Gagal menyimpan transaksi ke database.', { cause: error });
  }
}

// Branches Queries (Google Maps)
export async function getAllBranches() {
  try {
    return await db.select().from(branches).orderBy(branches.name);
  } catch (error) {
    console.error('getAllBranches error:', error);
    throw new Error('Gagal mengambil lokasi cabang perpustakaan.', { cause: error });
  }
}

// Sync Log Queries
export async function recordSyncLog(log: typeof syncLogs.$inferInsert) {
  try {
    const res = await db.insert(syncLogs).values(log).returning();
    return res[0];
  } catch (error) {
    console.error('recordSyncLog error:', error);
    return null;
  }
}

export async function getSyncLogs() {
  try {
    return await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(50);
  } catch (error) {
    console.error('getSyncLogs error:', error);
    return [];
  }
}
