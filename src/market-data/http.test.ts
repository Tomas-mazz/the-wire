import { describe, expect, it } from "vitest";
import { isTransientError, ProviderHttpError, retryTransient } from "./http";

const noWait = { sleep: async () => {} };

describe("isTransientError", () => {
  it("retries rate limits, server errors and timeouts only", () => {
    expect(isTransientError(new ProviderHttpError("finnhub", 429, "API limit reached"))).toBe(true);
    expect(isTransientError(new ProviderHttpError("finnhub", 503, ""))).toBe(true);
    expect(isTransientError(Object.assign(new Error("slow"), { name: "TimeoutError" }))).toBe(true);
    expect(isTransientError(new ProviderHttpError("finnhub", 401, "bad key"))).toBe(false);
    expect(isTransientError(new Error("bug"))).toBe(false);
  });
});

describe("retryTransient", () => {
  it("tries again after a 429 and returns the answer", async () => {
    let calls = 0;
    const result = await retryTransient(async () => {
      calls++;
      if (calls < 3) throw new ProviderHttpError("finnhub", 429, "API limit reached");
      return "GPRO";
    }, noWait);
    expect(result).toBe("GPRO");
    expect(calls).toBe(3);
  });

  it("waits a little longer each time", async () => {
    const waits: number[] = [];
    await expect(
      retryTransient(
        async () => {
          throw new ProviderHttpError("finnhub", 429, "");
        },
        { attempts: 3, delayMs: 100, sleep: async (ms) => void waits.push(ms) },
      ),
    ).rejects.toThrow(/429/);
    expect(waits).toEqual([100, 200]);
  });

  it("does not retry errors that will not go away", async () => {
    let calls = 0;
    await expect(
      retryTransient(async () => {
        calls++;
        throw new ProviderHttpError("finnhub", 401, "bad key");
      }, noWait),
    ).rejects.toThrow(/401/);
    expect(calls).toBe(1);
  });
});
