const app  = require('./app');
const { PORT } = require('./config/env');
const pool = require('./config/db');

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅  MySQL connected');

    app.listen(PORT, () => {
      console.log(`🚀  GEO API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌  Could not connect to MySQL:', err.message);
    process.exit(1);
  }
}

start();