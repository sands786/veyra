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
