import { describe, expect, it } from "vitest";

describe("configured Starknet Mainnet RPC", () => {
  it("answers a lightweight spec-version request", async () => {
    const endpoint = process.env.VITE_STARKNET_MAINNET_RPC_URL;
    expect(endpoint).toMatch(/^https:\/\/starknet-mainnet\.g\.alchemy\.com\/starknet\/version\/rpc\/v0_10\//);

    const response = await fetch(endpoint!, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "starknet_specVersion", params: [] }),
    });
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { result?: string; error?: unknown };
    expect(payload.error).toBeUndefined();
    expect(payload.result).toEqual(expect.any(String));
  }, 15_000);
});
