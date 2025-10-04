-- ============================================================
-- FlareNet Database Schema + Seed Data (Phase 2)
-- ============================================================

-- Drop existing tables in correct dependency order
DROP TABLE IF EXISTS thermal_image CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS transformers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================= USERS =================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- bcrypt("admin1234") hash
INSERT INTO users (username, password, role) VALUES
('admin', '2b$12$C9Q4sdy9BKJKdP7w7a2o7uUk5HMJmy0C6aEOYFZAX9GZjDGCTsDlC', 'ADMIN'),
('user1', '2b$12$C9Q4sdy9BKJKdP7w7a2o7uUk5HMJmy0C6aEOYFZAX9GZjDGCTsDlC', 'USER');


-- ================= TRANSFORMERS =================
CREATE TABLE transformers (
    id BIGSERIAL PRIMARY KEY,
    transformer_no VARCHAR(255),
    region VARCHAR(255),
    pole_no VARCHAR(255),
    type VARCHAR(255),
    location_details VARCHAR(255),
    capacitykva DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- reset sequence so IDs are predictable
ALTER SEQUENCE transformers_id_seq RESTART WITH 1;

INSERT INTO transformers (transformer_no, region, pole_no, type, location_details, capacitykva) VALUES
('TX-0001', 'Colombo', 'EN-101', 'Distribution', 'Town Center', 500),
('TX-0002', 'Kandy', 'EN-102', 'Bulk', 'Market Square', 1000),
('TX-0003', 'Galle', 'EN-103', 'Distribution', 'Harbor Side', 750),
('TX-0004', 'Jaffna', 'EN-104', 'Bulk', 'University Road', 2000),
('TX-0005', 'Kaduwela', 'EN-105', 'Distribution', 'Town Hall', 5000);

-- ================= INSPECTIONS =================
CREATE TABLE inspections (
    id BIGSERIAL PRIMARY KEY,
    branch VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    inspected_date DATE,
    inspection_number VARCHAR(255) UNIQUE,
    inspection_time TIME,
    maintenance_date DATE,
    status VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT now(),
    transformer_id BIGINT REFERENCES transformers(id) ON DELETE CASCADE
);

ALTER SEQUENCE inspections_id_seq RESTART WITH 1;

-- 3 inspections for Transformer 1
INSERT INTO inspections (branch, inspected_date, inspection_number, inspection_time, status, transformer_id) VALUES
('Moratuwa', '2025-09-01', '20001', '09:00:00', 'PENDING', 1),
('Moratuwa', '2025-09-02', '20002', '10:30:00', 'COMPLETED', 1),
('Moratuwa', '2025-09-03', '20003', '11:45:00', 'IN_PROGRESS', 1);

-- 2 inspections for Transformer 2
INSERT INTO inspections (branch, inspected_date, inspection_number, inspection_time, status, transformer_id) VALUES
('Galle', '2025-09-04', '20004', '14:15:00', 'PENDING', 2),
('Galle', '2025-09-05', '20005', '16:00:00', 'COMPLETED', 2);

-- ================= THERMAL IMAGES =================
CREATE TABLE thermal_image (
    id BIGSERIAL PRIMARY KEY,
    content_type VARCHAR(255),
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    image_type VARCHAR(50),
    size_bytes BIGINT,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    uploader VARCHAR(255),
    weather_condition VARCHAR(50),
    inspection_id BIGINT REFERENCES inspections(id) ON DELETE CASCADE,
    transformer_id BIGINT REFERENCES transformers(id) ON DELETE CASCADE
);

ALTER SEQUENCE thermal_image_id_seq RESTART WITH 1;

-- 2 images for 1st inspection of Transformer 1 (inspection_id = 1)
INSERT INTO thermal_image (content_type, file_name, file_path, image_type, size_bytes, uploader, weather_condition, inspection_id, transformer_id) VALUES
('image/png', 'T1_normal_001.jpg', 'uploads/t-1/T1_normal_001.jpg', 'BASELINE', 120000, 'admin', 'SUNNY', 1, 1),
('image/png', 'T1_faulty_047.jpg', 'uploads/t-1/T1_faulty_047.jpg', 'MAINTENANCE', 150000, 'admin', 'CLOUDY', 1, 1);

-- 1 image for 2nd inspection of Transformer 1 (inspection_id = 2)
INSERT INTO thermal_image (content_type, file_name, file_path, image_type, size_bytes, uploader, weather_condition, inspection_id, transformer_id) VALUES
('image/png', 'T1_faulty_001.jpg', 'uploads/t-1/T1_faulty_047.jpg', 'MAINTENANCE', 110000, 'admin', 'RAINY', 2, 1),
('image/png', 'T1_faulty_042.jpg', 'uploads/t-1/T1_faulty_042.jpg', 'MAINTENANCE', 110000, 'admin', 'RAINY', 3, 1);

-- 2 images for inspections of Transformer 3 (inspection_id = 4,5)
INSERT INTO thermal_image (content_type, file_name, file_path, image_type, size_bytes, uploader, weather_condition, inspection_id, transformer_id) VALUES
('image/png', 'T2_normal_001.png', 'uploads/t-2/T2_normal_001.png', 'BASELINE', 130000, 'user1', 'CLOUDY', 5, 2),
('image/png', 'T2_faulty_003.png', 'uploads/t-2/T2_faulty_003.png', 'MAINTENANCE', 180000, 'user1', 'SUNNY', 4, 2),
('image/png', 'T2_faulty_002.png', 'uploads/t-2/T2_faulty_002.png', 'MAINTENANCE', 180000, 'user1', 'SUNNY', 5, 2);


-- ================= ANALYSIS RESULTS =================
CREATE TABLE analysis_result (
    id BIGSERIAL PRIMARY KEY,
    thermal_image_id BIGINT REFERENCES thermal_image(id) ON DELETE CASCADE,
    result_json TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

ALTER SEQUENCE analysis_result_id_seq RESTART WITH 1;

