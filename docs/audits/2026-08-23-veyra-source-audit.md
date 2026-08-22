# Veyra Source Audit — 23 August 2026

## Scope and posture

This audit covered the Veyra React/Vite client, Express/tRPC server, Drizzle schema and migration metadata, shared state-machine helpers, local authentication, wallet adapter, public proof and claim boundaries, tests, deployment configuration, and production dependency graph. The product posture reviewed here is **Starknet mainnet only**, with Veyra-owned email/password authentication and server-enforced workspace authorization.

The audit was performed against application-controlled source. It does not claim that external Vercel account configuration, Starknet contract deployment, wallet ownership, or user-supplied mainnet transaction evidence has been completed.

## Verified fixes in this pass

| Finding | Risk | Resolution | Evidence |
|---|---:|---|---|
| Wallet execution was fail-open when a wallet did not report a recognized chain ID. | High integrity risk | `assertWalletNetwork`, `onchainCapability`, and execution gating now require a recognized Starknet mainnet chain ID. Unknown chain identity is rejected. | Wallet unit coverage and `performance-optimization.test.ts` regression |
| Retired Manus bearer-token forwarding remained in the client after local-auth migration. | Medium security hygiene risk | Removed `sessionStorage` token extraction and `Authorization` forwarding. Requests now use the Veyra HttpOnly session cookie and optional workspace-selection header only. | `client/src/main.tsx`; local-auth server accepts only the Veyra cookie |
| Private-market persistence still allowed Sepolia in the schema despite mainnet-only routers and UI. | Medium policy/integrity risk | Tightened `privateMarkets.network` to `enum('mainnet')`, applied migration `drizzle/0018_flashy_random.sql`, and narrowed the creation helper. Existing database inspection found one market and it was already mainnet. | Applied SQL migration; mainnet-only regression coverage |
| Private Markets still displayed stale `testnet/mainnet` execution copy. | Low-to-medium product-integrity risk | Replaced with explicit Starknet mainnet wording and added regression coverage. | `server/mainnet-only.test.ts` |
| Dormant client Sepolia wallet/config branches remained callable by typed client code. | Medium posture ambiguity | Narrowed the client `VeilNetwork` and contract-environment selection to mainnet, removed the Sepolia wallet/config branches, and updated fixtures. | `client/src/lib/strk20.ts`, `onchainConfig.ts`, and related tests |

## Verification results

| Check | Result |
|---|---:|
| Vitest | **103 tests passed across 29 files** |
| TypeScript | **Passed with no errors** |
| Production build | **Passed**; Vite client and Express server bundle generated |
| Production dependency audit | **No known vulnerabilities found** at the configured high-severity threshold |
| Database migration | **Applied successfully**; no existing private-market Sepolia rows were present |
| Runtime smoke checks | Main workspace, sign-in, and private-markets routes rendered successfully at desktop viewport |
| Unsafe HTML/eval scan | No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, or `document.write` matches in application source |
| Secret-like literal scan | No suspicious hardcoded credential literals were identified by the repository scan |

The remaining build warning concerns a client chunk larger than 500 kB. The initial client bundle remains approximately 823 kB after route splitting and removal of the heavy Starknet SDK from the initial path; this is a performance optimization opportunity, not a correctness failure.

## Explicitly not complete

Two application-owned integrity tasks remain open and should not be described as complete:

1. **Payment-route editing atomicity.** The edit path still requires a dedicated transaction-safe refactor so route metadata, allocation replacement, and audit-event creation share one database transaction.
2. **Blockchain transaction lifecycle atomicity.** Recording or confirming a blockchain receipt and advancing the payment-route lifecycle still require a shared transaction boundary. The current implementation has receipt-backed verification and idempotency, but the complete cross-table lifecycle transition is not yet proven atomic.

The stale external Vercel deployment and callback/origin configuration also remain outside the repository’s control. The current code uses Veyra-owned authentication and does not depend on the retired Manus OAuth callback path.

## Conclusion

The audited release is in a substantially stronger state: the client and server mainnet posture is stricter, unknown wallet networks fail closed, stale bearer forwarding is removed, private-market persistence now matches the declared network policy, public proof creation remains receipt-backed, claim redemption remains expiry-aware and race-safe, and the complete automated verification suite is green. The release should be treated as **audit-verified with two explicitly tracked atomicity gaps**, not as an assertion that every lifecycle operation is already institutionally atomic.
