// Copper Veil style reminder: integration states must be explicit; demo mode never pretends a mainnet transaction happened.
import { num } from "starknet";

export const STRK_TOKEN = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const MAINNET_CHAIN_ID = "0x534e5f4d41494e";

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

export async function connectVeilWallet(): Promise<{ wallet?: VeilWallet; address?: string; live: boolean }> {
  const wallet = detectWallet();
  if (!wallet) return { live: false };
  await wallet.enable?.();
  const address = wallet.address ?? wallet.account?.address;
  return { wallet, address, live: Boolean(address) };
}

export async function submitShieldedRoute(wallet: VeilWallet, amountSmallestUnit: bigint, recipient?: string) {
  if (!wallet.strk20InvokeTransaction) throw new Error("This wallet does not expose the STRK20 privacy API yet.");
  const actions = [
    { type: "deposit", token: STRK_TOKEN, amount: num.toHex(amountSmallestUnit) },
    ...(recipient ? [{ type: "transfer", token: STRK_TOKEN, amount: num.toHex(amountSmallestUnit), recipient }] : []),
  ];
  return wallet.strk20InvokeTransaction(actions);
}

export function explorerUrl(txHash: string, chainId?: string) {
  const isMainnet = chainId === MAINNET_CHAIN_ID || !chainId;
  return `${isMainnet ? "https://voyager.online" : "https://sepolia.voyager.online"}/tx/${txHash}`;
}
