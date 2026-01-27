/**
 * Shared Redis client with lazy initialization.
 * Avoids Upstash warnings during Next.js build when env vars aren't available.
 */
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

/**
 * Check if Redis environment variables are configured.
 */
export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Get the Redis client instance.
 * Creates the client on first access (lazy initialization).
 * Returns null if Redis environment variables are not configured.
 */
export function getRedis(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}
