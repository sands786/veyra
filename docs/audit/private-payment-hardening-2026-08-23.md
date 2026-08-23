# Veyra Private-Payment Production Hardening Audit

**Date:** 23 August 2026  
**Author:** Manus AI  
**Scope:** Veyra’s claimed-payment lifecycle from route creation through wallet request, application persistence, Starknet receipt confirmation, and recipient private-note discovery.

## Executive conclusion

The audit identified two code-owned reliability defects that could make a successful wallet-originated private action look absent in Veyra: route creation was not retry-idempotent, and a returned wallet hash could be lost if the subsequent application write did not finish. The latter left the route actionable, which could invite an unsafe second signature. Both defects are corrected in the current release.

The correction does **not** claim that Veyra can independently determine private-note delivery to a recipient wallet. The official privacy SDK separates transfer orchestration from discovery, and the public chain intentionally does not reveal the recipient or note owner. Veyra now models wallet submission, application recording, public receipt verification, and recipient-note discovery as separate facts. [1] [2]

| Lifecycle event | Required evidence | Veyra behavior after hardening |
| --- | --- | --- |
| Route creation | Authenticated workspace request | A client request UUID is persisted and uniquely scoped to the workspace, preventing duplicate rows from the same retry. |
| Private wallet request | Wallet returns a transaction hash | The hash is stored locally before any application persistence attempt; no generic/public fallback is used. |
| Application recording | Veyra transaction row | The record operation advances the route atomically to `routed`, emits an audit event, and the UI locks future signing. |
| Interrupted write recovery | Existing transaction hash plus verifiable Mainnet receipt | A sender can use **Verify & Record Existing Hash**; Veyra verifies the Starknet receipt before recording and does not open a wallet request. |
| Settlement | Receipt status is accepted and execution succeeds | Receipt confirmation determines the application’s confirmed/reverted/unknown state. |
| Recipient delivery | Recipient wallet’s private-note discovery | Remains a wallet/SDK outcome. No public receipt or Veyra server field is treated as proof of delivery. |

## Verified defects and corrections

### 1. Duplicate route creation after a wallet retry

The old builder saved a route before requesting the wallet action. If the wallet returned an error, or if the post-wallet persistence step was interrupted, the next attempt could create another route with the same visible name, amount, and recipient selection. The audit observed duplicate records for the user’s `March contractor run` workflow.

The release adds a `clientRequestId` to `paymentRoutes`, backed by the `paymentRoutes_workspace_request_unique` unique index. A retry with the same request identifier returns the existing route rather than inserting another. The client also keeps the saved route selected while its wallet result is being handled.

### 2. Returned hash lost after wallet success

The supplied hash `0x00c254e48eabc23bc3f0f25343c98876d8351ff3fe9fe63b9808b4126b9f59c3` was publicly verified as a successful Starknet Mainnet STRK20 privacy-pool action, yet it was absent from Veyra’s transaction table at audit time. This explains why the UI could still display another signing control.

Veyra now stores a returned public hash in browser storage under the associated route before calling the record endpoint. If the record endpoint fails or the browser session is interrupted, the route does not silently return to a fresh-signature state. Instead, the claim-review panel disables signing and exposes **Verify & Record Existing Hash**. The server verifies the supplied hash through its Mainnet receipt provider before it writes the submission record.

> A recovery action records an already returned transaction hash; it **does not** submit a new wallet request, re-sign a transaction, or expose private note data.

### 3. Incomplete submitted-route state transition

Previously, a persisted transaction hash did not itself advance the route state or emit its own audit action. Transaction recording now executes atomically with a route transition through `shielded` to `routed`, as appropriate, and records `transaction_submitted` in the workspace audit trail. Receipt confirmation remains the sole mechanism that advances `routed` to `settled` or `failed`.

### 4. Unsafe generic wallet execution removed from the payment path

The route-builder’s supplemental generic `wallet.execute` branch was removed. Private payment submission now uses only the official STRK20 wallet invocation path. If a wallet does not implement the required capability, returns no hash, or reports a protocol readiness error, Veyra records no submission and offers no public-transfer fallback.

## Verification evidence

| Check | Result |
| --- | --- |
| Full automated suite | **152 tests across 37 files passed** |
| TypeScript | `tsc --noEmit` passed |
| Production build | Vite and server bundle passed |
| Database change | `clientRequestId` column and workspace-scoped unique index applied and verified through `INFORMATION_SCHEMA` |
| Visual smoke check | Restarted development server rendered cleanly at the Veyra workspace landing screen |
| Public transaction evidence | The fourth supplied hash is publicly recorded as Accepted on L2; recipient-note ownership remains deliberately unasserted |

The production build retains a Rollup chunk-size advisory for the main JavaScript bundle. It is a performance optimization opportunity, not a correctness or private-payment state failure.

## Remaining non-code boundaries

The following items remain intentionally outside Veyra’s authority and must not be misrepresented as resolved by this release.

| Boundary | Current status | Correct next source of truth |
| --- | --- | --- |
| Ready X private recipient delivery | Unconfirmed for the reported sends | The intended recipient wallet’s Shielded Starknet/private-note discovery view, or Ready X support using public hashes and addresses only |
| Wallet STRK20 capability | Wallet-specific | The connected wallet’s official `wallet_strk20InvokeTransaction` response; no generic fallback is permitted |
| Mainnet transaction fee and approval | User-controlled | The wallet’s confirmation view immediately before approval |
| Historic missing Veyra record | Recoverable | Open the exact saved route, paste its already returned hash into the recovery panel, then verify and record it without signing again |

## References

[1] [Starknet Privacy SDK repository](https://github.com/starkware-libs/starknet-privacy) — describes SDK orchestration for registration, private transfers, and note discovery, with a wallet submitting the built transaction.  
[2] [Starknet developer tools](https://docs.starknet.io/learn/cheatsheets/tools) — identifies STRK20 by Example as a runnable resource covering deposits, transfers, withdrawals, note discovery, and wallet integration.  
[3] [Privacy Is Now Live on Starknet](https://www.starknet.io/blog/privacy-live-on-starknet/) — official privacy launch and supported wallet context.  
[4] [Fourth claimed-route receipt on Starkscan](https://starkscan.co/tx/0x00c254e48eabc23bc3f0f25343c98876d8351ff3fe9fe63b9808b4126b9f59c3) — public Mainnet receipt evidence only.
