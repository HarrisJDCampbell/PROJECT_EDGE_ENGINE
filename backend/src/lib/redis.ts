/**
 * Redis Client (Upstash / any Redis provider)
 *
 * Wraps ioredis with graceful degradation:
 *   - If REDIS_URL is not set, every operation is a no-op (local dev without Redis works fine).
 *   - If the connection drops, errors are logged but never thrown to callers.
 *
 * Usage:
 *   import redis from './redis';
 *   await redis.set('key', JSON.stringify(value), 'EX', 1800);
 *   const raw = await redis.get('key');
 *   const value = raw ? JSON.parse(raw) : null;
 */

import Redis from 'ioredis';
import logger from './logger';

// ── Null-safe client interface ─────────────────────────────────────────────────
interface SafeRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  isConnected(): boolean;
}

function makeNoop(): SafeRedis {
  return {
    get: async () => null,
    set: async () => undefined,
    del: async () => undefined,
    keys: async () => [],
    isConnected: () => false,
  };
}

function makeClient(url: string): SafeRedis {
  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on('error', (err) => {
    logger.warn({ err: err.message }, '[Redis] Connection error');
  });

  client.connect().catch((err) => {
    logger.warn({ err: err.message }, '[Redis] Initial connect failed — will retry on demand');
  });

  return {
    get: async (key) => {
      try { return await client.get(key); } catch { return null; }
    },
    set: async (key, value, _mode, ttlSeconds) => {
      try { await client.set(key, value, 'EX', ttlSeconds); } catch { /* noop */ }
    },
    del: async (key) => {
      try { await client.del(key); } catch { /* noop */ }
    },
    keys: async (pattern) => {
      try { return await client.keys(pattern); } catch { return []; }
    },
    isConnected: () => client.status === 'ready',
  };
}

const redis: SafeRedis = process.env.REDIS_URL
  ? makeClient(process.env.REDIS_URL)
  : makeNoop();

export default redis;

// ── Typed helpers ─────────────────────────────────────────────────────────────

/** Get a JSON-parsed value from Redis. Returns null on miss or parse error. */
export async function redisGetJSON<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/** Set a JSON-serialised value in Redis with a TTL (seconds). */
export async function redisSetJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
