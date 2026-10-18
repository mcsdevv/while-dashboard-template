import { randomUUID } from "node:crypto";
import { getRedis } from "@/lib/redis";

/** A lease that survives function termination and cannot release a newer owner's lock. */
export async function acquireLock(key: string, seconds = 330) {
  const redis = getRedis();
  if (!redis) throw new Error("Redis not configured");
  const owner = randomUUID();
  const acquired = await redis.set(key, owner, { nx: true, ex: seconds });
  if (!acquired) return null;
  return async () => {
    await redis.eval(
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
      [key],
      [owner],
    );
  };
}
