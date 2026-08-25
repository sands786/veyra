# STRK20 Private Sprint: Top-Ten Evidence Snapshot and Veyra Comparison

**Prepared by:** Manus AI  
**Evidence snapshot:** 25 August 2026  
**Scope:** Public repository, official-registry, official-project-dataset, demo, metadata, and Mainnet-evidence review. This is a competitive assessment, **not** an official panel ranking.

## Executive conclusion

> **Veyra will not be considered through the official hub until its registry pull request is opened and merged.** The current official `registry.json` and generated `projects.json` contain no `sands786/veyra` entry. The sprint instructions explicitly say that a merged registry pull request is how a project appears on the hub. [1] [3] [4]

The official hub does **not** publish a pre-judging top-ten leaderboard. It publishes projects and requirement status; a named panel scores projects after submissions close. The correct answer is therefore not “the official top ten,” but **the ten strongest visible candidates under a reproducible public-evidence proxy**. [1] [2]

On pure product breadth, workflow design, security posture, and documentation, Veyra is genuinely competitive. It has a clearer institutional thesis than most projects: **private financial coordination—payroll, treasury policy, claims, selective proof, private-market workflow, and launchpad operations—without custody or secret handling**. Its README precisely distinguishes intent, wallet authorization, receipt confirmation, and selective proof. [5]

However, Veyra is **not a top-three candidate today**. The projects most likely to beat it can demonstrate a custom anonymizer or a complete user-level Mainnet lifecycle, while Veyra’s public evidence is three pool transactions plus a strong control-plane product. Veyra itself candidly states that recipient-wallet private-note discovery for the historic transfer remains unresolved and that it has no fund-moving deployed Cairo interface. [5] The registry absence is the immediate scoreability blocker; it matters more than any UI or README improvement.

## What the official rules actually reward

The official rules require a public, open-source repository with a license, a live demo, **a three-minute demo video**, and at least three successful Mainnet transaction hashes touching the STRK20 pool in root `strk20.json`. The stated panel weighting is 30% STRK20 integration depth, 30% working Mainnet product, 25% innovation, and 15% documentation/open-source quality. [1]

| Official dimension | Weight | Evidence a strong project shows | Veyra’s current position |
|---|---:|---|---|
| STRK20 integration depth | 30% | Real wallet flow, custom `privacy_invoke`/anonymizer logic where appropriate, correctly bounded privacy claims. | Good wallet and receipt boundary; weaker than custom-anonymizer leaders. |
| Working Mainnet product | 30% | A real end-to-end user lifecycle, not merely a successful pool receipt. | Three valid public pool receipts, but recipient-side delivery in the historic private route is unresolved. |
| Innovation | 25% | A problem where privacy changes the product, not a generic dashboard with a privacy tab. | Strong: institutional coordination plus proof-minimisation is a differentiated thesis. |
| Documentation and open source | 15% | Clear architecture, reproducible setup, honest threat model, license, and evidence trail. | A Veyra strength; likely upper tier of this category. |

## The top ten strongest visible candidates by official public-evidence proxy

The official dataset was refreshed on 25 August. It exposes public fields including verified pool-transaction count, deployed contracts, demo/video flags, Mainnet flag, activity, and structured assessments. It does **not** expose a judge score or final placement. I used only those visible fields to calculate a deterministic availability/completeness proxy, then read the public repositories to identify contradictions and limits. [2] [6]

| Proxy rank | Project | Official dataset signal | Why it is a serious competitor | Important qualification |
|---:|---|---|---|---|
| 1 | **Philoxenia** | 3 verified pool transactions; 3 contracts; demo, video, and Mainnet flags all true. | Private hospitality marketplace with escrow, private payment, social discovery, and a live demo/video. [2] [7] | Operationally tied to Ready X private-payment support and its specific wallet environment. |
| 2 | **Morrow** | 3 verified pool transactions; 1 contract; all three requirement flags true. | Good privacy-preflight explanation and a live app/video. [2] [8] | Its README says the helper is not deployed and the complete claim/recovery user flow remains unverified; hub flags and README conflict. |
| 3 | **Doom** | 4 verified pool transactions; 14 Mainnet contracts; demo, video, and Mainnet true. | The clearest complete custom-privacy application reviewed: private prediction markets, live markets, anonymizer contracts, and an end-to-end three-minute demo. [2] [9] | The team honestly records claim-secret and timing-correlation limits. |
| 4 | **Aperture** | 7 verified pool transactions; 4 contracts; demo/Mainnet true; no current video flag. | Deep DAO governance and shielded-treasury engineering, with strong test/evidence disclosure. [2] [10] | Lacks the dataset’s video flag and documents meaningful permanent-loss/trust-model risks. |
| 5 | **Lantern** | 5 verified pool transactions; 1 contract; demo, video, and Mainnet true. | Full private crowdfunding lifecycle: create, contribute, reach target, and privately claim funds on Mainnet. [2] [11] | Narrower than Veyra, but its narrower scope is more completely proven. |
| 6 | **Envelope** | 3 verified pool transactions; 1 contract; demo/Mainnet true; no current video flag. | Well-engineered payment-link primitive with an SDK/CLI and signature-based claim design that mitigates preimage front-running. [2] [12] | Amounts and funding/claim legs are public and linkable; its public fallback is not the private route. |
| 7 | **Airlock** | 4 verified pool transactions; 3 contracts; demo/Mainnet true; no current video flag. | Mainnet denomination bucketer plus unusually strong public anonymity/timing analysis and test coverage. [2] [13] | The repository says a real full wallet round trip is the remaining integration closure. |
| 8 | **Cutout** | 4 verified pool transactions; no contract; demo/Mainnet true; no current video flag. | Very disciplined wallet-native guard: deterministic preflight, receipt verification, public evidence snapshots, and fail-closed action scope. [2] [14] | It intentionally does not become a full private-payment/co-ordination product. |
| 9 | **Booty Bank** | 3 verified pool transactions; no listed contract; demo/Mainnet true; no current video flag. | Broad consumer-finance thesis, private income credential work, and well-labelled technical/partner boundaries. [2] [15] | Many banking surfaces remain preview, partner, or roadmap; private payout anonymizer work is gated. |
| 10 | **Aegis Rescue** | 3 verified pool transactions; 1 contract; demo/Mainnet true; no current video flag. | Concrete whitehat-rescue workflow with GitHub-owner claims and STRK20 private payout design. [2] [16] | The private payout still needs a connected wallet; unattended rescue introduces operational-risk questions. |

**Why this table is intentionally not called an official ranking.** The proxy favors demonstrable prerequisites and public submission completeness. It is not an opinion about the final winner. For example, Morrow receives a strong proxy position from its current dataset flags, but its own README self-reports a less complete implementation. Conversely, a project such as Crosslink is a strong technical benchmark even though it did not land in this proxy ten: it has a live privacy meter/API surface and records three pool transactions. [2] [17]

## Honest Veyra comparison

The estimates below use the official 30/30/25/15 dimensions as a disciplined scouting framework. They are **not judge scores**, do not claim that a contract has been audited, and do not award Mainnet-product credit for Demo Mode. A separate transparent scorecard with the assumptions is stored alongside this report. [1] [18]

| Dimension | Veyra’s defensible advantage | What the best competitors do better | Frank assessment |
|---|---|---|---|
| STRK20 integration | Veyra uses the wallet-owned STRK20 action boundary, blocks generic/public fallback paths, persists public hashes, and verifies receipts before settlement. [5] | Doom, Lantern, Envelope, Airlock, and Aperture can point to deployed custom logic that changes what a private user can actually do. [9] [11] [12] [13] [10] | **Middle tier.** Veyra integrates carefully, but current public proof is more wallet/control-plane than Veyra-owned onchain mechanism. |
| Working Mainnet product | Veyra has a deployed judge path, three verified public pool receipts, strict confirmation states, full-stack workflow controls, and no secret custody. [5] | Lantern demonstrates closed-loop contribution/payout; Doom demonstrates the actual product action and private payout return; Philoxenia has live private checkout/escrow. [11] [9] [7] | **Below the leading cohort.** A receipt proves pool interaction, not successful Veyra recipient delivery. |
| Innovation | It combines private payroll, treasury guardrails, claims, selective proofs, launchpad governance, and private-market workflow in one institutional operating layer. [5] | Doom and Envelope deliver sharper single-primitive novelty; Airlock/Cutout make privacy quality itself the product. [9] [12] [13] [14] | **Strong but needs focus.** The pitch should lead with “private financial control plane,” not a long feature inventory. |
| Documentation & open source | Architecture, threat model, decision record, reviewer guide, evidence handoff, test/build path, and explicit non-goals are unusually strong. [5] | Philoxenia, Airlock, Cutout, and Envelope also publish clear limits and reproducible material. [7] [13] [14] [12] | **Upper tier.** This is Veyra’s best scoring category, but it is capped at 15%. |
| Submission scoreability | Veyra has a public MIT repository, live Vercel URL, and three listed hashes. [5] | The four dataset projects with all requirement flags currently satisfied—Philoxenia, Morrow, Doom, Lantern—are visibly scoreable on the hub. [2] | **Blocked.** Veyra is absent from both official data files and therefore is not presently in the panel’s visible project pipeline. |

### Where Veyra lands today

If it were registered **today**, the defensible assessment is **roughly #8–#10 inside this evidence-selected competitor group**, or about **75/100 on a deliberately conservative scouting model**. It is neither a weak project nor a credible top-three favourite at the moment.

The distinction matters. Veyra is stronger than many entries in product architecture, safety boundaries, and documentation. Yet top projects such as Doom, Lantern, Aperture, Philoxenia, Envelope, and Airlock have a clearer answer to the judge’s most expensive question: *“Show me the novel private action working end to end on Mainnet.”* [9] [11] [10] [7] [12] [13]

> **Brutally honest view:** Veyra cannot win from its current submitted state, because it is not currently submitted to the hub. After the registry and video problems are corrected, it can become a credible shortlist project, but it would still need a more persuasive Veyra-owned end-to-end private outcome to beat the best custom-anonymizer applications.

## Three winner-critical actions, in order

| Priority | Action | Why it matters | What “done” means |
|---:|---|---|---|
| 1 | **Open the prepared registry pull request.** | This is the only action that makes Veyra appear on the official hub; it is a hard prerequisite rather than polish. [1] | Open the already-prepared user-owned PR: [compare and create pull request](https://github.com/starkience/strk20-hackathon/compare/main...sands786:strk20-hackathon:register-veyra?expand=1). Then wait for the automated check/merge and confirm Veyra appears in the hub dataset. |
| 2 | **Keep the official video mapping compliant and stable.** | The rules say a “3-minute demo video” is required to be scored. Veyra’s current `strk20.json` points to its existing 3:10 walkthrough, while the separately delivered two-minute package is a quality-first alternative. Do not replace the metadata-linked walkthrough with the two-minute file without making a deliberate compliance decision. [1] [5] | Confirm that the root `demo_video` URL stays publicly playable and points to the intended long-form walkthrough. If replacing it, use an evidence-safe video that is clearly consistent with the “3-minute” requirement. |
| 3 | **Demonstrate one complete Veyra-owned private workflow without changing the privacy boundary.** | This is the largest 30%-Mainnet-product gap relative to Lantern/Doom/Envelope. [9] [11] [12] | A recorded, reproducible flow from Veyra route approval to the official wallet action, returned hash, confirmed receipt, and recipient-wallet-visible result. The evidence must not collect seeds, private keys, viewing keys, or note material. If wallet discovery cannot be confirmed, document that limitation plainly rather than simulating settlement. |

The fourth priority, only after the three items above, is **pitch compression**: position Veyra as the *institutional control plane for private financial operations*—policy → wallet authorization → verified receipt → selective proof. Payroll, claims, launchpad, and markets then become evidence that the control plane scales across financial coordination, not a scattered list of features.

## Final decision

Do **not** describe Veyra as “top ten” or “likely to win” in public. Describe it as a privacy-first Starknet coordination product with rigorous safety boundaries, a live Vercel reviewer path, three verified pool receipts, and explicitly stated remaining Mainnet delivery limitations. That framing is credible, defensible, and materially better than overstating settlement.

The correct next move is simple: **open the registry PR first**. Until that happens, no amount of visual refinement changes Veyra’s official competitive position.

## References

[1]: https://github.com/starkience/strk20-hackathon "STRK20 Private Sprint — official repository, application process, requirements, and judging rubric"
[2]: https://raw.githubusercontent.com/starkience/strk20-hackathon/main/projects.json "STRK20 Private Sprint — generated public project dataset"
[3]: https://raw.githubusercontent.com/starkience/strk20-hackathon/main/registry.json "STRK20 Private Sprint — official project registry"
[4]: https://github.com/starkience/strk20-hackathon/compare/main...sands786:strk20-hackathon:register-veyra?expand=1 "Prepared user-owned Veyra registry pull-request comparison"
[5]: https://github.com/sands786/veyra "Veyra public repository and judge-facing evidence"
[6]: docs/audit/strk20-projects-proxy-ranking.json "Local deterministic proxy calculated from the official project dataset"
[7]: https://github.com/SergioSSantiago/philoxenia "Philoxenia repository"
[8]: https://github.com/nftkingiii/Morrow "Morrow repository"
[9]: https://github.com/neromtoobad/doom "Doom repository"
[10]: https://github.com/OoJae/aperture-strk20 "Aperture repository"
[11]: https://github.com/PhiBao/lantern "Lantern repository"
[12]: https://github.com/0xrlawrence/envelope "Envelope repository"
[13]: https://github.com/kenkomu/airlock "Airlock repository"
[14]: https://github.com/dmetagame/cutout "Cutout repository"
[15]: https://github.com/odinfree/booty-bank "Booty Bank repository"
[16]: https://github.com/justbiar/aegis "Aegis Rescue repository"
[17]: https://github.com/CaptainDiv/crosslink "Crosslink repository"
[18]: docs/audit/strk20-top-ten-scorecard.md "Detailed transparent scouting scorecard and assumptions"
