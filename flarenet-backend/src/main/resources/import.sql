-- USERS
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.K0iHZ8OZWjWn6i8u5D9dM3Wsj7HpiW', 'ADMIN'),
('user1', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.K0iHZ8OZWjWn6i8u5D9dM3Wsj7HpiW', 'USER'),
('user2', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.K0iHZ8OZWjWn6i8u5D9dM3Wsj7HpiW', 'USER'),
('user3', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.K0iHZ8OZWjWn6i8u5D9dM3Wsj7HpiW', 'USER'),
('user4', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.K0iHZ8OZWjWn6i8u5D9dM3Wsj7HpiW', 'USER');

-- TRANSFORMERS
INSERT INTO transformers (transformer_no, region, pole_no, type, location_details, capacitykva) VALUES
('TX-0001', 'Colombo', 'EN-101', 'Distribution', 'Town Center', 500),
('TX-0002', 'Kandy', 'EN-102', 'Bulk', 'Market Square', 1000),
('TX-0003', 'Galle', 'EN-103', 'Distribution', 'Harbor Side', 750),
('TX-0004', 'Jaffna', 'EN-104', 'Bulk', 'University Road', 2000),
('TX-0005', 'Kaduwela', 'EN-105', 'Distribution', 'Town Hall', 5000);

-- INSPECTIONS
INSERT INTO inspections (branch, inspected_date, inspection_number, inspection_time, status, transformer_id) VALUES
('Moratuwa', '2025-09-01', '20001', '09:00:00', 'PENDING', 1),
('Moratuwa', '2025-09-02', '20002', '10:30:00', 'COMPLETED', 2),
('Kaduwela', '2025-09-03', '20003', '11:45:00', 'IN_PROGRESS', 3),
('Colombo', '2025-09-04', '20004', '14:15:00', 'PENDING', 4),
('Kandy', '2025-09-05', '20005', 'COMPLETED', 5);

-- THERMAL IMAGES
INSERT INTO thermal_image (content_type, file_name, file_path, image_type, size_bytes, uploader, weather_condition, inspection_id, transformer_id) VALUES
('image/png', 'baseline1.png', 't-1/baseline1.png', 'BASELINE', 120000, 'user1', 'SUNNY', 1, 1),
('image/png', 'maintenance1.png', 't-1/maintenance1.png', 'MAINTENANCE', 150000, 'user2', 'CLOUDY', 2, 2),
('image/png', 'baseline2.png', 't-2/baseline2.png', 'BASELINE', 110000, 'user3', 'RAINY', 3, 3),
('image/png', 'maintenance2.png', 't-2/maintenance2.png', 'MAINTENANCE', 180000, 'user4', 'SUNNY', 4, 4),
('image/png', 'baseline3.png', 't-1/baseline3.png', 'BASELINE', 130000, 'admin', 'CLOUDY', 5, 5);
