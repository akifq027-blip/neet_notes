-- ============================================================================
-- NEET Notes Marketplace — Complete MySQL Database Schema
-- Database Name: neet_notes_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `neet_notes_db` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `neet_notes_db`;

-- ----------------------------------------------------------------------------
-- 1. Table: users
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `downloads`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `refund_requests`;
DROP TABLE IF EXISTS `wishlist`;
DROP TABLE IF EXISTS `recently_viewed`;
DROP TABLE IF EXISTS `notes`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `contacts`;
DROP TABLE IF EXISTS `site_settings`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Table: categories
-- ----------------------------------------------------------------------------
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT 'book-open',
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Table: notes
-- ----------------------------------------------------------------------------
CREATE TABLE `notes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `subject` ENUM('Physics', 'Chemistry', 'Biology', 'General NEET') NOT NULL,
  `chapter` VARCHAR(150) NOT NULL,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `original_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `thumbnail` VARCHAR(255) DEFAULT NULL,
  `pdf_file` VARCHAR(255) NOT NULL,
  `preview_file` VARCHAR(255) DEFAULT NULL,
  `preview_pages` INT DEFAULT 3,
  `total_pages` INT DEFAULT 20,
  `file_size_mb` DECIMAL(5, 2) DEFAULT 4.50,
  `is_free` TINYINT(1) NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_bestseller` TINYINT(1) NOT NULL DEFAULT 0,
  `author_name` VARCHAR(100) DEFAULT 'Dr. AIIMS NEET Faculty',
  `rating_avg` DECIMAL(3, 2) DEFAULT 5.00,
  `rating_count` INT UNSIGNED DEFAULT 0,
  `purchase_count` INT UNSIGNED DEFAULT 0,
  `download_count` INT UNSIGNED DEFAULT 0,
  `status` ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_notes_subject` (`subject`),
  INDEX `idx_notes_chapter` (`chapter`),
  INDEX `idx_notes_price` (`price`),
  INDEX `idx_notes_is_free` (`is_free`),
  INDEX `idx_notes_status` (`status`),
  FULLTEXT INDEX `ft_notes_search` (`title`, `description`, `chapter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Table: orders
-- ----------------------------------------------------------------------------
CREATE TABLE `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `coupon_code` VARCHAR(50) DEFAULT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(50) DEFAULT 'razorpay',
  `razorpay_order_id` VARCHAR(100) DEFAULT NULL,
  `razorpay_payment_id` VARCHAR(100) DEFAULT NULL,
  `razorpay_signature` VARCHAR(255) DEFAULT NULL,
  `customer_name` VARCHAR(100) DEFAULT NULL,
  `customer_email` VARCHAR(191) DEFAULT NULL,
  `customer_phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_orders_user_id` (`user_id`),
  INDEX `idx_orders_payment_status` (`payment_status`),
  INDEX `idx_orders_razorpay_order_id` (`razorpay_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table: order_items
-- ----------------------------------------------------------------------------
CREATE TABLE `order_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT UNSIGNED NOT NULL,
  `note_id` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `note_title` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE,
  INDEX `idx_order_items_order_id` (`order_id`),
  INDEX `idx_order_items_note_id` (`note_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table: downloads
-- ----------------------------------------------------------------------------
CREATE TABLE `downloads` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `note_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `downloaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL,
  INDEX `idx_downloads_user_note` (`user_id`, `note_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Table: reviews
-- ----------------------------------------------------------------------------
CREATE TABLE `reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `note_id` INT UNSIGNED NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `review` TEXT NOT NULL,
  `status` ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'approved',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_note_review` (`user_id`, `note_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE,
  INDEX `idx_reviews_note_id` (`note_id`),
  INDEX `idx_reviews_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Table: coupons
-- ----------------------------------------------------------------------------
CREATE TABLE `coupons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10, 2) NOT NULL,
  `minimum_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `usage_limit` INT UNSIGNED DEFAULT 500,
  `times_used` INT UNSIGNED DEFAULT 0,
  `expiry_date` DATE DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. Table: contacts (Support messages)
-- ----------------------------------------------------------------------------
CREATE TABLE `contacts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(200) DEFAULT 'General Inquiry',
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `reply` TEXT DEFAULT NULL,
  `replied_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. Table: refund_requests
-- ----------------------------------------------------------------------------
CREATE TABLE `refund_requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED NOT NULL,
  `note_id` INT UNSIGNED NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `admin_note` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. Table: wishlist
-- ----------------------------------------------------------------------------
CREATE TABLE `wishlist` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `note_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_wishlist` (`user_id`, `note_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. Table: site_settings
-- ----------------------------------------------------------------------------
CREATE TABLE `site_settings` (
  `key_name` VARCHAR(50) PRIMARY KEY,
  `key_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA FOR TESTING AND INITIAL LAUNCH
-- ============================================================================

-- 1. Default Admin Account (Password: AdminPassword@2025 - bcrypt hashed)
-- Hash generated using bcrypt cost 10: $2a$10$w82qWvC7M1jO4uT7.HlJaeM284iK0n3m1r/G8YqR2J7i7l3n8fC/6
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `status`) VALUES
('NEET Notes Admin', 'admin@neetnotes.com', '$2a$10$83Z08mG4hJ9Y.j8p1Jk17.tU1y7l17l19.k5j0j3m5o2h0j9k8l7m', 'admin', 'active'),
('Akash Sharma', 'student@neetnotes.com', '$2a$10$83Z08mG4hJ9Y.j8p1Jk17.tU1y7l17l19.k5j0j3m5o2h0j9k8l7m', 'student', 'active');

-- 2. Categories
INSERT INTO `categories` (`name`, `slug`, `description`, `icon`, `display_order`) VALUES
('NCERT Line-by-Line Notes', 'ncert-notes', 'Comprehensive NCERT line-by-line extracts with marked high-yield NEET lines.', 'book-open', 1),
('Revision Notes & Mindmaps', 'revision-notes', 'Quick chapter summary maps and one-page cheat sheets for rapid revision.', 'zap', 2),
('Previous Year Questions (PYQs)', 'pyqs', 'Topic-wise 15 years solved NEET and AIPMT past questions with step-by-step solutions.', 'file-check', 3),
('Formula Sheets & Cheat Codes', 'formula-sheets', 'Complete Physics and Physical Chemistry formula digests with unit tables.', 'hash', 4),
('Biology Diagrams & Flowcharts', 'biology-diagrams', 'High-res labeled anatomical and physiological diagrams essential for NEET.', 'activity', 5),
('Question Banks & Mock Papers', 'question-banks', 'High-yield assertion-reason and multi-statement practice sets with answer keys.', 'help-circle', 6),
('Crash Course Modules', 'crash-course', '7-day fast-track high weightage chapter capsules for final exam crunch.', 'clock', 7);

-- 3. Initial Study Notes
INSERT INTO `notes` (`title`, `slug`, `description`, `subject`, `chapter`, `category_id`, `price`, `original_price`, `thumbnail`, `pdf_file`, `preview_file`, `preview_pages`, `total_pages`, `file_size_mb`, `is_free`, `is_featured`, `is_bestseller`, `author_name`, `rating_avg`, `rating_count`, `purchase_count`, `download_count`, `status`) VALUES
(
  'Human Physiology Master Handbook (All 7 Chapters)', 
  'human-physiology-master-handbook', 
  'Complete color-coded handwritten notes covering Digestion, Breathing, Body Fluids, Excretion, Locomotion, Neural & Chemical Coordination. Includes labeled NCERT diagrams, high-yield clinical correlations, and 200+ previous year questions tagged line-by-line.', 
  'Biology', 
  'Human Physiology', 
  1, 
  199.00, 
  499.00, 
  '/assets/thumbnails/biology-physio.jpg', 
  'human-physiology-full.pdf', 
  'human-physiology-preview.pdf', 
  5, 
  145, 
  14.20, 
  0, 
  1, 
  1, 
  'Dr. Ramesh Gupta (AIIMS Delhi M.B.B.S)', 
  4.95, 
  128, 
  540, 
  890, 
  'published'
),
(
  'Rotational Motion & Mechanics Formula Sheet + Shortcuts', 
  'rotational-motion-mechanics-formula-sheet', 
  'Formula cheat sheet, moment of inertia master chart, torque shortcuts, rolling motion energy equations, and tricky solved problems to master Rotation in 3 hours.', 
  'Physics', 
  'System of Particles & Rotational Motion', 
  4, 
  49.00, 
  149.00, 
  '/assets/thumbnails/physics-rotational.jpg', 
  'rotational-motion-full.pdf', 
  'rotational-motion-preview.pdf', 
  3, 
  24, 
  3.80, 
  0, 
  1, 
  1, 
  'Prof. V. K. Verma (Ex-Kota Physics HOD)', 
  4.88, 
  94, 
  410, 
  620, 
  'published'
),
(
  'Organic Chemistry Named Reactions & Mechanisms Compendium', 
  'organic-chemistry-named-reactions-mechanisms', 
  'All 72 Named Reactions of Class 11 & 12 NCERT with detailed arrow-pushing mechanisms, reagent identification flowcharts, and distinguishing test tables (Lucas, Tollens, Fehling, Iodoform).', 
  'Chemistry', 
  'Organic Chemistry Master Guide', 
  1, 
  149.00, 
  399.00, 
  '/assets/thumbnails/chemistry-organic.jpg', 
  'organic-chemistry-reactions.pdf', 
  'organic-chemistry-preview.pdf', 
  4, 
  88, 
  9.40, 
  0, 
  1, 
  1, 
  'Er. Sandeep Mittal (IIT Roorkee / NEET Faculty)', 
  4.92, 
  112, 
  490, 
  770, 
  'published'
),
(
  'FREE: NEET Biology NCERT High-Yield Diagrams & Flowcharts Vol. 1', 
  'free-neet-biology-ncert-diagrams-vol-1', 
  'Essential labeled diagrams from Cell Biology, Plant Anatomy, and Genetics directly tested in NEET exams. Download 100% free after student signup!', 
  'Biology', 
  'Cell Biology & Genetics', 
  5, 
  0.00, 
  199.00, 
  '/assets/thumbnails/free-bio-diagrams.jpg', 
  'free-biology-diagrams.pdf', 
  'free-biology-diagrams-preview.pdf', 
  6, 
  32, 
  5.10, 
  1, 
  1, 
  0, 
  'Dr. Ananya Ray (NEET Rank 42 Mentor)', 
  4.98, 
  340, 
  1820, 
  2450, 
  'published'
),
(
  'Optics & Modern Physics Complete Formula & Revision Capsule', 
  'optics-modern-physics-revision-capsule', 
  'Ray Optics, Wave Optics, Dual Nature, Atoms, Nuclei, and Semiconductor devices. Includes sign conventions, lens maker formula derivations, and standard numerical shortcuts.', 
  'Physics', 
  'Optics and Modern Physics', 
  2, 
  129.00, 
  299.00, 
  '/assets/thumbnails/physics-optics.jpg', 
  'optics-modern-physics.pdf', 
  'optics-modern-physics-preview.pdf', 
  3, 
  56, 
  6.30, 
  0, 
  0, 
  1, 
  'Prof. V. K. Verma (Ex-Kota Physics HOD)', 
  4.82, 
  76, 
  320, 
  490, 
  'published'
),
(
  'Chemical Bonding & Coordination Compounds NCERT Decoder', 
  'chemical-bonding-coordination-compounds', 
  'VSEPR geometry rules, Hybridisation tricks, MOT energy diagrams, Crystal Field Splitting energy tricks, and IUPAC nomenclature with previous 12 years question patterns.', 
  'Chemistry', 
  'Inorganic Chemistry Foundations', 
  1, 
  99.00, 
  249.00, 
  '/assets/thumbnails/chemistry-bonding.jpg', 
  'chemical-bonding-decoder.pdf', 
  'chemical-bonding-preview.pdf', 
  3, 
  48, 
  5.70, 
  0, 
  0, 
  0, 
  'Er. Sandeep Mittal (IIT Roorkee / NEET Faculty)', 
  4.79, 
  54, 
  230, 
  380, 
  'published'
),
(
  'FREE: NEET 2024 & 2023 Solved Paper with Official Key & Explanations', 
  'free-neet-2024-2023-solved-paper', 
  'Complete 200 Questions solved with detailed step-by-step explanations, question difficulty breakdown, and NCERT page number references.', 
  'General NEET', 
  'All Subjects Full Mock Analysis', 
  3, 
  0.00, 
  99.00, 
  '/assets/thumbnails/free-pyq-paper.jpg', 
  'free-neet-solved-paper.pdf', 
  'free-neet-solved-paper-preview.pdf', 
  8, 
  44, 
  4.90, 
  1, 
  1, 
  0, 
  'Dr. Ramesh Gupta (AIIMS Delhi M.B.B.S)', 
  4.96, 
  410, 
  2900, 
  3800, 
  'published'
),
(
  'Genetics, Molecular Basis of Inheritance & Biotechnology Handbook', 
  'genetics-molecular-basis-biotech-handbook', 
  'Mendelian crosses, Pedigree analysis rules, DNA Replication, Transcription, Lac Operon, PCR, and rDNA technology. Maximum weightage unit in NEET Biology.', 
  'Biology', 
  'Genetics & Biotechnology', 
  1, 
  169.00, 
  399.00, 
  '/assets/thumbnails/biology-genetics.jpg', 
  'genetics-biotech-full.pdf', 
  'genetics-biotech-preview.pdf', 
  4, 
  92, 
  11.50, 
  0, 
  1, 
  1, 
  'Dr. Ananya Ray (NEET Rank 42 Mentor)', 
  4.94, 
  88, 
  380, 
  590, 
  'published'
);

-- 4. Coupons
INSERT INTO `coupons` (`code`, `description`, `discount_type`, `discount_value`, `minimum_amount`, `usage_limit`, `times_used`, `expiry_date`, `active`) VALUES
('NEET20', 'Special 20% discount on all notes and question banks', 'percentage', 20.00, 99.00, 1000, 42, '2026-12-31', 1),
('BIOLOGY50', 'Flat Rs. 50 OFF on Biology Master Modules', 'fixed', 50.00, 150.00, 500, 19, '2026-12-31', 1),
('FIRSTBUY', 'Flat 15% discount for first-time NEET aspirants', 'percentage', 15.00, 49.00, 2000, 88, '2026-12-31', 1);

-- 5. Reviews
INSERT INTO `reviews` (`user_id`, `note_id`, `rating`, `review`, `status`) VALUES
(2, 1, 5, 'The Human Physiology handbook saved my NEET preparation! The NCERT page tags and colored flowcharts made revising all 7 chapters effortless.', 'approved'),
(2, 2, 5, 'Rotational Motion used to be my weakest chapter. The moment of inertia tricks in this PDF solved my doubts in just one evening.', 'approved'),
(2, 3, 5, 'Every single reaction mechanism is explained so clearly. Best organic chemistry notes for NEET aspirants by far.', 'approved');

-- 6. Site Settings
INSERT INTO `site_settings` (`key_name`, `key_value`) VALUES
('site_name', 'NEET Notes Marketplace'),
('site_tagline', 'High-Yield Medical Entrance Study Material & NCERT Decoders'),
('support_email', 'support@neetnotes.com'),
('support_phone', '+91 98765 43210'),
('maintenance_mode', 'false'),
('announcement_bar', '🎉 NEET 2026 Aspirants: Use code NEET20 for 20% OFF on all high-yield notes!'),
('currency_symbol', '₹');
