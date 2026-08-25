# STRK20 Private Sprint Competitor Research Notes

**Research date:** 25 August 2026

## Official baseline

The official repository describes an 18-day mainnet sprint. A named panel scores projects after the deadline on **STRK20 integration depth (30%)**, **working mainnet product (30%)**, **innovation (25%)**, and **documentation/open-source quality (15%)**. It requires a public repository and license, a public demo, three successful Mainnet STRK20-pool transaction hashes in `strk20.json`, and a “3-minute demo video.” The hub is a registry/progress surface refreshed from repositories; it does **not** publish an ordered top-ten leaderboard before judging. Any “top ten” below must therefore be treated as a research ranking of the strongest visible candidates, not as an official placing.

## Initial high-signal evidence

| Candidate | Observable strength | Material caveat |
|---|---|---|
| Crosslink | Live mainnet pool analysis, three listed receipts, hosted score API/npm package, explicit privacy refusal logic. | Its full cross-chain corridor and outbound anonymizer remain roadmap; wallet registration/availability friction is candidly documented. |
| GhostBook | Deployed Mainnet anonymizer, Cairo enforcement of order-plan terms, Ekubo integration, detailed contract/testing narrative. | Repository explicitly says it cannot currently complete a private Mainnet transaction because of wallet registration/proving limits. |
| Offbook | Specific private OTC/RFQ workflow, deployed settlement-helper address, explicit lock/claim lifecycle and private-secret boundary. | Need verify qualifying transaction metadata and live workflow independently; some market-board storage depends on Postgres. |
| Aether | Most developed privacy methodology: live attack-model analytics, deterministic planner, mainnet-grounded fact checks, 114 tests. | Its splitter is not deployed; private execution evidence is still landing and contracts are unaudited. |
| Rhizome | Very strong mainnet-data-driven privacy economics and candid fee/timing analysis. | Mainnet anonymizer is not deployed; paid execution fails closed, so depth does not equal a working full product. |
| Sevrin | Coherent confidential allocation system with Cairo vault/claim adapter and concrete credential model. | Mainnet addresses, qualifying transactions, public demo, and video are stated as pending. |
| Veyl | Strong consumer thesis and polished private launch/trading terminal narrative. | Repository states sealed-bid contract/back end and Mainnet demo are still active development; core is starter-kit base plus UI. |
| Nomos | Concrete merchant checkout/payout gateway with ledger, webhooks, and transaction verification. | Custodial operating-wallet model; live production configuration needs real infrastructure and manual shielding reconciliation. |

## Official hub dataset finding

The hub source explicitly describes a project grid fed by `projects.json`. At the time collected, the official dataset contained **146 projects** and exposed per-project `verified_txs`, `contracts`, `requirements.demo`, `requirements.video`, and `requirements.mainnet` fields. It did not expose a judge score or ordered leaderboard.

An evidence-completeness proxy over those official fields—not an official ranking—placed these projects at the top: **philoxenia, Morrow, Doom, Aperture, Lantern, envelope, Airlock, Cutout, Booty Bank, and Aegis Rescue**. Of these, the official dataset showed all three scoring prerequisites (`mainnet`, `demo`, and `video`) for **Philoxenia, Morrow, Doom, and Lantern**.

**Critical Veyra finding:** `https://github.com/sands786/veyra` was absent from both the live official `registry.json` and the generated `projects.json` at collection time. Therefore Veyra currently cannot appear on the official hub or be included in an official project-list comparison until the already-prepared registry pull request is opened and merged.

## Additional top-candidate evidence

| Candidate | Observable strength | Material caveat |
|---|---|---|
| Philoxenia | Three verified pool transactions, three listed contracts, live public demo/video, full-stack hospitality product with private payment/escrow surfaces. | Private payment support is tightly coupled to Ready X environment and ecosystem-specific operational prerequisites. |
| Doom | Four verified pool transactions, 14 listed contracts, a three-minute end-to-end demo, and live private prediction-market lifecycle. | Its own README acknowledges claim-secret and timing-correlation limitations. |
| Lantern | Five verified transactions, deployed STRK20 anonymizer, live campaign lifecycle from private contribution through private payout claim. | Narrower application scope than Veyra, but much stronger end-to-end product proof. |
| Aperture | 22 manifest hashes, four listed contracts, Mainnet anonymizer, detailed public evidence and candid failure record. | Its video field was still absent and multiple governance limitations remain. |
| Morrow | Has a live app/video and strong privacy-boundary documentation. | Repository itself says its helper is not deployed and a complete user flow has not been achieved; it is weaker than hub completeness fields imply. |
| Envelope | Deployed link-payment anonymizer, SDK/CLI, front-running-resistant claim signatures, and detailed privacy boundaries. | Amounts and funding/claim legs remain publicly visible and related; walletless claim applies only to its public-funding fallback. |
| Airlock | Mainnet bucketer, live pool census, 49 Cairo + 59 TypeScript tests, denomination/timing threat model. | A real full wallet round-trip remains the unclosed integration proof; cross-chain lane is not yet wired. |
| Cutout | Exceptionally disciplined signing guard, independent receipts, reproducible policy/indexer, and explicit fail-closed scope. | It is a narrow privacy preflight; it does not deliver a private coordination workflow or prove an end-to-end transfer. |
| Booty Bank | Broad consumer product surface with careful roadmap labeling, strong account/credential engineering, and substantial test claims. | Many banking rails are intentionally preview/partner/roadmap; private payout anonymizer is gated work. |
| Aegis Rescue | Live registry scan, genuine rescue problem, verified owner claim model, and real mainnet safe-wallet/pool evidence. | Private payout still requires a manually connected wallet and unattended scanning/execution increases operational risk. |

## Source additions

11. Official hub state dataset: https://raw.githubusercontent.com/starkience/strk20-hackathon/main/projects.json
12. Philoxenia: https://github.com/SergioSSantiago/philoxenia
13. Morrow: https://github.com/nftkingiii/Morrow
14. Doom: https://github.com/neromtoobad/doom
15. Lantern: https://github.com/PhiBao/lantern
16. Official project dataset parser output, generated from source 11: `docs/audit/strk20-projects-proxy-ranking.json`
17. Envelope: https://github.com/0xrlawrence/envelope
18. Airlock: https://github.com/kenkomu/airlock
19. Cutout: https://github.com/dmetagame/cutout
20. Booty Bank: https://github.com/odinfree/booty-bank
21. Aegis Rescue: https://github.com/justbiar/aegis

## Provisional Veyra position

Veyra is unusually broad for the sprint: private payroll, claims, selective disclosure, private-market workflow, treasury/operations, Launchpad allocation, and a large test/documentation footprint. It also has three publicly verified STRK20-pool receipts. Its limiting issue is not UI breadth: its live Veyra sender flow intentionally stops at the wallet-private recipient-channel boundary and the strongest recorded demo outcomes are visibly local simulations rather than a fully completed third-party private delivery. This is lower-risk engineering than fabricating a result, but it weakens the working-product score relative to a competitor that can show an end-to-end private route from its own app.

## Sources collected

1. Official requirements: https://github.com/starkience/strk20-hackathon
2. Official registry: https://raw.githubusercontent.com/starkience/strk20-hackathon/main/registry.json
3. Crosslink: https://github.com/CaptainDiv/crosslink
4. Veyl: https://github.com/codeswithroh/veyl
5. Offbook: https://github.com/Akinbola247/offbook
6. GhostBook: https://github.com/JemIIahh/ghostbook-starknet
7. Aether: https://github.com/shariqazeem/aether-strk20
8. Nomos: https://github.com/wheval/nomos
9. Rhizome: https://github.com/cipoklean/rhizome
10. Sevrin: https://github.com/velikanghost/sevrin
