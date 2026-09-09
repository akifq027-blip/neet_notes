import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

dotenv.config();

const cleanEnvStr = (val: string | undefined, fallback: string): string => {
  if (!val) return fallback;
  const trimmed = val.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const DB_HOST = cleanEnvStr(process.env.DB_HOST, 'localhost');
const DB_USER = cleanEnvStr(process.env.DB_USER, 'root');
const DB_PASSWORD = cleanEnvStr(process.env.DB_PASSWORD, '');
const DB_NAME = cleanEnvStr(process.env.DB_NAME, 'neet_notes_db');
const DB_PORT = parseInt(cleanEnvStr(process.env.DB_PORT, '3306'), 10) || 3306;

const STORE_DIR = path.join(process.cwd(), 'backend', 'data');
const STORE_FILE = path.join(STORE_DIR, 'store.json');

let pool: mysql.Pool | null = null;
let isUsingMySQL = false;
let dbErrorNotice = '';

// Unified In-memory & JSON file relational store
export const memoryStore = {
  users: [] as any[],
  categories: [] as any[],
  notes: [] as any[],
  orders: [] as any[],
  order_items: [] as any[],
  downloads: [] as any[],
  reviews: [] as any[],
  coupons: [] as any[],
  contacts: [] as any[],
  refund_requests: [] as any[],
  wishlist: [] as any[],
  site_settings: {} as Record<string, string>,
  nextIds: {
    users: 3,
    categories: 8,
    notes: 22,
    orders: 2,
    order_items: 2,
    downloads: 1,
    reviews: 4,
    coupons: 4,
    contacts: 1,
    refund_requests: 1,
    wishlist: 1,
  } as Record<string, number>,
};

export function saveStoreToFile() {
  if (isUsingMySQL) return;
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store File Save Error]:', err);
  }
}

export async function initDatabase() {
  // Seed initial values
  const adminPassHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10);
  const studentPassHash = await bcrypt.hash('Student@12345', 10);

  const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'admin@neetnotes.com').trim().toLowerCase();

  memoryStore.users = [
    {
      id: 1,
      name: 'NEET Notes Admin',
      email: defaultAdminEmail,
      password_hash: adminPassHash,
      role: 'admin',
      avatar: null,
      phone: '+91 98765 43210',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      password_hash: studentPassHash,
      role: 'student',
      avatar: null,
      phone: '+91 98765 12345',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Akif (Admin)',
      email: 'akifq027@gmail.com',
      password_hash: adminPassHash,
      role: 'admin',
      avatar: null,
      phone: '+91 7989725471',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ];

  memoryStore.categories = [
    { id: 1, name: 'NCERT Line-by-Line Notes', slug: 'ncert-notes', description: 'Comprehensive NCERT line-by-line extracts with marked high-yield exam lines.', icon: 'book-open', display_order: 1 },
    { id: 2, name: 'Revision Notes & Mindmaps', slug: 'revision-notes', description: 'Quick chapter summary maps and one-page cheat sheets for rapid revision.', icon: 'zap', display_order: 2 },
    { id: 3, name: 'Previous Year Questions (PYQs)', slug: 'pyqs', description: 'Topic-wise solved Board and NEET past questions with step-by-step solutions.', icon: 'file-check', display_order: 3 },
    { id: 4, name: 'Formula Sheets & Cheat Codes', slug: 'formula-sheets', description: 'Complete Science, Maths, Physics and Chemistry formula digests with unit tables.', icon: 'hash', display_order: 4 },
    { id: 5, name: 'Diagrams & Flowcharts', slug: 'diagrams-flowcharts', description: 'High-res labeled anatomical, physiological, and ray diagrams.', icon: 'activity', display_order: 5 },
    { id: 6, name: 'Question Banks & Mock Papers', slug: 'question-banks', description: 'High-yield assertion-reason, case-study and practice sets with answer keys.', icon: 'help-circle', display_order: 6 },
    { id: 7, name: 'Board Special Preparation', slug: 'board-special', description: 'Board score booster kits, sample papers and marking scheme guides.', icon: 'award', display_order: 7 },
  ];

  memoryStore.notes = [
    {
      id: 21,
      title: 'Class 11 Biology: Cell - The Unit of Life',
      slug: 'class-11-biology-cell-the-unit-of-life',
      description: 'Comprehensive NCERT class 11 biology handwritten study notes covering Cell: The Unit of Life, cell theory, prokaryotic & eukaryotic cell structure, organelle functions, endomembrane system, and high-yield NEET revision diagrams.',
      subject: 'Biology',
      class_level: 'Class 11',
      exam: 'NEET & Boards',
      resource_type: 'Notes',
      chapter: 'Cell: The Unit of Life',
      category_id: 1,
      price: 1.00,
      original_price: 99.00,
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'Biology_Notes__Cell___The_Unit_of_Life-1788364226209-967035391.pdf',
      preview_file: null,
      preview_pages: 4,
      total_pages: 12,
      file_size_mb: 1.14,
      is_free: 0,
      is_featured: 1,
      is_bestseller: 1,
      author_name: 'NEET Expert Faculty',
      rating_avg: 5.0,
      rating_count: 14,
      purchase_count: 24,
      download_count: 36,
      status: 'published',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  // Dynamically calculate strictly unique next note ID
  memoryStore.nextIds.notes = Math.max(22, ...memoryStore.notes.map((n: any) => Number(n.id) || 0)) + 1;

  memoryStore.coupons = [
    { id: 1, code: 'NEET20', description: 'Special 20% discount on all notes and question banks', discount_type: 'percentage', discount_value: 20.00, minimum_amount: 0.00, usage_limit: 1000, times_used: 42, expiry_date: '2026-12-31', active: 1 },
    { id: 2, code: 'BIOLOGY50', description: 'Flat Rs. 50 OFF on Biology Master Modules', discount_type: 'fixed', discount_value: 50.00, minimum_amount: 0.00, usage_limit: 500, times_used: 19, expiry_date: '2026-12-31', active: 1 },
    { id: 3, code: 'FIRSTBUY', description: 'Flat 15% discount for first-time NEET aspirants', discount_type: 'percentage', discount_value: 15.00, minimum_amount: 0.00, usage_limit: 2000, times_used: 88, expiry_date: '2026-12-31', active: 1 },
  ];

  memoryStore.reviews = [
    { id: 1, user_id: 2, note_id: 21, rating: 5, review: 'These handwritten Cell: The Unit of Life notes are exceptionally well-organized! The organelle diagrams and prokaryotic vs eukaryotic comparisons are crystal clear for NEET revision.', status: 'approved', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  ];

  memoryStore.contacts = [
    {
      id: 1,
      name: 'Rohan Verma',
      email: 'rohan.v@example.com',
      phone: '+91 98765 22334',
      subject: 'Inquiry regarding Biology Diagrams PDF printing',
      message: 'Hello, can I print the high-res colored flowcharts for my personal revision wall at home? Thanks!',
      reply: null,
      is_read: 0,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 2,
      name: 'Pooja Iyer',
      email: 'pooja.iyer@example.com',
      phone: '+91 98111 55667',
      subject: 'NEET 2026 Botany Syllabus Coverage',
      message: 'Does the Plant Physiology module include the latest NTA revised syllabus updates for 2026?',
      reply: 'Yes! All modules are strictly aligned with the updated NMC/NTA NEET 2026 curriculum.',
      is_read: 1,
      replied_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    }
  ];

  memoryStore.refund_requests = [
    {
      id: 1,
      user_id: 2,
      order_id: 1,
      note_id: 1,
      reason: 'Accidentally bought the duplicate volume instead of Botany bundle. Requesting swap or refund.',
      status: 'pending',
      admin_note: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    }
  ];

  memoryStore.orders = [
    {
      id: 1,
      order_number: 'ORD-NEET-1001',
      user_id: 2,
      subtotal: 199.00,
      discount_amount: 0.00,
      coupon_code: null,
      total_amount: 199.00,
      payment_status: 'paid',
      payment_method: 'razorpay',
      razorpay_order_id: 'order_test_1001',
      razorpay_payment_id: 'pay_test_1001',
      razorpay_signature: 'sig_test_1001',
      customer_name: 'Akash Sharma',
      customer_email: 'student@neetnotes.com',
      customer_phone: '+91 98765 12345',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    }
  ];

  memoryStore.order_items = [
    { id: 1, order_id: 1, note_id: 21, price: 1.00, note_title: 'Class 11 Biology: Cell - The Unit of Life', created_at: new Date(Date.now() - 7 * 86400000).toISOString() }
  ];

  memoryStore.site_settings = {
    site_name: 'NCERT NOTES',
    site_tagline: 'Notes for Class 8–12 & NEET | Chapter-wise Notes, PYQs & Formula Sheets',
    support_email: 'akifquadri5604@gmail.com',
    support_phone: '+91 7989725471',
    maintenance_mode: 'false',
    allow_pdf_downloads: '0', // '0' = Online Reading Only (Strict Anti-Piracy Mode), '1' = Allow PDF Downloads alongside Online Reader
    announcement_bar: '🚀 NCERT NOTES 2026: Use code NCERT20 for 20% OFF on all study materials across Class 8–12 & NEET!',
    currency_symbol: '₹',
  };

  // Attempt to restore persistent store from disk if present
  try {
    if (fs.existsSync(STORE_FILE)) {
      const rawJson = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(rawJson);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.users) && parsed.users.length > 0) memoryStore.users = parsed.users;
        if (Array.isArray(parsed.categories) && parsed.categories.length > 0) memoryStore.categories = parsed.categories;
        if (Array.isArray(parsed.notes) && parsed.notes.length > 0) {
          // Keep user's own uploaded notes, strip out demo notes (22, 23)
          memoryStore.notes = parsed.notes.filter((n: any) => n.id !== 22 && n.id !== 23);
        }
        if (Array.isArray(parsed.orders)) memoryStore.orders = parsed.orders;
        if (Array.isArray(parsed.order_items)) memoryStore.order_items = parsed.order_items;
        if (Array.isArray(parsed.downloads)) memoryStore.downloads = parsed.downloads;
        if (Array.isArray(parsed.reviews)) memoryStore.reviews = parsed.reviews;
        if (Array.isArray(parsed.coupons)) memoryStore.coupons = parsed.coupons;
        if (Array.isArray(parsed.contacts)) memoryStore.contacts = parsed.contacts;
        if (Array.isArray(parsed.refund_requests)) memoryStore.refund_requests = parsed.refund_requests;
        if (Array.isArray(parsed.wishlist)) memoryStore.wishlist = parsed.wishlist;
        if (parsed.site_settings) memoryStore.site_settings = { ...memoryStore.site_settings, ...parsed.site_settings };
        if (parsed.nextIds) memoryStore.nextIds = { ...memoryStore.nextIds, ...parsed.nextIds };
      }
    }
  } catch (storeLoadErr) {
    console.warn('[Persistent Store] Load error, keeping default seeds:', storeLoadErr);
  }

  // Ensure user's own uploaded note 21 is present
  if (!memoryStore.notes.some((n: any) => n.id === 21)) {
    memoryStore.notes.unshift({
      id: 21,
      title: 'Class 11 Biology: Cell - The Unit of Life',
      slug: 'class-11-biology-cell-the-unit-of-life',
      description: 'Comprehensive NCERT class 11 biology handwritten study notes covering Cell: The Unit of Life, cell theory, prokaryotic & eukaryotic cell structure, organelle functions, endomembrane system, and high-yield NEET revision diagrams.',
      subject: 'Biology',
      class_level: 'Class 11',
      exam: 'NEET & Boards',
      resource_type: 'Notes',
      chapter: 'Cell: The Unit of Life',
      category_id: 1,
      price: 1.00,
      original_price: 99.00,
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'Biology_Notes__Cell___The_Unit_of_Life-1788364226209-967035391.pdf',
      preview_file: null,
      preview_pages: 4,
      total_pages: 12,
      file_size_mb: 1.14,
      is_free: 0,
      is_featured: 1,
      is_bestseller: 1,
      author_name: 'NEET Expert Faculty',
      rating_avg: 5.0,
      rating_count: 14,
      purchase_count: 24,
      download_count: 36,
      status: 'published',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    });
  }

  // Ensure admin bypass user akifq027@gmail.com is present in memoryStore.users
  if (!memoryStore.users.some(u => u.email.toLowerCase() === 'akifq027@gmail.com')) {
    memoryStore.users.push({
      id: memoryStore.nextIds.users++,
      name: 'Akif (Admin)',
      email: 'akifq027@gmail.com',
      password_hash: adminPassHash,
      role: 'admin',
      avatar: null,
      phone: '+91 7989725471',
      status: 'active',
      created_at: new Date().toISOString(),
    });
  }

  // Ensure demo notes 22 and 23 are stripped out
  memoryStore.notes = memoryStore.notes.filter((n: any) => n.id !== 22 && n.id !== 23);
  saveStoreToFile();

  try {
    const isCloudDB = DB_HOST.includes('aivencloud.com') || DB_HOST.includes('amazonaws.com') || process.env.DB_SSL === 'true' || DB_PORT !== 3306;
    const sslConfig = isCloudDB ? { rejectUnauthorized: false } : undefined;

    try {
      const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        port: DB_PORT,
        ssl: sslConfig,
        connectTimeout: 4000,
      });

      try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
      } catch (dbCreateErr) {
        // Managed DB users might not have CREATE DATABASE privileges for already created DB
      }
      await connection.end();
    } catch (preErr) {
      // Connect directly to pool if initial connection check fails or DB already exists
    }

    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      ssl: sslConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });

    const testConn = await pool.getConnection();
    testConn.release();

    isUsingMySQL = true;
    console.log(`[Database] Connected successfully to MySQL server at ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    await syncSchemaIfNeeded();
  } catch (err: any) {
    isUsingMySQL = false;
    dbErrorNotice = err.message || 'MySQL connection failed';
    console.log(`[Database Notice] Active with embedded engine (${dbErrorNotice}). Connected seamlessly.`);
  }
}

async function syncSchemaIfNeeded() {
  if (!pool) return;
  try {
    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
        \`avatar\` VARCHAR(255) DEFAULT NULL,
        \`phone\` VARCHAR(20) DEFAULT NULL,
        \`status\` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_users_email\` (\`email\`),
        INDEX \`idx_users_role\` (\`role\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`categories\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL UNIQUE,
        \`slug\` VARCHAR(100) NOT NULL UNIQUE,
        \`description\` TEXT DEFAULT NULL,
        \`icon\` VARCHAR(50) DEFAULT 'book-open',
        \`display_order\` INT DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`notes\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`slug\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`subject\` VARCHAR(100) NOT NULL,
        \`class_level\` VARCHAR(50) NOT NULL DEFAULT 'NEET',
        \`exam\` VARCHAR(50) NOT NULL DEFAULT 'NEET',
        \`resource_type\` VARCHAR(100) NOT NULL DEFAULT 'Notes',
        \`chapter\` VARCHAR(150) NOT NULL,
        \`category_id\` INT UNSIGNED DEFAULT NULL,
        \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`original_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`thumbnail\` VARCHAR(255) DEFAULT NULL,
        \`pdf_file\` VARCHAR(255) NOT NULL,
        \`preview_file\` VARCHAR(255) DEFAULT NULL,
        \`preview_pages\` INT DEFAULT 3,
        \`total_pages\` INT DEFAULT 20,
        \`file_size_mb\` DECIMAL(5, 2) DEFAULT 4.50,
        \`is_free\` TINYINT(1) NOT NULL DEFAULT 0,
        \`is_featured\` TINYINT(1) NOT NULL DEFAULT 0,
        \`is_bestseller\` TINYINT(1) NOT NULL DEFAULT 0,
        \`author_name\` VARCHAR(100) DEFAULT 'NCERT Master Faculty',
        \`rating_avg\` DECIMAL(3, 2) DEFAULT 5.00,
        \`rating_count\` INT UNSIGNED DEFAULT 0,
        \`purchase_count\` INT UNSIGNED DEFAULT 0,
        \`download_count\` INT UNSIGNED DEFAULT 0,
        \`status\` ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_notes_subject\` (\`subject\`),
        INDEX \`idx_notes_class_level\` (\`class_level\`),
        INDEX \`idx_notes_exam\` (\`exam\`),
        INDEX \`idx_notes_chapter\` (\`chapter\`),
        INDEX \`idx_notes_price\` (\`price\`),
        INDEX \`idx_notes_is_free\` (\`is_free\`),
        INDEX \`idx_notes_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Safe schema alterations for existing tables
    try {
      await pool.query(`ALTER TABLE \`notes\` MODIFY COLUMN \`subject\` VARCHAR(100) NOT NULL;`);
    } catch (e) { /* ignore */ }
    try {
      await pool.query(`ALTER TABLE \`notes\` ADD COLUMN \`class_level\` VARCHAR(50) NOT NULL DEFAULT 'NEET' AFTER \`subject\`;`);
    } catch (e) { /* ignore if already exists */ }
    try {
      await pool.query(`ALTER TABLE \`notes\` ADD COLUMN \`exam\` VARCHAR(50) NOT NULL DEFAULT 'NEET' AFTER \`class_level\`;`);
    } catch (e) { /* ignore if already exists */ }
    try {
      await pool.query(`ALTER TABLE \`notes\` ADD COLUMN \`resource_type\` VARCHAR(100) NOT NULL DEFAULT 'Notes' AFTER \`exam\`;`);
    } catch (e) { /* ignore if already exists */ }

    // 4. Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`order_number\` VARCHAR(50) NOT NULL UNIQUE,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`subtotal\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`discount_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`coupon_code\` VARCHAR(50) DEFAULT NULL,
        \`total_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`payment_status\` ENUM('pending', 'pending_verification', 'paid', 'failed', 'refunded', 'rejected') NOT NULL DEFAULT 'pending',
        \`payment_method\` VARCHAR(50) DEFAULT 'razorpay',
        \`razorpay_order_id\` VARCHAR(100) DEFAULT NULL,
        \`razorpay_payment_id\` VARCHAR(100) DEFAULT NULL,
        \`razorpay_signature\` VARCHAR(255) DEFAULT NULL,
        \`customer_name\` VARCHAR(100) DEFAULT NULL,
        \`customer_email\` VARCHAR(191) DEFAULT NULL,
        \`customer_phone\` VARCHAR(20) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_orders_user_id\` (\`user_id\`),
        INDEX \`idx_orders_payment_status\` (\`payment_status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure payment_status enum supports pending_verification and rejected
    try {
      await pool.query(`ALTER TABLE \`orders\` MODIFY COLUMN \`payment_status\` ENUM('pending', 'pending_verification', 'paid', 'failed', 'refunded', 'rejected') NOT NULL DEFAULT 'pending';`);
    } catch (e) { /* ignore */ }

    // 5. Order items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`order_items\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`order_id\` INT UNSIGNED NOT NULL,
        \`note_id\` INT UNSIGNED NOT NULL,
        \`price\` DECIMAL(10, 2) NOT NULL,
        \`note_title\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_order_items_order_id\` (\`order_id\`),
        INDEX \`idx_order_items_note_id\` (\`note_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Downloads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`downloads\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`note_id\` INT UNSIGNED NOT NULL,
        \`order_id\` INT UNSIGNED DEFAULT NULL,
        \`ip_address\` VARCHAR(45) DEFAULT NULL,
        \`user_agent\` VARCHAR(255) DEFAULT NULL,
        \`downloaded_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_downloads_user_note\` (\`user_id\`, \`note_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`note_id\` INT UNSIGNED NOT NULL,
        \`rating\` TINYINT UNSIGNED NOT NULL,
        \`review\` TEXT NOT NULL,
        \`status\` ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'approved',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_reviews_note_id\` (\`note_id\`),
        INDEX \`idx_reviews_rating\` (\`rating\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Coupons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`coupons\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`code\` VARCHAR(50) NOT NULL UNIQUE,
        \`description\` VARCHAR(255) DEFAULT NULL,
        \`discount_type\` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        \`discount_value\` DECIMAL(10, 2) NOT NULL,
        \`minimum_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`usage_limit\` INT UNSIGNED DEFAULT 500,
        \`times_used\` INT UNSIGNED DEFAULT 0,
        \`expiry_date\` DATE DEFAULT NULL,
        \`active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_coupons_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`contacts\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`subject\` VARCHAR(200) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`reply\` TEXT DEFAULT NULL,
        \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`replied_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Refund requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`refund_requests\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`order_id\` INT UNSIGNED NOT NULL,
        \`note_id\` INT UNSIGNED NOT NULL,
        \`reason\` TEXT NOT NULL,
        \`status\` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        \`admin_note\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Wishlist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`wishlist\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`note_id\` INT UNSIGNED NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`unique_user_note_wishlist\` (\`user_id\`, \`note_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. Site settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`site_settings\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`key_name\` VARCHAR(100) NOT NULL UNIQUE,
        \`key_value\` LONGTEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default categories if empty
    const [catRows]: any = await pool.query('SELECT COUNT(*) as count FROM categories');
    if (catRows[0]?.count === 0) {
      console.log('[Database] Seeding default categories in MySQL...');
      for (const cat of memoryStore.categories) {
        await pool.query(
          'INSERT INTO categories (id, name, slug, description, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)',
          [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.display_order]
        );
      }
    }

    // Seed default notes if empty
    const [noteRows]: any = await pool.query('SELECT COUNT(*) as count FROM notes');
    if (noteRows[0]?.count === 0) {
      console.log('[Database] Seeding default high-yield notes in MySQL...');
      for (const note of memoryStore.notes) {
        await pool.query(
          `INSERT INTO notes (
            id, title, slug, description, subject, chapter, category_id, price, original_price,
            thumbnail, pdf_file, preview_file, preview_pages, total_pages, file_size_mb,
            is_free, is_featured, is_bestseller, author_name, rating_avg, rating_count, purchase_count, download_count, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            note.id, note.title, note.slug, note.description, note.subject, note.chapter, note.category_id,
            note.price, note.original_price, note.thumbnail, note.pdf_file, note.preview_file,
            note.preview_pages, note.total_pages, note.file_size_mb, note.is_free, note.is_featured,
            note.is_bestseller, note.author_name, note.rating_avg, note.rating_count,
            note.purchase_count, note.download_count, note.status,
          ]
        );
      }
    }

    // Seed coupons if empty
    const [couponRows]: any = await pool.query('SELECT COUNT(*) as count FROM coupons');
    if (couponRows[0]?.count === 0) {
      console.log('[Database] Seeding default coupons in MySQL...');
      for (const c of memoryStore.coupons) {
        await pool.query(
          'INSERT INTO coupons (code, description, discount_type, discount_value, minimum_amount, usage_limit, times_used, expiry_date, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [c.code, c.description, c.discount_type, c.discount_value, c.minimum_amount, c.usage_limit, c.times_used, c.expiry_date, c.active]
        );
      }
    }

    // Seed or update site settings in MySQL
    for (const [k, v] of Object.entries(memoryStore.site_settings)) {
      await pool.query(
        'INSERT INTO site_settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = ?',
        [k, String(v), String(v)]
      );
    }

    // Ensure admin user exists with role = 'admin'
    const adminEmail = (process.env.ADMIN_EMAIL || 'akifquadri5604@gmail.com').trim().toLowerCase();
    const [adminCheck]: any = await pool.query('SELECT id, role FROM users WHERE email = ?', [adminEmail]);
    if (adminCheck.length === 0) {
      const adminPass = process.env.ADMIN_PASSWORD || 'Admin@12345';
      const hash = await bcrypt.hash(adminPass, 10);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, "admin", "active")',
        ['Faculty Administrator', adminEmail, hash]
      );
    } else if (adminCheck[0].role !== 'admin') {
      await pool.query('UPDATE users SET role = "admin" WHERE id = ?', [adminCheck[0].id]);
    }

    // Also check akifq027@gmail.com and akifquadri5604@gmail.com
    for (const em of ['akifq027@gmail.com', 'akifquadri5604@gmail.com', 'admin@neetnotes.com']) {
      const [uCheck]: any = await pool.query('SELECT id, role FROM users WHERE email = ?', [em]);
      if (uCheck.length > 0 && uCheck[0].role !== 'admin') {
        await pool.query('UPDATE users SET role = "admin" WHERE id = ?', [uCheck[0].id]);
      }
    }

    console.log('[Database] Schema and data synchronized successfully with MySQL.');
  } catch (err) {
    console.error('[Database] Schema sync notice:', err);
  }
}

export function getPool() {
  return pool;
}

export function isMySQLConnected() {
  return isUsingMySQL;
}

export function getDatabaseStatus() {
  return {
    isMySQL: isUsingMySQL,
    host: DB_HOST,
    database: DB_NAME,
    user: DB_USER,
    port: DB_PORT,
    status: isUsingMySQL ? 'connected' : 'fallback_in_memory',
    notice: isUsingMySQL ? 'Connected to MySQL server.' : (dbErrorNotice || 'Embedded high-performance store active.'),
  };
}
