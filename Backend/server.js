'use strict';
// ─── Env validation FIRST — fails fast on missing/weak secrets ───────────────
require('dotenv').config();
require('./config/env');

const http      = require('http');
const express   = require('express');
const cors      = require('cors');
const cookieParser  = require('cookie-parser');
const helmet    = require('helmet');
const mongoose  = require('mongoose');
const morgan    = require('morgan');
const hpp       = require('hpp');
const crypto    = require('crypto');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss       = require('xss-clean');
const csrf      = require('csurf');
const swaggerUi = require('swagger-ui-express');
const YAML      = require('yamljs');
const cookie    = require('cookie');
const jwt       = require('jsonwebtoken');

const connectDB        = require('./config/db');
const logger           = require('./utils/logger');
const redis            = require('./utils/redis');
const globalErrorHandler = require('./middleware/globalErrorHandler');
const maintenanceMiddleware = require('./middleware/maintenance');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const donorRoutes        = require('./routes/donors');
const requestRoutes      = require('./routes/requests');
const eventRoutes        = require('./routes/events');
const chatRoutes         = require('./routes/chat');
const bankRoutes         = require('./routes/banks');
const newsRoutes         = require('./routes/news');
const notificationRoutes = require('./routes/notifications');
const adminRoutes        = require('./routes/admin');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB().catch((err) => {
  logger.error({ msg: 'Fatal: MongoDB connection failed', err: err.message });
  process.exit(1);
});

// ─── App setup ────────────────────────────────────────────────────────────────
const app    = express();
const swaggerDoc = YAML.load('./swagger.yaml');

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE ORDER — security-critical, do NOT reorder
// ══════════════════════════════════════════════════════════════════════════════

// 1. HTTPS redirect (production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 2. Helmet — explicit CSP (headers before anything else)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org'],
      connectSrc:  ["'self'", process.env.FRONTEND_URL],
      frameSrc:    ["'self'", 'https://www.openstreetmap.org'],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // required for OpenStreetMap iframes
}));

// 3. CORS
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Correlation-Id', 'X-Idempotency-Key'],
}));

// 4-5. Body parsers — tight limits (10kb default, 50kb for emergency route)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. NoSQL injection protection (must run before routes see the body)
app.use(mongoSanitize());

// 7. XSS sanitization
app.use(xss());

// 8. HTTP Parameter Pollution protection
app.use(hpp({ whitelist: ['bloodGroup', 'city', 'status', 'role'] }));

// 9. Global rate limiter (1000 req/15min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      process.env.NODE_ENV === 'development' ? 10000 : 1000,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);

// 10. Correlation ID — attach before logging
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
});

// 11. HTTP request logging (Morgan → Winston)
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip:   (req) => req.url === '/api/health',
  }
);
app.use(morganMiddleware);

// 12. Cookie parser (required before CSRF)
app.use(cookieParser());

// 13. CSRF protection (after cookieParser)
const csrfProtection = csrf({
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' },
});

// 14. Maintenance mode (after CSRF, before routes)
app.use(maintenanceMiddleware);

// ─── Cache-Control headers ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ─── Swagger docs ─────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ─── CSRF token endpoint ──────────────────────────────────────────────────────
app.get('/api/v1/auth/csrf-token', csrfProtection, (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});
// Legacy path
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

// ─── Comprehensive health check ───────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const checks   = {};
  let   overall  = 'healthy';

  // MongoDB
  try {
    const t0 = Date.now();
    await mongoose.connection.db.admin().ping();
    checks.mongodb = { status: 'healthy', latencyMs: Date.now() - t0 };
  } catch (err) {
    checks.mongodb = { status: 'unhealthy', error: err.message };
    overall = 'degraded';
  }

  // Redis
  try {
    const t0 = Date.now();
    await redis.ping();
    checks.redis = { status: 'healthy', latencyMs: Date.now() - t0 };
  } catch (err) {
    checks.redis = { status: 'degraded', error: err.message };
    // Redis degradation doesn't make the whole system unhealthy
  }

  // Memory
  const mem = process.memoryUsage();
  checks.memory = {
    heapUsedMB:  Math.round(mem.heapUsed  / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    rssMB:       Math.round(mem.rss       / 1024 / 1024),
  };

  res.status(overall === 'healthy' ? 200 : 503).json({
    status:        overall,
    version:       process.env.npm_package_version || '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp:     new Date().toISOString(),
    checks,
  });
});

// Root
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Blood4U API. See /api/health or /api/docs.' });
});

// ─── 15. API Routes (v1) ──────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      process.env.NODE_ENV === 'development' ? 1000 : 30,
  message:  { success: false, message: 'Too many auth requests. Try again in 15 minutes.' },
});

const apiRouter = express.Router();
apiRouter.use('/auth',          authLimiter, authRoutes);
apiRouter.use('/users',         userRoutes);
apiRouter.use('/donors',        donorRoutes);
apiRouter.use('/requests',      requestRoutes);
apiRouter.use('/events',        eventRoutes);
apiRouter.use('/chat',          chatRoutes);
apiRouter.use('/banks',         bankRoutes);
apiRouter.use('/news',          newsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin',         adminRoutes);

app.use('/api/v1', apiRouter);
app.use('/api',    apiRouter); // backward compat

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── 16-17. Global error handler (must be last) ───────────────────────────────
app.use(globalErrorHandler);

// ─── HTTP server + Socket.io ──────────────────────────────────────────────────
const PORT       = process.env.PORT || 3000;
const httpServer = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(httpServer, {
  cors: {
    origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
});

// ── Socket.io Redis adapter ───────────────────────────────────────────────────
if (process.env.REDIS_URL) {
  try {
    const { createClient }  = require('redis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    const pubClient  = createClient({ url: process.env.REDIS_URL });
    const subClient  = pubClient.duplicate();
    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.io Redis adapter connected');
      })
      .catch((err) => logger.warn({ msg: 'Redis adapter error', err: err.message }));
  } catch (err) {
    logger.warn({ msg: 'Socket.io Redis adapter not available', err: err.message });
  }
}

app.set('io', io);

// ── Socket.io Handshake Auth (Section 1.10) ───────────────────────────────────
const User = require('./models/User');
io.use(async (socket, next) => {
  try {
    const cookies   = cookie.parse(socket.handshake.headers.cookie || '');
    const token     = cookies.accessToken || cookies.token;
    if (!token) return next(new Error('AUTH_MISSING'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id || decoded.userId)
      .select('isActive tokenVersion role')
      .lean();

    if (!user || !user.isActive)              return next(new Error('AUTH_INVALID'));
    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== decoded.tokenVersion
    ) return next(new Error('AUTH_STALE'));

    socket.userId = String(decoded.id || decoded.userId);
    socket.role   = user.role;
    next();
  } catch {
    next(new Error('AUTH_FAILED'));
  }
});

// ── Room join + per-socket rate limiter ──────────────────────────────────────
io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.join(`role:${socket.role}`);
  logger.debug({ msg: 'Socket connected', userId: socket.userId, role: socket.role });

  // Token-bucket rate limiter: 30 events/minute per socket
  const bucket = { tokens: 30, lastRefill: Date.now() };
  socket.use(([event], next) => {
    const now     = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens    = Math.min(30, bucket.tokens + elapsed * (30 / 60));
    bucket.lastRefill = now;
    if (bucket.tokens < 1) {
      socket.disconnect(true);
      return next(new Error('RATE_LIMITED'));
    }
    bucket.tokens--;
    next();
  });

  socket.on('disconnect', () => {
    logger.debug({ msg: 'Socket disconnected', userId: socket.userId });
  });
});

// ── Initialize socket event handlers ─────────────────────────────────────────
const { initializeSockets } = require('./sockets');
initializeSockets(io);

// ─── Start server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`Blood4U API running in [${process.env.NODE_ENV}] on http://localhost:${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/api/health`);
    logger.info(`Docs:   http://localhost:${PORT}/api/docs`);
  });
}

// ─── Graceful shutdown (Section 2.1) ─────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`[SHUTDOWN] Received ${signal}. Closing gracefully...`);
  httpServer.close(async () => {
    try {
      await mongoose.connection.close();
      await redis.quit();
      logger.info('[SHUTDOWN] Clean exit');
    } catch (err) {
      logger.error({ msg: '[SHUTDOWN] Error during cleanup', err: err.message });
    }
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('[SHUTDOWN] Forced exit after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM',            () => shutdown('SIGTERM'));
process.on('SIGINT',             () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ msg: 'Unhandled rejection', reason: String(reason) });
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ msg: 'Uncaught exception', err: err.message, stack: err.stack });
  shutdown('uncaughtException');
});

module.exports = app;
