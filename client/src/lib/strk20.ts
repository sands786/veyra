import { num } from "starknet";

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

export type VeilWallet = {
  account?: { address?: string };
  address?: string;
  chainId?: string;
  strk20InvokeTransaction?: (actions: unknown[]) => Promise<{ transaction_hash: string }>;
  strk20Balances?: (tokens: string[]) => Promise<unknown>;
  enable?: () => Promise<unknown>;
};

declare global {
  interface Window {
    starknet?: VeilWallet;
    starknet_argentX?: VeilWallet;
    starknet_braavos?: VeilWallet;
  }
}

function detectWallet(): VeilWallet | undefined {
  return window.starknet ?? window.starknet_argentX ?? window.starknet_braavos;
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

export async function connectVeilWallet(): Promise<{ wallet?: VeilWallet; address?: string; live: boolean; network?: VeilNetwork }> {
  const wallet = detectWallet();
  if (!wallet) return { live: false };
  await wallet.enable?.();
  const address = wallet.address ?? wallet.account?.address;
  return { wallet, address, live: Boolean(address), network: networkFromChainId(wallet.chainId) };
}

export async function submitShieldedRoute(wallet: VeilWallet, amountSmallestUnit: bigint, network: VeilNetwork = "mainnet", recipient?: string) {
  if (!wallet.strk20InvokeTransaction) throw new Error("This wallet does not expose the STRK20 privacy API yet.");
  assertWalletNetwork(wallet, network);
  const actions = [
    { type: "deposit", token: STRK_TOKEN, amount: num.toHex(amountSmallestUnit) },
    ...(recipient ? [{ type: "transfer", token: STRK_TOKEN, amount: num.toHex(amountSmallestUnit), recipient }] : []),
  ];
  return wallet.strk20InvokeTransaction(actions);
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
