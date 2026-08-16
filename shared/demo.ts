export const DEMO_TABS = [
  { id: "payroll", label: "PAYROLL" },
  { id: "operations", label: "OPERATIONS" },
  { id: "treasury", label: "TREASURY" },
  { id: "claims", label: "CLAIMS" },
  { id: "launchpad", label: "LAUNCHPAD" },
  { id: "proof", label: "PROOF" },
] as const;

export type DemoAction = "redeem-claim" | "approve-release" | "publish-proof";
export type DemoActionState = "ready" | "pending" | "success" | "error";
export type TestnetEvidenceState = "idle" | "writing" | "waiting" | "reading" | "verified" | "unknown" | "reconciling" | "accepted" | "failed";
export type TestnetEvidenceEvent = "start" | "submitted" | "confirmed" | "read" | "timeout" | "reconcile" | "accept" | "fail" | "reset";

export function nextDemoActionState(current: DemoActionState, event: "run" | "fail" | "retry") {
  if (event === "run") return "pending";
  if (event === "fail") return "error";
  if (event === "retry") return "success";
  return current;
}

export function nextDemoState(current: string, action: DemoAction) {
  if (action === "redeem-claim" && current === "UNREDEEMED") return "REDEEMED";
  if (action === "approve-release" && current === "PENDING") return "APPROVED";
  if (action === "publish-proof" && current === "READY") return "PUBLISHED";
  return current;
}

export function nextTestnetEvidenceState(current: TestnetEvidenceState, event: TestnetEvidenceEvent): TestnetEvidenceState {
  if (event === "reset") return "idle";
  if (event === "start" && current === "idle") return "writing";
  if (event === "submitted" && current === "writing") return "waiting";
  if (event === "confirmed" && current === "waiting") return "reading";
  if (event === "read" && current === "reading") return "verified";
  if (event === "timeout" && current === "waiting") return "unknown";
  if (event === "reconcile" && current === "unknown") return "reconciling";
  if (event === "accept" && current === "reconciling") return "accepted";
  if (event === "fail" && (current === "writing" || current === "waiting" || current === "reading" || current === "reconciling")) return "failed";
  return current;
}

export function testnetTranscript(state: TestnetEvidenceState, txHash = "0xsepolia-demo-verified"): string[] {
  const common = [
    "[testnet] network=Starknet Sepolia",
    "[write] namespace=veilpay-demo / payload=non-sensitive fixture",
    `[write] transaction=${txHash}`,
  ];
  if (state === "idle") return ["[ready] testnet round trip not started"];
  if (state === "writing") return [...common, "[write] status=SUBMITTING"];
  if (state === "waiting") return [...common, "[wait] status=PENDING / polling receipt"];
  if (state === "reading") return [...common, "[wait] status=ACCEPTED_ON_L2", "[read] signed recall request=SUBMITTED"];
  if (state === "verified" || state === "accepted") return [...common, "[wait] status=ACCEPTED_ON_L2", "[read] payload_match=true", "[integrity] sha256_match=true", `[final] ${state.toUpperCase()}`];
  if (state === "unknown") return [...common, "[wait] timeout_after_submission=true", "[final] UNKNOWN / reconciliation required"];
  if (state === "reconciling") return [...common, "[wait] timeout_after_submission=true", "[reconcile] idempotency_key=veilpay-demo-001", "[reconcile] duplicate_write=false"];
  return [...common, "[final] FAILED / no production data changed"];
}
