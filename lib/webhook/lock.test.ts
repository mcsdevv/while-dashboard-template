import { beforeEach, expect, test, vi } from "vitest";
import { acquireLock } from "./lock";

const redis = vi.hoisted(() => ({ set: vi.fn(), eval: vi.fn() }));
vi.mock("@/lib/redis", () => ({ getRedis: () => redis }));
beforeEach(() => {
  vi.resetAllMocks();
});

test("an occupied lease cannot be acquired", async () => {
  redis.set.mockResolvedValue(null);
  expect(await acquireLock("job")).toBeNull();
});

test("an expiring lease can only release its own value", async () => {
  redis.set.mockResolvedValue("OK");
  const release = await acquireLock("job");
  expect(redis.set).toHaveBeenCalledWith("job", expect.any(String), { nx: true, ex: 330 });
  await release!();
  expect(redis.eval).toHaveBeenCalledWith(
    expect.stringContaining("== ARGV[1]"),
    ["job"],
    [redis.set.mock.calls[0][1]],
  );
});
