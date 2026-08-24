# Veyra — STRK20 Hackathon Submission Pack

**Prepared:** 23 August 2026  
**Submission status:** **Repository-level entry package verified.** The official rules state that the repository state at the deadline is the entry; there is no manual registry submission. [1]

## Submission copy

> **Veyra** is a privacy-first financial-coordination workspace for Starknet teams. It combines private payroll routes, recipient claim links, treasury guardrails, private-market workflows, sealed launch allocations, and receipt-backed selective proof. Veyra is Mainnet-only and non-custodial: a user’s wallet performs any STRK20 action, while the application persists only route metadata, public transaction hashes, public receipt state, and audit events.
>
> The project integrates the official STRK20 wallet-invocation boundary and deliberately fails closed when a wallet does not support or is not ready for the private action. It never falls back to a public transfer. The current release also hardens the complete claimed-payment lifecycle: retry-safe route creation, durable returned-hash recovery without a second signature, atomic submitted-route state, receipt-gated confirmation, and explicit separation between public receipt evidence and wallet-private note discovery.

## Product and technical evidence

| Category | Evidence |
| --- | --- |
| Live product | [Veyra app](https://veilpay-spri-t4knu9mv.manus.space) |
| Source | [Public GitHub repository](https://github.com/sands786/veyra) |
| Demo | [Three-minute product demo](https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/veJaWSgpcQWfhFVT.mp4) — verified runtime: 189.97 seconds |
| Submission metadata | [`strk20.json`](../../strk20.json) |
| Mainnet evidence record | [Public receipt audit](./mainnet-evidence-2026-08-23.md) |
| Architecture and hardening | [Private-payment hardening audit](./private-payment-hardening-2026-08-23.md) |
| Recovery procedure | [Claimed-route hash-recovery runbook](./claimed-route-hash-recovery-runbook.md) |

## Required `strk20.json` transaction evidence

| # | Mainnet transaction hash | Public status |
| --- | --- | --- |
| 1 | [`0x0336a6a8d3cc51290ed19e17b3f927d253389dea5f5408ff6b33cf926c3bed57`](https://starkscan.co/tx/0x0336a6a8d3cc51290ed19e17b3f927d253389dea5f5408ff6b33cf926c3bed57) | Succeeded; Accepted on L2 |
| 2 | [`0x03dd3037a3d6cada35b764e57f94f3fac0fc5f55cd6592bb214c1a5ec2c11890`](https://starkscan.co/tx/0x03dd3037a3d6cada35b764e57f94f3fac0fc5f55cd6592bb214c1a5ec2c11890) | Succeeded; Accepted on L2 |
| 3 | [`0x02437fc5f800a691602781a26fa98e3eea494eb94c909f6db347ae3003743c9f`](https://starkscan.co/tx/0x02437fc5f800a691602781a26fa98e3eea494eb94c909f6db347ae3003743c9f) | Succeeded; Accepted on L2 |

An additional successful claimed-route pool action is documented separately as public-only evidence: [`0x00c254e48eabc23bc3f0f25343c98876d8351ff3fe9fe63b9808b4126b9f59c3`](https://starkscan.co/tx/0x00c254e48eabc23bc3f0f25343c98876d8351ff3fe9fe63b9808b4126b9f59c3). It is not required to reach the three-hash threshold and must not be presented as proof of recipient private-note delivery.

## Final user-owned checklist

| Item | Status | Required action |
| --- | --- | --- |
| Public repository | Verified | Keep `sands786/veyra` public with its `LICENSE` available. |
| App and demo links | Verified | Keep the live Veyra app and `demo_video` URL reachable through judging. |
| Three required transaction hashes | Verified | Keep the three real hashes in `strk20.json`; do not add placeholders. |
| Manual registry form / Telegram | Not required | The official submission instructions state that there is nothing to submit manually; the public repository state at the deadline is the entry. |
| Optional contract address | Pending only if deployed | Leave `contracts: []` unless there is a real deployed Veyra payroll-registry address. |
| Recipient-note reconciliation | Separate operational issue | Do not claim resolution until the recipient Ready X wallet discovers the private note. |
| Historic Veyra route record | Separate operational issue | Use the safe no-signature recovery control with the already returned hash before a receipt confirmation attempt. |

## Accuracy boundary

Veyra’s public Mainnet receipts establish that wallet-submitted STRK20 pool actions succeeded. They do not disclose recipient identity, encrypted note ownership, recipient balances, or wallet-private delivery. The official privacy SDK explicitly treats transfer orchestration and note discovery as distinct operations. [1] [2]

## References

[1] [Official STRK20 Hackathon rules and submission instructions](https://github.com/starkience/strk20-hackathon#submitting).  
[2] [Starknet Privacy SDK repository](https://github.com/starkware-libs/starknet-privacy).  
[3] [Starknet developer tools — STRK20 by Example](https://docs.starknet.io/learn/cheatsheets/tools).  
[4] [Official STRK20 live privacy announcement](https://www.starknet.io/blog/privacy-live-on-starknet/).  
[5] [Veyra public evidence handoff](../../HACKATHON_EVIDENCE.md).
