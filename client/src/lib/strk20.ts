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
