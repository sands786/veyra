export const documentationRoute = "/docs";
export const documentationTeaserAsset = "/manus-storage/veilpay-coming-soon-teaser-with-music_a6a5969d.mp4";

export const documentationChapters = [
  "overview",
  "why",
  "product",
  "privacy",
  "starknet",
  "demo",
] as const;

export const documentationProductSurfaces = [
  "Private payroll",
  "Operations + treasury",
  "Private claims",
  "Launchpad governance",
] as const;

export type DocumentationChapter = (typeof documentationChapters)[number];

export const documentationVideoGuides = [
  { id: "payroll", title: "Private payroll", asset: "/manus-storage/veilpay-payroll_588f5274.mp4", duration: "28 sec", purpose: "Build a private route from a roster, edit the route, advance its status, and confirm a simulated receipt.", boundary: "Recipient identity and amount context stay workspace-scoped; a real receipt still requires wallet approval." },
  { id: "operations", title: "Operations", asset: "/manus-storage/veilpay-operations_b0575c52.mp4", duration: "28 sec", purpose: "Coordinate schedules, governance decisions, monitoring, and retryable operational actions.", boundary: "Demo actions are local and reversible; production scheduling requires an authenticated workspace." },
  { id: "treasury", title: "Treasury guardrails", asset: "/manus-storage/veilpay-treasury_053d7e7c.mp4", duration: "20 sec", purpose: "Run policy dry-runs against limits, networks, and approval thresholds before execution.", boundary: "A passed dry-run is not a transfer or a mainnet authorization." },
  { id: "claims", title: "Private claims", asset: "/manus-storage/veilpay-private-claims_3c80740e.mp4", duration: "20 sec", purpose: "Redeem a private claim link without turning the recipient roster into public data.", boundary: "Claim state is simulated here; production redemption must be authenticated and wallet-aware." },
  { id: "launchpad", title: "Launchpad governance", asset: "/manus-storage/veilpay-launchpad_510ad29b.mp4", duration: "27 sec", purpose: "Move through project rooms, readiness, shielded allocations, milestones, and governed release.", boundary: "Project operations are persisted in the workspace; final settlement remains a separate Starknet execution step." },
  { id: "proof", title: "Public proof", asset: "/manus-storage/veilpay-proof_2c6bb941.mp4", duration: "18 sec", purpose: "Publish aggregate verification while keeping identity and allocation context private.", boundary: "Proof references communicate aggregate state; they do not reveal the private roster." },
  { id: "wallet", title: "Wallet and execution boundary", asset: "/manus-storage/veilpay-wallet-boundary_ba03409d.mp4", duration: "20 sec", purpose: "Understand the path from operator intent to wallet approval, receipt, and public proof.", boundary: "Demo Mode never creates a private key or a real Starknet transaction." },
  { id: "errors", title: "Error and retry behavior", asset: "/manus-storage/veilpay-demo-errors-retry_68ed2daf.mp4", duration: "20 sec", purpose: "See how simulated failures are surfaced, retried, and reset without corrupting local state.", boundary: "Failure controls are designed for exploration and QA, not as evidence of production settlement." },
] as const;
