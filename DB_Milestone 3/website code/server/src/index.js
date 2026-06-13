require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');

const authRoutes         = require('./routes/authRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const complaintRoutes    = require('./routes/complaintRoutes');
const staffRoutes        = require('./routes/staffRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes       = require('./routes/reportRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false, // relax CSP in dev
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Strict limit on login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// ─── Static files (locally-uploaded images) ──────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  env: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/complaints',    complaintRoutes);
app.use('/api/staff',         staffRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports',       reportRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.message?.includes('Only') && err.message?.includes('allowed')) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy violation' });
  }
  console.error('[ERROR]', err.name, err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: isProd ? 'Internal server error' : err.message,
  });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');
    app.listen(PORT, () => {
      console.log(`🚀 NCMMS API running → http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
