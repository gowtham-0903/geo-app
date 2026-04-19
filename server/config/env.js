const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌  Missing required env var: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  PORT:         process.env.PORT        || 3001,
  DB_HOST:      process.env.DB_HOST     || 'localhost',
  DB_PORT:      process.env.DB_PORT     || '3306',
  DB_USER:      process.env.DB_USER,
  DB_PASSWORD:  process.env.DB_PASSWORD,
  DB_NAME:      process.env.DB_NAME,
  JWT_SECRET:   process.env.JWT_SECRET,
  NODE_ENV:     process.env.NODE_ENV    || 'development',
};