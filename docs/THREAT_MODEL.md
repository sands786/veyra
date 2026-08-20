# Veyra Threat Model and Security Posture

> **This is a code-grounded threat model, not a claim of a completed external audit or a promise of custody-grade security.** It states what Veyra protects in the current implementation, how the controls work, and what still requires real deployment validation.

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/wekOSUaPYilfgKxo.svg" width="100%" alt="Veyra privacy trust map" />
</p>

## Assets and invariants

| Asset or invariant | Desired property                                                                                                   | Current enforcement                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Wallet authority   | A user, not the application, approves Starknet calls.                                                              | The wallet is an external user-controlled boundary. Veyra does not accept seed phrases, private keys, recovery words, or keystores. |
| Workspace data     | A member cannot access or mutate another workspace’s routes, recipients, policies, bids, or audit records.         | Protected procedures resolve workspace membership; helpers bind ownership checks to `workspaceId`.                                  |
| Route settlement   | A route is not shown as settled without the configured approval threshold and receipt-derived status.              | `transitionPaymentRoute`, `verifyStarknetReceipt`, and `confirmBlockchainTransaction`.                                              |
| Public proof       | A public link never exposes the private roster or individual allocation data and cannot exist before settlement.   | `createShareableProof` permits only settled routes; `getPublicProof` returns a constrained summary.                                 |
| Market integrity   | A bid cannot bypass a closed/live window, amount validity, configured cap, concentration limit, or capacity check. | `commitPrivateMarketBid` enforces each condition and emits an alert before rejecting a violation.                                   |
| Auditability       | Operators can reconstruct material workspace mutations.                                                            | Mutations append workspace-scoped `auditEvents`; operators can export audit CSV data.                                               |

## Threat scenarios

| Scenario                       | What could go wrong                                                     | Current control                                                                                                        | Residual risk / required follow-up                                                                             |
| ------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cross-workspace request        | A user attempts to read or modify an ID belonging to another workspace. | Server resolves membership; queries and mutations use workspace-scoped predicates.                                     | Requires routine authorization testing as the API evolves.                                                     |
| Viewer privilege escalation    | A viewer attempts an operator/admin mutation.                           | Router role checks reject recipient, route, policy, approval, schedule, and market mutations as applicable.            | Role model should be reviewed if new roles are introduced.                                                     |
| Forged settlement confidence   | Someone records a hash and claims the route settled.                    | A record is `submitted` until RPC verification returns succeeded execution and accepted finality; proof remains gated. | RPC availability and trust assumptions must be monitored in production.                                        |
| Misbound transaction reference | The same hash is attached to a different route or network.              | Hash uniqueness and route-network matching are checked before persistence.                                             | Production explorer and receipt monitoring should complement API checks.                                       |
| Premature proof publication    | An operator tries to issue a public link for a draft or routed route.   | Server rejects proof creation unless route status is `settled`.                                                        | Public proof fields should remain intentionally small as product scope evolves.                                |
| Sealed-bid policy bypass       | A bidder submits a bid outside policy or after a deadline.              | Live status, deadline, positive amount, max bid, concentration, and capacity checks run before persistence.            | “Encrypted terms” are persisted payloads; cryptographic confidentiality depends on how callers construct them. |
| OAuth state tampering          | An attacker attempts to complete a callback started in another browser. | Callback compares a state nonce with the one-time cookie written when login begins.                                    | OAuth redirect origins must be correctly configured for every production domain.                               |
| Unsafe secret handling         | A user pastes wallet material into an operational note or issue.        | Product and docs state secrets are invalid inputs and excluded from application storage intent.                        | User education and production content safeguards remain necessary.                                             |

## Explicit non-goals and out-of-scope claims

Veyra does **not** claim to be an audited custody protocol, a fund-moving escrow, a mixer, or a replacement for wallet confirmation. The Cairo registry records non-custodial commitments and events; it does not hold or transfer tokens. The application’s private operating data model is not presented as a cryptographic privacy proof for arbitrary deployment environments.

Before a real-fund launch, the project owner must complete real wallet flows, confirm STRK20 interface semantics, deploy on Sepolia, conduct adversarial and integration tests, define emergency controls and role rotation, independently audit any fund-moving Cairo code, configure owned RPC/observability, and record genuine mainnet evidence.

## Security-relevant implementation map

| Topic                                | Code path                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------- |
| OAuth nonce / session issue          | [`server/_core/oauth.ts`](../server/_core/oauth.ts)                         |
| Protected procedure baseline         | [`server/_core/trpc.ts`](../server/_core/trpc.ts)                           |
| Role and workspace checks            | [`server/routers.ts`](../server/routers.ts)                                 |
| Receipt, proof, route, and bid gates | [`server/db.ts`](../server/db.ts)                                           |
| Shared lifecycle and policy rules    | [`shared/operations.ts`](../shared/operations.ts)                           |
| Tables and scoped entities           | [`drizzle/schema.ts`](../drizzle/schema.ts)                                 |
| Cairo commitment boundary            | [`contracts/veyra_payroll/README.md`](../contracts/veyra_payroll/README.md) |

Report a security concern using the repository’s [security audit notes](../SECURITY_AUDIT_STRIX.md). Do not include sensitive customer data or wallet material in an issue.
