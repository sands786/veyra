# VeilPay real SaaS boundary

VeilPay’s production workspace is full-stack. Authenticated workspace access, role checks, database persistence, tRPC procedures, audit events, route creation, recipient management, approvals, schedules, treasury policies, claims, public proofs, Launchpad projects, milestones, release requests, allocation commitments, and network-aware transaction records are implemented as real server-backed workflows.

The `/private-primitives` workspace now uses the existing authenticated backend procedures rather than local-only action state. Private payment requests call `claims.create` and persist expiring claim links. Selective proof summaries call `proofs.create` and expose the existing privacy-safe public proof route. Milestone release actions call `launchpad.updateMilestoneStatus` and refresh persisted project state.

Demo Mode remains intentionally local and reversible. It exists to demonstrate interaction states without requiring authentication or a wallet; it must not be described as proof of a live transaction.

The Starknet execution boundary is explicit. Testnet and mainnet selection, chain mismatch protection, wallet connection, transaction submission hooks, explorer URL generation, receipt confirmation, and network-aware transaction records are implemented. A live STRK20 privacy settlement still requires a compatible wallet/API implementation, deployed contract/SDK configuration, wallet approval, and a real transaction hash. No simulated receipt or local demo state is treated as mainnet evidence.

## Verification

The current implementation has been verified with 46 Vitest tests, TypeScript, a production build, and responsive desktop/mobile visual QA. Real mainnet evidence remains user-owned because it requires signing from the user’s wallet.

## Private Markets

The `/private-markets` workspace adds a persisted market terminal inspired by private identity/public market design. Workspace operators can create and open a market with a selected Starknet network. Authenticated members can commit sealed bids. The database stores the bidder identity and bid amount behind workspace authorization, while the market projection exposes only aggregate public volume and participant count.

The current feature is a real persisted market and commitment workflow, not an order-matching engine. Price discovery, bid reveal/selection, and live settlement are deliberately not inferred from a commitment. Those capabilities require an explicit matching policy and deployed privacy-capable contract/SDK integration before they can be represented as live onchain behavior.
