import { describe, expect, it } from "vitest";
import { protocolReadiness } from "./onchainConfig";

describe("Veyra protocol contract readiness", () => {
  it("reports deployed Launchpad and Private Markets contracts while leaving other surfaces explicit", () => {
    const readiness = protocolReadiness("mainnet");
    expect(readiness.fullyConfigured).toBe(false);
    expect(readiness.missing).toEqual(["privacy", "payroll", "treasury", "claims", "proof"]);
    expect(readiness.configured).toEqual(["launchpad", "markets"]);
    expect(readiness.contracts.launchpad?.address).toMatch(/^0x[0-9a-f]{64}$/);
    expect(readiness.contracts.markets?.address).toBe("0x05476ca7064583238f3e82a6815a7f662b14228e1fb585d480838a282b9d7cf2");
  });

  it("accepts the deployed Mainnet Launchpad escrow address shape", () => {
    const address = "0x005d7cb0f5ea0cda8b046d524eaa45e38f3a5c54357f2e4b211da7e2c435bb15";
    expect(address).toMatch(/^0x[0-9a-f]{64}$/);
    expect(address).not.toBe("0x" + "0".repeat(64));
  });
});
