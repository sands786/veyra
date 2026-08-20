# Veyra Reviewer Guide

> **The fastest honest way to evaluate Veyra:** watch the thesis, touch the operating surface, inspect the boundary, then follow the evidence into code.

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/LloNuaWHMMXnVtug.svg" width="100%" alt="Veyra 90-second reviewer path" />
</p>

## The 90-second path

|      Time | Open                                                                                                                      | Verify                                                                                                        |
| --------: | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **00:00** | [30-second teaser](https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/UWySWLIQYVhglQGv.mp4) | The product thesis: a private operating record should not become a public roster.                             |
| **00:30** | [Live workspace](https://veilpay-spri-t4knu9mv.manus.space)                                                               | Route creation is persisted intent; the wallet and receipt states are visibly distinct.                       |
| **01:00** | [Architecture](ARCHITECTURE.md) and [Trust Model](THREAT_MODEL.md)                                                        | Read exactly where identity, workspace data, wallet approval, RPC confirmation, and public proof sit.         |
| **01:30** | [`server/db.ts`](../server/db.ts) and tests                                                                               | Confirm proof gating, receipt verification, approval threshold, risk-policy, and lifecycle enforcement paths. |

## Reviewer tasks

### 1. Try to find a fake settlement claim

Start on the workspace route flow. Veyra presents **persisted**, **unsigned**, **wallet pending**, **submitted**, **confirmed**, **reverted**, and **unknown** as different product states. A saved route is not described as a transfer. A transaction hash is not described as final. A public proof cannot be created until the route is settled.

The relevant proof gate is [`createShareableProof`](../server/db.ts); the route must satisfy `canPublishShareableProof(route.status)`, which accepts only `settled`.

### 2. Try to cross a workspace boundary

The application resolves authenticated workspace membership before protected procedures access routes, recipients, policies, claims, markets, or audits. The database helpers carry workspace predicates as a second ownership check. Review the route and market procedures in [`server/routers.ts`](../server/routers.ts) and their helper implementations in [`server/db.ts`](../server/db.ts).

### 3. Try to settle a market incorrectly

The Private Markets lifecycle rejects invalid transitions. Settlement requires at least one accepted allocation; sealed bids are accepted only while a market is live and within its deadline; bid limits, concentration rules, and target capacity are evaluated before persistence. Inspect [`shared/operations.ts`](../shared/operations.ts) and `commitPrivateMarketBid` / `updatePrivateMarketStatus` in [`server/db.ts`](../server/db.ts).

### 4. Verify the evidence instead of accepting copy

```bash
pnpm install
pnpm test
pnpm build
```

The current suite has **14 Vitest files / 64 tests**. It covers core operations, workspace isolation and resolution, protected flows, Demo Mode, documentation registry, launchpad behavior, STRK20 helpers, private primitives, route editing, and client utilities.

## Review boundaries

| Claim                               | Evidence present in this repository                                                                             | Boundary that remains owner-operated                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Full-stack coordination application | React/Vite client, Express/tRPC API, Drizzle schema, database helpers, authenticated workspace flow.            | Production database configuration and operational monitoring.                     |
| Wallet-aware Starknet flow          | Starknet wallet discovery, network state, wallet-owned action boundary, transaction reference and receipt flow. | User signs a real wallet transaction.                                             |
| Receipt-backed proof gate           | RPC receipt verifier and settled-route proof guard.                                                             | A real public transaction hash must exist before a real receipt can be confirmed. |
| Cairo registry                      | Cairo source, tests, build path, non-custodial commitment semantics.                                            | Fund-moving STRK20 semantics, testnet deployment, audit, and any mainnet release. |
| Documentation and product film      | Stable teaser, stable walkthrough, in-app guide library, architecture, operations, threat model, decision log.  | Reviewer judgment.                                                                |

For the complete evidence posture, read [Operations and Verification](OPERATIONS.md). For release requirements that must not be fabricated, read [`HACKATHON_EVIDENCE.md`](../HACKATHON_EVIDENCE.md).
