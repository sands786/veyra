# Veyra Launchpad Escrow — audit-scoped contract draft

This package contains the first proposed on-chain settlement layer for Veyra Launchpad. It is intentionally separate from the existing payroll commitment registry. The design is a non-upgradable, single-token milestone escrow: a creator creates and activates a project, investors deposit the configured token, the creator reserves beneficiary allocations, the creator approves a milestone for an allocation, and the creator releases that allocation to the stored beneficiary. Investors can refund their own deposits only before any allocation is reserved.

## Important status

This contract is **not deployed, not audited, and not yet accepted as production settlement infrastructure**. The repository currently has no local Scarb compiler available in the build environment, and no Mainnet contract address or owner-operated lifecycle receipt has been supplied. The Launchpad UI must therefore continue to describe the current product as coordination until the contract compiles, receives review, is deployed from a user-controlled wallet, and completes an independently verified Mainnet lifecycle.

## Security boundary

The contract has no upgrade entrypoint and no owner withdrawal entrypoint. Token movement is limited to `transfer_from` during an investor deposit and `transfer` during an investor refund or an approved milestone release. Every release is replay-protected by the stored milestone and allocation states. The creator is the only account allowed to activate a project, reserve an allocation, approve a milestone, or release an approved milestone.

This is deliberately a narrow first version. It does not implement multi-signature governance, dispute arbitration, time locks, emergency pause, vesting, token allowlists beyond the constructor token, or a private STRK20 escrow flow. Those features must not be implied by this draft. The contract also does not prove off-chain milestone evidence; the UI and server may coordinate evidence, but the contract only enforces the signed state transition that releases the configured token.

## Required gates before production

| Gate | Required evidence |
| --- | --- |
| Cairo compilation | Reproducible Scarb build using the pinned Starknet and test dependencies. |
| Contract tests | Positive and negative tests for creator authorization, double allocation, insufficient escrow, refund locking, release replay, and token-transfer failure. |
| Review | Independent review of Cairo storage, dispatcher interfaces, arithmetic, event semantics, and economic edge cases. |
| Deployment | User-controlled Mainnet wallet signs declaration, deployment, and constructor initialization for a verified token. |
| Integration | Veyra stores the contract address and network explicitly; no guessed or user-supplied unverified address is accepted. |
| Lifecycle proof | Mainnet receipts independently confirm create, activate, deposit, allocation/milestone approval, release, and beneficiary receipt. |

Until all gates pass, the contract remains an implementation candidate and the Launchpad remains a database-backed coordination workflow with a planned on-chain settlement layer.
