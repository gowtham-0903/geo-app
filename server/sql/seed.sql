-- Admin user seed
-- Password hash is bcrypt of the production password — do not change
INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'GEO Admin',
  'geopacks2015@gmail.com',
  '$2b$10$yJaoPFMz66jVPom0btFPM.Asw34QZDsxh7oTwa0lM5FOvpf80nWQm',
  'admin',
  1
);
