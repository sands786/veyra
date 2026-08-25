# Private Markets On-Chain Audit — 2026-08-25

## Current state

Veyra Private Markets is currently an authenticated SaaS coordination surface. Market metadata, lifecycle status, sealed-bid commitments, RFQ quotes, risk policies, alerts, and aggregate insights are persisted in the database through tRPC procedures. The current page explicitly states that market metadata and sealed-bid commitments do not move capital on-chain. No dedicated Private Markets Cairo contract exists in the repository; the only deployed contract artifact is the Launchpad milestone escrow.

## Existing entities

The `privateMarkets` table stores workspace, token, Mainnet network, target amount, aggregate volume, participant count, and an off-chain lifecycle (`draft`, `scheduled`, `live`, `reveal`, `settled`, `paused`, `closed`). `privateMarketBids` stores a commitment hash, optional encrypted terms, a bid amount, and an off-chain bid status. `privateMarketQuotes`, `privateMarketRiskPolicies`, and `privateMarketAlerts` are also database-backed coordination records. There are currently no market contract addresses, on-chain market IDs, transaction hashes, receipt statuses, or on-chain settlement references in the Private Markets schema.

## Wallet and privacy boundary

The existing wallet adapter supports verified Starknet Mainnet wallet connection and the official `wallet_strk20InvokeTransaction` boundary for STRK20 private actions. The Launchpad public escrow uses a separate standard invoke path. A Private Markets contract that directly receives public ERC-20 transfers would make the caller, token, and amount publicly observable. That can protect bid terms only if the terms are committed separately, but it does not provide anonymous market participation by itself.

Official Starknet Privacy documentation describes a separate protocol stack involving a privacy pool, SDK, proving service, discovery service, and proof facts supplied to the pool contract. The official repository also describes invoke anonymizers for external contracts. Therefore, Veyra must not claim that a newly written public escrow contract is a private STRK20 market unless a verified protocol-compatible private contract flow is integrated and independently tested.

## Recommended first contract scope

Implement a non-upgradable Mainnet market escrow for one verified token, with private bid terms represented by commitments and explicit public custody transitions. The contract should have bounded, auditable transitions such as create market, open market, commit bid, close bidding, accept allocation, and settle or refund. It should emit events and reject replayed IDs. The UI must label the first version as **private terms / public settlement** unless the official privacy-pool SDK and anonymizer path is integrated.

The database should remain coordination and indexing metadata only. Settlement labels must be driven by wallet transaction hashes and verified receipts, not optimistic tRPC status mutations. A deployment is not authorized until local Cairo tests, TypeScript calldata tests, and an owner-signed Mainnet lifecycle are complete.

## Sources

1. [Starknet Privacy overview](https://docs.starknet.io/build/starknet-privacy/overview) — official protocol components, private transfers, discovery, compliance, and deployed pool context.
2. [starkware-libs/starknet-privacy](https://github.com/starkware-libs/starknet-privacy) — official SDK/proving/discovery architecture and invoke anonymizer model.
