# Veyra Audit Findings

## Completed fixes

The transaction submission boundary now accepts only `submitted`; client input can no longer mark a transaction `confirmed`, `reverted`, or `unknown`. Confirmation remains verifier-backed through `verifyWorkspaceStarknetReceipt` before lifecycle mutation.

Market-utilization alert thresholds now use BigInt-backed decimal comparisons (`compareDecimalTimesInteger`). Approximate numeric conversion is retained only for the human-readable percentage string.

The tRPC workspace header now uses `safeLocalStorageGet` rather than direct browser storage access, preserving the restricted-browser-safe boundary.

Payroll schedule updates now perform the database update, audit event, and response read within one transaction with an affected-row guard.

## Verification observations

A fresh production build succeeds. The full Vitest suite succeeds with 37 test files and 136 tests. TypeScript succeeds with no errors. `git diff --check` succeeds, and the production dependency audit reports no known vulnerabilities.

Desktop and mobile screenshots for `/`, `/launchpad`, `/private-markets`, and `/sign-in` render with a stable dark Copper Veil canvas, mainnet-only labels, responsive navigation, and no observed white transition flash. The Demo Mode pill intentionally occupies the lower viewport edge and remains visible on mobile.

## Remaining warnings and prerequisites

Drizzle historical snapshot JSON files retain legacy `enum('mainnet','sepolia')` text as migration-history metadata; active `drizzle/schema.ts` and migration SQL contain only `mainnet`.

The browser baseline mapping package emits an informational stale-data warning during dev preview. Production build emits a bundle-size optimization warning for the main JavaScript chunk; it does not fail the build.

User-owned hackathon evidence remains outstanding: real wallet connection, real mainnet transaction hashes, public repository publication, and final demo submission.
