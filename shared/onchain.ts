export type OnchainSurface = "payroll" | "treasury" | "claims" | "launchpad" | "markets" | "proof";
export type OnchainLifecycle = "draft" | "intent_ready" | "awaiting_signature" | "submitted" | "confirming" | "confirmed" | "reverted" | "unknown";
export type OnchainNetwork = "mainnet" | "sepolia";

export type OnchainBoundary = {
  surface: OnchainSurface;
  network: OnchainNetwork;
  lifecycle: OnchainLifecycle;
  transactionHash?: string;
  explorerUrl?: string;
  contractAddress?: string;
  requiresWallet: boolean;
  isProtocolFinal: boolean;
};

export const ONCHAIN_LIFECYCLE_LABELS: Record<OnchainLifecycle, string> = {
  draft: "DRAFT",
  intent_ready: "INTENT READY",
  awaiting_signature: "AWAITING SIGNATURE",
  submitted: "SUBMITTED",
  confirming: "CONFIRMING",
  confirmed: "CONFIRMED",
  reverted: "REVERTED",
  unknown: "UNKNOWN",
};

export function isTerminalOnchainLifecycle(lifecycle: OnchainLifecycle): boolean {
  return ["confirmed", "reverted"].includes(lifecycle);
}

export function canPublishOnchainProof(boundary: OnchainBoundary): boolean {
  return boundary.isProtocolFinal && boundary.lifecycle === "confirmed" && Boolean(boundary.transactionHash);
}

export function boundaryForPersistedIntent(surface: OnchainSurface, network: OnchainNetwork): OnchainBoundary {
  return { surface, network, lifecycle: "intent_ready", requiresWallet: true, isProtocolFinal: false };
}
