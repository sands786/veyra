export const privatePrimitiveIds = ["links", "proofs", "milestones"] as const;
export type PrivatePrimitiveId = (typeof privatePrimitiveIds)[number];

export const privatePrimitiveLabels: Record<PrivatePrimitiveId, string> = {
  links: "PRIVATE LINKS",
  proofs: "SELECTIVE PROOF",
  milestones: "MILESTONE RELEASES",
};

export const milestoneSteps = ["PREPARE", "FUND", "EVIDENCE", "RESOLVE"] as const;

export const privateClaimDemoPath = "/claim/veilpay-private-request-demo";

export function privatePrimitiveEvidenceNote(network: "sepolia" | "mainnet") {
  return network === "sepolia"
    ? "Testnet evidence only; no mainnet proof."
    : "Mainnet evidence requires explicit wallet approval.";
}
