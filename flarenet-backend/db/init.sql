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
('image/png', 'T1_faulty_001.jpg', 'uploads/t-1/T1_faulty_001.jpg', 'MAINTENANCE', 110000, 'admin', 'RAINY', 2, 1),
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
-- Auto-generated analysis inserts
-- Generated on 2025-10-05 11:44:14.429200
INSERT INTO analysis_result (thermal_image_id, result_json, analyzed_at) VALUES (2, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 1.0, "bbox": {"x": 328, "y": 305, "width": 124, "height": 34}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 1.0, "bbox": {"x": 453, "y": 312, "width": 59, "height": 20}}]}', NOW());
INSERT INTO analysis_result (thermal_image_id, result_json, analyzed_at) VALUES (3, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.9306637644767761, "bbox": {"x": 358, "y": 26, "width": 218, "height": 203}}, {"label": "Loose Joint (Faulty)", "category": "loose_joint", "severity": "Faulty", "confidence": 0.95177734375, "bbox": {"x": 56, "y": 225, "width": 434, "height": 415}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.9092928469181061, "bbox": {"x": 498, "y": 593, "width": 29, "height": 34}}]}', NOW());
INSERT INTO analysis_result (thermal_image_id, result_json, analyzed_at) VALUES (4, '{"status": "Anomalies", "anomalies": [{"label": "Loose Joint (Faulty)", "category": "loose_joint", "severity": "Faulty", "confidence": 0.90237109375, "bbox": {"x": 41, "y": 268, "width": 454, "height": 341}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 1.0, "bbox": {"x": 480, "y": 469, "width": 28, "height": 75}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.8501624464988708, "bbox": {"x": 298, "y": 576, "width": 33, "height": 64}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.8517188131809235, "bbox": {"x": 248, "y": 602, "width": 29, "height": 38}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.8541258573532104, "bbox": {"x": 208, "y": 604, "width": 20, "height": 36}}]}', NOW());
INSERT INTO analysis_result (thermal_image_id, result_json, analyzed_at) VALUES (6, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.98506960272789, "bbox": {"x": 165, "y": 121, "width": 80, "height": 118}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9817008674144745, "bbox": {"x": 75, "y": 127, "width": 80, "height": 109}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9797631800174713, "bbox": {"x": 255, "y": 128, "width": 79, "height": 108}}]}', NOW());
INSERT INTO analysis_result (thermal_image_id, result_json, analyzed_at) VALUES (7, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9843432009220123, "bbox": {"x": 73, "y": 132, "width": 78, "height": 100}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9845758080482483, "bbox": {"x": 161, "y": 132, "width": 79, "height": 104}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9872575998306274, "bbox": {"x": 253, "y": 133, "width": 77, "height": 101}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.9913800954818726, "bbox": {"x": 80, "y": 216, "width": 20, "height": 13}}]}', NOW());