CREATE DATABASE IF NOT EXISTS kalon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kalon;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL UNIQUE,
  name VARCHAR(100),
  email VARCHAR(150),
  role ENUM('customer', 'volunteer', 'admin') NOT NULL DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT,
  license_plate VARCHAR(20) NOT NULL,
  color VARCHAR(30),
  fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') DEFAULT 'petrol',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS service_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS assistance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_code VARCHAR(20) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  volunteer_id INT NULL,
  vehicle_id INT NULL,
  service_type_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  notes TEXT,
  estimated_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (volunteer_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (service_type_id) REFERENCES service_types(id)
);

CREATE TABLE IF NOT EXISTS request_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES assistance_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  is_available BOOLEAN DEFAULT TRUE,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_jobs INT DEFAULT 0,
  services_offered JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES assistance_requests(id)
);

INSERT INTO service_types (slug, name, description, base_price, icon) VALUES
  ('fuel_delivery', 'Fuel Delivery', 'Emergency fuel delivery to your location', 499.00, 'fuel'),
  ('tyre_puncture', 'Tyre Puncture', 'On-spot puncture repair and tyre change', 399.00, 'tyre'),
  ('battery_jump', 'Battery Jump Start', 'Jump start service for dead batteries', 349.00, 'battery'),
  ('towing', 'Towing Service', 'Vehicle towing to nearest service center', 999.00, 'tow')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO users (phone, name, email, role, is_verified) VALUES
  ('9999999999', 'Admin User', 'admin@kalon.app', 'admin', TRUE),
  ('8888888888', 'Volunteer One', 'volunteer@kalon.app', 'volunteer', TRUE),
  ('7777777777', 'Demo Customer', 'customer@kalon.app', 'customer', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO volunteer_profiles (user_id, is_available, current_latitude, current_longitude, services_offered)
SELECT id, TRUE, 28.6139, 77.2090, '["fuel_delivery","tyre_puncture","battery_jump","towing"]'
FROM users WHERE phone = '8888888888'
ON DUPLICATE KEY UPDATE is_available=TRUE;
