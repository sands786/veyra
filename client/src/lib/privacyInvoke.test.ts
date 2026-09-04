import { describe, expect, it, vi } from "vitest";
import type { VeilWallet } from "./strk20";
import {
  buildPrivacyInvokeRequest,
  submitPrivacyInvoke,
} from "./privacyInvoke";

const actions = [
  { type: "deposit" as const, token: "0x1", amount: "0x2" },
];

describe("privacy invoke boundary", () => {
  it("builds the official wallet STRK20 request without changing actions", () => {
    const request = buildPrivacyInvokeRequest(actions);

    expect(request).toEqual({
      type: "wallet_strk20InvokeTransaction",
      params: { actions },
    });
    expect(request.params.actions).not.toBe(actions);
  });

  it("rejects an empty privacy action list", () => {
    expect(() => buildPrivacyInvokeRequest([])).toThrow(
      "At least one STRK20 privacy action is required."
    );
  });

  it("uses a wallet-native STRK20 method when available", async () => {
    const strk20InvokeTransaction = vi
      .fn()
      .mockResolvedValue({ transaction_hash: "0xabc" });
    const wallet: VeilWallet = { strk20InvokeTransaction };

    await expect(submitPrivacyInvoke(wallet, actions)).resolves.toEqual({
      transaction_hash: "0xabc",
    });
    expect(strk20InvokeTransaction).toHaveBeenCalledWith(actions);
  });

  it("falls back only to the official wallet request type", async () => {
    const request = vi.fn().mockResolvedValue({ transaction_hash: "0xdef" });
    const wallet: VeilWallet = { request };

    await expect(submitPrivacyInvoke(wallet, actions)).resolves.toEqual({
      transaction_hash: "0xdef",
    });
    expect(request).toHaveBeenCalledWith({
      type: "wallet_strk20InvokeTransaction",
      params: { actions },
    });
  });

  it("fails closed when the wallet returns no public hash", async () => {
    const wallet: VeilWallet = {
      request: vi.fn().mockResolvedValue({}),
    };

    await expect(submitPrivacyInvoke(wallet, actions)).rejects.toThrow(
      "The wallet returned no Starknet transaction hash."
    );
  });
});
