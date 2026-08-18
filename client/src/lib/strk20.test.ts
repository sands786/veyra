import { describe, expect, it } from "vitest";
import { buildPayrollRegistryCreateCall, buildShieldedRouteActions, MAINNET_CHAIN_ID, onchainCapability, STRK_TOKEN } from "./strk20";

describe("STRK20 on-chain adapter", () => {
  it("builds a deposit action for a valid shielded route intent", () => {
    expect(buildShieldedRouteActions({ network: "sepolia", token: STRK_TOKEN, amountSmallestUnit: 2_840_000_000n })).toEqual([
      { type: "deposit", token: STRK_TOKEN, amount: "0xa946f600" },
    ]);
  });

  it("rejects zero or negative settlement amounts before wallet execution", () => {
    expect(() => buildShieldedRouteActions({ network: "mainnet", token: STRK_TOKEN, amountSmallestUnit: 0n })).toThrow("greater than zero");
    expect(() => buildShieldedRouteActions({ network: "mainnet", token: STRK_TOKEN, amountSmallestUnit: -1n })).toThrow("greater than zero");
  });

  it("builds Cairo u256 calldata for the payroll registry entrypoint", () => {
    expect(buildPayrollRegistryCreateCall("0x1234", STRK_TOKEN, 2_840_000_000n, "0xabc")).toEqual({ contractAddress: "0x1234", entrypoint: "create_route", calldata: [STRK_TOKEN, "0xa946f600", "0x0", "0xabc"] });
  });

  it("rejects unconfigured or unsafe payroll registry calls", () => {
    expect(() => buildPayrollRegistryCreateCall("missing", STRK_TOKEN, 1n, "0xabc")).toThrow("contract address");
    expect(() => buildPayrollRegistryCreateCall("0x1234", STRK_TOKEN, 0n, "0xabc")).toThrow("greater than zero");
  });

  it("reports whether a connected wallet can execute on the selected network", () => {
    const wallet = { address: "0x1234", chainId: MAINNET_CHAIN_ID, strk20InvokeTransaction: async () => ({ transaction_hash: "0xabc" }) };
    expect(onchainCapability(wallet, "mainnet")).toMatchObject({ walletConnected: true, walletNetwork: "mainnet", networkCompatible: true, strk20Ready: true, canExecute: true });
    expect(onchainCapability(wallet, "sepolia")).toMatchObject({ networkCompatible: false, canExecute: false });
  });
});
