-- =============================================================================
-- QSM (Quick Smart Mobility) 2026 — Database Schema DDL (PostgreSQL / SQLite)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(32) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  membership_tier VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (membership_tier IN ('standard', 'gold', 'platinum')),
  avatar_url VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(64) PRIMARY KEY,
  model_name VARCHAR(120) NOT NULL,
  service_name VARCHAR(120) NOT NULL,
  license_plate VARCHAR(32) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bike', 'car', 'luxury')),
  battery_percentage INTEGER NOT NULL DEFAULT 100 CHECK (battery_percentage BETWEEN 0 AND 100),
  status VARCHAR(20) NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'on_trip', 'charging', 'maintenance'))
);

CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_id VARCHAR(64) NOT NULL REFERENCES vehicles(id),
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
  total_trips INTEGER NOT NULL DEFAULT 0,
  current_lat DECIMAL(10, 6) NOT NULL,
  current_lng DECIMAL(10, 6) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline'))
);

CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(64) PRIMARY KEY,
  trip_code VARCHAR(32) UNIQUE NOT NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  driver_id VARCHAR(64) REFERENCES drivers(id),
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('bike', 'car', 'luxury')),
  pickup_address VARCHAR(255) NOT NULL,
  pickup_lat DECIMAL(10, 6) NOT NULL,
  pickup_lng DECIMAL(10, 6) NOT NULL,
  dest_address VARCHAR(255) NOT NULL,
  dest_lat DECIMAL(10, 6) NOT NULL,
  dest_lng DECIMAL(10, 6) NOT NULL,
  distance_km DECIMAL(6, 2) NOT NULL DEFAULT 0,
  duration_mins INTEGER NOT NULL DEFAULT 0,
  fare_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  final_amount INTEGER NOT NULL,
  payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('cash', 'vnpay', 'momo', 'card', 'qsm_wallet')),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PICKING_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
  cancel_reason VARCHAR(255),
  cancelled_by VARCHAR(32),
  rating_stars INTEGER CHECK (rating_stars BETWEEN 1 AND 5),
  feedback_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_messages (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL REFERENCES trips(id),
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'driver', 'system')),
  sender_name VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

