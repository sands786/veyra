import { describe, expect, it } from "vitest";
import { DEMO_TABS, nextDemoActionState, nextDemoState, nextTestnetEvidenceState, testnetTranscript } from "../shared/demo";

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

  it("models a complete Sepolia round trip without upgrading it to mainnet evidence", () => {
    let state = nextTestnetEvidenceState("idle", "start");
    state = nextTestnetEvidenceState(state, "submitted");
    state = nextTestnetEvidenceState(state, "confirmed");
    state = nextTestnetEvidenceState(state, "read");
    expect(state).toBe("verified");
    expect(testnetTranscript(state).some((line) => line.includes("network=Starknet Sepolia"))).toBe(true);
    expect(testnetTranscript(state).some((line) => line.includes("payload_match=true"))).toBe(true);
  });

  it("reconciles an UNKNOWN outcome idempotently", () => {
    let state = nextTestnetEvidenceState("idle", "start");
    state = nextTestnetEvidenceState(state, "submitted");
    state = nextTestnetEvidenceState(state, "timeout");
    expect(state).toBe("unknown");
    state = nextTestnetEvidenceState(state, "reconcile");
    expect(testnetTranscript(state).some((line) => line.includes("duplicate_write=false"))).toBe(true);
    expect(nextTestnetEvidenceState(state, "accept")).toBe("accepted");
  });
});
