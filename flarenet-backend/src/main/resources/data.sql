INSERT INTO transformer (id, transformer_no, region, pole_no, type, location_details, capacitykva, created_at, updated_at)
VALUES
  (1, 'TX-0001', 'Nugegoda', 'EN-101', 'Distribution', 'Keells Embuldeniya', 100.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'TX-0002', 'Kaduwela', 'EN-102', 'Distribution', 'Malabe Junction', 160.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 'TX-0003', 'Nugegoda', 'EN-101', 'Bulk', 'Keells Embuldeniya', 100.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 'TX-0004', 'Kaduwela', 'EN-102', 'Distribution', 'Malabe Junction', 160.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 'TX-0005', 'Nugegoda', 'EN-101', 'Bulk', 'Keells Embuldeniya', 100.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 
ON CONFLICT DO NOTHING;
