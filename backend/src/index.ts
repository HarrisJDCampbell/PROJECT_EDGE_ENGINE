import 'dotenv/config';
import { initSentry, Sentry } from './lib/sentry';
initSentry();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './lib/logger';

import gamesRouter from './routes/games';
import playersRouter from './routes/players';
import oddsRouter from './routes/odds';
import subscriptionsRouter from './routes/subscriptions';
import projectionsRouter from './routes/projections';
import promoRouter from './routes/promo';
import adminRouter from './routes/admin';
import { startScheduler } from './jobs/scheduler';

// ── Validate required environment variables on startup ──────────────────────
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const WARN_ENV_VARS = ['API_SPORTS_KEY', 'ODDS_API_KEY', 'REVENUECAT_WEBHOOK_SECRET', 'ADMIN_API_KEY'];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    logger.error(`Missing required env var: ${key} — server cannot function correctly`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
for (const key of WARN_ENV_VARS) {
  if (!process.env[key]) {
    logger.warn(`Missing env var: ${key} — related features will be disabled`);
  }
}

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const isProduction = process.env.NODE_ENV === 'production';

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Always allow requests with no origin header (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);

      // In development, allow all browser origins
      if (!isProduction) return callback(null, true);

      // In production: only allow explicitly listed origins.
      // If ALLOWED_ORIGINS is empty, reject all browser-origin requests (fail-closed).
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject — do not expose the actual allowed list in the error
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ── Rate limiting ───────────────────────────────────────────────────────────
// Global: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Stricter limit for projection-heavy endpoints (protects API quota)
const projectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Projection rate limit exceeded, please try again shortly' },
});

// Strict limit for webhook endpoint (prevent abuse)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook rate limit exceeded' },
});

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Trust proxy (Railway / reverse proxy) ───────────────────────────────────
if (isProduction) {
  app.set('trust proxy', 1);
}

// ── Request logging ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      { method: req.method, url: req.url, status: res.statusCode, durationMs: Date.now() - start },
      'request'
    );
  });
  next();
});

// ── Health check ────────────────────────────────────────────────────────────
import { getOddsUsageStats } from './services/oddsApi';
import { supabaseAdmin } from './lib/supabaseAdmin';
app.get('/health', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    const { error } = await supabaseAdmin.from('game_logs').select('id', { count: 'exact', head: true }).limit(1);
    if (error) dbStatus = 'error';
  } catch {
    dbStatus = 'unreachable';
  }
  const overall = dbStatus === 'ok' ? 'ok' : 'degraded';
  res.status(overall === 'ok' ? 200 : 503).json({
    status: overall,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    oddsQuota: getOddsUsageStats(),
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/games', gamesRouter);
app.use('/api/players', playersRouter);
app.use('/api/odds', oddsRouter);
app.use('/api/subscriptions/webhook', webhookLimiter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/projections', projectionLimiter, projectionsRouter);
app.use('/api/promo', promoRouter);
app.use('/api/admin', adminRouter);

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ───────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  Sentry.captureException(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV ?? 'development' }, 'Server started');

  // Start the cron scheduler (nightly ingest + odds refresh)
  startScheduler();

  // Warm schedule + odds caches on startup so first user request is fast.
  // Fire-and-forget — failure is non-fatal.
  setTimeout(async () => {
    try {
      const { getGamesForDate } = await import('./services/apiSports');
      const { getNBAOdds } = await import('./services/oddsApi');
      const today = new Date().toISOString().split('T')[0];
      const [games, odds] = await Promise.allSettled([
        getGamesForDate(today),
        getNBAOdds(),
      ]);
      logger.info(
        { games: games.status, odds: odds.status },
        'Startup cache warm complete'
      );

    } catch (err: any) {
      logger.warn({ err: err.message }, 'Startup cache warm failed (non-fatal)');
    }
  }, 2000);

  // Auto-backfill if game_logs table is sparse — delayed 90s to avoid
  // interfering with Railway health check (60s timeout)
  setTimeout(async () => {
    try {
      const { supabaseAdmin } = await import('./lib/supabaseAdmin');
      const { count } = await supabaseAdmin
        .from('game_logs')
        .select('*', { count: 'exact', head: true });
      if ((count ?? 0) < 500) {
        logger.info({ count }, '[Startup] game_logs sparse — triggering 30-day backfill');
        const { runBackfill } = await import('./jobs/backfill');
        runBackfill(30).catch((e) => logger.warn({ err: e.message }, '[Startup] Auto-backfill failed'));
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, '[Startup] Auto-backfill check failed');
    }
  }, 90_000);
});

export default app;
