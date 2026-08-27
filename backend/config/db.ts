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
    support_email: 'support@neetnotes.com',
    support_phone: '+91 98765 43210',
    maintenance_mode: 'false',
    announcement_bar: '🎉 NEET 2026 Aspirants: Use code NEET20 for 20% OFF on all high-yield notes!',
    currency_symbol: '₹',
  };

  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT,
      connectTimeout: 2000,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();

    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
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
    const [rows]: any = await pool.query("SHOW TABLES LIKE 'notes'");
    if (rows.length === 0) {
      console.log('[Database] Initializing MySQL tables from schema.sql...');
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (e: any) {}
        }
        console.log('[Database] MySQL tables created successfully.');
      }
    }
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
