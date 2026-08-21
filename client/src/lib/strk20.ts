export type VeilNetwork = "mainnet" | "sepolia";

export const STRK_TOKEN = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const MAINNET_CHAIN_ID = "0x534e5f4d41494e";
export const SEPOLIA_CHAIN_ID = "0x534e5f5345504f4c4941";

export const NETWORKS: Record<VeilNetwork, { label: string; chainId: string; explorer: string; evidenceLabel: string }> = {
  mainnet: {
    label: "Starknet mainnet",
    chainId: MAINNET_CHAIN_ID,
    explorer: "https://voyager.online",
    evidenceLabel: "Production evidence",
  },
  sepolia: {
    label: "Starknet Sepolia",
    chainId: SEPOLIA_CHAIN_ID,
    explorer: "https://sepolia.voyager.online",
    evidenceLabel: "Testnet verification",
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

export type VeilWallet = {
  id?: string;
  name?: string;
  icon?: string;
  account?: { address?: string };
  address?: string;
  chainId?: string;
  strk20InvokeTransaction?: (actions: OnchainAction[]) => Promise<{ transaction_hash: string }>;
  execute?: (calls: StarknetContractCall[]) => Promise<{ transaction_hash: string }>;
  strk20Balances?: (tokens: string[]) => Promise<unknown>;
  enable?: () => Promise<unknown>;
  connect?: (options?: { mode?: "browser" | "qr" }) => Promise<unknown>;
  disconnect?: () => Promise<void>;
  request?: (request: { type: string; params?: Record<string, unknown> }) => Promise<unknown>;
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
  if (value < BigInt(0)) throw new Error("Expected a non-negative Starknet felt value.");
  return `0x${value.toString(16)}`;
}

function detectWallet(): VeilWallet | undefined {
  return window.starknet ?? window.starknet_argentX ?? window.starknet_braavos;
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
    return [{ id, name: wallet.name || fallbackName, icon: wallet.icon, wallet, supportsQr }];
  });
}

function addressFromWallet(wallet?: VeilWallet): string | undefined {
  return wallet?.address ?? wallet?.account?.address;
}

export async function disconnectVeilWallet(wallet?: VeilWallet): Promise<void> {
  await wallet?.disconnect?.();
}

export async function requestWalletQrConnection(option: StarknetWalletOption): Promise<WalletQrResult | undefined> {
  const wallet = option.wallet;
  if (!option.supportsQr) return undefined;
  try {
    const requested = await wallet.request?.({ type: "wallet_connect_qr", params: { walletId: option.id } });
    const uri = typeof requested === "string" ? requested : typeof requested === "object" && requested !== null && "uri" in requested ? String((requested as { uri?: unknown }).uri ?? "") : "";
    if (uri) return { uri, walletId: option.id };
  } catch {
    // Some injected wallets expose connect but not QR. Fall through to their browser connection.
  }
  try {
    const connected = await wallet.connect?.({ mode: "qr" });
    const uri = typeof connected === "string" ? connected : typeof connected === "object" && connected !== null && "uri" in connected ? String((connected as { uri?: unknown }).uri ?? "") : "";
    return uri ? { uri, walletId: option.id } : undefined;
  } catch {
    return undefined;
  }
}

export function networkFromChainId(chainId?: string): VeilNetwork | undefined {
  if (!chainId) return undefined;
  const normalized = chainId.toLowerCase();
  if (normalized === MAINNET_CHAIN_ID.toLowerCase()) return "mainnet";
  if (normalized === SEPOLIA_CHAIN_ID.toLowerCase()) return "sepolia";
  return undefined;
}

export function chainIdForNetwork(network: VeilNetwork): string {
  return NETWORKS[network].chainId;
}

export function assertWalletNetwork(wallet: VeilWallet, network: VeilNetwork): void {
  const detected = networkFromChainId(wallet.chainId);
  if (detected && detected !== network) {
    throw new Error(`Wallet is connected to ${NETWORKS[detected].label}; switch to ${NETWORKS[network].label} before signing.`);
  }
}

export async function connectVeilWallet(selectedWallet?: VeilWallet): Promise<{ wallet?: VeilWallet; address?: string; live: boolean; network?: VeilNetwork }> {
  const wallet = selectedWallet ?? detectWallet();
  if (!wallet) return { live: false };
  if (wallet.enable) await wallet.enable();
  else await wallet.connect?.({ mode: "browser" });
  const address = addressFromWallet(wallet);
  return { wallet, address, live: Boolean(address), network: networkFromChainId(wallet.chainId) };
}

export function buildShieldedRouteActions(intent: ShieldedRouteIntent): OnchainAction[] {
  if (intent.amountSmallestUnit <= BigInt(0)) throw new Error("Shielded route amount must be greater than zero.");
  if (!intent.token.trim()) throw new Error("Shielded route token is required.");
  const amount = bigintToHex(intent.amountSmallestUnit);
  return [
    { type: "deposit", token: intent.token, amount },
    ...(intent.recipient ? [{ type: "transfer" as const, token: intent.token, amount, recipient: intent.recipient }] : []),
  ];
}

export function buildPayrollRegistryCreateCall(contractAddress: string, token: string, amountSmallestUnit: bigint, recipientCommitment: string): StarknetContractCall {
  if (!/^0x[0-9a-fA-F]+$/.test(contractAddress)) throw new Error("Payroll registry contract address is invalid.");
  if (!/^0x[0-9a-fA-F]+$/.test(token)) throw new Error("Payroll token address is invalid.");
  if (amountSmallestUnit <= BigInt(0)) throw new Error("Payroll registry amount must be greater than zero.");
  if (!recipientCommitment.trim()) throw new Error("Recipient commitment is required.");
  const lowMask = (BigInt(1) << BigInt(128)) - BigInt(1);
  const low = amountSmallestUnit & lowMask;
  const high = amountSmallestUnit >> BigInt(128);
  return { contractAddress, entrypoint: "create_route", calldata: [token, bigintToHex(low), bigintToHex(high), recipientCommitment] };
}

export function onchainCapability(wallet: VeilWallet | undefined, network: VeilNetwork) {
  const walletNetwork = networkFromChainId(wallet?.chainId);
  return {
    network,
    walletConnected: Boolean(wallet?.address ?? wallet?.account?.address),
    walletNetwork,
    networkCompatible: !walletNetwork || walletNetwork === network,
    strk20Ready: Boolean(wallet?.strk20InvokeTransaction),
    canExecute: Boolean(wallet?.strk20InvokeTransaction) && (!walletNetwork || walletNetwork === network),
  } as const;
}

export async function submitShieldedRoute(wallet: VeilWallet, amountSmallestUnit: bigint, network: VeilNetwork = "mainnet", recipient?: string) {
  if (!wallet.strk20InvokeTransaction) throw new Error("This wallet does not expose the STRK20 privacy API yet.");
  assertWalletNetwork(wallet, network);
  return wallet.strk20InvokeTransaction(buildShieldedRouteActions({ network, token: STRK_TOKEN, amountSmallestUnit, recipient }));
}

export function explorerUrl(txHash: string, networkOrChainId?: VeilNetwork | string) {
  const network = networkOrChainId === "mainnet" || networkOrChainId === "sepolia" ? networkOrChainId : networkFromChainId(networkOrChainId) ?? "mainnet";
  return `${NETWORKS[network].explorer}/tx/${txHash}`;
}

export function networkLabel(network: VeilNetwork): string {
  return NETWORKS[network].label;
}

export function evidenceLabel(network: VeilNetwork): string {
  return NETWORKS[network].evidenceLabel;
}
