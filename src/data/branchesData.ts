export interface BranchLocation {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  openHours: string;
  capacity: number;
  booksCount: number;
  librarianInCharge: string;
  status: string;
  services: string[];
}

export const INITIAL_BRANCHES: BranchLocation[] = [
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
