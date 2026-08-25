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

## Verified Mainnet evidence

The contract class was declared with class hash `0x038b051114f7827ffba57a71cc39a91fc22737ca19b0bd11cf755688dd0a8ca9`; the declaration transaction `0x10b33cb550ec31f37e61a87bff587925ea96fbb1a6d5223fa27fa94aba406a6` was accepted on L2 and succeeded. The deployed contract is `0x05476ca7064583238f3e82a6815a7f662b14228e1fb585d480838a282b9d7cf2`, deployed by transaction `0x018ae7706c51ea0987f1e04c85a5778b2ff19b85a574fcf038dd09db8c4a781c`, also accepted on L2 and succeeded.

A complete market acceptance path was then executed with market ID `1` and bid ID `1`: create `0x01d9c3a39754beeb9f9b320d721678b94a0471bdd4c53684a6544cbb057f3bfa`, open `0x0461a9bac1c42cc3b7d42c8569d25c4d3dedc58fc99f3168f4d888937c278f03`, STRK approval `0x024f30dde491a6167ff66e4c55dbe31b1fba7e3c7671af25805f81090dabe77a`, commit bid `0x0273c1a65199ba16ff0992069b751849fcb47ac13cd7a1a736251ea9ce7cc881`, close `0x03a95eb41459e79e9016f71c3bb6e1dfb1cbec72e6342d9a67c3275f4e5913c6`, accept `0x0012be49f9c13f63ffba3baae9eed3f5415331ce485f2fcc97e3a1cb1eb34d86`, and settle `0x06e00858408afcc1aa3ec84e7517d92f8a15231131150f21327d15803e0dae93`. Every transaction was reported as accepted on L2 with succeeded execution.

Final read-only state checks returned market state `3_u8` (`SETTLED`), bid state `2_u8` (`SETTLED`), and committed balance `0_u256`. The evidence proves public-token custody and settlement for one Mainnet test path. It does not prove anonymous participant settlement or privacy-pool integration.

## Remaining product evidence gap

The current browser panel constructs and submits the audited wallet calls and displays returned transaction hashes, but it does not yet poll a configured Mainnet RPC and independently display receipt finality and contract state. Until that is added, the UI should continue to describe the hash as submitted and require external receipt verification; the CLI evidence above is the verified source of truth.
