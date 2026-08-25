import { StarknetInjectedWallet } from "@starknet-io/get-starknet-wallet-standard";

export type VeilNetwork = "mainnet";

export const STRK_TOKEN =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const ETH_TOKEN =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const MAINNET_CHAIN_ID = "0x534e5f4d41494e";

export const STRK20_ASSETS = {
  STRK: { symbol: "STRK", token: STRK_TOKEN, decimals: 18 },
  ETH: { symbol: "ETH", token: ETH_TOKEN, decimals: 18 },
} as const;

export type Strk20AssetSymbol = keyof typeof STRK20_ASSETS;

export function strk20AssetForSymbol(symbol: string) {
  return STRK20_ASSETS[symbol.trim().toUpperCase() as Strk20AssetSymbol];
}

export function strk20TokenAddressForSymbol(
  symbol: string
): string | undefined {
  return strk20AssetForSymbol(symbol)?.token;
}

export function strk20TokenDecimalsForSymbol(
  symbol: string
): number | undefined {
  return strk20AssetForSymbol(symbol)?.decimals;
}

export function isSupportedStrk20Token(token: string): boolean {
  return Object.values(STRK20_ASSETS).some(
    asset => asset.token.toLowerCase() === token.trim().toLowerCase()
  );
}

export const NETWORKS: Record<
  VeilNetwork,
  { label: string; chainId: string; explorer: string; evidenceLabel: string }
> = {
  mainnet: {
    label: "Starknet mainnet",
    chainId: MAINNET_CHAIN_ID,
    explorer: "https://voyager.online",
    evidenceLabel: "Production evidence",
  },
};

export type OnchainAction = {
  type: "deposit" | "transfer";
  token: string;
  amount: string;
  recipient?: string;
};

export type StarknetContractCall = {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
};

export type ShieldedRouteIntent = {
  network: VeilNetwork;
  token: string;
  amountSmallestUnit: bigint;
  recipient?: string;
};

export type LaunchpadEscrowAction =
  | { type: "create_project"; projectId: bigint; creator: string }
  | { type: "activate_project"; projectId: bigint }
  | { type: "deposit"; projectId: bigint; amountSmallestUnit: bigint }
  | {
      type: "reserve_allocation";
      projectId: bigint;
      allocationId: bigint;
      beneficiary: string;
      amountSmallestUnit: bigint;
    }
  | {
      type: "approve_milestone";
      projectId: bigint;
      milestoneId: bigint;
      allocationId: bigint;
    }
  | { type: "release_milestone"; projectId: bigint; milestoneId: bigint }
  | { type: "refund"; projectId: bigint; amountSmallestUnit: bigint };

export type PrivateMarketsAction =
  | { type: "create_market"; marketId: bigint; creator: string; targetSmallestUnit: bigint }
  | { type: "open_market"; marketId: bigint }
  | { type: "commit_bid"; marketId: bigint; bidId: bigint; commitmentHash: string; amountSmallestUnit: bigint }
  | { type: "close_market"; marketId: bigint }
  | { type: "accept_bid"; marketId: bigint; bidId: bigint }
  | { type: "settle_bid"; marketId: bigint; bidId: bigint }
  | { type: "refund_bid"; marketId: bigint; bidId: bigint };

type WalletRequest = (request: {
  type: string;
  params?: Record<string, unknown>;
}) => Promise<unknown>;

export type VeilWallet = {
  id?: string;
  name?: string;
  icon?: string;
  account?: { address?: string };
  accounts?: Array<{ address?: string; chainId?: string } | string>;
  address?: string;
  selectedAddress?: string;
  selectedAccount?: { address?: string; chainId?: string };
  chainId?: string;
  selectedChainId?: string;
  on?: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => (() => void) | void;
  /** Native STRK20 wallet-api method, when the wallet exposes it directly. */
  strk20InvokeTransaction?: (
    actions: OnchainAction[]
  ) => Promise<{ transaction_hash: string }>;
  /** Standard Starknet wallet-api request seam used by Braavos/Ready X injected wallets. */
  request?: WalletRequest;
  execute?: (
    calls: StarknetContractCall[]
  ) => Promise<{ transaction_hash: string }>;
  strk20Balances?: (tokens: string[]) => Promise<unknown>;
  enable?: () => Promise<unknown>;
  connect?: (options?: { mode?: "browser" | "qr" }) => Promise<unknown>;
  disconnect?: () => Promise<void>;
};

export type StarknetWalletOption = {
  id: string;
  name: string;
  icon?: string;
  wallet: VeilWallet;
  supportsQr: boolean;
};

export type WalletQrResult = { uri: string; walletId: string };

declare global {
  interface Window {
    starknet?: VeilWallet;
    starknet_argentX?: VeilWallet;
    starknet_braavos?: VeilWallet;
  }
}

function bigintToHex(value: bigint): string {
  if (value < BigInt(0))
    throw new Error("Expected a non-negative Starknet felt value.");
  return `0x${value.toString(16)}`;
}

function detectWallet(): VeilWallet | undefined {
  return window.starknet ?? window.starknet_argentX ?? window.starknet_braavos;
}

function addressFromWallet(wallet?: VeilWallet): string | undefined {
  const candidate =
    wallet?.address ??
    wallet?.account?.address ??
    wallet?.selectedAddress ??
    wallet?.selectedAccount?.address ??
    addressFromValue(wallet?.accounts);
  return addressFromValue(candidate);
}

export function describeStrk20SubmissionError(
  error: unknown
): string | undefined {
  const message = error instanceof Error ? error.message : String(error);
  if (/not_registered/i.test(message)) {
    return "The connected wallet or STRK20 privacy pool reports NOT_REGISTERED. No transaction was created. Complete STRK20 registration/shielding in a supported wallet, or configure the verified Mainnet SDK/pool deployment before retrying.";
  }
  if (/not implemented|not_implemented|unsupported.*strk20/i.test(message)) {
    return "This wallet connected successfully but does not implement the requested STRK20 private action. No transaction was created. The current official wallet privacy phase supports shielding inside Ready X or Xverse; Veyra will not replace this with an unsafe public transfer or an unverified contract call.";
  }
  if (/unknown_error/i.test(message)) {
    return "The wallet did not return a usable STRK20 result. No transaction hash was recorded and the Veyra route remains ready to sign; review the wallet state before retrying.";
  }
  return undefined;
}

function transactionHashFromWalletResponse(value: unknown): string {
  if (
    typeof value !== "object" ||
    value === null ||
    !("transaction_hash" in value) ||
    typeof (value as { transaction_hash?: unknown }).transaction_hash !==
      "string" ||
    !(value as { transaction_hash: string }).transaction_hash.trim()
  ) {
    throw new Error("The wallet returned no Starknet transaction hash.");
  }
  return (value as { transaction_hash: string }).transaction_hash;
}

async function requestStrk20Invoke(
  wallet: VeilWallet,
  actions: OnchainAction[]
): Promise<{ transaction_hash: string }> {
  if (!wallet.request)
    throw new Error("This wallet does not expose the Starknet wallet API.");
  const result = await wallet.request.call(wallet, {
    type: "wallet_strk20InvokeTransaction",
    params: { actions },
  });
  return { transaction_hash: transactionHashFromWalletResponse(result) };
}

async function requestInvoke(
  wallet: VeilWallet,
  calls: StarknetContractCall[]
): Promise<{ transaction_hash: string }> {
  if (!wallet.request)
    throw new Error("This wallet does not expose the Starknet wallet API.");
  const result = await wallet.request.call(wallet, {
    type: "wallet_addInvokeTransaction",
    params: {
      calls: calls.map(call => ({
        contract_address: call.contractAddress,
        entry_point: call.entrypoint,
        calldata: call.calldata,
      })),
    },
  });
  return { transaction_hash: transactionHashFromWalletResponse(result) };
}

/**
 * Submit one reviewed Launchpad escrow contract call through the connected
 * wallet’s standard invoke request. This is intentionally separate from the
 * private STRK20 route: a public escrow contract uses wallet_addInvokeTransaction,
 * while private payments may only use wallet_strk20InvokeTransaction.
 */
export async function submitPrivateMarketsCall(
  wallet: VeilWallet,
  network: VeilNetwork,
  call: StarknetContractCall
): Promise<{ transaction_hash: string }> {
  assertWalletNetwork(wallet, network);
  if (!wallet.request) throw new Error("This wallet does not expose the Starknet wallet API.");
  return requestInvoke(wallet, [call]);
}

export async function submitLaunchpadEscrowCall(
  wallet: VeilWallet,
  network: VeilNetwork,
  call: StarknetContractCall
): Promise<{ transaction_hash: string }> {
  assertWalletNetwork(wallet, network);
  if (!wallet.request)
    throw new Error("This wallet does not expose the Starknet wallet API.");
  return requestInvoke(wallet, [call]);
}

/**
 * Adapt a raw injected Starknet wallet to the official Starknet wallet-api
 * request names. The request is still capability-based: unsupported wallets
 * reject the exact STRK20 request, and no generic `execute` fallback is used
 * for private actions.
 */
function withWalletStandardMethods(wallet: VeilWallet): VeilWallet {
  if (wallet.request && typeof wallet.on === "function") {
    try {
      const injected = {
        ...wallet,
        on: wallet.on.bind(wallet),
        request: async (request: {
          type: string;
          params?: Record<string, unknown>;
        }) => {
          const value = await wallet.request!.call(wallet, request);
          if (
            request.type === "wallet_requestChainId" &&
            networkFromChainId(chainIdFromValue(value)) === "mainnet"
          ) {
            return MAINNET_CHAIN_ID;
          }
          return value;
        },
      } as unknown as ConstructorParameters<typeof StarknetInjectedWallet>[0];
      const standard = new StarknetInjectedWallet(injected);
      const walletApi = standard.features["starknet:walletApi"];
      const standardConnect = standard.features["standard:connect"];
      // Veyra keeps the STRK20 action union broad enough for the protocol’s
      // deposit + transfer flow; the wallet-standard declaration currently
      // exposes a narrower transfer-only generated type. Runtime validation
      // remains at the protocol readiness and route guards below this seam.
      const standardRequest = walletApi.request as unknown as WalletRequest;
      const account = standard.accounts[0];
      const chainId = account?.chains[0]?.split(":").at(-1);
      return {
        ...wallet,
        name: standard.name || wallet.name,
        icon: standard.icon || wallet.icon,
        address: account?.address ?? wallet.address,
        chainId: chainId ?? wallet.chainId,
        on: wallet.on.bind(wallet),
        request: standardRequest,
        connect: async () => {
          const result = await standardConnect.connect({});
          const connectedAccounts = standard.accounts.map(account => ({
            address: account.address,
            chainId: account.chains[0]?.split(":").at(-1),
          }));
          return connectedAccounts.length
            ? { accounts: connectedAccounts }
            : result;
        },
        strk20InvokeTransaction:
          wallet.strk20InvokeTransaction ??
          (actions =>
            standardRequest({
              type: "wallet_strk20InvokeTransaction",
              params: { actions },
            }).then(value => ({
              transaction_hash: transactionHashFromWalletResponse(value),
            }))),
        execute: wallet.execute ?? (calls => requestInvoke(wallet, calls)),
      };
    } catch {
      // Fall through to the direct wallet-api adapter when a legacy provider
      // does not expose the event methods required by the standard wrapper.
    }
  }
  if (!wallet.request) return wallet;
  return {
    ...wallet,
    strk20InvokeTransaction:
      wallet.strk20InvokeTransaction ??
      (actions => requestStrk20Invoke(wallet, actions)),
    execute: wallet.execute ?? (calls => requestInvoke(wallet, calls)),
  };
}

export function discoverStarknetWallets(): StarknetWalletOption[] {
  if (typeof window === "undefined") return [];
  const candidates: Array<[string, string, VeilWallet | undefined]> = [
    ["argent-x", "Argent X", window.starknet_argentX],
    ["braavos", "Braavos", window.starknet_braavos],
    ["starknet", "Starknet wallet", window.starknet],
  ];
  const seen = new Set<VeilWallet>();
  return candidates.flatMap(([id, fallbackName, wallet]) => {
    if (!wallet || seen.has(wallet)) return [];
    seen.add(wallet);
    const supportsQr = Boolean(wallet.request || wallet.connect);
    return [
      {
        id,
        name: wallet.name || fallbackName,
        icon: wallet.icon,
        wallet,
        supportsQr,
      },
    ];
  });
}

export async function disconnectVeilWallet(wallet?: VeilWallet): Promise<void> {
  await wallet?.disconnect?.();
}

export async function requestWalletQrConnection(
  option: StarknetWalletOption
): Promise<WalletQrResult | undefined> {
  const wallet = option.wallet;
  if (!option.supportsQr) return undefined;
  try {
    const requested = await wallet.request?.call(wallet, {
      type: "wallet_connect_qr",
      params: { walletId: option.id },
    });
    const uri =
      typeof requested === "string"
        ? requested
        : typeof requested === "object" &&
            requested !== null &&
            "uri" in requested
          ? String((requested as { uri?: unknown }).uri ?? "")
          : "";
    if (uri) return { uri, walletId: option.id };
  } catch {
    // Some injected wallets expose connect but not QR. Fall through to their browser connection.
  }
  try {
    const connected = await wallet.connect?.({ mode: "qr" });
    const uri =
      typeof connected === "string"
        ? connected
        : typeof connected === "object" &&
            connected !== null &&
            "uri" in connected
          ? String((connected as { uri?: unknown }).uri ?? "")
          : "";
    return uri ? { uri, walletId: option.id } : undefined;
  } catch {
    return undefined;
  }
}

function chainIdFromValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return chainIdFromValue(value[0]);
  if (typeof value === "number" && Number.isSafeInteger(value))
    return String(value);
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of [
    "chainId",
    "chain_id",
    "network",
    "networkId",
    "network_id",
  ]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim())
      return candidate.trim();
    if (typeof candidate === "number" && Number.isSafeInteger(candidate))
      return String(candidate);
  }
  const account = Array.isArray(record.accounts)
    ? record.accounts[0]
    : record.account;
  if (account !== undefined) return chainIdFromValue(account);
  return chainIdFromValue(record.chains);
}

function addressFromValue(value: unknown): string | undefined {
  if (typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value.trim()))
    return value.trim();
  if (Array.isArray(value)) return addressFromValue(value[0]);
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["address", "accountAddress", "account_address"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim())
      return candidate.trim();
  }
  const account = Array.isArray(record.accounts)
    ? record.accounts[0]
    : record.account;
  return addressFromValue(account);
}

function mergeWalletConnection(
  wallet: VeilWallet,
  connectionResult: unknown
): VeilWallet {
  const address = addressFromValue(connectionResult);
  const chainId = chainIdFromValue(connectionResult);
  return {
    ...wallet,
    ...(address ? { address } : {}),
    ...(chainId ? { chainId } : {}),
  };
}

async function hydrateWalletApiAccount(
  wallet: VeilWallet
): Promise<VeilWallet> {
  const knownAddress = addressFromWallet(wallet);
  if (knownAddress) {
    return mergeWalletConnection(wallet, {
      address: knownAddress,
      chainId:
        wallet.chainId ??
        wallet.selectedChainId ??
        wallet.selectedAccount?.chainId,
    });
  }
  if (!wallet.request) return wallet;
  const accounts = await wallet.request.call(wallet, {
    type: "wallet_requestAccounts",
  });
  const address = addressFromValue(accounts);
  if (!address) return wallet;
  const accountResultChainId = Array.isArray(accounts)
    ? typeof accounts[0] === "object" && accounts[0] !== null
      ? chainIdFromValue(accounts[0])
      : undefined
    : chainIdFromValue(accounts);
  let chainId = wallet.chainId ?? accountResultChainId;
  if (!wallet.chainId) {
    try {
      chainId =
        chainIdFromValue(
          await wallet.request.call(wallet, { type: "wallet_requestChainId" })
        ) ?? chainId;
    } catch {
      // Strict Mainnet verification remains enforced by assertWalletNetwork.
    }
  }
  return mergeWalletConnection(wallet, { accounts: [{ address, chainId }] });
}

export function networkFromChainId(chainId?: string): VeilNetwork | undefined {
  if (!chainId) return undefined;
  const normalized = chainId.trim().toLowerCase();
  const namespaceless = normalized.startsWith("starknet:")
    ? normalized.slice("starknet:".length)
    : normalized;
  const normalizedHex = /^\d+$/.test(namespaceless)
    ? `0x${BigInt(namespaceless).toString(16)}`
    : namespaceless;
  if (
    normalizedHex === MAINNET_CHAIN_ID.toLowerCase() ||
    normalizedHex === "sn_main" ||
    normalizedHex === "sn_mainnet" ||
    normalizedHex === "starknet-mainnet" ||
    normalizedHex === "starknet_mainnet"
  )
    return "mainnet";
  return undefined;
}

export function chainIdForNetwork(network: VeilNetwork): string {
  return NETWORKS[network].chainId;
}

export function assertWalletNetwork(
  wallet: VeilWallet,
  network: VeilNetwork
): void {
  const detected = networkFromChainId(wallet.chainId);
  if (!detected || detected !== network) {
    throw new Error(
      `Wallet network could not be verified. Connect a wallet reporting ${NETWORKS[network].label} before signing.`
    );
  }
}

export async function connectVeilWallet(selectedWallet?: VeilWallet): Promise<{
  wallet?: VeilWallet;
  address?: string;
  live: boolean;
  network?: VeilNetwork;
}> {
  const wallet = selectedWallet ?? detectWallet();
  if (!wallet) return { live: false };
  const adaptedWallet = withWalletStandardMethods(wallet);
  const connectionResult = adaptedWallet.connect
    ? await adaptedWallet.connect({ mode: "browser" })
    : await adaptedWallet.enable?.();
  const mergedWallet = mergeWalletConnection(adaptedWallet, connectionResult);
  const connectedWallet = await hydrateWalletApiAccount(mergedWallet);
  const enhancedWallet = withWalletStandardMethods(connectedWallet);
  const address = addressFromWallet(enhancedWallet);
  return {
    wallet: enhancedWallet,
    address,
    live: Boolean(address),
    network: networkFromChainId(enhancedWallet.chainId),
  };
}

export function buildShieldedRouteActions(
  intent: ShieldedRouteIntent
): OnchainAction[] {
  if (intent.amountSmallestUnit <= BigInt(0))
    throw new Error("Shielded route amount must be greater than zero.");
  if (!intent.token.trim())
    throw new Error("Shielded route token is required.");
  if (!isSupportedStrk20Token(intent.token))
    throw new Error(
      "Only verified STRK or ETH Mainnet tokens can be submitted through this STRK20 adapter."
    );
  const amount = bigintToHex(intent.amountSmallestUnit);
  return [
    { type: "deposit", token: intent.token, amount },
    ...(intent.recipient
      ? [
          {
            type: "transfer" as const,
            token: intent.token,
            amount,
            recipient: intent.recipient,
          },
        ]
      : []),
  ];
}

function assertContractAddress(value: string, label: string): void {
  if (!/^0x[0-9a-fA-F]+$/.test(value) || BigInt(value) === BigInt(0))
    throw new Error(`${label} address is invalid.`);
}

function assertPositiveId(value: bigint, label: string): void {
  if (value <= BigInt(0)) throw new Error(`${label} must be greater than zero.`);
}

function u256Calldata(value: bigint, label: string): string[] {
  if (value <= BigInt(0)) throw new Error(`${label} must be greater than zero.`);
  const lowMask = (BigInt(1) << BigInt(128)) - BigInt(1);
  return [bigintToHex(value & lowMask), bigintToHex(value >> BigInt(128))];
}

export function buildPrivateMarketsTokenApprovalCall(
  tokenAddress: string,
  spenderAddress: string,
  amountSmallestUnit: bigint
): StarknetContractCall {
  assertContractAddress(tokenAddress, "Token");
  assertContractAddress(spenderAddress, "Spender");
  return {
    contractAddress: tokenAddress,
    entrypoint: "approve",
    calldata: [spenderAddress, ...u256Calldata(amountSmallestUnit, "Approval amount")],
  };
}

export function buildPrivateMarketsCall(
  contractAddress: string,
  action: PrivateMarketsAction
): StarknetContractCall {
  assertContractAddress(contractAddress, "Private Markets contract");
  switch (action.type) {
    case "create_market":
      assertPositiveId(action.marketId, "Market id");
      assertContractAddress(action.creator, "Creator");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.marketId), action.creator, ...u256Calldata(action.targetSmallestUnit, "Market target")] };
    case "open_market":
    case "close_market":
      assertPositiveId(action.marketId, "Market id");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.marketId)] };
    case "commit_bid":
      assertPositiveId(action.marketId, "Market id");
      assertPositiveId(action.bidId, "Bid id");
      if (!action.commitmentHash.trim()) throw new Error("Commitment hash is required.");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.marketId), bigintToHex(action.bidId), action.commitmentHash, ...u256Calldata(action.amountSmallestUnit, "Bid amount")] };
    case "accept_bid":
    case "settle_bid":
    case "refund_bid":
      assertPositiveId(action.marketId, "Market id");
      assertPositiveId(action.bidId, "Bid id");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.marketId), bigintToHex(action.bidId)] };
  }
}

export function buildLaunchpadEscrowCall(
  contractAddress: string,
  action: LaunchpadEscrowAction
): StarknetContractCall {
  assertContractAddress(contractAddress, "Launchpad escrow contract");
  switch (action.type) {
    case "create_project":
      assertPositiveId(action.projectId, "Project id");
      assertContractAddress(action.creator, "Creator");
      return {
        contractAddress,
        entrypoint: action.type,
        calldata: [bigintToHex(action.projectId), action.creator],
      };
    case "activate_project":
      assertPositiveId(action.projectId, "Project id");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.projectId)] };
    case "deposit":
      assertPositiveId(action.projectId, "Project id");
      return {
        contractAddress,
        entrypoint: action.type,
        calldata: [bigintToHex(action.projectId), ...u256Calldata(action.amountSmallestUnit, "Deposit amount")],
      };
    case "reserve_allocation":
      assertPositiveId(action.projectId, "Project id");
      assertPositiveId(action.allocationId, "Allocation id");
      assertContractAddress(action.beneficiary, "Beneficiary");
      return {
        contractAddress,
        entrypoint: action.type,
        calldata: [bigintToHex(action.projectId), bigintToHex(action.allocationId), action.beneficiary, ...u256Calldata(action.amountSmallestUnit, "Allocation amount")],
      };
    case "approve_milestone":
      assertPositiveId(action.projectId, "Project id");
      assertPositiveId(action.milestoneId, "Milestone id");
      assertPositiveId(action.allocationId, "Allocation id");
      return {
        contractAddress,
        entrypoint: action.type,
        calldata: [bigintToHex(action.projectId), bigintToHex(action.milestoneId), bigintToHex(action.allocationId)],
      };
    case "release_milestone":
      assertPositiveId(action.projectId, "Project id");
      assertPositiveId(action.milestoneId, "Milestone id");
      return {
        contractAddress,
        entrypoint: action.type,
        calldata: [bigintToHex(action.projectId), bigintToHex(action.milestoneId)],
      };
    case "refund":
      assertPositiveId(action.projectId, "Project id");
      return {
        contractAddress,
        entrypoint: action.type,
        calldata: [bigintToHex(action.projectId), ...u256Calldata(action.amountSmallestUnit, "Refund amount")],
      };
  }
}

export function buildPayrollRegistryCreateCall(
  contractAddress: string,
  token: string,
  amountSmallestUnit: bigint,
  recipientCommitment: string
): StarknetContractCall {
  if (!/^0x[0-9a-fA-F]+$/.test(contractAddress))
    throw new Error("Payroll registry contract address is invalid.");
  if (!/^0x[0-9a-fA-F]+$/.test(token))
    throw new Error("Payroll token address is invalid.");
  if (amountSmallestUnit <= BigInt(0))
    throw new Error("Payroll registry amount must be greater than zero.");
  if (!recipientCommitment.trim())
    throw new Error("Recipient commitment is required.");
  const lowMask = (BigInt(1) << BigInt(128)) - BigInt(1);
  const low = amountSmallestUnit & lowMask;
  const high = amountSmallestUnit >> BigInt(128);
  return {
    contractAddress,
    entrypoint: "create_route",
    calldata: [token, bigintToHex(low), bigintToHex(high), recipientCommitment],
  };
}

export type Strk20Readiness = {
  status: "connect" | "network" | "wallet-api" | "registration";
  label: string;
  detail: string;
};

export function describeStrk20Readiness(
  wallet: VeilWallet | undefined,
  network: VeilNetwork
): Strk20Readiness {
  if (!wallet) {
    return {
      status: "connect",
      label: "WAITING FOR WALLET",
      detail:
        "Connect a wallet before Veyra can inspect the Mainnet STRK20 action capability.",
    };
  }
  const walletNetwork = networkFromChainId(wallet.chainId);
  if (walletNetwork !== network) {
    return {
      status: "network",
      label: "NETWORK MISMATCH",
      detail: `The wallet must report ${NETWORKS[network].label}; Veyra will not sign on another network.`,
    };
  }
  if (!wallet.strk20InvokeTransaction && !wallet.request) {
    return {
      status: "wallet-api",
      label: "STRK20 API UNAVAILABLE",
      detail:
        "This wallet does not expose the official STRK20 wallet action. No generic invoke fallback is available.",
    };
  }
  return {
    status: "registration",
    label: "API DETECTED / REGISTRATION UNVERIFIED",
    detail:
      "Wallet capability is present, but registration, recipient channel context, and private-note discovery remain wallet-owned prerequisites.",
  };
}

export function onchainCapability(
  wallet: VeilWallet | undefined,
  network: VeilNetwork
) {
  const walletNetwork = networkFromChainId(wallet?.chainId);
  const strk20Ready = Boolean(
    wallet?.strk20InvokeTransaction || wallet?.request
  );
  return {
    network,
    walletConnected: Boolean(wallet?.address ?? wallet?.account?.address),
    walletNetwork,
    networkCompatible: walletNetwork === network,
    strk20Ready,
    canExecute: strk20Ready && walletNetwork === network,
  } as const;
}

export async function submitShieldedRoute(
  wallet: VeilWallet,
  amountSmallestUnit: bigint,
  network: VeilNetwork = "mainnet",
  recipient?: string,
  token: string = STRK_TOKEN
) {
  assertWalletNetwork(wallet, network);
  const actions = buildShieldedRouteActions({
    network,
    token,
    amountSmallestUnit,
    recipient,
  });
  if (wallet.strk20InvokeTransaction)
    return wallet.strk20InvokeTransaction(actions);
  return requestStrk20Invoke(wallet, actions);
}

export function explorerUrl(
  txHash: string,
  networkOrChainId?: VeilNetwork | string
) {
  const network =
    networkOrChainId === "mainnet" ||
    networkFromChainId(networkOrChainId) === "mainnet"
      ? "mainnet"
      : "mainnet";
  return `${NETWORKS[network].explorer}/tx/${txHash}`;
}

export function networkLabel(network: VeilNetwork): string {
  return NETWORKS[network].label;
}

export function evidenceLabel(network: VeilNetwork): string {
  return NETWORKS[network].evidenceLabel;
}

export type PrivateMarketsReceiptStatus = {
  transactionHash: string;
  finalityStatus: string;
  executionStatus: string;
};

export type PrivateMarketsChainState = {
  marketState: bigint;
  bidState: bigint;
  committed: bigint;
};

function privateMarketsRpcUrl(): string {
  const url = String(import.meta.env.VITE_STARKNET_MAINNET_RPC_URL ?? "").trim();
  if (!url || !/^https:\/\//i.test(url)) {
    throw new Error("A verified HTTPS Starknet Mainnet RPC URL is not configured.");
  }
  return url;
}

async function privateMarketsRpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(privateMarketsRpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error(`Starknet RPC returned HTTP ${response.status}.`);
  const payload = (await response.json()) as { result?: T; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message || "Starknet RPC request failed.");
  if (payload.result === undefined) throw new Error("Starknet RPC returned no result.");
  return payload.result;
}

async function readPrivateMarketsCall(contractAddress: string, entrypoint: string, calldata: string[]): Promise<string[]> {
  assertContractAddress(contractAddress, "Private Markets contract address");
  const { hash } = await import("starknet");
  return privateMarketsRpc<string[]>("starknet_call", [{
    contract_address: contractAddress,
    entry_point_selector: hash.getSelectorFromName(entrypoint),
    calldata,
  }, "latest"]);
}

function u256FromFelts(values: string[], label: string): bigint {
  if (values.length < 2) throw new Error(`${label} returned an invalid u256 response.`);
  return BigInt(values[0]) + (BigInt(values[1]) << BigInt("128"));
}

export async function readPrivateMarketsChainState(
  contractAddress: string,
  marketId: bigint,
  bidId: bigint
): Promise<PrivateMarketsChainState> {
  const [marketState, bidState, committed] = await Promise.all([
    readPrivateMarketsCall(contractAddress, "get_market_state", [marketId.toString()]),
    readPrivateMarketsCall(contractAddress, "get_bid_state", [marketId.toString(), bidId.toString()]),
    readPrivateMarketsCall(contractAddress, "get_market_committed", [marketId.toString()]),
  ]);
  return {
    marketState: BigInt(marketState[0] ?? "0"),
    bidState: BigInt(bidState[0] ?? "0"),
    committed: u256FromFelts(committed, "get_market_committed"),
  };
}

export async function readPrivateMarketsReceipt(transactionHash: string): Promise<PrivateMarketsReceiptStatus> {
  if (!/^0x[0-9a-f]+$/i.test(transactionHash)) throw new Error("Invalid Starknet transaction hash.");
  const receipt = await privateMarketsRpc<{
    finality_status?: string;
    execution_status?: string;
  }>("starknet_getTransactionReceipt", [transactionHash]);
  return {
    transactionHash,
    finalityStatus: receipt.finality_status ?? "UNKNOWN",
    executionStatus: receipt.execution_status ?? "UNKNOWN",
  };
}

export type LaunchpadChainState = {
  projectState: bigint;
  milestoneState: bigint;
  projectBalance: bigint;
};

export async function readLaunchpadChainState(
  contractAddress: string,
  projectId: bigint,
  milestoneId: bigint
): Promise<LaunchpadChainState> {
  const [projectState, milestoneState, projectBalance] = await Promise.all([
    readPrivateMarketsCall(contractAddress, "get_project_state", [projectId.toString()]),
    readPrivateMarketsCall(contractAddress, "get_milestone_state", [projectId.toString(), milestoneId.toString()]),
    readPrivateMarketsCall(contractAddress, "get_project_balance", [projectId.toString()]),
  ]);
  return {
    projectState: BigInt(projectState[0] ?? "0"),
    milestoneState: BigInt(milestoneState[0] ?? "0"),
    projectBalance: u256FromFelts(projectBalance, "get_project_balance"),
  };
}

export type VeyraAgentAction =
  | { type: "create_round"; roundId: bigint; coordinator: string; roundType: string }
  | { type: "open_round"; roundId: bigint }
  | { type: "commit"; roundId: bigint; itemId: bigint; commitment: string }
  | { type: "close_round"; roundId: bigint }
  | { type: "reveal"; roundId: bigint; itemId: bigint; value: string; nonce: string }
  | { type: "resolve"; roundId: bigint; itemId: bigint; winner: string };

export function buildVeyraAgentCall(
  contractAddress: string,
  action: VeyraAgentAction
): StarknetContractCall {
  assertContractAddress(contractAddress, "Veyra Agent contract");
  switch (action.type) {
    case "create_round":
      assertPositiveId(action.roundId, "Round id");
      assertContractAddress(action.coordinator, "Coordinator");
      if (!action.roundType.trim()) throw new Error("Round type is required.");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.roundId), action.coordinator, action.roundType] };
    case "open_round":
    case "close_round":
      assertPositiveId(action.roundId, "Round id");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.roundId)] };
    case "commit":
      assertPositiveId(action.roundId, "Round id");
      assertPositiveId(action.itemId, "Item id");
      if (!/^0x[0-9a-fA-F]+$/.test(action.commitment) || BigInt(action.commitment) === BigInt(0)) throw new Error("Commitment must be a non-zero felt.");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.roundId), bigintToHex(action.itemId), action.commitment] };
    case "reveal":
      assertPositiveId(action.roundId, "Round id");
      assertPositiveId(action.itemId, "Item id");
      if (!action.value.trim() || !action.nonce.trim()) throw new Error("Reveal value and nonce are required.");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.roundId), bigintToHex(action.itemId), action.value, action.nonce] };
    case "resolve":
      assertPositiveId(action.roundId, "Round id");
      assertPositiveId(action.itemId, "Item id");
      assertContractAddress(action.winner, "Winner");
      return { contractAddress, entrypoint: action.type, calldata: [bigintToHex(action.roundId), bigintToHex(action.itemId), action.winner] };
  }
}

export async function submitVeyraAgentCall(
  wallet: VeilWallet,
  network: VeilNetwork,
  call: StarknetContractCall
): Promise<{ transaction_hash: string }> {
  return submitPrivateMarketsCall(wallet, network, call);
}

export type VeyraAgentChainState = {
  roundState: bigint;
  commitment: string;
  reveal: string;
};

export async function readVeyraAgentChainState(
  contractAddress: string,
  roundId: bigint,
  itemId: bigint,
  participant: string
): Promise<VeyraAgentChainState> {
  assertContractAddress(participant, "Participant");
  const [roundState, commitment, reveal] = await Promise.all([
    readPrivateMarketsCall(contractAddress, "get_round_state", [roundId.toString()]),
    readPrivateMarketsCall(contractAddress, "get_commitment", [roundId.toString(), itemId.toString(), participant]),
    readPrivateMarketsCall(contractAddress, "get_reveal", [roundId.toString(), itemId.toString(), participant]),
  ]);
  return { roundState: BigInt(roundState[0] ?? "0"), commitment: commitment[0] ?? "0x0", reveal: reveal[0] ?? "0x0" };
}

export async function readVeyraAgentReceipt(transactionHash: string): Promise<PrivateMarketsReceiptStatus> {
  return readPrivateMarketsReceipt(transactionHash);
}
