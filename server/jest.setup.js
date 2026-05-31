// Set all required env vars before any module loads
process.env.NODE_ENV      = 'test';
process.env.JWT_SECRET    = 'test-jwt-secret-32-chars-minimum!!';
process.env.DB_HOST       = 'localhost';
process.env.DB_PORT       = '3306';
process.env.DB_USER       = 'test_user';
process.env.DB_PASSWORD   = 'test_pass';
process.env.DB_NAME       = 'test_db';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.PORT          = '3001';
