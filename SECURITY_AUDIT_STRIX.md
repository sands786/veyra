# Veyra Security and Quality Audit

**Audit basis.** This review used the open-source Strix repository as a methodology reference for scope control, authorization-aware analysis, reproducible local checks, and explicit separation between evidence and inference [1]. The review was performed against Veyra source code and local verification only. No unauthorized third-party target was probed.

## Scope and verification

| Area | Result |
|---|---|
| Workspace authorization and role gates | Reviewed across tRPC procedures and database helpers; workspace-scoped reads and writes were preserved. |
| Privacy projections | Reviewed public claims, proofs, Launchpad summaries, market aggregates, and bidder identity handling. |
| Transaction integrity | Reviewed route ownership, network binding, transaction-hash reuse, receipt verification, and route settlement transitions. |
| Private Markets | Reviewed market lifecycle, sealed-bid persistence, aggregate arithmetic, and cross-market commitment reuse. |
| Dependencies and repository hygiene | Frozen-lockfile install succeeded; no tracked environment or credential files were found. `pnpm audit --prod` reported advisories, but no actionable high/critical package entry was emitted by the installed audit report. |
| Regression verification | 49 Vitest tests passed; TypeScript passed; production build passed; desktop visual smoke checks passed for `/` and `/private-markets`. |

## Confirmed defects fixed

### 1. Cross-market sealed-bid commitment collision

A sealed-bid commitment hash was treated as idempotent based on the hash alone. Reusing the same hash in another market could return the prior bid-shaped result instead of rejecting the cross-market collision. The fix now permits idempotent reuse only when both the market ID and commitment hash match. Cross-market reuse raises an explicit error.

### 2. Public proof creation before route settlement

The proof creation helper did not require a route to be settled before generating a public proof link. That allowed draft, routed, or failed route metadata to be exposed through a shareable proof surface. The fix requires the route status to be `settled` before a proof can be created. Existing privacy-safe public projection behavior remains unchanged.

### 3. Cross-project Launchpad allocation commitment collision

Launchpad allocation idempotency was based on the commitment string without requiring the same project. The fix now scopes idempotent reuse to the same project and commitment; reuse across projects is rejected.

### 4. Transaction hash and network binding

Transaction recording accepted a network value without verifying it matched the owned payment route. Existing transaction hashes could also be returned without checking route and network identity. The fix binds a submission to the route network, rejects cross-route or cross-network hash reuse, and keeps confirmation updates scoped to the verified transaction record.

### 5. Receipt verification chain selection

Receipt verification previously used one RPC URL regardless of the selected network. The fix selects Sepolia or mainnet RPC configuration based on the stored transaction network and verifies the transaction within the authenticated workspace before applying settlement status.

## Regression coverage

New shared business-rule tests cover same-market sealed-bid idempotency, settled-only public proofs, and same-project Launchpad allocation idempotency. The full suite passes with **49 tests**.

## Remaining limitations

This audit does not claim that a live STRK20 privacy contract has been deployed, that a wallet has signed a transaction, or that mainnet settlement has been proven. Demo Mode remains an intentional local simulation layer. The application now has real persisted business workflows and network-aware transaction safeguards, but user-owned wallet approval and authentic testnet/mainnet transaction hashes remain separate evidence requirements.

The production build still emits a bundle-size advisory for the main JavaScript chunk. It is a performance optimization opportunity, not a security defect, and no behavior was changed solely to silence the warning.

## References

[1]: https://github.com/usestrix/strix "Strix open-source AI penetration testing tool"
