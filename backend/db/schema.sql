-- TripMate AI — Database Schema
-- Run on database: tripmate

SET NAMES utf8mb4;
SET time_zone = '+05:30';

-- --------------------------------------------------------
-- PACKAGES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `packages` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `destination` VARCHAR(100) NOT NULL,
  `category` ENUM('honeymoon','family','adventure','pilgrimage','budget','luxury','group') NOT NULL DEFAULT 'family',
  `days` INT NOT NULL,
  `price_per_person` DECIMAL(10,2) NOT NULL,
  `child_price` DECIMAL(10,2) DEFAULT NULL,
  `hotel_category` VARCHAR(50) DEFAULT '3-star',
  `meals_included` VARCHAR(100) DEFAULT 'breakfast',
  `food_preference` ENUM('veg','non-veg','any') DEFAULT 'any',
  `inclusions` JSON DEFAULT NULL,
  `exclusions` JSON DEFAULT NULL,
  `itinerary` JSON DEFAULT NULL,
  `image_url` TEXT DEFAULT NULL,
  `available_dates` JSON DEFAULT NULL,
  `group_size_limit` INT DEFAULT 20,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_destination` (`destination`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`),
  INDEX `idx_price` (`price_per_person`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SESSIONS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `session_token` VARCHAR(64) NOT NULL,
  `source_campaign` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`session_token`),
  INDEX `idx_last_active` (`last_active_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- LEADS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leads` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `session_id` VARCHAR(36) DEFAULT NULL,
  `name` VARCHAR(150) DEFAULT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `source_campaign` VARCHAR(100) DEFAULT NULL,
  `primary_interest` VARCHAR(150) DEFAULT NULL,
  `budget_mentioned` DECIMAL(10,2) DEFAULT NULL,
  `travel_date_mentioned` VARCHAR(100) DEFAULT NULL,
  `group_size` INT DEFAULT NULL,
  `urgency_level` ENUM('none','low','medium','high') DEFAULT 'none',
  `package_interest_confidence` ENUM('low','medium','high') DEFAULT 'low',
  `matched_package_ids` JSON DEFAULT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `score_band` ENUM('hot','warm','cold') NOT NULL DEFAULT 'cold',
  `score_breakdown` JSON DEFAULT NULL,
  `ai_summary` TEXT DEFAULT NULL,
  `assigned_agent_id` VARCHAR(36) DEFAULT NULL,
  `status` ENUM('new','contacted','converted','lost') NOT NULL DEFAULT 'new',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_session` (`session_id`),
  INDEX `idx_score_band` (`score_band`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- MESSAGES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `session_id` VARCHAR(36) NOT NULL,
  `role` ENUM('user','assistant','tool','system') NOT NULL,
  `content` TEXT NOT NULL,
  `tool_name` VARCHAR(100) DEFAULT NULL,
  `tool_call_id` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_session_created` (`session_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ADMIN USERS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('owner','agent') NOT NULL DEFAULT 'agent',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SCORING RULES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `scoring_rules` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `signal_name` VARCHAR(100) NOT NULL,
  `label` VARCHAR(200) NOT NULL,
  `points` INT NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_signal` (`signal_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- BOT SETTINGS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bot_settings` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- DEFAULT SCORING RULES
-- --------------------------------------------------------
INSERT INTO `scoring_rules` (`signal_name`, `label`, `points`, `enabled`) VALUES
('specific_package_discussed', 'Specific package explicitly discussed (2+ times)', 20, 1),
('budget_mentioned', 'Budget mentioned', 15, 1),
('travel_date_within_30_days', 'Travel date within 30 days', 25, 1),
('group_size_shared', 'Group size / family details shared', 10, 1),
('contact_captured', 'Name + phone number captured', 20, 1),
('payment_query', 'Asked about payment/booking/how to confirm', 25, 1),
('high_urgency', 'High urgency language (urgent, ASAP, this week)', 20, 1),
('vague_browsing', 'Vague single-message browsing, no follow-up', -10, 1),
('ignored_questions', 'Ignored 2+ clarifying questions', -15, 1),
('just_browsing', 'Explicitly says just browsing / not sure yet', -20, 1)
ON DUPLICATE KEY UPDATE `points`=VALUES(`points`);

-- --------------------------------------------------------
-- DEFAULT BOT SETTINGS
-- --------------------------------------------------------
INSERT INTO `bot_settings` (`setting_key`, `setting_value`) VALUES
('greeting_message', 'Hi there! 👋 I''m Riya, your personal travel consultant. I can help you find the perfect tour package for any destination, budget, or occasion. What kind of trip are you dreaming of? 🌴'),
('agent_name', 'Riya'),
('agency_name', 'TripMate'),
('tone', 'warm, professional, consultative'),
('hindi_support', 'true'),
('escalation_keywords', '["refund","complaint","cancel","cheated","manager","problem","issue","wrong"]'),
('hot_lead_threshold', '70'),
('warm_lead_threshold', '35'),
('business_hours', '9 AM - 8 PM IST, Mon-Sat'),
('escalation_contact_email', 'admin@royal300.com')
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);

-- --------------------------------------------------------
-- DEFAULT ADMIN USER (password: Admin@123)
-- --------------------------------------------------------
INSERT INTO `admin_users` (`name`, `email`, `password_hash`, `role`) VALUES
('Admin', 'admin@royal300.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
