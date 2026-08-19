CREATE DATABASE IF NOT EXISTS nursery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nursery_db;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'user',
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farmers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(30),
  location VARCHAR(180),
  address TEXT,
  notes TEXT,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  type ENUM('CUSTOMER','EXPORTER') NOT NULL DEFAULT 'CUSTOMER',
  phone VARCHAR(30),
  email VARCHAR(190),
  address TEXT,
  city VARCHAR(100),
  gst_number VARCHAR(50),
  notes TEXT,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_date DATE NOT NULL,
  party_type ENUM('FARMER','CUSTOMER') NOT NULL,
  party_id INT UNSIGNED NOT NULL,
  transaction_type ENUM('PURCHASE','FARMER_PAYMENT','SALE','CUSTOMER_RECEIPT') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(40) DEFAULT 'Cash',
  remarks VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_party (party_type, party_id),
  INDEX idx_date (transaction_date)
);

CREATE TABLE expenses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expense_date DATE NOT NULL,
  expense_type VARCHAR(80) NOT NULL,
  description VARCHAR(500),
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(40) DEFAULT 'Cash',
  remarks VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expense_date (expense_date)
);

CREATE TABLE expense_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  status TINYINT(1) DEFAULT 1
);

INSERT IGNORE INTO expense_categories(name) VALUES
('Travel'),('Fuel'),('Loading'),('Unloading'),('Labour'),
('Packing'),('Commission'),('Vehicle'),('Other');

CREATE TABLE payment_modes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  status TINYINT(1) DEFAULT 1
);

INSERT IGNORE INTO payment_modes(name) VALUES
('Cash'),('UPI'),('Bank Transfer'),('Cheque'),('Other');

CREATE TABLE settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT
);

-- Seed default settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('currency_symbol', '₹'),
('business_name', 'Green Harvest Nursery'),
('business_phone', '+91 9876543210'),
('business_address', 'Main Road, Nursery Cluster, Anaparthi, AP');

-- Seed default admin user (email: admin@nursery.com, password: admin123)
-- Password hash generated using password_hash('admin123', PASSWORD_BCRYPT)
INSERT IGNORE INTO users (id, name, email, password_hash, role, status) VALUES
(1, 'Admin Manager', 'admin@nursery.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 1);