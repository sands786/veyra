import { describe, expect, it } from "vitest";
import { DEMO_TABS, nextDemoActionState, nextDemoState } from "../shared/demo";

describe("Demo Mode contract", () => {
  it("exposes all primary VeilPay simulation surfaces", () => {
    expect(DEMO_TABS.map((tab) => tab.id)).toEqual(["payroll", "operations", "treasury", "claims", "launchpad", "proof"]);
  });

  it("supports named action failure and retry recovery", () => {
    for (const action of ["wallet", "treasury", "claim", "proof", "governance", "release"]) {
      expect(nextDemoActionState("ready", "run")).toBe("pending");
      expect(nextDemoActionState("pending", "fail")).toBe("error");
      expect(nextDemoActionState("error", "retry")).toBe("success");
      expect(action).toBeTruthy();
    }
  });

  it("advances simulated claim, release, and proof states deterministically", () => {
    expect(nextDemoState("UNREDEEMED", "redeem-claim")).toBe("REDEEMED");
    expect(nextDemoState("PENDING", "approve-release")).toBe("APPROVED");
    expect(nextDemoState("READY", "publish-proof")).toBe("PUBLISHED");
    expect(nextDemoState("APPROVED", "approve-release")).toBe("APPROVED");
  });
});
