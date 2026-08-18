# VeilPay — STRK20 Private Sprint Readiness Assessment

## Executive assessment

VeilPay is structurally prepared as a STRK20 private-payments SaaS product, but it is **not yet fully scoreable for the hackathon**. The decisive missing evidence is not another UI feature: the project still needs a public open-source GitHub repository with the required registry entry, three successful Starknet mainnet transaction hashes touching the live STRK20 pool, a public three-minute demo video, a completed user-owned wallet flow, and a payout address if the team wins.

The official sprint closes on **August 31, 2026 at 23:59 UTC**. Winners are announced on **September 4, 2026**. The prize pool is **$5,000 paid in STRK**, split as $2,500 first place, $1,500 second place, and $1,000 third place. The judging weights are STRK20 integration depth 30%, working mainnet product 30%, innovation 25%, and documentation/open-source quality 15%.

## Requirement-by-requirement mapping

| Official requirement | VeilPay evidence | Status | Required action |
|---|---|---:|---|
| Public GitHub repository | Project exists in the managed workspace, but no public GitHub repository has been created in this task | Missing | Create a public repository, add a license, push the source, and confirm the first commit is visible |
| Registry pull request | `strk20.json` exists locally, but no registry PR has been opened | Missing | Add the repository URL and Telegram usernames to `registry.json` in the official hackathon repository and open the single PR |
| Public/open-source license | README exists, but the public repository/license state is not verified | Needs verification | Add an explicit open-source license before registry submission |
| STRK20 Wallet API integration | `client/src/lib/strk20.ts` implements the official `strk20InvokeTransaction` adapter boundary and the app exposes wallet-gated actions | Implemented locally | Use a privacy-enabled wallet and verify the actual action on Starknet mainnet |
| Working mainnet product | Manus deployment is live at `https://veilpay-spri-t4knu9mv.manus.space`, but a user-approved mainnet wallet action has not been completed | Partially evidenced | Complete a real mainnet wallet flow and record successful receipts |
| Three successful mainnet pool transactions | `strk20.json` currently contains an empty `transactions` array | Missing and decisive | Execute at least three successful mainnet transactions that touch the live STRK20 pool and add their hashes |
| Three-minute demo video | `strk20.json` has an empty `demo_video` field | Missing and decisive | Record and publish a concise three-minute product demo showing the real wallet/mainnet flow |
| Public demo URL | Manus deployment URL exists, but it must be added to public metadata or repository discovery fields | Needs update | Add the public demo URL to `strk20.json` and the repository Website field |
| Contracts metadata | `strk20.json` has an empty `contracts` array; VeilPay does not currently require a custom anonymizer contract | Optional | Add deployed addresses only if a custom contract is deployed; otherwise leave empty |
| Root `strk20.json` metadata | File exists with empty evidence fields | Partially complete | Populate `transactions`, `demo_video`, and `demo_url` after real evidence exists |
| README/build instructions | README exists and documents the privacy boundary and adapter boundary | Implemented locally | Ensure the public repository README includes setup, wallet prerequisites, and the exact demo flow |
| Team contact details | No Telegram usernames are recorded in this project | Missing | Supply Telegram usernames when opening the registry PR |
| Payout address | Not required before building, but required for a winning team | Pending | Provide one payout address only through the official submission process if VeilPay wins |
| Authenticated user-flow evidence | Code, tests, and preview QA are complete; the user-owned login and wallet approval remain unperformed | User action required | Sign in, connect the privacy-enabled wallet, and approve the test flow without sharing keys |

## What counts as a valid mainnet transaction

The official repository says each listed hash is checked against the chain. It must exist, succeed, and touch the STRK20 pool. A locally simulated transaction, a demo-mode hash, a manually entered hash, or a transaction that never reaches the live pool will not satisfy this requirement. VeilPay must therefore preserve only the resulting public transaction hash, network, status, and timestamp; it must never request or store private keys, viewing keys, seed phrases, or plaintext sensitive payroll notes.

## Recommended submission sequence

First, create or connect the public GitHub repository, add an open-source license, and push the current checkpoint. Next, populate the registry PR with the repository URL and Telegram usernames. Then complete the wallet-owned mainnet flow and execute the minimum three successful STRK20 pool transactions. After confirming each hash independently, add the hashes to `strk20.json`, add the public demo URL, record the three-minute video, and publish its URL in the same file. Finally, verify that the public repository, demo, metadata, and registry page all expose the same project identity before the deadline.

## Evidence boundary

The project is **not described as a winner or as mainnet-complete** until the missing artifacts above exist. In particular, a polished SaaS interface and a correctly shaped wallet adapter are valuable for the integration-depth and documentation scores, but they do not substitute for the three chain-verified mainnet transactions or the required video.

## References

[1]: https://strk20.starknet.io/hackathon "Official STRK20 Private Sprint hackathon page"
[2]: https://github.com/starkience/strk20-hackathon "Official STRK20 hackathon repository and scoring metadata"
[3]: https://strk20.starknet.io/build "Official STRK20 build routes"
[4]: https://strk20-by-example.org/starknet-wallet-api/overview "Official Starknet Wallet API documentation"
[5]: https://strk20-by-example.org/helpers/privacy-invoke "Official anonymizer contract documentation"
[6]: https://strk20-by-example.org/sdk/getting-started "Official Privacy SDK documentation"

## Testnet implementation update — 2026-08-16

VeilPay now exposes a first-class Starknet Sepolia path in the workspace. The selected network is persisted locally, visibly labeled, and threaded through route creation, draft editing, treasury simulation, wallet signing, transaction persistence, and Voyager explorer links. Switching networks clears the connected wallet state so a wallet cannot be reused silently across environments.

The `/demo` route now includes a reproducible testnet evidence panel with a clearly labeled `WRITE → WAIT → READ → INTEGRITY` sequence, transcript export, deterministic timeout-to-`UNKNOWN` simulation, and idempotent reconciliation demonstration. This panel is a local evidence rehearsal and does not claim a real testnet transaction unless a user connects a wallet and approves an actual transaction from the main workspace.

The production boundary remains explicit:

| Environment | Purpose | Evidence status |
|---|---|---|
| Demo Mode | Local deterministic rehearsal, error/retry, transcript shape, and reconciliation UX | Simulation only; never a chain transaction |
| Starknet Sepolia | Safe wallet, STRK20 adapter, receipt, and integration verification | Testnet evidence; does not satisfy mainnet requirements |
| Starknet mainnet | Production wallet execution and hackathon proof | Requires user-approved transactions touching the live STRK20 pool |

Verification after this implementation: **43 Vitest tests pass, TypeScript passes, and the production build succeeds**. The remaining mainnet evidence is still user-owned and must not be fabricated or inferred from Demo Mode or Sepolia activity.


## Full-stack reality update — 2026-08-18

VeilPay’s production workspace is server-backed rather than static: authenticated tRPC procedures, workspace-scoped authorization, database persistence, audit events, claims, proofs, Launchpad milestone state, and network-aware transaction records are implemented. The `/private-primitives` workspace calls real `claims.create`, `proofs.create`, and `launchpad.updateMilestoneStatus` procedures instead of local-only action state. Demo Mode remains intentionally local and reversible. Live STRK20 settlement and mainnet evidence still require compatible wallet/SDK execution, user wallet approval, and real transaction hashes.
