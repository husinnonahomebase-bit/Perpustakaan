import { relations } from 'drizzle-orm';
import { boolean, integer, json, pgTable, serial, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

// Users table (maps Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').default('User'),
  avatar: text('avatar').default(''),
  role: text('role').default('librarian'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Books table
export const books = pgTable('books', {
  id: text('id').primaryKey(),
  isbn: text('isbn').notNull(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  publisher: text('publisher').default(''),
  year: integer('year').default(2024),
  category: text('category').notNull(),
  copiesTotal: integer('copies_total').notNull().default(1),
  copiesAvailable: integer('copies_available').notNull().default(1),
  coverImage: text('cover_image').default(''),
  shelfLocation: text('shelf_location').default(''),
  description: text('description').default(''),
  rating: doublePrecision('rating').default(4.5),
  isFeatured: boolean('is_featured').default(false),
  tags: text('tags').array().default([]),
  addedAt: text('added_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Members table
export const members = pgTable('members', {
  id: text('id').primaryKey(),
  memberCode: text('member_code').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  avatar: text('avatar').default(''),
  role: text('role').default('Siswa'),
  classOrDept: text('class_or_dept').default(''),
  joinedDate: text('joined_date').notNull(),
  status: text('status').default('active'),
  activeLoansCount: integer('active_loans_count').default(0),
  totalFinesUnpaid: integer('total_fines_unpaid').default(0),
  maxBorrowLimit: integer('max_borrow_limit').default(3),
  createdAt: timestamp('created_at').defaultNow(),
});

// Circulation Transactions table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  trxCode: text('trx_code').notNull().unique(),
  bookId: text('book_id').notNull(),
  bookTitle: text('book_title').notNull(),
  bookIsbn: text('book_isbn').default(''),
  bookCover: text('book_cover').default(''),
  memberId: text('member_id').notNull(),
  memberName: text('member_name').notNull(),
  memberCode: text('member_code').default(''),
  memberAvatar: text('member_avatar').default(''),
  memberPhone: text('member_phone').default(''),
  borrowDate: text('borrow_date').notNull(),
  dueDate: text('due_date').notNull(),
  returnDate: text('return_date'),
  status: text('status').default('borrowed'),
  fineAmount: integer('fine_amount').default(0),
  notes: text('notes').default(''),
  processedBy: text('processed_by').default('Librarian'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Library Branches / Book Drop Locations for Google Maps
export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  type: text('type').default('Main Library'), // Main Library, Branch, Smart Book Locker, Mobile Stop
  address: text('address').notNull(),
  city: text('city').default('Jakarta Selatan'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  phone: text('phone').default(''),
  openHours: text('open_hours').default('07:30 - 16:00 WIB'),
  capacity: integer('capacity').default(10000),
  booksCount: integer('books_count').default(3500),
  librarianInCharge: text('librarian_in_charge').default('Staff Perpustakaan'),
  status: text('status').default('Operational'),
  services: text('services').array().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

// Workspace Sync & Audit Log
export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  service: text('service').notNull(), // 'Google Drive' | 'Google Sheets' | 'Gmail' | 'GAS Webhook'
  action: text('action').notNull(),
  status: text('status').notNull(), // 'SUCCESS' | 'FAILED' | 'PENDING'
  details: text('details').default(''),
  recordsAffected: integer('records_affected').default(0),
  timestamp: text('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const booksRelations = relations(books, ({ many }) => ({
  transactions: many(transactions),
}));

export const membersRelations = relations(members, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  book: one(books, {
    fields: [transactions.bookId],
    references: [books.id],
  }),
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
}));
