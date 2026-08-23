import { describe, expect, it } from "vitest";
import { boundaryForPersistedIntent, canPublishOnchainProof, isTerminalOnchainLifecycle } from "./onchain";

describe("shared on-chain lifecycle model", () => {
  it("starts persisted intents as wallet-required and non-final", () => {
    expect(boundaryForPersistedIntent("payroll", "mainnet")).toMatchObject({ network: "mainnet", lifecycle: "intent_ready", requiresWallet: true, isProtocolFinal: false });
  });

  it("only treats confirmed protocol transactions as terminal", () => {
    expect(isTerminalOnchainLifecycle("confirmed")).toBe(true);
    expect(isTerminalOnchainLifecycle("reverted")).toBe(true);
    expect(isTerminalOnchainLifecycle("unknown")).toBe(false);
  });

  it("does not allow a proof before a confirmed transaction", () => {
    expect(canPublishOnchainProof({ surface: "proof", network: "mainnet", lifecycle: "submitted", transactionHash: "0xabc", requiresWallet: true, isProtocolFinal: false })).toBe(false);
    expect(canPublishOnchainProof({ surface: "proof", network: "mainnet", lifecycle: "confirmed", transactionHash: "0xabc", requiresWallet: true, isProtocolFinal: true })).toBe(true);
  });
});
