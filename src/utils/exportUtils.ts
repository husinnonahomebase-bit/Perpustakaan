import { jsPDF } from 'jspdf';
import { Book, Member, Transaction, SchoolProfile } from '../types';

export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map(header => `"${header}"`).join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // Add BOM for Excel UTF-8 support
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTransactionsToPDF(
  transactions: Transaction[], 
  school: SchoolProfile, 
  title: string = 'LAPORAN REKAPITULASI SIRKULASI PERPUSTAKAAN'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header / Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(school.schoolName.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`NPSN: ${school.npsn} | Kode Perpustakaan: ${school.libraryCode}`, pageWidth / 2, 24, { align: 'center' });
  doc.text(school.address + ', ' + school.city, pageWidth / 2, 29, { align: 'center' });
  doc.text(`Email: ${school.email} | Telp: ${school.phone}`, pageWidth / 2, 34, { align: 'center' });

  // Divider Line
  doc.setDrawColor(16, 185, 129); // Emerald-500
  doc.setLineWidth(0.8);
  doc.line(14, 38, pageWidth - 14, 38);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(14, 39.5, pageWidth - 14, 39.5);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, pageWidth / 2, 48, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const nowStr = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.text(`Dicetak pada: ${nowStr} oleh Sistem Lumina Cloud`, pageWidth / 2, 53, { align: 'center' });

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 58, pageWidth - 28, 16, 2, 2, 'F');
  
  const totalTrx = transactions.length;
  const activeTrx = transactions.filter(t => t.status === 'borrowed').length;
  const overdueTrx = transactions.filter(t => t.status === 'overdue').length;
  const returnedTrx = transactions.filter(t => t.status === 'returned').length;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Transaksi: ${totalTrx}`, 20, 68);
  doc.setTextColor(16, 185, 129);
  doc.text(`Dipinjam: ${activeTrx}`, 65, 68);
  doc.setTextColor(239, 68, 68);
  doc.text(`Terlambat: ${overdueTrx}`, 110, 68);
  doc.setTextColor(59, 130, 246);
  doc.text(`Dikembalikan: ${returnedTrx}`, 155, 68);

  // Table Headers
  let startY = 82;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, startY - 5, pageWidth - 28, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, startY);
  doc.text('No. Transaksi', 24, startY);
  doc.text('Peminjam / Anggota', 52, startY);
  doc.text('Judul Buku', 95, startY);
  doc.text('Tgl Pinjam', 140, startY);
  doc.text('Batas Tempo', 162, startY);
  doc.text('Status', 184, startY);

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let currentY = startY + 6;

  transactions.slice(0, 25).forEach((t, index) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    // Alternate background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY - 4, pageWidth - 28, 6.5, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(`${index + 1}`, 16, currentY);
    doc.text(t.trxCode, 24, currentY);
    
    // Truncate long names
    const memName = t.memberName.length > 20 ? t.memberName.substring(0, 19) + '..' : t.memberName;
    doc.text(memName, 52, currentY);
    
    const bTitle = t.bookTitle.length > 24 ? t.bookTitle.substring(0, 23) + '..' : t.bookTitle;
    doc.text(bTitle, 95, currentY);

    doc.text(t.borrowDate, 140, currentY);
    doc.text(t.dueDate, 162, currentY);

    // Status label
    if (t.status === 'borrowed') {
      doc.setTextColor(16, 185, 129);
      doc.text('DIPINJAM', 184, currentY);
    } else if (t.status === 'overdue') {
      doc.setTextColor(220, 38, 38);
      doc.text('TERLAMBAT', 184, currentY);
    } else {
      doc.setTextColor(59, 130, 246);
      doc.text('KEMBALI', 184, currentY);
    }

    currentY += 6.5;
  });

  // Footer Signatures
  const footerY = Math.max(currentY + 15, 235);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  // Left Sign: Kepala Perpustakaan
  doc.text('Mengetahui,', 25, footerY);
  doc.text('Kepala Perpustakaan', 25, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, 25, footerY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NIP. 19850412 200902 2 004', 25, footerY + 33);

  // Right Sign: Kepala Sekolah
  doc.setFontSize(9);
  doc.text(`${school.city}, ${nowStr}`, pageWidth - 75, footerY);
  doc.text('Kepala Sekolah', pageWidth - 75, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.principalName, pageWidth - 75, footerY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NIP. 19710318 199703 1 002', pageWidth - 75, footerY + 33);

  doc.save(`Laporan_Sirkulasi_Lumina_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportCatalogToPDF(books: Book[], school: SchoolProfile) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(school.schoolName.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('DAFTAR INDEKS KATALOG BUKU & ARSIP KOLEKSI', pageWidth / 2, 25, { align: 'center' });

  // Divider
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(14, 30, pageWidth - 14, 30);

  // Table
  let startY = 40;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, startY - 5, pageWidth - 28, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, startY);
  doc.text('ISBN / ID', 24, startY);
  doc.text('Judul Buku', 60, startY);
  doc.text('Penulis / Pengarang', 115, startY);
  doc.text('Kategori', 155, startY);
  doc.text('Stok / Rak', 182, startY);

  doc.setFont('helvetica', 'normal');
  let currentY = startY + 6;

  books.forEach((b, index) => {
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY - 4, pageWidth - 28, 6.5, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(`${index + 1}`, 16, currentY);
    doc.text(b.isbn, 24, currentY);
    doc.text(b.title.length > 28 ? b.title.substring(0, 27) + '..' : b.title, 60, currentY);
    doc.text(b.author.length > 22 ? b.author.substring(0, 21) + '..' : b.author, 115, currentY);
    doc.text(b.category, 155, currentY);
    doc.text(`${b.copiesAvailable}/${b.copiesTotal} (${b.shelfLocation.split(' ')[1] || b.shelfLocation})`, 182, currentY);

    currentY += 6.5;
  });

  doc.save(`Katalog_Buku_Lumina_${new Date().toISOString().slice(0, 10)}.pdf`);
}
