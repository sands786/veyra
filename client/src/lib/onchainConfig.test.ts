import { describe, expect, it } from "vitest";
import { protocolReadiness } from "./onchainConfig";

describe("Veyra protocol contract readiness", () => {
  it("reports unconfigured surfaces honestly when no public contract addresses are supplied", () => {
    const readiness = protocolReadiness("mainnet");
    expect(readiness.fullyConfigured).toBe(false);
    expect(readiness.missing).toEqual(["payroll", "treasury", "claims", "launchpad", "markets", "proof"]);
    expect(readiness.configured).toEqual([]);
  });
});
