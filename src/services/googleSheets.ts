// Google Sheets API Integration Service using Client-Side Bearer Token
import { Book, Transaction, Member } from '../types.ts';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export async function createLuminaSpreadsheet(accessToken: string, title: string = 'Lumina Library Management Live Data'): Promise<SpreadsheetInfo> {
  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Katalog Buku',
          gridProperties: { rowCount: 200, columnCount: 12 },
        },
      },
      {
        properties: {
          title: 'Sirkulasi Transaksi',
          gridProperties: { rowCount: 500, columnCount: 12 },
        },
      },
      {
        properties: {
          title: 'Daftar Anggota',
          gridProperties: { rowCount: 200, columnCount: 10 },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Sheets create error: ${res.status}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    title: data.properties?.title || title,
  };
}

export async function syncBooksToSheet(
  accessToken: string,
  spreadsheetId: string,
  books: Book[]
) {
  const header = ['ID Buku', 'ISBN', 'Judul Buku', 'Pengarang', 'Penerbit', 'Tahun', 'Kategori', 'Total Stok', 'Tersedia', 'Lokasi Rak', 'Rating', 'Tanggal Ditambahkan'];
  const rows = books.map((b) => [
    b.id,
    b.isbn,
    b.title,
    b.author,
    b.publisher,
    b.year,
    b.category,
    b.copiesTotal,
    b.copiesAvailable,
    b.shelfLocation,
    b.rating,
    b.addedAt,
  ]);

  const values = [header, ...rows];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Katalog Buku'!A1:L${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Katalog Buku'!A1:L${values.length}`,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Sheets sync error: ${res.status}`);
  }

  return await res.json();
}

export async function syncTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[]
) {
  const header = ['Kode Trx', 'Judul Buku', 'ISBN', 'Nama Anggota', 'No. Anggota', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Status', 'Denda (Rp)', 'Petugas', 'Catatan'];
  const rows = transactions.map((t) => [
    t.trxCode,
    t.bookTitle,
    t.bookIsbn,
    t.memberName,
    t.memberCode,
    t.borrowDate,
    t.dueDate,
    t.returnDate || '-',
    t.status,
    t.fineAmount,
    t.processedBy,
    t.notes || '-',
  ]);

  const values = [header, ...rows];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Sirkulasi Transaksi'!A1:L${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Sirkulasi Transaksi'!A1:L${values.length}`,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Sheets transaction sync error: ${res.status}`);
  }

  return await res.json();
}

export async function readSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string = "'Katalog Buku'!A1:L100"
) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Read sheet values error: ${res.status}`);
  }

  return await res.json();
}
