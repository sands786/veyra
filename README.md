<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/nGZKwALPBnNMrEdQ.svg" width="720" alt="Veyra — Private Financial Coordination" />
</p>

<p align="center">
  <strong>Private financial coordination for teams operating on Starknet.</strong><br />
  <sub>PREPARE INTENT · AUTHORIZE WITH A WALLET · VERIFY A RECEIPT · REVEAL ONLY THE PROOF</sub>
</p>

<p align="center">
  <a href="https://veilpay-spri-t4knu9mv.manus.space">Live workspace</a> ·
  <a href="docs/REVIEWER_GUIDE.md">90-second reviewer path</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a> ·
  <a href="docs/THREAT_MODEL.md">Threat model</a> ·
  <a href="docs/DECISIONS.md">Decision record</a> ·
  <a href="#film-library">Film library</a>
</p>

---

## The reviewer promise

> **In ninety seconds, you should know what Veyra does, where privacy lives, who can authorize a state change, what proves settlement, and what remains deliberately unfinished.**

Veyra is an institutional operating layer for private financial coordination. It turns a team’s private operating record—payroll roster, approvals, policies, claims, allocations, bids, and milestones—into a controlled sequence that stops at the wallet boundary. Only a user-owned Starknet wallet can authorize a transaction. Only a verified receipt can settle a route. Only a settled route can issue a constrained proof.

```text
PERSISTED INTENT  →  WALLET AUTHORIZATION  →  SUBMITTED TRANSACTION  →  CONFIRMED RECEIPT  →  SELECTIVE PROOF
```

This repository is designed to make that sequence inspectable. It is not a landing page with a backend attached; it is a full-stack product, a proof-boundary model, a Cairo commitment package, a test suite, an operations guide, and a transparent record of what still requires a real owner-operated mainnet release.

---

## The 90-second path

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/LloNuaWHMMXnVtug.svg" width="100%" alt="Veyra 90-second reviewer path" />
</p>

|      Time | Do this                                                                                                                             | What it demonstrates                                                                                                       |
| --------: | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **00:00** | [Watch the cinematic teaser](https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/UWySWLIQYVhglQGv.mp4) | The core thesis: a private roster must not become a public payment record.                                                 |
| **00:30** | [Open the live workspace](https://veilpay-spri-t4knu9mv.manus.space)                                                                | Routes, roles, operations, wallet state, proof ledger, Launchpad, and Private Markets are product surfaces—not mock cards. |
| **01:00** | [Read the architecture](docs/ARCHITECTURE.md)                                                                                       | The browser, OAuth, API, database, wallet, RPC provider, and Cairo registry sit in distinct trust domains.                 |
| **01:30** | [Verify the evidence](docs/REVIEWER_GUIDE.md)                                                                                       | Follow the exact code paths for receipt verification, proof gating, risk enforcement, and the 64-test suite.               |

---

## Film library

### Film 01 — The thesis

<video controls preload="metadata" width="100%" poster="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/eeAuPiqfhiOlCqpM.png">
  <source src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/UWySWLIQYVhglQGv.mp4" type="video/mp4" />
  Your browser does not support embedded video playback.
</video>

The stable 30-second teaser establishes Veyra’s visual system and its private-to-proof operating principle.

### Film 00 — The operating model

<video controls preload="metadata" width="100%" poster="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/QrIoqSGetmaJtKjn.png">
  <source src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/veJaWSgpcQWfhFVT.mp4" type="video/mp4" />
  Your browser does not support embedded video playback.
</video>

The 3:10 product walkthrough traces private routes, wallet/receipt boundaries, claims, governance, Private Markets, and the documentation library without presenting Demo Mode as chain evidence.

---

## What the system is built to protect

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/NFJmfbsJfkWzNKUg.svg" width="100%" alt="Veyra privacy trust map" />
</p>

### Four non-negotiable invariants

| Invariant                                       | Why it matters                                                                                  | Code-backed behavior                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **The wallet signs; Veyra coordinates.**        | A workspace tool must not quietly become a key custodian.                                       | No seed phrase, private key, recovery phrase, or keystore is accepted or stored.                       |
| **A hash is not a receipt.**                    | A submitted transaction can remain pending, fail, revert, or target the wrong network.          | Receipt lookup classifies `confirmed`, `reverted`, or `unknown`; no local hash is treated as finality. |
| **A proof is smaller than the private record.** | Public verification should not reopen a private roster or sealed bid book.                      | Proof creation is settled-route gated and the public query returns a constrained summary.              |
| **Policy must run on the server.**              | A decorative warning can be bypassed; an enforced rule cannot be skipped through a client call. | Role, approval, treasury, lifecycle, and bid-risk checks execute in tRPC/database paths.               |

Read the complete [Threat Model and Security Posture](docs/THREAT_MODEL.md) for assets, attack scenarios, controls, residual risk, and explicit non-goals.

---

## Visual architecture

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/HxKPSdnGRrcrWpBM.svg" width="100%" alt="Veyra system architecture" />
</p>

| Domain                   | Purpose                                                                                                     | Trust boundary                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **React + Vite client**  | Workspace UI, route composition, wallet state, documentation, public proof/claim views.                     | The client is never the authorization authority.                                           |
| **Express + tRPC API**   | Typed procedures, membership/role checks, lifecycle controls, audit records, receipt lookup.                | Server resolves user + workspace; protected actions do not trust client-supplied identity. |
| **MySQL/TiDB + Drizzle** | Workspace coordination state: routes, recipients, policies, claims, markets, audit, transaction references. | Workspace predicates constrain records; secrets are out of scope.                          |
| **Starknet wallet**      | Account, network, user review, signature, and submission.                                                   | User-controlled signing authority.                                                         |
| **Starknet RPC**         | Public receipt execution and finality lookup.                                                               | Receipt is a verification input, not a signing mechanism.                                  |
| **Cairo registry**       | Non-custodial route and settlement commitment records.                                                      | No token custody or transfer semantics.                                                    |

The deep architecture package includes OAuth sequence diagrams, entity model, state machines, role matrix, deployment topology, configuration contract, and exact source paths: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Product system

| Surface                        | What it coordinates                                                                                         | Enforcement boundary                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Private payroll**            | Recipient routes, schedules, approvals, transaction references, audit, and proof eligibility.               | Only permitted roles mutate routes; settlement requires approvals and verified receipt status.                     |
| **Treasury and operations**    | Per-token/network policy, daily limits, approval thresholds, schedule state, health, and CSV audit exports. | Policy evaluates before protected route workflow persistence.                                                      |
| **Claims and selective proof** | Time-bounded claim records and receipt-gated proof slugs.                                                   | No proof before settlement; public proof excludes private allocations and roster data.                             |
| **Launchpad governance**       | Projects, commitments, allocations, milestones, release requests, readiness, and operator controls.         | These are coordination records until a wallet-approved, externally confirmed execution exists.                     |
| **Private Markets**            | RFQs, sealed bid commitments, encrypted-term fields, risk policy, alerts, portfolio math, and lifecycle.    | Live window, deadline, amount, concentration, cap, capacity, accepted-allocation, and role checks run server-side. |
| **Documentation**              | Film library, operating model, security posture, architecture, reviewer guide, and decision record.         | Every material claim points to source, product state, or an explicit owner-operated boundary.                      |

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/mOERMfGFHMsRvNYm.png" alt="Veyra Private Markets control room" width="100%" />
</p>

---

## State is evidence, not decoration

| State                 | What is true                                                         | What is deliberately **not** implied                    |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| **Persisted**         | An authenticated workspace record exists.                            | A transfer, signature, or public transaction exists.    |
| **Unsigned**          | A claim, allocation, proposal, or proof candidate has been prepared. | A wallet has approved it.                               |
| **Wallet pending**    | The app has reached the user-owned authorization boundary.           | The user will approve or the transaction will succeed.  |
| **Submitted**         | A unique transaction hash is bound to a route and network.           | The receipt is final or the route is settled.           |
| **Confirmed receipt** | RPC reports succeeded execution plus accepted finality.              | Private roster, allocation, or bid data becomes public. |
| **Demo Mode**         | Deterministic local explanation state is visible.                    | Mainnet evidence exists.                                |

The lifecycle itself is enforced, not merely displayed. See the exact route and market state diagrams in [Architecture](docs/ARCHITECTURE.md), then inspect `transitionPaymentRoute`, `confirmBlockchainTransaction`, `createShareableProof`, `updatePrivateMarketStatus`, and `commitPrivateMarketBid` in [`server/db.ts`](server/db.ts).

---

## The decisions behind the product

Veyra’s most important design choices are constraints, not feature claims. It uses a wallet-owned signing boundary rather than custodial key handling; a receipt-derived confirmation state rather than a locally trusted hash; a proof surface smaller than the private operating record; server enforcement rather than dashboard-only warnings; a non-custodial Cairo registry rather than pretending to ship an audited escrow; and Demo Mode as explanation rather than evidence.

Read the complete **[Decision Record](docs/DECISIONS.md)** to understand the trade-offs, consequences, and intentional non-goals.

---

## Proof of work

| Evidence            | Where to inspect                                                          | What it proves                                                                                                   |
| ------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Product**         | [Live workspace](https://veilpay-spri-t4knu9mv.manus.space)               | The designed operational surface and state language are live.                                                    |
| **Film**            | Direct players in the [Film library](#film-library)                       | Product narrative and end-to-end guided context.                                                                 |
| **Backend**         | [`server/routers.ts`](server/routers.ts) · [`server/db.ts`](server/db.ts) | Protected procedures, workspace scoping, policy and receipt gates, persistence, audit behavior.                  |
| **Lifecycle logic** | [`shared/operations.ts`](shared/operations.ts)                            | Shared market transition, risk, policy, disclosure, and scheduling logic.                                        |
| **Data model**      | [`drizzle/schema.ts`](drizzle/schema.ts)                                  | Typed tables for workspaces, routes, claims, policy, launch governance, markets, transactions, and audit events. |
| **Cairo boundary**  | [`contracts/veyra_payroll`](contracts/veyra_payroll)                      | Non-custodial commitment registry and its explicit deployment boundary.                                          |
| **Verification**    | `pnpm test && pnpm build`                                                 | **14 test files / 64 tests** and a production bundle build.                                                      |

---

## Documentation map

| Document                                                   | Purpose                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Reviewer Guide](docs/REVIEWER_GUIDE.md)                   | Exact 90-second evaluation path, inspection tasks, and evidence levels.                                           |
| [Architecture](docs/ARCHITECTURE.md)                       | System context, trust domains, OAuth sequence, persisted model, role matrix, lifecycle, deployment, and code map. |
| [Threat Model](docs/THREAT_MODEL.md)                       | Assets, threat scenarios, controls, residual risks, and non-goals.                                                |
| [Decision Record](docs/DECISIONS.md)                       | Product/engineering trade-offs that keep Veyra’s claims honest.                                                   |
| [Operations Guide](docs/OPERATIONS.md)                     | Controls, reviewer path, local verification, release gates, and incident posture.                                 |
| [Cairo Registry README](contracts/veyra_payroll/README.md) | Contract scope, build, Sepolia workflow, and production limits.                                                   |
| [Evidence Handoff](HACKATHON_EVIDENCE.md)                  | Completed assets and user-owned mainnet/repository release steps.                                                 |

---

## Run the system

### Prerequisites

Use **Node.js 22**, **pnpm 10**, a MySQL/TiDB database you control, and the Manus OAuth environment contract defined in [`server/_core/env.ts`](server/_core/env.ts). Keep `DATABASE_URL`, `JWT_SECRET`, OAuth settings, RPC credentials, and all wallet material outside the repository.

```bash
pnpm install
pnpm dev
```

Run the product verification suite and production build:

```bash
pnpm test
pnpm build
pnpm start
```

For schema work, generate and apply migrations only against a database you control:

```bash
pnpm db:push
```

For the separate Cairo registry:

```bash
cd contracts/veyra_payroll
scarb build
```

---

## Release posture

| Ready now                                                                                                                                                                                                   | Requires owner-operated evidence or further engineering                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-stack workspace, typed API, database model, protected workflow, lifecycle semantics, audit events, policy/risk controls, documentation system, product films, test suite, and Cairo commitment source. | Real STRK20 pool interactions, public transaction hashes, any fund-moving Cairo interface, Sepolia deployment validation, independent contract review, owned production observability, Vercel OAuth origin configuration. |

The `transactions` array in `strk20.json` remains empty by design until the project owner performs real successful STRK20 pool interactions and records their public hashes. No transaction hash, deployed contract address, settlement status, audit result, or testimonial is fabricated in this repository.

For STRK20 program context, see the [Starknet STRK20 Private Sprint page](https://strk20.starknet.io/hackathon) [1].

---

<p align="center">
  <strong>Veyra</strong><br />
  <sub>PRIVATE FINANCIAL COORDINATION · WALLET → RECEIPT → PROOF</sub><br /><br />
  <a href="LICENSE">MIT License</a>
</p>

## References

[1]: https://strk20.starknet.io/hackathon "STRK20 Private Sprint"
