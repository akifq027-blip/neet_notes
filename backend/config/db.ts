import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'neet_notes_db';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);

let pool: mysql.Pool | null = null;
let isUsingMySQL = false;
let dbErrorNotice = '';

// Unified In-memory relational store
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
    notes: 9,
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

export async function initDatabase() {
  // Seed in-memory store
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
  ];

  memoryStore.categories = [
    { id: 1, name: 'NCERT Line-by-Line Notes', slug: 'ncert-notes', description: 'Comprehensive NCERT line-by-line extracts with marked high-yield NEET lines.', icon: 'book-open', display_order: 1 },
    { id: 2, name: 'Revision Notes & Mindmaps', slug: 'revision-notes', description: 'Quick chapter summary maps and one-page cheat sheets for rapid revision.', icon: 'zap', display_order: 2 },
    { id: 3, name: 'Previous Year Questions (PYQs)', slug: 'pyqs', description: 'Topic-wise 15 years solved NEET and AIPMT past questions with step-by-step solutions.', icon: 'file-check', display_order: 3 },
    { id: 4, name: 'Formula Sheets & Cheat Codes', slug: 'formula-sheets', description: 'Complete Physics and Physical Chemistry formula digests with unit tables.', icon: 'hash', display_order: 4 },
    { id: 5, name: 'Biology Diagrams & Flowcharts', slug: 'biology-diagrams', description: 'High-res labeled anatomical and physiological diagrams essential for NEET.', icon: 'activity', display_order: 5 },
    { id: 6, name: 'Question Banks & Mock Papers', slug: 'question-banks', description: 'High-yield assertion-reason and multi-statement practice sets with answer keys.', icon: 'help-circle', display_order: 6 },
    { id: 7, name: 'Crash Course Modules', slug: 'crash-course', description: '7-day fast-track high weightage chapter capsules for final exam crunch.', icon: 'clock', display_order: 7 },
  ];

  memoryStore.notes = [
    {
      id: 1,
      title: 'Human Physiology Master Handbook (All 7 Chapters)',
      slug: 'human-physiology-master-handbook',
      description: 'Complete color-coded handwritten notes covering Digestion, Breathing, Body Fluids, Excretion, Locomotion, Neural & Chemical Coordination. Includes labeled NCERT diagrams, high-yield clinical correlations, and 200+ previous year questions tagged line-by-line.',
      subject: 'Biology',
      chapter: 'Human Physiology',
      category_id: 1,
      price: 199.00,
      original_price: 499.00,
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'human-physiology-master.pdf',
      preview_file: 'human-physiology-preview.pdf',
      preview_pages: 5,
      total_pages: 145,
      file_size_mb: 14.20,
      is_free: 0,
      is_featured: 1,
      is_bestseller: 1,
      author_name: 'Dr. Ramesh Gupta (AIIMS Delhi M.B.B.S)',
      rating_avg: 4.95,
      rating_count: 128,
      purchase_count: 540,
      download_count: 890,
      status: 'published',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      title: 'Rotational Motion & Mechanics Formula Sheet + Shortcuts',
      slug: 'rotational-motion-mechanics-formula-sheet',
      description: 'Formula cheat sheet, moment of inertia master chart, torque shortcuts, rolling motion energy equations, and tricky solved problems to master Rotation in 3 hours.',
      subject: 'Physics',
      chapter: 'System of Particles & Rotational Motion',
      category_id: 4,
      price: 49.00,
      original_price: 149.00,
      thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'rotational-motion-full.pdf',
      preview_file: 'rotational-motion-preview.pdf',
      preview_pages: 3,
      total_pages: 24,
      file_size_mb: 3.80,
      is_free: 0,
      is_featured: 1,
      is_bestseller: 1,
      author_name: 'Prof. V. K. Verma (Ex-Kota Physics HOD)',
      rating_avg: 4.88,
      rating_count: 94,
      purchase_count: 410,
      download_count: 620,
      status: 'published',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 3,
      title: 'Organic Chemistry Named Reactions & Mechanisms Compendium',
      slug: 'organic-chemistry-named-reactions-mechanisms',
      description: 'All 72 Named Reactions of Class 11 & 12 NCERT with detailed arrow-pushing mechanisms, reagent identification flowcharts, and distinguishing test tables (Lucas, Tollens, Fehling, Iodoform).',
      subject: 'Chemistry',
      chapter: 'Organic Chemistry Master Guide',
      category_id: 1,
      price: 149.00,
      original_price: 399.00,
      thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'organic-chemistry-reactions.pdf',
      preview_file: 'organic-chemistry-preview.pdf',
      preview_pages: 4,
      total_pages: 88,
      file_size_mb: 9.40,
      is_free: 0,
      is_featured: 1,
      is_bestseller: 1,
      author_name: 'Er. Sandeep Mittal (IIT Roorkee / NEET Faculty)',
      rating_avg: 4.92,
      rating_count: 112,
      purchase_count: 490,
      download_count: 770,
      status: 'published',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 4,
      title: 'FREE: NEET Biology NCERT High-Yield Diagrams & Flowcharts Vol. 1',
      slug: 'free-neet-biology-ncert-diagrams-vol-1',
      description: 'Essential labeled diagrams from Cell Biology, Plant Anatomy, and Genetics directly tested in NEET exams. Download 100% free after student signup!',
      subject: 'Biology',
      chapter: 'Cell Biology & Genetics',
      category_id: 5,
      price: 0.00,
      original_price: 199.00,
      thumbnail: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'free-biology-diagrams.pdf',
      preview_file: 'free-biology-diagrams-preview.pdf',
      preview_pages: 6,
      total_pages: 32,
      file_size_mb: 5.10,
      is_free: 1,
      is_featured: 1,
      is_bestseller: 0,
      author_name: 'Dr. Ananya Ray (NEET Rank 42 Mentor)',
      rating_avg: 4.98,
      rating_count: 340,
      purchase_count: 1820,
      download_count: 2450,
      status: 'published',
      created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    },
    {
      id: 5,
      title: 'Optics & Modern Physics Complete Formula & Revision Capsule',
      slug: 'optics-modern-physics-revision-capsule',
      description: 'Ray Optics, Wave Optics, Dual Nature, Atoms, Nuclei, and Semiconductor devices. Includes sign conventions, lens maker formula derivations, and standard numerical shortcuts.',
      subject: 'Physics',
      chapter: 'Optics and Modern Physics',
      category_id: 2,
      price: 129.00,
      original_price: 299.00,
      thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'optics-modern-physics.pdf',
      preview_file: 'optics-modern-physics-preview.pdf',
      preview_pages: 3,
      total_pages: 56,
      file_size_mb: 6.30,
      is_free: 0,
      is_featured: 0,
      is_bestseller: 1,
      author_name: 'Prof. V. K. Verma (Ex-Kota Physics HOD)',
      rating_avg: 4.82,
      rating_count: 76,
      purchase_count: 320,
      download_count: 490,
      status: 'published',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 6,
      title: 'Chemical Bonding & Coordination Compounds NCERT Decoder',
      slug: 'chemical-bonding-coordination-compounds',
      description: 'VSEPR geometry rules, Hybridisation tricks, MOT energy diagrams, Crystal Field Splitting energy tricks, and IUPAC nomenclature with previous 12 years question patterns.',
      subject: 'Chemistry',
      chapter: 'Inorganic Chemistry Foundations',
      category_id: 1,
      price: 99.00,
      original_price: 249.00,
      thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'chemical-bonding-decoder.pdf',
      preview_file: 'chemical-bonding-preview.pdf',
      preview_pages: 3,
      total_pages: 48,
      file_size_mb: 5.70,
      is_free: 0,
      is_featured: 0,
      is_bestseller: 0,
      author_name: 'Er. Sandeep Mittal (IIT Roorkee / NEET Faculty)',
      rating_avg: 4.79,
      rating_count: 54,
      purchase_count: 230,
      download_count: 380,
      status: 'published',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 7,
      title: 'FREE: NEET Solved Paper with Official Key & Explanations',
      slug: 'free-neet-solved-paper',
      description: 'Complete 200 Questions solved with detailed step-by-step explanations, question difficulty breakdown, and NCERT page number references.',
      subject: 'General NEET',
      chapter: 'All Subjects Full Mock Analysis',
      category_id: 3,
      price: 0.00,
      original_price: 99.00,
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'free-neet-solved-paper.pdf',
      preview_file: 'free-neet-solved-paper-preview.pdf',
      preview_pages: 8,
      total_pages: 44,
      file_size_mb: 4.90,
      is_free: 1,
      is_featured: 1,
      is_bestseller: 0,
      author_name: 'Dr. Ramesh Gupta (AIIMS Delhi M.B.B.S)',
      rating_avg: 4.96,
      rating_count: 410,
      purchase_count: 2900,
      download_count: 3800,
      status: 'published',
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: 8,
      title: 'Genetics, Molecular Basis of Inheritance & Biotechnology Handbook',
      slug: 'genetics-molecular-basis-biotech-handbook',
      description: 'Mendelian crosses, Pedigree analysis rules, DNA Replication, Transcription, Lac Operon, PCR, and rDNA technology. Maximum weightage unit in NEET Biology.',
      subject: 'Biology',
      chapter: 'Genetics & Biotechnology',
      category_id: 1,
      price: 169.00,
      original_price: 399.00,
      thumbnail: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
      pdf_file: 'genetics-biotech-full.pdf',
      preview_file: 'genetics-biotech-preview.pdf',
      preview_pages: 4,
      total_pages: 92,
      file_size_mb: 11.50,
      is_free: 0,
      is_featured: 1,
      is_bestseller: 1,
      author_name: 'Dr. Ananya Ray (NEET Rank 42 Mentor)',
      rating_avg: 4.94,
      rating_count: 88,
      purchase_count: 380,
      download_count: 590,
      status: 'published',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  memoryStore.coupons = [
    { id: 1, code: 'NEET20', description: 'Special 20% discount on all notes and question banks', discount_type: 'percentage', discount_value: 20.00, minimum_amount: 99.00, usage_limit: 1000, times_used: 42, expiry_date: '2026-12-31', active: 1 },
    { id: 2, code: 'BIOLOGY50', description: 'Flat Rs. 50 OFF on Biology Master Modules', discount_type: 'fixed', discount_value: 50.00, minimum_amount: 150.00, usage_limit: 500, times_used: 19, expiry_date: '2026-12-31', active: 1 },
    { id: 3, code: 'FIRSTBUY', description: 'Flat 15% discount for first-time NEET aspirants', discount_type: 'percentage', discount_value: 15.00, minimum_amount: 49.00, usage_limit: 2000, times_used: 88, expiry_date: '2026-12-31', active: 1 },
  ];

  memoryStore.reviews = [
    { id: 1, user_id: 2, note_id: 1, rating: 5, review: 'The Human Physiology handbook saved my NEET preparation! The NCERT page tags and colored flowcharts made revising all 7 chapters effortless.', status: 'approved', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: 2, user_id: 2, note_id: 2, rating: 5, review: 'Rotational Motion used to be my weakest chapter. The moment of inertia tricks in this PDF solved my doubts in just one evening.', status: 'approved', created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
    { id: 3, user_id: 2, note_id: 3, rating: 5, review: 'Every single reaction mechanism is explained so clearly. Best organic chemistry notes for NEET aspirants by far.', status: 'approved', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
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
    { id: 1, order_id: 1, note_id: 1, price: 199.00, note_title: 'Human Physiology Master Handbook (All 7 Chapters)', created_at: new Date(Date.now() - 7 * 86400000).toISOString() }
  ];

  memoryStore.site_settings = {
    site_name: 'NEET Notes Marketplace',
    site_tagline: 'High-Yield Medical Entrance Study Material & NCERT Decoders',
    support_email: 'akifquadri5604@gmail.com',
    support_phone: '7989725471',
    maintenance_mode: 'false',
    announcement_bar: '🎉 NEET 2026 Aspirants: Use code NEET20 for 20% OFF on all high-yield notes!',
    currency_symbol: '₹',
  };

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
        \`subject\` ENUM('Physics', 'Chemistry', 'Biology', 'General NEET') NOT NULL,
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
        \`author_name\` VARCHAR(100) DEFAULT 'Dr. AIIMS NEET Faculty',
        \`rating_avg\` DECIMAL(3, 2) DEFAULT 5.00,
        \`rating_count\` INT UNSIGNED DEFAULT 0,
        \`purchase_count\` INT UNSIGNED DEFAULT 0,
        \`download_count\` INT UNSIGNED DEFAULT 0,
        \`status\` ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_notes_subject\` (\`subject\`),
        INDEX \`idx_notes_chapter\` (\`chapter\`),
        INDEX \`idx_notes_price\` (\`price\`),
        INDEX \`idx_notes_is_free\` (\`is_free\`),
        INDEX \`idx_notes_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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
        \`payment_status\` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
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
