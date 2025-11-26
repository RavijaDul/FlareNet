-- ============================================================
-- FlareNet Database Schema + Seed Data (Phase 2)
-- ============================================================

-- Drop existing tables in correct dependency order
DROP TABLE IF EXISTS thermal_image CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS transformers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS analysis_result CASCADE;
DROP TABLE IF EXISTS user_annotations CASCADE;

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
    thermal_image_id BIGINT UNIQUE REFERENCES thermal_image(id) ON DELETE CASCADE,
    result_json TEXT,  -- Keep for backward compatibility during migration
    status VARCHAR(50),  -- 'Normal' or 'Anomalies'
    total_detections INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    potentially_faulty_count INTEGER DEFAULT 0,
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

ALTER SEQUENCE analysis_result_id_seq RESTART WITH 1;

-- ================= DETECTIONS (NORMALIZED) =================
-- Individual anomaly detections with proper relational structure
CREATE TABLE detection (
    id BIGSERIAL PRIMARY KEY,
    analysis_result_id BIGINT NOT NULL REFERENCES analysis_result(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'loose_joint', 'wire_overload', 'point_overload', 'anomaly'
    severity VARCHAR(50) NOT NULL,  -- 'Critical', 'Faulty', 'Potentially Faulty'
    confidence DOUBLE PRECISION NOT NULL,  -- 0.0 to 1.0
    bbox_x INTEGER NOT NULL,
    bbox_y INTEGER NOT NULL,
    bbox_width INTEGER NOT NULL,
    bbox_height INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER SEQUENCE detection_id_seq RESTART WITH 1;

-- Indexes for efficient querying in Phase 4
CREATE INDEX idx_detection_analysis ON detection(analysis_result_id);
CREATE INDEX idx_detection_category ON detection(category);
CREATE INDEX idx_detection_severity ON detection(severity);
CREATE INDEX idx_detection_confidence ON detection(confidence);
CREATE INDEX idx_detection_label ON detection(label);

-- ================= USER ANNOTATIONS =================
CREATE TABLE user_annotations (
    id BIGSERIAL PRIMARY KEY,
    thermal_image_id BIGINT REFERENCES thermal_image(id) ON DELETE CASCADE,
    transformer_id BIGINT REFERENCES transformers(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    annotations_json TEXT NOT NULL,  -- Keep for backward compatibility
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER SEQUENCE user_annotations_id_seq RESTART WITH 1;

-- ================= ANNOTATION ACTIONS (NORMALIZED) =================
-- Track specific user actions on detections for feedback and adaptive learning
CREATE TABLE annotation_action (
    id BIGSERIAL PRIMARY KEY,
    user_annotation_id BIGINT NOT NULL REFERENCES user_annotations(id) ON DELETE CASCADE,
    detection_id BIGINT REFERENCES detection(id) ON DELETE SET NULL,  -- NULL if user added new detection
    action_type VARCHAR(50) NOT NULL,  -- 'EDITED', 'DELETED', 'ADDED', 'CONFIRMED', 'BBOX_MODIFIED'
    original_label VARCHAR(100),
    new_label VARCHAR(100),
    original_category VARCHAR(50),
    new_category VARCHAR(50),
    original_severity VARCHAR(50),
    new_severity VARCHAR(50),
    original_confidence DOUBLE PRECISION,
    new_confidence DOUBLE PRECISION,
    original_bbox_x INTEGER,
    original_bbox_y INTEGER,
    original_bbox_width INTEGER,
    original_bbox_height INTEGER,
    new_bbox_x INTEGER,
    new_bbox_y INTEGER,
    new_bbox_width INTEGER,
    new_bbox_height INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER SEQUENCE annotation_action_id_seq RESTART WITH 1;

-- Indexes for annotation tracking and feedback analysis
CREATE INDEX idx_annotation_action_user ON annotation_action(user_annotation_id);
CREATE INDEX idx_annotation_action_detection ON annotation_action(detection_id);
CREATE INDEX idx_annotation_action_type ON annotation_action(action_type);
CREATE INDEX idx_annotation_action_created ON annotation_action(created_at);
-- ================= SEED DATA: ANALYSIS RESULTS =================
-- Auto-generated analysis inserts - Generated on 2025-10-05 11:44:14.429200
-- Keep result_json for backward compatibility during migration phase

-- Analysis for thermal_image_id = 2 (status: Anomalies, 2 detections)
INSERT INTO analysis_result (thermal_image_id, result_json, status, total_detections, critical_count, potentially_faulty_count, analyzed_at) 
VALUES (2, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 1.0, "bbox": {"x": 328, "y": 305, "width": 124, "height": 34}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 1.0, "bbox": {"x": 453, "y": 312, "width": 59, "height": 20}}]}', 'Anomalies', 2, 0, 2, NOW());

-- Analysis for thermal_image_id = 3 (status: Anomalies, 3 detections)
INSERT INTO analysis_result (thermal_image_id, result_json, status, total_detections, critical_count, potentially_faulty_count, analyzed_at) 
VALUES (3, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.9306637644767761, "bbox": {"x": 358, "y": 26, "width": 218, "height": 203}}, {"label": "Loose Joint (Faulty)", "category": "loose_joint", "severity": "Faulty", "confidence": 0.95177734375, "bbox": {"x": 56, "y": 225, "width": 434, "height": 415}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.9092928469181061, "bbox": {"x": 498, "y": 593, "width": 29, "height": 34}}]}', 'Anomalies', 3, 0, 2, NOW());

-- Analysis for thermal_image_id = 4 (status: Anomalies, 5 detections)
INSERT INTO analysis_result (thermal_image_id, result_json, status, total_detections, critical_count, potentially_faulty_count, analyzed_at) 
VALUES (4, '{"status": "Anomalies", "anomalies": [{"label": "Loose Joint (Faulty)", "category": "loose_joint", "severity": "Faulty", "confidence": 0.90237109375, "bbox": {"x": 41, "y": 268, "width": 454, "height": 341}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 1.0, "bbox": {"x": 480, "y": 469, "width": 28, "height": 75}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.8501624464988708, "bbox": {"x": 298, "y": 576, "width": 33, "height": 64}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.8517188131809235, "bbox": {"x": 248, "y": 602, "width": 29, "height": 38}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.8541258573532104, "bbox": {"x": 208, "y": 604, "width": 20, "height": 36}}]}', 'Anomalies', 5, 0, 4, NOW());

-- Analysis for thermal_image_id = 6 (status: Anomalies, 3 detections)
INSERT INTO analysis_result (thermal_image_id, result_json, status, total_detections, critical_count, potentially_faulty_count, analyzed_at) 
VALUES (6, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.98506960272789, "bbox": {"x": 165, "y": 121, "width": 80, "height": 118}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9817008674144745, "bbox": {"x": 75, "y": 127, "width": 80, "height": 109}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9797631800174713, "bbox": {"x": 255, "y": 128, "width": 79, "height": 108}}]}', 'Anomalies', 3, 0, 0, NOW());

-- Analysis for thermal_image_id = 7 (status: Anomalies, 4 detections)
INSERT INTO analysis_result (thermal_image_id, result_json, status, total_detections, critical_count, potentially_faulty_count, analyzed_at) 
VALUES (7, '{"status": "Anomalies", "anomalies": [{"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9843432009220123, "bbox": {"x": 73, "y": 132, "width": 78, "height": 100}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9845758080482483, "bbox": {"x": 161, "y": 132, "width": 79, "height": 104}}, {"label": "Point Overload (Faulty)", "category": "point_overload", "severity": "Faulty", "confidence": 0.9872575998306274, "bbox": {"x": 253, "y": 133, "width": 77, "height": 101}}, {"label": "Point Overload (Potentially Faulty)", "category": "point_overload", "severity": "Potentially Faulty", "confidence": 0.9913800954818726, "bbox": {"x": 80, "y": 216, "width": 20, "height": 13}}]}', 'Anomalies', 4, 0, 1, NOW());

-- ================= SEED DATA: DETECTIONS (NORMALIZED) =================
-- Populate individual detections from analysis results above

-- Detections for analysis_result_id = 1 (thermal_image_id = 2)
INSERT INTO detection (analysis_result_id, label, category, severity, confidence, bbox_x, bbox_y, bbox_width, bbox_height) VALUES
(1, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 1.0, 328, 305, 124, 34),
(1, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 1.0, 453, 312, 59, 20);

-- Detections for analysis_result_id = 2 (thermal_image_id = 3)
INSERT INTO detection (analysis_result_id, label, category, severity, confidence, bbox_x, bbox_y, bbox_width, bbox_height) VALUES
(2, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 0.930664, 358, 26, 218, 203),
(2, 'Loose Joint (Faulty)', 'loose_joint', 'Faulty', 0.951777, 56, 225, 434, 415),
(2, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 0.909293, 498, 593, 29, 34);

-- Detections for analysis_result_id = 3 (thermal_image_id = 4)
INSERT INTO detection (analysis_result_id, label, category, severity, confidence, bbox_x, bbox_y, bbox_width, bbox_height) VALUES
(3, 'Loose Joint (Faulty)', 'loose_joint', 'Faulty', 0.902371, 41, 268, 454, 341),
(3, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 1.0, 480, 469, 28, 75),
(3, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 0.850162, 298, 576, 33, 64),
(3, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 0.851719, 248, 602, 29, 38),
(3, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 0.854126, 208, 604, 20, 36);

-- Detections for analysis_result_id = 4 (thermal_image_id = 6)
INSERT INTO detection (analysis_result_id, label, category, severity, confidence, bbox_x, bbox_y, bbox_width, bbox_height) VALUES
(4, 'Point Overload (Faulty)', 'point_overload', 'Faulty', 0.98507, 165, 121, 80, 118),
(4, 'Point Overload (Faulty)', 'point_overload', 'Faulty', 0.98170, 75, 127, 80, 109),
(4, 'Point Overload (Faulty)', 'point_overload', 'Faulty', 0.979763, 255, 128, 79, 108);

-- Detections for analysis_result_id = 5 (thermal_image_id = 7)
INSERT INTO detection (analysis_result_id, label, category, severity, confidence, bbox_x, bbox_y, bbox_width, bbox_height) VALUES
(5, 'Point Overload (Faulty)', 'point_overload', 'Faulty', 0.984343, 73, 132, 78, 100),
(5, 'Point Overload (Faulty)', 'point_overload', 'Faulty', 0.984576, 161, 132, 79, 104),
(5, 'Point Overload (Faulty)', 'point_overload', 'Faulty', 0.987258, 253, 133, 77, 101),
(5, 'Point Overload (Potentially Faulty)', 'point_overload', 'Potentially Faulty', 0.991380, 80, 216, 20, 13);