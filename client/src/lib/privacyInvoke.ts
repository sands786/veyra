import type { OnchainAction, VeilWallet } from "./strk20";

export type PrivacyInvokeRequest = {
  type: "wallet_strk20InvokeTransaction";
  params: { actions: OnchainAction[] };
};

function transactionHashFromResponse(value: unknown): string {
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

/**
 * Build the official STRK20 wallet-api request without touching keys,
 * constructing proofs, or falling back to a public invoke transaction.
 */
export function buildPrivacyInvokeRequest(
  actions: readonly OnchainAction[]
): PrivacyInvokeRequest {
  if (!actions.length) {
    throw new Error("At least one STRK20 privacy action is required.");
  }

  return {
    type: "wallet_strk20InvokeTransaction",
    params: {
      actions: actions.map(action => ({ ...action })),
    },
  };
}

/**
 * Submit a prepared STRK20 action through the connected wallet. The wallet
 * remains responsible for registration, proof generation, approval, and
 * signing; Veyra receives only the public transaction hash.
 */
export async function submitPrivacyInvoke(
  wallet: VeilWallet,
  actions: readonly OnchainAction[]
): Promise<{ transaction_hash: string }> {
  if (wallet.strk20InvokeTransaction) {
    const response = await wallet.strk20InvokeTransaction([...actions]);
    return { transaction_hash: transactionHashFromResponse(response) };
  }

  if (!wallet.request) {
    throw new Error("This wallet does not expose the STRK20 wallet API.");
  }

  const response = await wallet.request(
    buildPrivacyInvokeRequest(actions) as {
      type: string;
      params?: Record<string, unknown>;
    }
  );
  return { transaction_hash: transactionHashFromResponse(response) };
}
