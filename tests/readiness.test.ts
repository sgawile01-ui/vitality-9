// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createReadiness } from "../testing/readiness";

it("recovers from failed initialization on the same instance", async () => {
  const initialize = vi
    .fn()
    .mockRejectedValueOnce(new Error("synthetic failure"))
    .mockResolvedValue(undefined);
  const probe = vi.fn().mockResolvedValue(undefined);
  const readiness = createReadiness(initialize, probe);
  expect(await readiness.check()).toBe(false);
  expect(await readiness.check()).toBe(true);
  expect(initialize).toHaveBeenCalledTimes(2);
  expect(probe).toHaveBeenCalledTimes(1);
});
it("rechecks availability and recovers after losing a previously healthy backend", async () => {
  const initialize = vi.fn().mockResolvedValue(undefined);
  const probe = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(undefined);
  const readiness = createReadiness(initialize, probe);
  expect(await readiness.check()).toBe(true);
  expect(await readiness.check()).toBe(false);
  expect(await readiness.check()).toBe(true);
  expect(initialize).toHaveBeenCalledTimes(2);
  expect(probe).toHaveBeenCalledTimes(3);
});
it("concurrent callers share one initialization and probe", async () => {
  let finish!: () => void;
  const initialize = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const probe = vi.fn().mockResolvedValue(undefined);
  const readiness = createReadiness(initialize, probe);
  const first = readiness.check();
  const second = readiness.check();
  expect(first).toBe(second);
  await Promise.resolve();
  finish();
  expect(await first).toBe(true);
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(probe).toHaveBeenCalledTimes(1);
});
it("synchronous initialization failure cannot poison the retry promise", async () => {
  const initialize = vi
    .fn()
    .mockImplementationOnce(() => {
      throw new Error("sync failure");
    })
    .mockResolvedValue(undefined);
  const readiness = createReadiness(initialize, async () => {});
  expect(await readiness.check()).toBe(false);
  expect(await readiness.check()).toBe(true);
});
it("RPC failure invalidation forces reinitialization", async () => {
  const initialize = vi.fn().mockResolvedValue(undefined);
  const readiness = createReadiness(initialize, async () => {});
  expect(await readiness.check()).toBe(true);
  readiness.invalidate();
  expect(await readiness.check()).toBe(true);
  expect(initialize).toHaveBeenCalledTimes(2);
});
