# Veyra Operations and Verification Guide

> This guide is for operators, reviewers, and developers. It documents what the application currently enforces, what must be confirmed externally, and how to reproduce the repository’s verification checks.

## 1. Operational controls

| Control                | Enforced behavior                                                                                                                              | Evidence path                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Workspace isolation    | Each request resolves an authenticated user to a workspace membership before reading or mutating workspace records.                            | `workspaceFor` in `server/routers.ts`; workspace predicates in `server/db.ts`. |
| Role separation        | Viewer mutation paths are rejected; only owners/admins decide route approvals and change policy; operators can run permitted workflow actions. | Role checks in `server/routers.ts`.                                            |
| Route settlement gate  | A route cannot become settled until its workspace approval threshold is satisfied.                                                             | `transitionPaymentRoute` in `server/db.ts`.                                    |
| Hash binding           | A transaction hash can bind to only one route and must match the route network.                                                                | `recordBlockchainTransaction` in `server/db.ts`.                               |
| Receipt verification   | Confirmation queries an RPC receipt and checks execution and finality status.                                                                  | `verifyStarknetReceipt` in `server/db.ts`.                                     |
| Public proof gate      | A shareable proof cannot be created unless the route is settled.                                                                               | `createShareableProof` in `server/db.ts`.                                      |
| Market transition gate | Invalid market transitions are rejected; settlement requires an accepted allocation.                                                           | `updatePrivateMarketStatus` and `shared/operations.ts`.                        |
| Bid risk controls      | Live-window, positive amount, cap, concentration, and capacity checks execute before commitment persistence.                                   | `commitPrivateMarketBid` in `server/db.ts`.                                    |
| Audit trail            | Mutating operations append workspace-scoped audit events.                                                                                      | `auditEvents` table and helper writes.                                         |

## 2. Evidence levels

| Level                   | Meaning                                                                | Example                                                  |   Does it prove chain settlement?    |
| ----------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- | :----------------------------------: |
| **Persisted**           | A server-authorized workspace record exists.                           | Route, market, policy, milestone, or claim record.       |                  No                  |
| **Prepared / unsigned** | The UI has assembled an action or public-link candidate.               | A claim preview or governance action.                    |                  No                  |
| **Wallet pending**      | The user is at the user-owned signature boundary.                      | Wallet request shown.                                    |                  No                  |
| **Submitted**           | A transaction reference has been recorded against a route and network. | `blockchainTransactions.status = submitted`.             |                  No                  |
| **Confirmed**           | RPC inspection reports succeeded execution plus accepted finality.     | Route can transition to settled; proof becomes eligible. | Yes, for the recorded receipt status |
| **Demo Mode**           | Deterministic local scenario state supports explanation and testing.   | In-app demonstration data.                               |                Never                 |

## 3. Reviewer path

1. Open the [live workspace](https://veilpay-spri-t4knu9mv.manus.space) and sign in through Manus OAuth.
2. Create a recipient and a route from the **Payment routes** surface; inspect the persisted and unsigned labels before treating any action as a transfer.
3. Open **Operations** and **Treasury** to inspect approval, schedule, policy, and audit controls.
4. Open **Private Markets** to inspect the persisted RFQ, sealed-bid, policy, alert, and lifecycle views.
5. Open [Documentation](https://veilpay-spri-t4knu9mv.manus.space/documentation) for the architecture narrative, receipt boundary, and function films.
6. Treat the mainnet evidence list as incomplete until the owner has recorded real hashes in `strk20.json`; the current repository deliberately contains no fabricated transaction evidence.

## 4. Local verification

The current suite comprises **14 Vitest files and 64 tests**. It covers shared operations, workspace selection and resolution, launchpad router behavior, Demo Mode, documentation data, authentication logout behavior, route editing, STRK20 helpers, private primitives, and clipboard/on-chain configuration utilities.

```bash
pnpm install
pnpm test
pnpm build
```

The build emits the Vite client and bundles the Express server entry. Keep `DATABASE_URL`, OAuth configuration, and all production keys outside the repository.

### Cairo registry verification

```bash
cd contracts/veyra_payroll
scarb build
```

The Cairo package is a non-custodial commitment registry. It records route and settlement commitments but does not custody or transfer tokens. Read [`contracts/veyra_payroll/README.md`](../contracts/veyra_payroll/README.md) before attempting a Sepolia deployment.

## 5. Mainnet release gates

The following must be completed by the project owner before presenting Veyra as a live mainnet financial protocol:

| Gate                                                                                                         | Why it exists                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Connect a user-owned privacy-enabled Starknet wallet                                                         | Wallet approval must remain user-controlled.                                             |
| Execute and verify real STRK20 pool interactions                                                             | The application must not substitute demo state or locally supplied hashes for a receipt. |
| Record successful public transaction hashes in `strk20.json`                                                 | Makes reviewer verification possible.                                                    |
| Deploy, test, and independently audit any fund-moving Cairo semantics                                        | The included registry is not an audited escrow or custody contract.                      |
| Configure production RPC, OAuth origins, and monitoring                                                      | A real deployment needs owned infrastructure and operational observability.              |
| Keep private keys, seed phrases, and customer-sensitive notes out of the application database and repository | These are never valid application inputs.                                                |

## 6. Incident and error posture

The product exposes `submitted`, `confirmed`, `reverted`, and `unknown` transaction states instead of collapsing failures into success. A reverted receipt moves the associated route to `failed`; an unresolved receipt stays visible to operations health; a public proof remains unavailable until settlement is confirmed.

For non-production testing, use a small, user-owned test account and inspect every wallet prompt. Do not transmit seed phrases, private keys, recovery words, or keystore files through Veyra, source control, chat, or issue trackers.
