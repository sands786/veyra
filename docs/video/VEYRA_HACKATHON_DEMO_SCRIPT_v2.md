# Veyra Hackathon Demo — Approval Script

**Target runtime:** 2:56, leaving a four-second encoding safety margin below the three-minute limit.  
**Project:** Veyra — Private Financial Coordination on Starknet.  
**Audience:** STRK20 hackathon judges, Starknet builders, and privacy-conscious team operators.  
**Primary link shown:** `https://veyra-gamma-gold.vercel.app`.  
**Status:** **Script only. No video generation should begin until the project owner approves this narrative.**

## Narrative thesis

> A public chain should verify that a financial action happened—not turn a team’s payroll roster, claim allocation, and operating approvals into a permanent public spreadsheet.

Veyra is a Mainnet-only financial-coordination layer for teams using STRK20. It keeps operational intent, policy, and recipient workflow inside an authenticated workspace; a user-owned wallet is the only signing authority; and a receipt, not a UI label or transaction hash, is the settlement boundary.

## Production guardrails

| Rule | Direction for the editor and narrator |
| --- | --- |
| **Do not invent settlement** | Never show a route as paid, a hash as confirmed, or a recipient as credited without a verified receipt and wallet-visible private-note evidence. |
| **Label Demo Mode** | Any seeded or deterministic screen state must carry Veyra’s visible `DEMO MODE / SIMULATED ONLY` boundary. Do not use simulated screens as Mainnet evidence. |
| **Protect privacy** | Use only the prepared public demo workspace. Blur or replace any personal email, wallet address, private roster field, or recovery material that appears during capture. |
| **Preserve wallet custody** | Do not capture a seed phrase, private key, recovery phrase, or real wallet approval. The video shows the hand-off to a user-owned wallet, not a signature. |
| **Describe evidence precisely** | Veyra has three verified wallet-native Mainnet STRK20 privacy-pool receipts in root `strk20.json`. They are public pool evidence; they do **not** prove recipient private-note discovery or an end-to-end Veyra settlement. |

## Capture and visual language

Capture the application at **1920×1080, 60 fps** with a clean browser profile, no notification banners, no bookmarks bar, and no sensitive account information. The final editorial frame is a rounded application window on a restrained obsidian-to-deep-tide gradient, with a soft 24–32 px shadow. Grade all screen footage with a modest 10–15% contrast/saturation lift; retain Veyra’s moon-ivory, vermilion, emerald, and graphite hierarchy.

Use an enlarged custom cursor, spring-smoothed cursor motion, and a restrained click-ripple on actual interactions. For each click, push from 100% to 135–150% scale with a 240–320 ms ease-out, hold the relevant outcome for 1–2 seconds, then ease back. Cut dead time aggressively. Keep an individual shot under five seconds unless the viewer is reading a receipt state or a proof boundary. Use only soft crossfades or short motion-matched whip pans between chapters. Burn in high-contrast sentence-case captions with word-by-word vermilion emphasis on the current spoken word; do not obscure controls or states.

## Timestamped script

| Time | Screen direction | Voiceover | On-screen caption / motion | Sound direction |
| --- | --- | --- | --- | --- |
| **0:00–0:05** | Begin on a fast, close crop of a conventional public payment list. Recipient names, amounts, and approval markers animate into view, then a vermilion redaction sweep removes them. No Veyra title card yet. | “A payroll run should not become a permanent public spreadsheet.” | **YOUR ROSTER IS NOT PUBLIC DATA.** Text snaps in with the redaction sweep. | One low impact, then a warm pulse begins. |
| **0:05–0:15** | Whip-pan into Veyra’s live hero at the Vercel URL. Push into “Move the money. Keep the roster private.” Show the private route CTA, then cut to the authenticated workspace shell. | “But teams still need approvals, auditability, and proof that a route completed. Privacy cannot mean operating blind.” | **PRIVATE OPERATIONS. / VERIFIABLE OUTCOMES.** | Music rises; two quiet UI ticks on the route CTA and workspace transition. |
| **0:15–0:30** | Hold the Veyra route builder at 100%, then push into the state rail: `DRAFT → READY TO SIGN → ROUTED → CONFIRMED`. Emphasize the Mainnet badge and wallet boundary. | “Veyra is a Mainnet-only financial-coordination layer for STRK20. It keeps the operating record private, leaves signing to the wallet, and accepts settlement only after a verified Starknet receipt.” | **PREPARE → AUTHORIZE → VERIFY → PROVE** with each word highlighted as spoken. | Add a subtle clockwork click per state; music ducks slightly under the solution line. |
| **0:30–0:55** | **Feature 1 — Private Payroll.** Show a safe demo workspace: add or select one recipient, choose STRK, enter a small amount with the custom stepper, then create a private route. Push into `READY TO SIGN`, recipient count, and policy preview. Show Treasury/Operations in two fast cuts for the approval threshold and audit record. Use the Demo Mode label if seeded data is visible. | “First, private payroll. An operator prepares a route with the recipient, asset, amount, policy, and approval context in one workspace. Saving it is not a transfer. It is a controlled intent, checked against treasury guardrails, then ready for a wallet review.” | **01 / PRIVATE PAYROLL** then **SAVED INTENT ≠ SETTLEMENT** and **POLICY RUNS SERVER-SIDE.** | Light keyboard texture, one click-ripple per meaningful action. Cut immediately after the audited route state appears. |
| **0:55–1:20** | **Feature 2 — Private Primitives.** Move to the Claims and Private Primitives surfaces. Show a route-linked claim, the sender review state, selective disclosure/proof configuration, and the explicit receipt gate. Transition through Identity Keys to the Mainnet wallet hand-off; show “official STRK20 wallet action only,” then stop before any actual approval. | “Second, private primitives. Veyra turns a claim, a wallet hand-off, and a proof into controlled states rather than vague links. It never takes custody. It refuses a generic invoke or public-transfer fallback. A returned hash is recorded once, and a receipt—not a UI label—decides whether proof can exist.” | **02 / PRIVATE PRIMITIVES**. Sequence badges: **NO CUSTODY**, **NO PUBLIC FALLBACK**, **RECEIPT > UI STATE**. | Music ducks slightly under the execution boundary. Use one precise click per badge and a restrained short whoosh into the proof gate. |
| **1:20–1:47** | **Feature 3 — Private Markets.** Enter the Private Markets control room. Use a live or clearly labeled demo RFQ; show a sealed bid, policy/risk control, aggregate-only signal, accepted-allocation or lifecycle state, and the disclosure boundary that excludes counterparties and sealed terms. | “Third, private markets. A team can coordinate an RFQ, sealed bids, risk limits, and lifecycle decisions without publishing every counterparty or term. Operators see the state they need—window, capacity, policy, and aggregate signal—while sensitive market data stays inside the workspace.” | **03 / PRIVATE MARKETS** then **SEE THE SIGNAL. NOT THE COUNTERPARTY.** | Add two quiet trading-console ticks, never a cash-register sound. Crossfade into Launchpad on the lifecycle-state change. |
| **1:47–2:15** | **Feature 4 — Launchpad.** Open a project room, then push into a milestone, private allocation commitment, readiness indicator, and release-request state. Clearly display the wallet-gated execution boundary and the public-proof limitation. | “Fourth, Launchpad. Veyra gives a private project room a disciplined capital workflow: allocation commitments, milestone readiness, release requests, and audit context. These are governed coordination records until a user-owned wallet action and a confirmed receipt exist. That boundary is the point.” | **04 / PRIVATE LAUNCHPAD** then **GOVERN BEFORE RELEASE.** and **COORDINATION ≠ SETTLEMENT.** | Let the music widen slightly; one soft confirmation chime on milestone readiness, not on release. |
| **2:15–2:40** | **Technical highlight.** Use a clean animated architecture plate, then quick source-backed callouts: React/Vite client; Express/tRPC API; Drizzle/MySQL coordination state; Starknet wallet-standard seam; `wallet_strk20InvokeTransaction`; Starknet receipt verifier; non-custodial Cairo commitment registry. End on root `strk20.json` with the three hashes visibly truncated and an “evidence boundary” annotation. | “Under the hood, Veyra separates coordination from custody. React and Vite deliver the workspace; Express, tRPC, Drizzle, and MySQL enforce membership, policy, idempotency, and audit state. The wallet owns the STRK20 action. Starknet receipts decide confirmation. And the repository exposes three verified Mainnet privacy-pool receipts—without pretending that public data can reveal a recipient’s private note.” | **WALLET SIGNS. VEYRA COORDINATES.** Followed by **RECEIPT > UI STATE** and **3 VERIFIED MAINNET POOL RECEIPTS**. Footnote: *Recipient private-note discovery remains wallet-visible only.* | Music ducks for the technical line, then adds a restrained rising arpeggio. No “blockchain” stock SFX. |
| **2:40–2:56** | Return to a full, live Veyra workspace at the Vercel URL. Scroll smoothly from a ready-to-sign route to the receipt/proof area, then settle on the working product—not a logo card. Hold 2 seconds on the product with the wordmark in the header. | “Veyra gives Starknet teams a better financial operating model: coordinate privately, authorize with the wallet, verify the receipt, and reveal only the proof. This is private financial coordination built for STRK20.” | **COORDINATE PRIVATELY. / VERIFY OPENLY.** Lower third: **VEYRA · STARKNET MAINNET** and `veyra-gamma-gold.vercel.app`. | Resolve the music on the final live-product hold; no fade-to-black. End on a natural UI glow. |

## Voiceover pacing target

Record in a calm, decisive, technically literate voice at approximately **132–138 words per minute**, leaving micro-pauses after “private spreadsheet,” “receipt,” “no public fallback,” and “three verified Mainnet pool receipts.” The narrator should sound like a product builder explaining an operational system—not a trailer voice or a pitch contest host.

## Captions and overlay system

The caption file should be authored from the approved voiceover recording, not generated solely from the script. Use two lines maximum, 58–68 px bold sans-serif at 1080p, moon ivory on a 72% graphite translucent backing, and vermilion word emphasis. Place it inside the lower safe area with at least 80 px margin and dynamically move it above controls when it would cover a primary interaction. Feature identifier overlays should appear once per chapter, scale from 96% to 100% with opacity, and exit before the next click.

## Export requirements after approval

| Deliverable | Specification |
| --- | --- |
| **Captioned master** | 1920×1080, 60 fps, H.264 High Profile, 8–12 Mbps VBR, AAC 48 kHz, captions burned in, maximum runtime 2:56. |
| **Clean master** | Identical edit, grade, framing, and audio; no burned captions or caption backing. |
| **Review file** | A lower-bitrate review MP4 plus a separate `.srt` caption file for accessibility and judge upload options. |
| **Quality gate** | Verify exact runtime, no clipped narration, legible captions at 720p, no sensitive information, no claim that public receipts prove private-note delivery, and a working final product shot. |

## Approval questions

Approve this script as written, or specify changes to any of the following before generation begins: the hook intensity, the feature order, the technical depth, the narrator tone, whether the private-markets/launchpad montage stays in, and whether the final line should name the team as **Forgeclaw**.
