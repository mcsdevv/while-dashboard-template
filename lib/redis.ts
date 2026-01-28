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
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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
    redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redis;
}
