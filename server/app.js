require('dotenv').config();
require('./config/env');           // validates env vars on startup

const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,                       // allow cookies cross-origin
}));
app.use(express.json());
app.use(cookieParser());

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth',    require('./routes/auth.routes'));
app.use('/api/masters', require('./routes/masters.routes'));

// app.use('/api/masters',    require('./routes/masters.routes'));
// app.use('/api/costing',    require('./routes/costing.routes'));
// app.use('/api/production', require('./routes/production.routes'));
// app.use('/api/sales',      require('./routes/sales.routes'));
// app.use('/api/purchases',  require('./routes/purchases.routes'));
// app.use('/api/payments',   require('./routes/payments.routes'));
// app.use('/api/expenses',   require('./routes/expenses.routes'));
// app.use('/api/dashboard',  require('./routes/dashboard.routes'));

// ─── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

module.exports = app;