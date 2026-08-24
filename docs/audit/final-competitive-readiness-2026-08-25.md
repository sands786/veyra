# Veyra Final Competitive-Readiness Scorecard

**Prepared:** 25 August 2026  
**Purpose:** Internal, evidence-based prioritization for the STRK20 hackathon. This is **not** a prediction of judge scores and does not treat wallet-native receipt evidence as proof of recipient-private-note delivery.

## Executive conclusion

Veyra is a credible privacy-finance entry with a live public product, a public MIT repository, a Vercel Website link, a three-minute walkthrough, and exactly three verified Mainnet STRK20 privacy-pool hashes in root `strk20.json`. Those are material strengths. The product’s central integrity claim is also code-backed: it refuses a generic invoke or public-transfer substitute when the private wallet request cannot be safely completed.

The package is **not yet maximally competitive**. The largest remaining winner-critical gap is not visual polish: it is the absence of a publicly demonstrable, Veyra-recorded end-to-end claimed payment whose recipient has independently discovered the private note. The separate registry application is also unverified and must be completed with the team’s public Telegram username before the deadline. Neither gap may be concealed by Demo Mode, a wallet hash alone, or broad product copy.

## Official scoring map

The official rules weight **STRK20 integration depth** and **working Mainnet product** at 30% each, followed by **innovation** at 25% and **documentation/open-source quality** at 15%. They also distinguish a one-time registry pull request from the final repository-at-deadline evaluation. [1]

| Criterion | Weight | Evidence already present | Conservative internal readiness | Highest-leverage improvement |
| --- | ---: | --- | ---: | --- |
| STRK20 integration depth | 30% | Mainnet-only guards, STRK20 wallet-invocation boundary, three verified privacy-pool hashes, explicit note-discovery boundary | **18 / 30** | Demonstrate a supported Veyra-originated private route with retained hash, receipt confirmation, and recipient-wallet private-note discovery. |
| Working Mainnet product | 30% | Live Vercel app, persisted workspace flows, receipt verification, Mainnet-only state, public wallet-native evidence | **17 / 30** | Recover the historic claimed-route hash without a new signature, then complete a newly initiated end-to-end Veyra flow only if the recipient wallet is privacy-initialized. |
| Innovation | 25% | Private payroll, claims, policy/treasury guardrails, selective proof, private markets, and launch coordination share one controlled lifecycle | **18 / 25** | Lead the demo and README with one sharp thesis: governed private coordination with receipt-bound proof, rather than presenting breadth as a collection of unrelated screens. |
| Documentation and open-source quality | 15% | MIT repository, architecture, threat model, evidence handoff, operator runbook, video, Vercel guide, test suite | **13 / 15** | Keep the public package internally consistent; maintain Vercel as the single primary judge path and correct registry wording. |
| **Total internal evidence maturity** | **100%** | **Strong product package; material private-settlement gap remains** | **66 / 100** | **Do not claim a winner outcome before the end-to-end privacy result is independently visible.** |

## What is already real

| Claim | Status | Verifiable evidence |
| --- | --- | --- |
| Public source and license | Verified | `https://github.com/sands786/veyra` is public, has an MIT license, and keeps `main` as the default branch. |
| Primary judge path | Verified | The GitHub Website field and `demo_url` use `https://veyra-gamma-gold.vercel.app`; the public product entry point resolves. |
| Required pool-receipt count | Verified | Root [`strk20.json`](../../strk20.json) contains exactly three successful public Mainnet STRK20 privacy-pool transaction hashes. |
| Demo availability | Verified | The linked walkthrough is a public MP4 with a retained runtime of 189.97 seconds. |
| Private action safety | Code-backed | Veyra requests `wallet_strk20InvokeTransaction` through `submitShieldedRoute`; it does not substitute a generic wallet invoke or public transfer. |
| Route retry and hash recovery | Code-backed | Route creation uses a client request identity; returned hashes are retained before persistence and can be recovered only after a receipt-first server check. |

## What remains unresolved

| Boundary | Current fact | Correct handling |
| --- | --- | --- |
| Official registry entry | A live registry scan did not find `https://github.com/sands786/veyra` in `starkience/strk20-hackathon`’s `registry.json`. | Obtain the team’s public Telegram username and explicit approval, then open the single registry pull request. Do not publish any secret or private wallet information. |
| Historic claimed route | `0x00c254…f59c3` has a public successful receipt but was not recorded by Veyra when first returned. | Use the exact claimed saved route’s **Verify & Record Existing Hash** recovery control; it must not prompt the wallet or create a new signature. |
| Recipient delivery | Public receipts cannot reveal encrypted-note ownership or discovery. The recipient Ready X view has not provided conclusive evidence of an incoming note. | Keep delivery unconfirmed unless the recipient wallet’s private/shielded view independently shows the note. Never request seed phrases, private keys, recovery words, or encrypted note material. |
| Fund-moving Veyra contract | The included Cairo registry is intentionally non-custodial and has no verified Veyra deployment address in metadata. | Keep `contracts: []` until a real deployed address and source verification exist; do not add placeholders. |

## Winning sequence

1. **Complete discoverability:** open the one registry PR after the owner provides the public Telegram username(s).
2. **Protect the current package:** retain the three verified hashes, public MIT repository, Vercel Website link, public demo video, and live app through the deadline.
3. **Recover safely:** record the already-returned claimed-route hash through the no-signature recovery path and verify the receipt.
4. **Prove the differentiator:** only after recipient privacy setup is confirmed, perform one small owner-approved Veyra route that shows the complete persisted-intent → wallet authorization → receipt → recipient note-discovery chain. If this cannot be demonstrated, say so plainly and compete on the verified product and safety model rather than inventing settlement.
5. **Tell one coherent story:** Veyra is not a wallet. It is the governed operating layer around a private STRK20 payment: private roster coordination, user-owned signing, receipt-backed state, and selective public proof.

## References

[1] [Official STRK20 hackathon rules, application, submission, and judging criteria](https://github.com/starkience/strk20-hackathon).  
[2] [Veyra public evidence handoff](../../HACKATHON_EVIDENCE.md).  
[3] [Veyra private-payment hardening report](./private-payment-hardening-2026-08-23.md).  
[4] [Veyra claimed-route no-signature recovery runbook](./claimed-route-hash-recovery-runbook.md).
