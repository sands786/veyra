import { describe, expect, it } from "vitest";
import {
  buildPayrollRegistryCreateCall,
  buildShieldedRouteActions,
  describeStrk20SubmissionError,
  connectVeilWallet,
  disconnectVeilWallet,
  ETH_TOKEN,
  MAINNET_CHAIN_ID,
  networkFromChainId,
  onchainCapability,
  requestWalletQrConnection,
  STRK_TOKEN,
  submitShieldedRoute,
  type StarknetWalletOption,
  type VeilWallet,
} from "./strk20";

describe("STRK20 on-chain adapter", () => {
  it("classifies STRK20 registration and unsupported-wallet failures without implying a transaction was created", () => {
    expect(
      describeStrk20SubmissionError(new Error("NOT_REGISTERED"))
    ).toContain("No transaction was created");
    expect(
      describeStrk20SubmissionError(new Error("Error: Not implemented"))
    ).toContain("Ready X or Xverse");
    expect(describeStrk20SubmissionError(new Error("User rejected"))).toBe(
      undefined
    );
  });

  it("builds a deposit action for a valid shielded route intent", () => {
    expect(
      buildShieldedRouteActions({
        network: "mainnet",
        token: STRK_TOKEN,
        amountSmallestUnit: 2_840_000_000n,
      })
    ).toEqual([{ type: "deposit", token: STRK_TOKEN, amount: "0xa946f600" }]);
  });

  it("rejects zero, negative, and unconfigured token amounts before wallet execution", () => {
    expect(() =>
      buildShieldedRouteActions({
        network: "mainnet",
        token: STRK_TOKEN,
        amountSmallestUnit: 0n,
      })
    ).toThrow("greater than zero");
    expect(() =>
      buildShieldedRouteActions({
        network: "mainnet",
        token: STRK_TOKEN,
        amountSmallestUnit: -1n,
      })
    ).toThrow("greater than zero");
    expect(() =>
      buildShieldedRouteActions({
        network: "mainnet",
        token: "0x1234",
        amountSmallestUnit: 1n,
      })
    ).toThrow("verified STRK or ETH Mainnet tokens");
  });

  it("accepts the verified Starknet Mainnet ETH token mapping", () => {
    expect(
      buildShieldedRouteActions({
        network: "mainnet",
        token: ETH_TOKEN,
        amountSmallestUnit: 200000000000000000n,
      })
    ).toEqual([
      {
        type: "deposit",
        token: ETH_TOKEN,
        amount: "0x2c68af0bb140000",
      },
    ]);
  });

  it("builds Cairo u256 calldata for the payroll registry entrypoint", () => {
    expect(
      buildPayrollRegistryCreateCall(
        "0x1234",
        STRK_TOKEN,
        2_840_000_000n,
        "0xabc"
      )
    ).toEqual({
      contractAddress: "0x1234",
      entrypoint: "create_route",
      calldata: [STRK_TOKEN, "0xa946f600", "0x0", "0xabc"],
    });
  });

  it("rejects unconfigured or unsafe payroll registry calls", () => {
    expect(() =>
      buildPayrollRegistryCreateCall("missing", STRK_TOKEN, 1n, "0xabc")
    ).toThrow("contract address");
    expect(() =>
      buildPayrollRegistryCreateCall("0x1234", STRK_TOKEN, 0n, "0xabc")
    ).toThrow("greater than zero");
  });

  it("disconnects a provider wallet when it exposes a disconnect method", async () => {
    let disconnected = false;
    await disconnectVeilWallet({
      disconnect: async () => {
        disconnected = true;
      },
    });
    expect(disconnected).toBe(true);
  });

  it("returns a provider QR URI without claiming QR support when none is exposed", async () => {
    const option = {
      id: "argent-x",
      name: "Argent X",
      wallet: { request: async () => ({ uri: "starknet://connect/test" }) },
      supportsQr: true,
    } satisfies StarknetWalletOption;
    await expect(requestWalletQrConnection(option)).resolves.toEqual({
      uri: "starknet://connect/test",
      walletId: "argent-x",
    });
  });

  it("recognizes official Mainnet aliases and decimal felt chain IDs", () => {
    expect(networkFromChainId("SN_MAIN")).toBe("mainnet");
    expect(networkFromChainId(MAINNET_CHAIN_ID)).toBe("mainnet");
    expect(networkFromChainId(BigInt(MAINNET_CHAIN_ID).toString())).toBe(
      "mainnet"
    );
  });

  it("hydrates address and chain ID from a wallet enable response", async () => {
    const result = await connectVeilWallet({
      enable: async () => ({
        accounts: [{ address: "0x1234", chainId: "SN_MAIN" }],
      }),
    });
    expect(result).toMatchObject({
      address: "0x1234",
      live: true,
      network: "mainnet",
    });
  });

  it("hydrates a wallet-api provider that omits account data from connect", async () => {
    const requested: string[] = [];
    const result = await connectVeilWallet({
      request: async request => {
        requested.push(request.type);
        if (request.type === "wallet_requestAccounts") return ["0x9876"];
        if (request.type === "wallet_requestChainId") return "SN_MAIN";
        return undefined;
      },
    });
    expect(requested).toContain("wallet_requestAccounts");
    expect(result).toMatchObject({
      address: "0x9876",
      live: true,
      network: "mainnet",
    });
  });

  it("hydrates a Braavos-style selected account when no connection payload is returned", async () => {
    const result = await connectVeilWallet({
      selectedAddress: "0xfeed",
      selectedChainId: "SN_MAIN",
      request: async () => undefined,
    });
    expect(result).toMatchObject({
      address: "0xfeed",
      live: true,
      network: "mainnet",
      wallet: { address: "0xfeed", chainId: "SN_MAIN" },
    });
  });

  it("reports standard wallet-api request support as executable only on Mainnet", () => {
    const wallet = {
      address: "0x1234",
      chainId: MAINNET_CHAIN_ID,
      request: async () => ({ transaction_hash: "0xabc" }),
    };
    expect(onchainCapability(wallet, "mainnet")).toMatchObject({
      walletConnected: true,
      walletNetwork: "mainnet",
      networkCompatible: true,
      strk20Ready: true,
      canExecute: true,
    });
    expect(
      onchainCapability(
        { address: "0x1234", chainId: "0xunknown", request: wallet.request },
        "mainnet"
      )
    ).toMatchObject({
      walletNetwork: undefined,
      networkCompatible: false,
      canExecute: false,
    });
  });

  it("hydrates and submits through an injected Braavos-shaped wallet-standard provider", async () => {
    let received: unknown;
    const wallet = {
      id: "braavos",
      name: "Braavos",
      icon: "data:image/svg+xml;base64,AA==",
      on: (_event: string, _listener: (...args: unknown[]) => void) => () =>
        undefined,
      request: async (request: {
        type: string;
        params?: Record<string, unknown>;
      }) => {
        if (request.type === "wallet_requestAccounts") return ["0x1234"];
        if (request.type === "wallet_requestChainId") return "SN_MAIN";
        received = request;
        return { transaction_hash: "0xabc" };
      },
    };
    const connected = await connectVeilWallet(wallet);
    expect(connected).toMatchObject({
      address: "0x1234",
      live: true,
      network: "mainnet",
    });
    await expect(connected.wallet?.connect?.()).resolves.toMatchObject({
      accounts: [{ address: "0x1234", chainId: MAINNET_CHAIN_ID }],
    });
    await expect(
      submitShieldedRoute(connected.wallet, 2n, "mainnet", "0x4567", STRK_TOKEN)
    ).resolves.toEqual({ transaction_hash: "0xabc" });
    expect(received).toEqual({
      type: "wallet_strk20InvokeTransaction",
      params: {
        actions: [
          { type: "deposit", token: STRK_TOKEN, amount: "0x2" },
          {
            type: "transfer",
            token: STRK_TOKEN,
            amount: "0x2",
            recipient: "0x4567",
          },
        ],
      },
    });
  });

  it("preserves a Braavos prototype event method for the official injected adapter", async () => {
    const provider = Object.create({
      on: () => () => undefined,
    }) as VeilWallet;
    provider.id = "braavos";
    provider.name = "Braavos";
    provider.icon = "data:image/svg+xml;base64,AA==";
    provider.request = async request => {
      if (request.type === "wallet_requestAccounts") return ["0x1234"];
      if (request.type === "wallet_requestChainId") return "SN_MAIN";
      return { transaction_hash: "0xabc" };
    };
    const result = await connectVeilWallet(provider);
    expect(result).toMatchObject({
      address: "0x1234",
      live: true,
      network: "mainnet",
    });
    expect(result.wallet?.on).toBeTypeOf("function");
  });

  it("submits through the official wallet_strk20InvokeTransaction request", async () => {
    let received: unknown;
    const wallet = {
      address: "0x1234",
      chainId: MAINNET_CHAIN_ID,
      request: async (request: {
        type: string;
        params?: Record<string, unknown>;
      }) => {
        received = request;
        return { transaction_hash: "0xabc" };
      },
    };
    await expect(
      submitShieldedRoute(wallet, 2n, "mainnet", "0x4567", STRK_TOKEN)
    ).resolves.toEqual({ transaction_hash: "0xabc" });
    expect(received).toEqual({
      type: "wallet_strk20InvokeTransaction",
      params: {
        actions: [
          { type: "deposit", token: STRK_TOKEN, amount: "0x2" },
          {
            type: "transfer",
            token: STRK_TOKEN,
            amount: "0x2",
            recipient: "0x4567",
          },
        ],
      },
    });
  });
});
