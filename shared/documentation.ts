export const documentationRoute = "/docs";
export const documentationTeaserAsset =
  "/manus-storage/veyra-30s-logo-led-stable-teaser_edb01985.mp4";

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
  {
    id: "payroll",
    title: "Private payroll",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/GfbevsiEakUtNZqa.mp4",
    duration: "24 sec",
    purpose:
      "Follow Veyra’s route builder from shielded roster through structured intent, proof ledger, wallet boundary, and private recipient controls.",
    boundary:
      "Persisted intent is not settled money; wallet approval and a confirmed receipt are still required.",
  },
  {
    id: "operations",
    title: "Operations",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/CxzytYWFPPVfzsSU.mp4",
    duration: "24 sec",
    purpose:
      "Scroll through the Veyra operations layer: proof ledger, receipt health, workspace activity, and deliberate recovery controls.",
    boundary:
      "Operations records are authenticated workspace state; no simulated action is mainnet evidence.",
  },
  {
    id: "treasury",
    title: "Treasury guardrails",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/YfhvwrpUnMfknBRx.mp4",
    duration: "24 sec",
    purpose:
      "Explore configurable Veyra risk limits, concentration policy, and pre-trade controls before capital reaches a signing boundary.",
    boundary:
      "A policy decision is not a wallet signature or transfer authorization.",
  },
  {
    id: "claims",
    title: "Private claims",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/eyPIkjcWlVBsAmmf.mp4",
    duration: "24 sec",
    purpose:
      "See the private-link pattern and selective disclosure studio without opening a public recipient directory.",
    boundary:
      "Links and previews remain unsigned until a connected wallet and confirmed receipt exist.",
  },
  {
    id: "launchpad",
    title: "Launchpad governance",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/truegBCfvtmsdfOE.mp4",
    duration: "24 sec",
    purpose:
      "Move from the Veyra launch thesis into private project-room controls for shielded allocations and milestones.",
    boundary:
      "Workspace governance records do not themselves release on-chain funds.",
  },
  {
    id: "proof",
    title: "Public proof",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/lABdaFuVUtCEefnC.mp4",
    duration: "24 sec",
    purpose:
      "Walk the proof ledger where aggregate verification replaces public participant and allocation data.",
    boundary:
      "A proof is receipt-gated and cannot publish raw recipient or allocation context.",
  },
  {
    id: "wallet",
    title: "Wallet and execution boundary",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/WBIKbJVxOiVNLraw.mp4",
    duration: "24 sec",
    purpose:
      "Focus on Veyra’s account-aware execution surface and the user-controlled wallet connection boundary.",
    boundary:
      "Veyra never creates a private key or represents a local action as a real transaction.",
  },
  {
    id: "errors",
    title: "Error and retry behavior",
    asset:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/uMfaCTpcJqZRBDFd.mp4",
    duration: "24 sec",
    purpose:
      "Review the documented recovery model, demo boundary, and operator guidance for deliberate workflow retries.",
    boundary:
      "Retry controls support workflow recovery; only verified receipts establish settlement.",
  },
] as const;
