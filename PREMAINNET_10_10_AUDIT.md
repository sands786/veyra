# Veyra Pre-Mainnet 10/10 Audit

## Scope

This audit evaluates Veyra as a privacy-finance SaaS and Starknet protocol candidate before user-owned wallet transactions. It distinguishes verified code behavior from deployment evidence that must come from the user’s signed wallet.

## Verified product surface

| Area | Verified evidence | Boundary |
|---|---|---|
| Payroll | Authenticated route creation, recipient scoping, privacy-safe persistence, typed STRK20 actions, receipt recording, Explorer links, optional payroll-registry call | Live settlement requires a compatible privacy wallet and user approval |
| Treasury | Workspace policies, limits, approvals, dry-run guardrails, network constraints, and role enforcement | Live treasury custody and contract execution require deployed audited contracts |
| Claims | Expiring private links, redemption persistence, route-recipient fulfillment, and privacy-safe projections | Payout requires a real wallet and configured settlement path |
| Proof | Public metadata projection, selective disclosure boundary, receipt verification, and proof gating | A public proof record is not automatically a ZK proof |
| Launchpad | Projects, milestones, allocations, governance, readiness, release requests, and privacy-safe summaries | Escrow, token distribution, and milestone release need deployed contracts |
| Private Markets | Private trader identity, public aggregates, sealed commitments, market scoping, and network-aware records | Matching, reveal, and settlement remain contract/wallet gated |
| Demo Mode | Deterministic local rehearsal with explicit simulation-only labeling and retry states | Never treated as chain evidence |
| Network safety | Persisted Mainnet/Sepolia selection, wallet reset on switch, network-aware explorer routing, and contract readiness registry | Real deployment addresses must be supplied after user deployment |

## Security and privacy checks

The server never receives private keys, seed phrases, viewing keys, or wallet signing authority. Backend mutations enforce authentication, workspace membership, role checks, ownership, validation, and idempotency. Public proof projections exclude private rosters, encrypted references, claimed wallet addresses, and plaintext sensitive notes. Contract calldata builders reject malformed addresses, zero amounts, and missing commitments.

## On-chain package

`contracts/veyra_payroll` contains a Scarb project for `VeyraPayrollRegistry`. It compiles with Scarb 2.20.0 and passes a Starknet Foundry deployment test. The registry is intentionally non-custodial: it records private recipient and settlement commitments and does not hold tokens. The package includes generated Sierra/ABI artifacts, a README, and a Sepolia helper that stops for user-controlled signing.

## Verification record

The web application passes **56 Vitest tests**, TypeScript checking, the production build, and responsive visual QA. The Cairo registry passes **one Foundry deployment test** and compiles successfully. The production build reports only the existing bundle-size advisory; no type or compilation errors remain.

## Evidence still owned by the user

A 10/10 implementation cannot manufacture the following: a public repository, registry pull request, deployed Sepolia/mainnet addresses, successful mainnet transactions touching the live STRK20 pool, a public demo video, Telegram contact details, or a payout address. Those artifacts must be created through the user’s own authenticated accounts and wallet approvals. Until then, Veyra is **pre-mainnet contract-ready**, not mainnet-proven.
