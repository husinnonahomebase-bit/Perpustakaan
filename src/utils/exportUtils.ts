import { jsPDF } from 'jspdf';
import { Book, Member, Transaction, SchoolProfile } from '../types';

export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','));

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
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'Data_Transaksi_Sirkulasi_Lumina') {
  if (!transactions || !transactions.length) {
    return false;
  }

  const statusLabels: Record<string, string> = {
    borrowed: 'DIPINJAM (Aktif)',
    overdue: 'TERLAMBAT (Jatuh Tempo)',
    returned: 'DIKEMBALIKAN',
    renewed: 'DIPERPANJANG',
  };

  const formattedRows = transactions.map((t, index) => ({
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

  exportToCSV(formattedRows, filename);
  return true;
}

export function exportMonthlyReportToCSV(
  monthName: string,
  year: number,
  transactions: Transaction[],
  summary: { totalBorrows: number; totalReturns: number; totalOverdue: number; totalFines: number }
) {
  const metaRows = [
    { 'Keterangan': 'LAPORAN BULANAN SIRKULASI PERPUSTAKAAN', 'Nilai': `${monthName.toUpperCase()} ${year}` },
    { 'Keterangan': 'Total Peminjaman', 'Nilai': summary.totalBorrows },
    { 'Keterangan': 'Total Pengembalian', 'Nilai': summary.totalReturns },
    { 'Keterangan': 'Transaksi Terlambat', 'Nilai': summary.totalOverdue },
    { 'Keterangan': 'Total Akumulasi Denda (Rp)', 'Nilai': `Rp ${summary.totalFines.toLocaleString('id-ID')}` },
    { 'Keterangan': 'Tanggal Cetak', 'Nilai': new Date().toLocaleString('id-ID') },
    { 'Keterangan': '---', 'Nilai': '---' }
  ];

  const statusLabels: Record<string, string> = {
    borrowed: 'DIPINJAM',
    overdue: 'TERLAMBAT',
    returned: 'DIKEMBALIKAN',
    renewed: 'DIPERPANJANG',
  };

  const trxRows = transactions.map((t, idx) => ({
    'No.': idx + 1,
    'Kode Trx': t.trxCode,
    'Nama Peminjam': t.memberName,
    'No. Anggota': t.memberCode,
    'Judul Buku': t.bookTitle,
    'Tgl Pinjam': t.borrowDate,
    'Jatuh Tempo': t.dueDate,
    'Tgl Kembali': t.returnDate || '-',
    'Status': statusLabels[t.status] || t.status,
    'Denda (Rp)': t.fineAmount,
    'Petugas': t.processedBy,
  }));

  exportToCSV([...metaRows, ...trxRows], `Laporan_Bulanan_${monthName}_${year}`);
  return true;
}

/**
 * Helper to render standard School Letterhead (Kop Surat Resmi) in PDF
 * Dynamically fetches County Logo (Left) and School Logo (Right) from the current SchoolProfile
 */
export function renderSchoolHeader(doc: jsPDF, school: SchoolProfile, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const kop = school.kopSurat;

  let currentY = 14;

  // Resolve County/Kabupaten Logo (Left) and School Logo (Right)
  const leftLogo = kop?.logoLeftUrl || (kop?.enabled ? '' : school.logoUrl);
  const rightLogo = kop?.logoRightUrl || school.logoUrl;

  if (kop && kop.enabled) {
    // 1. Draw Left County/Kabupaten Logo if present
    if (leftLogo && (leftLogo.startsWith('data:image/') || leftLogo.startsWith('http'))) {
      try {
        const format = leftLogo.startsWith('data:image/jpeg') || leftLogo.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
        doc.addImage(leftLogo, format, 14, 10, 18, 18);
      } catch (e) {
        console.warn('PDF Header Left County Logo could not be rendered', e);
      }
    }

    // 2. Draw Right School Logo if present
    if (rightLogo && (rightLogo.startsWith('data:image/') || rightLogo.startsWith('http'))) {
      try {
        const format = rightLogo.startsWith('data:image/jpeg') || rightLogo.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
        doc.addImage(rightLogo, format, pageWidth - 32, 10, 18, 18);
      } catch (e) {
        console.warn('PDF Header Right School Logo could not be rendered', e);
      }
    }

    // Custom Official Indonesian Letterhead (Kop Surat)
    if (kop.governingBody) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const lines = kop.governingBody.split('\n');
      lines.forEach((line) => {
        doc.text(line.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 4.5;
      });
    }

    // Institution Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42);
    doc.text((kop.institutionName || school.schoolName).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    // Unit / Library Name
    if (kop.unitName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(kop.unitName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    }

    // Address & Contact Lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(kop.addressLine || `${school.address}, ${school.city}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3.5;
    doc.text(kop.contactLine || `Telp: ${school.phone} | Email: ${school.email}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3;

    // Boundary Line
    if (kop.borderStyle === 'double') {
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.8);
      doc.line(14, currentY, pageWidth - 14, currentY);
      doc.setLineWidth(0.25);
      doc.line(14, currentY + 1.2, pageWidth - 14, currentY + 1.2);
      currentY += 5;
    } else if (kop.borderStyle === 'emerald') {
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.9);
      doc.line(14, currentY, pageWidth - 14, currentY);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, currentY + 1.2, pageWidth - 14, currentY + 1.2);
      currentY += 5;
    } else {
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(1.0);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 5;
    }
  } else {
    // Default Header with Logos
    if (school.logoUrl && (school.logoUrl.startsWith('data:image/') || school.logoUrl.startsWith('http'))) {
      try {
        const format = school.logoUrl.startsWith('data:image/jpeg') || school.logoUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
        doc.addImage(school.logoUrl, format, 14, 14, 16, 16);
      } catch (e) {
        console.warn('PDF Header School Logo could not be rendered', e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(school.schoolName.toUpperCase(), pageWidth / 2, 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`NPSN: ${school.npsn} | Kode Perpustakaan: ${school.libraryCode}`, pageWidth / 2, 21, { align: 'center' });
    doc.text(`${school.address}, ${school.city}, ${school.province}`, pageWidth / 2, 26, { align: 'center' });
    doc.text(`Website: ${school.website} | Email: ${school.email} | Telp: ${school.phone}`, pageWidth / 2, 31, { align: 'center' });

    // Double Decorative Line
    doc.setDrawColor(16, 185, 129); // Emerald
    doc.setLineWidth(0.8);
    doc.line(14, 35, pageWidth - 14, 35);
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.3);
    doc.line(14, 36.5, pageWidth - 14, 36.5);
    currentY = 43;
  }

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, pageWidth / 2, currentY + 5, { align: 'center' });
    return currentY + 12;
  }

  return currentY + 8;
}

/**
 * UJI CETAK PRATINJAU DOKUMEN KOP SURAT RESMI (PDF TEST EXPORT)
 */
export function exportSampleLetterheadPDF(school: SchoolProfile) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const title = 'SURAT KETERANGAN RESMI PERPUSTAKAAN (CONTOH FORMAT KOP SURAT)';
  const subtitle = `Nomor: ${school.libraryCode}/SK-SAMPLE/${new Date().getFullYear()} | Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const currentY = renderSchoolHeader(doc, school, title, subtitle);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  doc.text(
    `Dokumen ini merupakan contoh resmi penerapan Kop Surat, Logo Kabupaten/Pemerintah Daerah (Sisi Kiri), dan Logo Sekolah/Instansi (Sisi Kanan) yang digenerate langsung oleh Lumina SIS Library Cloud Engine.`,
    14,
    currentY + 5,
    { maxWidth: pageWidth - 28, lineHeightFactor: 1.4 }
  );

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY + 22, pageWidth - 28, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY + 22, pageWidth - 28, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('STATUS KONFIGURASI LOGO & IDENTITAS:', 20, currentY + 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Logo Kabupaten (Kiri)  : ${school.kopSurat?.logoLeftUrl ? 'Terpasang (Valid PNG/JPG Base64)' : 'Menggunakan Lambang Default'}`, 20, currentY + 36);
  doc.text(`• Logo Sekolah (Kanan)   : ${school.kopSurat?.logoRightUrl || school.logoUrl ? 'Terpasang (Valid PNG/JPG Base64)' : 'Menggunakan Logo Utama'}`, 20, currentY + 42);
  doc.text(`• Instansi & Sekolah     : ${school.kopSurat?.institutionName || school.schoolName}`, 20, currentY + 48);
  doc.text(`• Kode Unit Perpustakaan : ${school.libraryCode} | NPSN: ${school.npsn}`, 20, currentY + 54);

  // Signatures
  const footerY = 230;
  const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Kepala Perpustakaan,', 25, footerY);
  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, 25, footerY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19850412 200902 2 004', 25, footerY + 28);

  doc.setFontSize(8.5);
  doc.text(`${school.city}, ${nowStr}`, pageWidth - 75, footerY);
  doc.text('Mengesahkan, Kepala Sekolah', pageWidth - 75, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.principalName, pageWidth - 75, footerY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19710318 199703 1 002', pageWidth - 75, footerY + 28);

  doc.save(`Pratinjau_KopSurat_${school.schoolName.replace(/\s+/g, '_')}.pdf`);
  return true;
}

/**
 * CETAK SLIP TANDA TERIMA TRANSAKSI (RECEIPT SLIP A6 / THERMAL)
 */
export function exportTransactionReceiptToPDF(
  trx: Transaction,
  school: SchoolProfile
) {
  // A6 format: 105mm x 148mm
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [105, 175] // Extended A6 height for comprehensive receipt
  });

  const pageWidth = 105;

  // Header Box
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  // Institution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(school.schoolName.toUpperCase(), pageWidth / 2, 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('UPT PERPUSTAKAAN DIGITAL LUMINA', pageWidth / 2, 12, { align: 'center' });
  doc.text(`${school.address}, ${school.city}`, pageWidth / 2, 16, { align: 'center' });
  doc.text(`Telp: ${school.phone} | NPSN: ${school.npsn}`, pageWidth / 2, 20, { align: 'center' });

  // Divider
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(6, 24, pageWidth - 6, 24);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(6, 25.2, pageWidth - 6, 25.2);

  // Title Slip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('BUKTI RESMI PEMINJAMAN PUSTAKA', pageWidth / 2, 31, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`KODE: ${trx.trxCode}`, pageWidth / 2, 36, { align: 'center' });

  // Dashed separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(6, 40, pageWidth - 6, 40);
  doc.setLineDashPattern([], 0);

  // Borrower Info Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('IDENTITAS PEMUSTAKA', 8, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Lengkap', 8, 50);
  doc.text(`: ${trx.memberName}`, 34, 50);

  doc.text('Nomor Anggota', 8, 54.5);
  doc.text(`: ${trx.memberCode}`, 34, 54.5);

  doc.text('No. Kontak/HP', 8, 59);
  doc.text(`: ${trx.memberPhone || '-'}`, 34, 59);

  // Dashed separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(6, 63, pageWidth - 6, 63);
  doc.setLineDashPattern([], 0);

  // Book Info Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('RINCIAN KOLEKSI BUKU', 8, 68);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Judul Buku', 8, 73);
  const splitTitle = doc.splitTextToSize(trx.bookTitle, 62);
  doc.text(`:`, 34, 73);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(splitTitle, 36, 73);

  const titleHeight = (splitTitle.length - 1) * 3.5;
  let bookY = 77.5 + titleHeight;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('ISBN / Barcode', 8, bookY);
  doc.setFont('courier', 'bold');
  doc.text(`: ${trx.bookIsbn}`, 34, bookY);

  bookY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Tgl Peminjaman', 8, bookY);
  doc.text(`: ${trx.borrowDate}`, 34, bookY);

  bookY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text('Batas Jatuh Tempo', 8, bookY);
  doc.text(`: ${trx.dueDate} (WAJIB KEMBALI)`, 34, bookY);

  // Policy Box
  bookY += 6;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(6, bookY, pageWidth - 12, 16, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(6, bookY, pageWidth - 12, 16, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(153, 27, 27);
  doc.text('KETENTUAN PENGEMBALIAN & DENDA:', 9, bookY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(185, 28, 28);
  doc.text('1. Keterlambatan dikenakan denda Rp 1.000 / hari / buku.', 9, bookY + 7.5);
  doc.text('2. Harap menjaga kondisi buku dari coretan, sobekan, atau cairan.', 9, bookY + 10.8);
  doc.text('3. Perpanjangan masa pinjam dapat diajukan via portal siswa.', 9, bookY + 14.1);

  // Signatures
  const signY = bookY + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Peminjam / Pemustaka,', 14, signY, { align: 'center' });
  doc.text('Petugas Sirkulasi,', pageWidth - 18, signY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${trx.memberName.length > 16 ? trx.memberName.substring(0, 15) + '..' : trx.memberName} )`, 14, signY + 14, { align: 'center' });
  doc.text(`( ${trx.processedBy || school.librarianName} )`, pageWidth - 18, signY + 14, { align: 'center' });

  // Footer barcode text & timestamp
  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} • Lumina SIS Cloud Engine`, pageWidth / 2, signY + 20, { align: 'center' });

  doc.save(`Tanda_Terima_${trx.trxCode}_${trx.memberName.replace(/\s+/g, '_')}.pdf`);
  return true;
}

/**
 * 1. LAPORAN BULANAN RESMI (PDF)
 */
export function exportMonthlyReportToPDF(
  monthName: string,
  year: number,
  monthlyTransactions: Transaction[],
  books: Book[],
  members: Member[],
  school: SchoolProfile
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const title = `LAPORAN BULANAN SIRKULASI & STATISTIK PERPUSTAKAAN`;
  const subtitle = `Periode Bulan: ${monthName.toUpperCase()} ${year} | Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  
  let currentY = renderSchoolHeader(doc, school, title, subtitle);

  // Monthly Metrics Calculation
  const totalBorrows = monthlyTransactions.length;
  const returnedCount = monthlyTransactions.filter(t => t.status === 'returned').length;
  const activeCount = monthlyTransactions.filter(t => t.status === 'borrowed').length;
  const overdueCount = monthlyTransactions.filter(t => t.status === 'overdue').length;
  const totalFines = monthlyTransactions.reduce((acc, t) => acc + (t.fineAmount || 0), 0);
  const onTimeRate = totalBorrows > 0 ? Math.round((returnedCount / (returnedCount + overdueCount || 1)) * 100) : 100;

  // Metric Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  
  doc.setTextColor(51, 65, 85);
  doc.text('TOTAL SIRKULASI', 20, currentY + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalBorrows}`, 20, currentY + 14);

  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text('DIKEMBALIKAN', 65, currentY + 6);
  doc.setFontSize(11);
  doc.text(`${returnedCount}`, 65, currentY + 14);

  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38);
  doc.text('TERLAMBAT', 110, currentY + 6);
  doc.setFontSize(11);
  doc.text(`${overdueCount}`, 110, currentY + 14);

  doc.setFontSize(7.5);
  doc.setTextColor(14, 165, 233);
  doc.text('DENDA TERKUMPUL', 150, currentY + 6);
  doc.setFontSize(9.5);
  doc.text(`Rp ${totalFines.toLocaleString('id-ID')}`, 150, currentY + 14);

  currentY += 26;

  // Section: Top 3 Popular Books & Categories in Month
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Ringkasan Sirkulasi Koleksi Buku:', 14, currentY);
  currentY += 5;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  monthlyTransactions.forEach(t => {
    const book = books.find(b => b.id === t.bookId || b.isbn === t.bookIsbn);
    const cat = book ? book.category : 'Umum / Lainnya';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const catSummaryStr = Object.entries(categoryCounts)
    .slice(0, 4)
    .map(([cat, count]) => `${cat}: ${count} buku`)
    .join('  •  ') || 'Tidak ada aktivitas kategori khusus';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(catSummaryStr, 14, currentY);
  currentY += 8;

  // Table of Monthly Transactions
  doc.setFillColor(15, 23, 42); // Dark slate header
  doc.rect(14, currentY, pageWidth - 28, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, currentY + 4.5);
  doc.text('Kode Trx', 24, currentY + 4.5);
  doc.text('Nama Peminjam', 52, currentY + 4.5);
  doc.text('Judul Buku', 94, currentY + 4.5);
  doc.text('Tgl Pinjam', 140, currentY + 4.5);
  doc.text('Jatuh Tempo', 162, currentY + 4.5);
  doc.text('Status', 184, currentY + 4.5);

  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  const displayList = monthlyTransactions.length > 0 ? monthlyTransactions : [];

  if (displayList.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('Tidak ada catatan transaksi peminjaman pada periode bulan ini.', pageWidth / 2, currentY + 8, { align: 'center' });
    currentY += 15;
  } else {
    displayList.slice(0, 24).forEach((t, idx) => {
      if (currentY > 255) {
        doc.addPage();
        currentY = 20;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, pageWidth - 28, 6, 'F');
      }

      doc.setTextColor(51, 65, 85);
      doc.text(`${idx + 1}`, 16, currentY + 4.2);
      doc.text(t.trxCode, 24, currentY + 4.2);

      const memName = t.memberName.length > 20 ? t.memberName.substring(0, 19) + '..' : t.memberName;
      doc.text(memName, 52, currentY + 4.2);

      const bTitle = t.bookTitle.length > 24 ? t.bookTitle.substring(0, 23) + '..' : t.bookTitle;
      doc.text(bTitle, 94, currentY + 4.2);

      doc.text(t.borrowDate, 140, currentY + 4.2);
      doc.text(t.dueDate, 162, currentY + 4.2);

      if (t.status === 'borrowed') {
        doc.setTextColor(16, 185, 129);
        doc.text('DIPINJAM', 184, currentY + 4.2);
      } else if (t.status === 'overdue') {
        doc.setTextColor(220, 38, 38);
        doc.text('TERLAMBAT', 184, currentY + 4.2);
      } else {
        doc.setTextColor(59, 130, 246);
        doc.text('KEMBALI', 184, currentY + 4.2);
      }

      currentY += 6;
    });
  }

  // Official Signatures
  const footerY = Math.max(currentY + 12, 240);
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Left Signature: Kepala Perpustakaan
  doc.text('Mengetahui,', 25, footerY);
  doc.text('Kepala Perpustakaan', 25, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, 25, footerY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19850412 200902 2 004', 25, footerY + 29);

  // Right Signature: Kepala Sekolah
  doc.setFontSize(8.5);
  doc.text(`${school.city}, ${dateStr}`, pageWidth - 75, footerY);
  doc.text('Kepala Sekolah', pageWidth - 75, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.principalName, pageWidth - 75, footerY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19710318 199703 1 002', pageWidth - 75, footerY + 29);

  doc.save(`Laporan_Bulanan_${monthName}_${year}_${school.schoolName.replace(/\s+/g, '_')}.pdf`);
  return true;
}

/**
 * 2. SURAT / SLIP PERINGATAN JATUH TEMPO (PDF)
 */
export function exportDueDateNoticePDF(
  transaction: Transaction,
  school: SchoolProfile,
  daysDifference: number = 0
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const title = `SURAT PEMBERITAHUAN JATUH TEMPO PINJAMAN BUKU`;
  const subtitle = `Nomor Surat: ${transaction.trxCode}/PERPUS-NOTIF/${new Date().getFullYear()}`;

  let currentY = renderSchoolHeader(doc, school, title, subtitle);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Letter recipient details
  doc.text(`Kepada Yth.`, 14, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(transaction.memberName, 14, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Anggota / NISN : ${transaction.memberCode}`, 14, currentY + 10);
  doc.text(`Kontak / No. Telepon    : ${transaction.memberPhone || '-'}`, 14, currentY + 15);

  currentY += 24;

  // Body text
  doc.text(
    `Dengan hormat, berdasarkan data sistem administrasi sirkulasi Lumina Library, kami menginformasikan bahwa masa pinjaman koleksi buku perpustakaan berikut telah mendekati atau melewati batas waktu pengembalian:`,
    14,
    currentY,
    { maxWidth: pageWidth - 28, lineHeightFactor: 1.4 }
  );

  currentY += 15;

  // Loan Detail Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 48, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, pageWidth - 28, 48, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const detailStartY = currentY + 8;
  doc.text(`Kode Transaksi`, 20, detailStartY);
  doc.text(`: ${transaction.trxCode}`, 65, detailStartY);

  doc.text(`Judul Buku`, 20, detailStartY + 7);
  doc.text(`: ${transaction.bookTitle}`, 65, detailStartY + 7);

  doc.text(`ISBN / ID Koleksi`, 20, detailStartY + 14);
  doc.text(`: ${transaction.bookIsbn}`, 65, detailStartY + 14);

  doc.text(`Tanggal Peminjaman`, 20, detailStartY + 21);
  doc.text(`: ${transaction.borrowDate}`, 65, detailStartY + 21);

  doc.text(`Batas Jatuh Tempo`, 20, detailStartY + 28);
  doc.setTextColor(220, 38, 38);
  doc.text(`: ${transaction.dueDate} (${transaction.status === 'overdue' ? 'TERLAMBAT' : 'JATUH TEMPO'})`, 65, detailStartY + 28);

  doc.setTextColor(51, 65, 85);
  doc.text(`Estimasi Akumulasi Denda`, 20, detailStartY + 35);
  doc.setTextColor(transaction.fineAmount > 0 ? 220 : 16, transaction.fineAmount > 0 ? 38 : 185, transaction.fineAmount > 0 ? 38 : 129);
  doc.text(`: Rp ${transaction.fineAmount.toLocaleString('id-ID')} (Tarif Rp 1.000 / hari keterlambatan)`, 65, detailStartY + 35);

  currentY += 56;

  // Notice Instructions
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Mohon untuk segera melakukan pengembalian koleksi buku atau pengajuan perpanjangan masa pinjaman ke loket layanan sirkulasi perpustakaan. Keterlambatan pengembalian dapat menghambat pemanfaatan koleksi oleh pemustaka lain.`,
    14,
    currentY,
    { maxWidth: pageWidth - 28, lineHeightFactor: 1.4 }
  );

  currentY += 18;
  doc.text(`Atas perhatian dan kerja samanya, kami ucapkan terima kasih.`, 14, currentY);

  // Signatures
  const signY = Math.max(currentY + 16, 230);
  const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.text(`${school.city}, ${nowStr}`, pageWidth - 75, signY);
  doc.text('Petugas Pelayanan Sirkulasi,', pageWidth - 75, signY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, pageWidth - 75, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Lumina Cloud Service Desk`, pageWidth - 75, signY + 32);

  doc.save(`Surat_Peringatan_JatuhTempo_${transaction.memberCode}_${transaction.trxCode}.pdf`);
  return true;
}

/**
 * 3. EXPORT TRANSAKSI SIRKULASI LENGKAP (PDF)
 */
export function exportTransactionsToPDF(
  transactions: Transaction[], 
  school: SchoolProfile, 
  title: string = 'LAPORAN REKAPITULASI SIRKULASI PERPUSTAKAAN'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let currentY = renderSchoolHeader(doc, school, title);

  const totalTrx = transactions.length;
  const activeTrx = transactions.filter(t => t.status === 'borrowed').length;
  const overdueTrx = transactions.filter(t => t.status === 'overdue').length;
  const returnedTrx = transactions.filter(t => t.status === 'returned').length;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'F');
  
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Transaksi: ${totalTrx}`, 20, currentY + 8.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`Dipinjam: ${activeTrx}`, 65, currentY + 8.5);
  doc.setTextColor(239, 68, 68);
  doc.text(`Terlambat: ${overdueTrx}`, 110, currentY + 8.5);
  doc.setTextColor(59, 130, 246);
  doc.text(`Dikembalikan: ${returnedTrx}`, 155, currentY + 8.5);

  currentY += 20;

  doc.setFillColor(15, 23, 42);
  doc.rect(14, currentY - 5, pageWidth - 28, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, currentY);
  doc.text('No. Transaksi', 24, currentY);
  doc.text('Peminjam / Anggota', 52, currentY);
  doc.text('Judul Buku', 95, currentY);
  doc.text('Tgl Pinjam', 140, currentY);
  doc.text('Batas Tempo', 162, currentY);
  doc.text('Status', 184, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let rowY = currentY + 5.5;

  transactions.slice(0, 28).forEach((t, index) => {
    if (rowY > 260) {
      doc.addPage();
      rowY = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY - 4, pageWidth - 28, 6, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(`${index + 1}`, 16, rowY);
    doc.text(t.trxCode, 24, rowY);
    
    const memName = t.memberName.length > 20 ? t.memberName.substring(0, 19) + '..' : t.memberName;
    doc.text(memName, 52, rowY);
    
    const bTitle = t.bookTitle.length > 24 ? t.bookTitle.substring(0, 23) + '..' : t.bookTitle;
    doc.text(bTitle, 95, rowY);

    doc.text(t.borrowDate, 140, rowY);
    doc.text(t.dueDate, 162, rowY);

    if (t.status === 'borrowed') {
      doc.setTextColor(16, 185, 129);
      doc.text('DIPINJAM', 184, rowY);
    } else if (t.status === 'overdue') {
      doc.setTextColor(220, 38, 38);
      doc.text('TERLAMBAT', 184, rowY);
    } else {
      doc.setTextColor(59, 130, 246);
      doc.text('KEMBALI', 184, rowY);
    }

    rowY += 6;
  });

  const footerY = Math.max(rowY + 12, 240);
  const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Mengetahui,', 25, footerY);
  doc.text('Kepala Perpustakaan', 25, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, 25, footerY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19850412 200902 2 004', 25, footerY + 29);

  doc.setFontSize(8.5);
  doc.text(`${school.city}, ${nowStr}`, pageWidth - 75, footerY);
  doc.text('Kepala Sekolah', pageWidth - 75, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.principalName, pageWidth - 75, footerY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19710318 199703 1 002', pageWidth - 75, footerY + 29);

  doc.save(`Laporan_Sirkulasi_Lumina_${new Date().toISOString().slice(0, 10)}.pdf`);
  return true;
}

/**
 * 4. EXPORT KATALOG BUKU (PDF)
 */
export function exportCatalogToPDF(books: Book[], school: SchoolProfile) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  let currentY = renderSchoolHeader(doc, school, 'DAFTAR INDEKS KATALOG BUKU & ARSIP KOLEKSI');

  doc.setFillColor(15, 23, 42);
  doc.rect(14, currentY - 5, pageWidth - 28, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, currentY);
  doc.text('ISBN / ID', 24, currentY);
  doc.text('Judul Buku', 60, currentY);
  doc.text('Penulis / Pengarang', 115, currentY);
  doc.text('Kategori', 155, currentY);
  doc.text('Stok / Rak', 182, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let rowY = currentY + 5.5;

  books.forEach((b, index) => {
    if (rowY > 265) {
      doc.addPage();
      rowY = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY - 4, pageWidth - 28, 6, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(`${index + 1}`, 16, rowY);
    doc.text(b.isbn, 24, rowY);
    doc.text(b.title.length > 28 ? b.title.substring(0, 27) + '..' : b.title, 60, rowY);
    doc.text(b.author.length > 22 ? b.author.substring(0, 21) + '..' : b.author, 115, rowY);
    doc.text(b.category, 155, rowY);
    doc.text(`${b.copiesAvailable}/${b.copiesTotal} (${b.shelfLocation.split(' ')[1] || b.shelfLocation})`, 182, rowY);

    rowY += 6;
  });

  doc.save(`Katalog_Buku_Lumina_${new Date().toISOString().slice(0, 10)}.pdf`);
  return true;
}

/**
 * 5. EXPORT KARTU ANGGOTA DIGITAL (PDF)
 */
export function exportMemberCardToPDF(member: Member, school: SchoolProfile) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 53.98], // Standard CR80 ID Card size
  });

  // Background Gradient Simulation
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 85.6, 53.98, 'F');

  // Top emerald accent bar
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(0, 0, 85.6, 3, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(school.schoolName.toUpperCase(), 42.8, 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(148, 163, 184);
  doc.text('KARTU ANGGOTA PERPUSTAKAAN DIGITAL', 42.8, 11, { align: 'center' });

  // Divider
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.2);
  doc.line(6, 13, 79.6, 13);

  // Avatar placeholder box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(8, 16, 16, 20, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text(member.name.charAt(0), 16, 28, { align: 'center' });

  // Member Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const shortName = member.name.length > 22 ? member.name.substring(0, 20) + '..' : member.name;
  doc.text(shortName, 28, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`No. Anggota:`, 28, 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153);
  doc.text(member.memberCode, 45, 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Tipe / Kategori:`, 28, 28);
  doc.setTextColor(255, 255, 255);
  doc.text(`${member.role} ${member.classOrDept ? `(${member.classOrDept})` : ''}`, 45, 28);

  doc.setTextColor(148, 163, 184);
  doc.text(`Status Keanggotaan:`, 28, 32);
  doc.setTextColor(16, 185, 129);
  doc.text(member.status.toUpperCase(), 45, 32);

  // Barcode / Number Line at Bottom
  doc.setFillColor(2, 6, 23);
  doc.rect(6, 39, 73.6, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`* ${member.memberCode} *`, 42.8, 45, { align: 'center' });

  doc.save(`Kartu_Anggota_${member.memberCode}.pdf`);
  return true;
}

/**
 * 5b. EXPORT LAPORAN DAFTAR ANGGOTA & REKAP STATUS (PDF)
 */
export function exportMembersToPDF(
  members: Member[],
  school: SchoolProfile,
  filterInfo?: {
    roleFilter?: string;
    statusFilter?: string;
    searchQuery?: string;
  }
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const suspendedMembers = members.filter(m => m.status === 'suspended').length;
  const expiredMembers = members.filter(m => m.status === 'expired').length;
  const inactiveMembers = suspendedMembers + expiredMembers;
  const activeRate = totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : '0';
  const totalLoans = members.reduce((sum, m) => sum + (m.activeLoansCount || 0), 0);
  const totalFines = members.reduce((sum, m) => sum + (m.totalFinesUnpaid || 0), 0);

  const filterSummary = [
    filterInfo?.roleFilter && filterInfo.roleFilter !== 'all' ? `Kategori: ${filterInfo.roleFilter}` : null,
    filterInfo?.statusFilter && filterInfo.statusFilter !== 'all' ? `Status: ${filterInfo.statusFilter.toUpperCase()}` : null,
    filterInfo?.searchQuery ? `Pencarian: "${filterInfo.searchQuery}"` : null,
  ].filter(Boolean).join(' | ');

  const title = 'LAPORAN REKAPITULASI DATA PEMUSTAKA & STATUS ANGGOTA';
  const subtitle = `Nomor Dokumen: ${school.libraryCode}/LAP-MBR/${new Date().getFullYear()} | Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}${filterSummary ? ` (${filterSummary})` : ''}`;

  let currentY = renderSchoolHeader(doc, school, title, subtitle);

  // Executive Metric Summary Box (Status Breakdown)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  // Box 1: Total Anggota
  doc.setTextColor(51, 65, 85);
  doc.text('TOTAL PEMUSTAKA', 20, currentY + 6.5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalMembers} Orang`, 20, currentY + 14.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Tercatat di sistem`, 20, currentY + 18.5);

  // Box 2: Anggota Aktif
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('STATUS AKTIF', 68, currentY + 6.5);
  doc.setFontSize(10.5);
  doc.text(`${activeMembers} (${activeRate}%)`, 68, currentY + 14.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`Akses sirkulasi valid`, 68, currentY + 18.5);

  // Box 3: Nonaktif / Denda
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68);
  doc.text('NONAKTIF / SUSPEND', 118, currentY + 6.5);
  doc.setFontSize(10.5);
  doc.text(`${inactiveMembers} Anggota`, 118, currentY + 14.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(239, 68, 68);
  doc.text(`${suspendedMembers} Ditangguhkan • ${expiredMembers} Exp`, 118, currentY + 18.5);

  // Box 4: Pinjaman Berjalan
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('PINJAMAN AKTIF', 165, currentY + 6.5);
  doc.setFontSize(10.5);
  doc.text(`${totalLoans} Buku`, 165, currentY + 14.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Tunggakan: Rp ${totalFines.toLocaleString('id-ID')}`, 165, currentY + 18.5);

  currentY += 28;

  // Table Headers
  doc.setFillColor(15, 23, 42); // Dark slate header
  doc.rect(14, currentY - 5, pageWidth - 28, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, currentY);
  doc.text('Kode Anggota', 24, currentY);
  doc.text('Nama Pemustaka', 54, currentY);
  doc.text('Peran / Kelas', 102, currentY);
  doc.text('Email / Kontak', 142, currentY);
  doc.text('Status', 178, currentY);
  doc.text('Pinjam', 194, currentY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  let rowY = currentY + 5.5;

  if (members.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('Tidak ada data anggota pemustaka yang sesuai kriteria filter.', pageWidth / 2, rowY + 8, { align: 'center' });
    rowY += 16;
  } else {
    members.forEach((m, index) => {
      if (rowY > 260) {
        doc.addPage();
        rowY = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, rowY - 4, pageWidth - 28, 6, 'F');
      }

      doc.setTextColor(51, 65, 85);
      doc.text(`${index + 1}`, 16, rowY);
      doc.text(m.memberCode, 24, rowY);

      const safeName = m.name.length > 24 ? m.name.substring(0, 23) + '..' : m.name;
      doc.text(safeName, 54, rowY);

      const roleClass = `${m.role}${m.classOrDept ? ` (${m.classOrDept})` : ''}`;
      const safeRole = roleClass.length > 22 ? roleClass.substring(0, 21) + '..' : roleClass;
      doc.text(safeRole, 102, rowY);

      const contactStr = m.email ? (m.email.length > 20 ? m.email.substring(0, 19) + '..' : m.email) : (m.phone || '-');
      doc.text(contactStr, 142, rowY);

      if (m.status === 'active') {
        doc.setTextColor(16, 185, 129);
        doc.text('AKTIF', 178, rowY);
      } else if (m.status === 'suspended') {
        doc.setTextColor(239, 68, 68);
        doc.text('SUSPEND', 178, rowY);
      } else {
        doc.setTextColor(245, 158, 11);
        doc.text('EXPIRED', 178, rowY);
      }

      doc.setTextColor(51, 65, 85);
      doc.text(`${m.activeLoansCount}/${m.maxBorrowLimit}`, 194, rowY, { align: 'right' });

      rowY += 6;
    });
  }

  // Formal Signatures Section
  const footerY = Math.max(rowY + 12, 240);
  const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Mengetahui,', 25, footerY);
  doc.text('Kepala Perpustakaan', 25, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, 25, footerY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19850412 200902 2 004', 25, footerY + 29);
  doc.text(`Unit Layanan Pemustaka`, 25, footerY + 33);

  doc.setFontSize(8.5);
  doc.text(`${school.city}, ${nowStr}`, pageWidth - 75, footerY);
  doc.text('Mengesahkan, Kepala Sekolah', pageWidth - 75, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.principalName, pageWidth - 75, footerY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19710318 199703 1 002', pageWidth - 75, footerY + 29);
  doc.text(school.schoolName, pageWidth - 75, footerY + 33);

  doc.save(`Laporan_Data_Anggota_Lumina_${new Date().toISOString().slice(0, 10)}.pdf`);
  return true;
}

/**
 * 6. EXPORT LAPORAN INVENTARISASI & REKAP ASET BUKU (PDF)
 */
export function exportInventoryReportToPDF(
  books: Book[], 
  school: SchoolProfile,
  filterCategory?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const filteredBooks = filterCategory && filterCategory !== 'Semua Kategori'
    ? books.filter(b => b.category === filterCategory)
    : books;

  const title = `BERITA ACARA & LAPORAN INVENTARISASI KOLEKSI PUSTAKA`;
  const subtitle = `Nomor Dokumen: ${school.libraryCode}/INV-ASET/${new Date().getFullYear()} | Klasifikasi: ${filterCategory || 'Semua Koleksi'}`;

  let currentY = renderSchoolHeader(doc, school, title, subtitle);

  // Asset & Copy Calculations
  const totalTitles = filteredBooks.length;
  const totalCopies = filteredBooks.reduce((acc, b) => acc + (b.copiesTotal || 0), 0);
  const availableCopies = filteredBooks.reduce((acc, b) => acc + (b.copiesAvailable || 0), 0);
  const borrowedCopies = totalCopies - availableCopies;
  
  const totalAssetValue = filteredBooks.reduce((acc, b) => {
    const unitPrice = b.price || 95000;
    return acc + (unitPrice * (b.copiesTotal || 1));
  }, 0);

  const goodConditionCopies = filteredBooks
    .filter(b => !b.condition || b.condition === 'Baik')
    .reduce((acc, b) => acc + (b.copiesTotal || 0), 0);
  const goodConditionPct = totalCopies > 0 ? Math.round((goodConditionCopies / totalCopies) * 100) : 100;

  // Executive Metric Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 21, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, currentY, pageWidth - 28, 21, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  
  doc.setTextColor(51, 65, 85);
  doc.text('TOTAL JUDUL BUKU', 20, currentY + 6.5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalTitles} Judul`, 20, currentY + 14.5);

  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text('TOTAL EKSEMPLAR', 65, currentY + 6.5);
  doc.setFontSize(11);
  doc.text(`${totalCopies} Eks (${availableCopies} Rak)`, 65, currentY + 14.5);

  doc.setFontSize(7.5);
  doc.setTextColor(14, 165, 233);
  doc.text('TOTAL NILAI ASET', 115, currentY + 6.5);
  doc.setFontSize(10.5);
  doc.text(`Rp ${totalAssetValue.toLocaleString('id-ID')}`, 115, currentY + 14.5);

  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11);
  doc.text('KONDISI BAIK', 165, currentY + 6.5);
  doc.setFontSize(11);
  doc.text(`${goodConditionPct}%`, 165, currentY + 14.5);

  currentY += 27;

  // Table Headers
  doc.setFillColor(15, 23, 42);
  doc.rect(14, currentY - 5, pageWidth - 28, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, currentY);
  doc.text('No. Inv / ISBN', 24, currentY);
  doc.text('Judul Buku', 62, currentY);
  doc.text('Kategori / Rak', 112, currentY);
  doc.text('Kondisi', 148, currentY);
  doc.text('Eks (Ada/Tot)', 166, currentY);
  doc.text('Estimasi Nilai', 188, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  let rowY = currentY + 5.5;

  filteredBooks.slice(0, 30).forEach((b, index) => {
    if (rowY > 260) {
      doc.addPage();
      rowY = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY - 4, pageWidth - 28, 6, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(`${index + 1}`, 16, rowY);
    
    const invCode = b.inventoryNumber || (b.isbn ? b.isbn.slice(0, 14) : `INV-${b.id || index + 1}`);
    doc.text(invCode, 24, rowY);

    const safeTitle = b.title || 'Koleksi Buku';
    const titleStr = safeTitle.length > 30 ? safeTitle.substring(0, 29) + '..' : safeTitle;
    doc.text(titleStr, 62, rowY);

    const safeCategory = b.category || 'Umum';
    const shelfCode = (b.shelfLocation || '').includes(' ') ? b.shelfLocation.split(' ')[1] : (b.shelfLocation || '-');
    const catShelf = `${safeCategory.slice(0, 12)} (${shelfCode})`;
    doc.text(catShelf, 112, rowY);

    const condStr = b.condition || 'Baik';
    if (condStr === 'Baik') {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(condStr, 148, rowY);

    doc.setTextColor(51, 65, 85);
    doc.text(`${b.copiesAvailable}/${b.copiesTotal}`, 166, rowY);

    const bookAsset = (b.price || 95000) * (b.copiesTotal || 1);
    doc.text(`Rp ${bookAsset.toLocaleString('id-ID')}`, 188, rowY);

    rowY += 6;
  });

  // Formal Signatures
  const footerY = Math.max(rowY + 12, 240);
  const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Petugas Pengelola Inventaris & Pustaka,', 25, footerY);
  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, 25, footerY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. 19850412 200902 2 004`, 25, footerY + 28);
  doc.text(`Unit Perpustakaan ${school.schoolName}`, 25, footerY + 32);

  doc.setFontSize(8.5);
  doc.text(`${school.city}, ${nowStr}`, pageWidth - 75, footerY);
  doc.text('Mengetahui / Mengesahkan,', pageWidth - 75, footerY + 4);
  doc.text('Kepala Sekolah', pageWidth - 75, footerY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(school.principalName, pageWidth - 75, footerY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. 19710318 199703 1 002`, pageWidth - 75, footerY + 28);

  doc.save(`Laporan_Inventaris_Pustaka_${new Date().toISOString().slice(0, 10)}.pdf`);
  return true;
}

/**
 * 7. EXPORT LAPORAN STOCK OPNAME (PDF)
 */
export function exportStockOpnameReportToPDF(
  books: Book[], 
  school: SchoolProfile
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const title = `BERITA ACARA HASIL STOCK OPNAME KOLEKSI PERPUSTAKAAN`;
  const subtitle = `Tahun Anggaran: ${new Date().getFullYear()} | Tanggal Audit: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  let currentY = renderSchoolHeader(doc, school, title, subtitle);

  const totalTitles = books.length;
  const verifiedCount = books.filter(b => b.stockOpnameStatus === 'Verified').length;
  const pendingCount = books.filter(b => b.stockOpnameStatus === 'Pending' || !b.stockOpnameStatus).length;
  const discrepancyCount = books.filter(b => b.stockOpnameStatus === 'Discrepancy').length;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Koleksi: ${totalTitles} Judul`, 20, currentY + 9.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`Terverifikasi Fisik: ${verifiedCount}`, 70, currentY + 9.5);
  doc.setTextColor(245, 158, 11);
  doc.text(`Belum Diperiksa: ${pendingCount}`, 120, currentY + 9.5);
  doc.setTextColor(239, 68, 68);
  doc.text(`Selisih / Masalah: ${discrepancyCount}`, 165, currentY + 9.5);

  currentY += 22;

  doc.setFillColor(15, 23, 42);
  doc.rect(14, currentY - 5, pageWidth - 28, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 16, currentY);
  doc.text('No. Inventaris', 24, currentY);
  doc.text('Judul Koleksi', 58, currentY);
  doc.text('Lokasi Rak', 115, currentY);
  doc.text('Stok Sistem', 145, currentY);
  doc.text('Kondisi', 165, currentY);
  doc.text('Status Audit', 184, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  let rowY = currentY + 5.5;

  books.slice(0, 30).forEach((b, idx) => {
    if (rowY > 260) {
      doc.addPage();
      rowY = 20;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY - 4, pageWidth - 28, 6, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(`${idx + 1}`, 16, rowY);
    const invCode = b.inventoryNumber || (b.isbn ? b.isbn.slice(0, 14) : `INV-${b.id || idx + 1}`);
    doc.text(invCode, 24, rowY);

    const safeTitle = b.title || 'Koleksi Buku';
    const titleCut = safeTitle.length > 32 ? safeTitle.substring(0, 31) + '..' : safeTitle;
    doc.text(titleCut, 58, rowY);
    doc.text(b.shelfLocation || '-', 115, rowY);
    doc.text(`${b.copiesTotal || 1} eks`, 145, rowY);
    doc.text(b.condition || 'Baik', 165, rowY);

    const st = b.stockOpnameStatus || 'Verified';
    if (st === 'Verified') {
      doc.setTextColor(16, 185, 129);
      doc.text('VALID', 184, rowY);
    } else if (st === 'Discrepancy') {
      doc.setTextColor(239, 68, 68);
      doc.text('SELISIH', 184, rowY);
    } else {
      doc.setTextColor(245, 158, 11);
      doc.text('PENDING', 184, rowY);
    }

    rowY += 6;
  });

  const footerY = Math.max(rowY + 12, 240);
  const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Tim Pemeriksa Stock Opname,', 25, footerY);
  doc.setFont('helvetica', 'bold');
  doc.text(school.librarianName, 25, footerY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Ketua Tim Inventarisasi`, 25, footerY + 28);

  doc.setFontSize(8.5);
  doc.text(`${school.city}, ${nowStr}`, pageWidth - 75, footerY);
  doc.text('Mengesahkan, Kepala Sekolah', pageWidth - 75, footerY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(school.principalName, pageWidth - 75, footerY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. 19710318 199703 1 002`, pageWidth - 75, footerY + 28);

  doc.save(`Laporan_Stock_Opname_${new Date().toISOString().slice(0, 10)}.pdf`);
  return true;
}

/**
 * 8. EXPORT DATA INVENTARIS KE CSV
 */
export function exportInventoryToCSV(books: Book[], school: SchoolProfile) {
  if (!books || !books.length) return false;

  const formattedRows = books.map((b, index) => {
    const unitPrice = b.price || 95000;
    const totalAsset = unitPrice * (b.copiesTotal || 1);
    const borrowed = (b.copiesTotal || 0) - (b.copiesAvailable || 0);

    return {
      'No': index + 1,
      'No. Registrasi Inventaris': b.inventoryNumber || `INV-${b.id}`,
      'ISBN': b.isbn,
      'Judul Buku': b.title,
      'Pengarang / Penulis': b.author,
      'Penerbit': b.publisher,
      'Tahun Terbit': b.year,
      'Kategori': b.category,
      'Lokasi Rak': b.shelfLocation,
      'Total Eksemplar': b.copiesTotal,
      'Eksemplar Tersedia di Rak': b.copiesAvailable,
      'Eksemplar Sedang Dipinjam': borrowed,
      'Kondisi Fisik Koleksi': b.condition || 'Baik',
      'Sumber Anggaran / Dana': b.sourceOfFund || 'Dana BOS',
      'Harga Satuan (Rp)': unitPrice,
      'Total Nilai Aset (Rp)': totalAsset,
      'Status Stock Opname': b.stockOpnameStatus || 'Verified',
      'Terakhir Stock Opname': b.lastStockOpnameDate || '-',
      'Tanggal Registrasi': b.addedAt,
    };
  });

  exportToCSV(formattedRows, `Laporan_Inventaris_Pustaka_${school.schoolName.replace(/\s+/g, '_')}`);
  return true;
}
