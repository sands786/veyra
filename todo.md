# VeilPay Full SaaS Upgrade

## Phase 1 — Domain and scope

- [x] Define workspace, recipient, payment route, route recipient, transaction, and audit-event models.
- [x] Define role permissions for owner, admin, finance operator, and viewer.
- [x] Define STRK20 transaction states and failure/retry behavior.
- [x] Document privacy boundaries: never persist private keys or plaintext sensitive payment notes.

## Phase 2 — Backend capability

- [x] Upgrade the project to full-stack auth, database, and backend support.
- [x] Verify generated schema and server conventions.
- [x] Add required environment/secrets only through the project configuration flow.

## Phase 3 — Product flows

- [x] Replace demo route data with persisted workspace data.
- [x] Add recipient CRUD with validation and soft deletion.
- [x] Add route creation, draft editing, recipient assignment, and status transitions.
- [x] Add activity/audit history and transaction receipt views.

## Phase 4 — STRK20

- [x] Preserve the official `strk20InvokeTransaction` adapter boundary.
- [x] Add server-safe transaction intent creation and client wallet signing.
- [x] Persist only public transaction hashes, status, network, and timestamps.
- [x] Add receipt verification and retry-safe idempotency.

## Phase 5 — Hardening and UX

- [x] Enforce workspace membership and role checks on every backend mutation.
- [x] Validate amounts, token addresses, recipients, and route ownership.
- [x] Add loading, empty, error, and retry states.
- [x] Add responsive SaaS navigation and workspace switching.

## Phase 6 — Verification and delivery

- [x] Run typecheck, build, and local integration tests.
- [x] Verify the key user flows in the browser.
- [x] Save a checkpoint and document remaining mainnet configuration steps.

## Follow-up hardening discovered during SaaS review

- [x] Add explicit privacy-boundary documentation and remove or constrain sensitive note persistence.
- [x] Replace authenticated hardcoded activity and route values with form-driven persisted data.
- [x] Implement recipient edit, archive, restore, and UI management actions.
- [x] Implement route draft editing, selected-recipient assignment, and persisted status transitions.
- [x] Add audit-history and transaction-receipt queries and UI.
- [x] Persist blockchain transaction records on submit/confirm with receipt verification and idempotent retry handling.
- [x] Validate recipient ownership, token format, and route ownership inside mutations.
- [x] Add complete query/mutation error and retry UI states.
- [x] Implement workspace switching.
- [x] Re-verify authenticated workspace flows in the browser after these fixes.

## Final hardening pass

- [x] Enforce the privacy boundary in code by removing sensitive note persistence or applying server-side redaction.
- [x] Make route creation fully form-driven with explicit token and recipient selection.
- [x] Add consistent error and retry affordances for audit, route, recipient, and transaction operations.
- [x] Exercise and document authenticated recipient, route, archive/restore, refresh, and transaction-recording flows in the browser.

## Selection integrity follow-up

- [x] Sanitize selected recipient IDs against the current active workspace recipients before route creation and clear archived selections.
- [x] Remove stale recipient-count state and hardcoded unit cues from the route builder.

## Final evidence and receipt pass

- [x] Add route draft update/edit API and UI for existing saved drafts.
- [x] Render a real audit-history list and transaction-receipt panel in the frontend.
- [x] Implement chain/provider receipt verification before allowing confirmed status.
- [x] Add consistent retry actions for route, recipient, and transaction mutations.
- [x] Historical final-evidence checklist superseded by the current user-owned Mainnet evidence item below.

## Mutation retry completeness

- [x] Add retry/error handlers for every remaining route, recipient, and transaction mutation, including draft updates, recipient archive/update/restore, and transaction confirmation.

## Navigation bug report

- [x] Make Payment routes, Proof ledger, and Identity keys sidebar items functional with active-state switching and section-specific content.

## Interaction completeness

- [x] Make every visible button functional: navigation, view contracts, proof actions, wallet controls, route actions, recipient actions, and mobile menu controls.
- [x] Add honest feedback or gated states for actions requiring authentication, a connected wallet, or persisted data.
- [x] Verify all visible controls with typecheck, tests, build, and responsive visual QA.

## Route edit feedback hardening

- [x] Make the proof-ledger EDIT action explicitly gated for non-draft routes.
- [x] Restore persisted route recipient assignments when loading a draft for editing.
- [x] Verify draft and non-draft edit behavior with tests or browser validation.

## Route edit verification evidence

- [x] Add a focused test covering draft edit state restoration and non-draft edit gating, then rerun the full verification suite.

## Logo treatment refinement

- [x] Remove the square logo container and render the VeilPay mark independently with transparent treatment across desktop and mobile surfaces.

## Workspace switching verification

- [x] Add focused workspace-selection tests for membership-scoped resolution and invalid workspace fallback.
- [x] Add an equivalent mobile workspace selector or responsive control.
- [x] Include workspace-list loading/error handling in the shared retry surface and rerun verification.

## Workspace resolver evidence

- [x] Add focused tests proving member-selected workspace resolution and unauthorized-ID fallback to the default accessible workspace.

## STRK20 Private Sprint compliance audit

- [x] Verify official eligibility, scope, deadline, judging rubric, and submission channel.
- [x] Verify required STRK20 SDK integration, registry metadata, deployment, and mainnet transaction evidence.
- [x] Verify repository, demo URL, video, README, and public proof requirements.
- [x] Map every requirement to VeilPay evidence and record honest gaps.

## Illustration blend refinement

- [x] Blend the right-corner privacy illustration into its dark panel with seamless masking, scale, placement, and responsive behavior.

## Desktop composition refinement

- [x] Reduce unused sidebar and content whitespace while preserving readable navigation and responsive behavior.

## SaaS expansion for STRK20 competition

- [x] Add scheduled payroll routes with timezone-safe schedule state, platform Heartbeat task IDs, callback handling, and operator pause/resume controls.
- [x] Add multi-approver route governance with configurable workspace approval thresholds, server-side settlement gating, and audit events.
- [x] Add shareable proof pages that reveal only public route/receipt metadata and never the private roster.
- [x] Add workspace-scoped operational analytics and CSV audit export.
- [x] Add backend authorization, validation, idempotency, and focused tests for the four operations features.
- [x] Add responsive UI states, authenticated gating, empty/error feedback, retry surfaces, and browser-verifiable controls for the four operations features.

## Differentiation expansion

- [x] Add a privacy-safe treasury command center with balance snapshots, reusable policies, spending limits, and route-level budget enforcement.
- [x] Add reusable payment policy templates with approval rules, token/network constraints, dry-run simulation, and wallet-signing guardrails.
- [x] Add a recipient self-claim flow using expiring private claim links, persist redemption data, and connect it to route fulfillment without exposing the roster publicly.
- [x] Add Starknet-native operational intelligence with proof-health and receipt-monitoring views plus privacy-preserving workspace activity insights.
- [x] Add focused Vitest coverage, responsive UI states, and production verification for the differentiation expansion.

## Differentiation hardening gaps

- [x] Enforce treasury daily-limit usage across active routes and include it in dry-run simulation.
- [x] Enforce policy network constraints in dry-run and route-creation guardrails.
- [x] Connect recipient claim redemption to route-recipient fulfillment state and payout readiness.
- [x] Add concrete proof-health and unresolved-receipt monitoring views, not only aggregate counters.

## Claim-link error repair

- [x] Diagnose the concrete runtime error shown in the claim-link workspace flow: comma-formatted amount values reached the strict treasury simulation validator; the existing route payload path was already normalizing commas.
- [x] Fix the affected workspace error path by normalizing numeric inputs before treasury simulation, while preserving the existing route/wallet normalization and privacy/authorization boundaries.
- [x] Add regression coverage and re-verify the claim flow visually and in production build.

## Workspace information architecture refactor

- [x] Keep the primary page focused on route creation, proof ledger, identity, and recent route status.
- [x] Move Operations, Treasury Guardrails, Recipient Claims, and monitoring into dedicated sidebar-accessible views.
- [x] Preserve mobile navigation, deep-linkable section targets, loading/error states, tests, and responsive spacing.

## Privacy-focused Starknet Launchpad

- [x] Define the launchpad product boundary: private project rooms, shielded allocations, milestone treasury releases, governance, claims, and public proof metadata.
- [x] Add launchpad database models and workspace-scoped APIs with privacy-preserving authorization and state transitions.
- [x] Add a dedicated Launchpad sidebar view without re-expanding the primary payroll page.
- [x] Add tests, responsive visual verification, and documentation of what is implemented versus what still requires real Starknet contracts or wallet transactions.
- [x] Add focused Launchpad tests for project/milestone contracts, allocation idempotency and privacy-safe summaries, and role authorization; rerun the full suite before checkpointing.

## Launchpad product polish

- [x] Replace the form-first Launchpad layout with a command-center hierarchy: overview, project status, milestone releases, and privacy signals.
- [x] Improve project, milestone, and allocation interactions with clearer validation, actionable empty states, and safer state transitions.
- [x] Refine the Copper Veil visual treatment with premium hierarchy, stronger cards, status accents, and responsive composition.
- [x] Add Launchpad polish regression coverage, production verification, and desktop/mobile visual QA.
- [x] Add polish-specific pure workflow tests for status progression, tab/view state, empty-state behavior, and disabled validation conditions; rerun the full suite before checkpointing.
- [x] Add deterministic Launchpad view-state helpers for default tab selection, visible panel resolution, and no-project/no-milestone empty states; test them and rerun the full suite before checkpointing.

## Full interaction audit

- [x] Inventory every button and interactive control across Home, Launchpad, Claim, Proof, navigation, and wallet surfaces.
- [x] Fix dead, misleading, duplicate, or unsafe handlers and add consistent pending, disabled, success, and error feedback.
- [x] Add interaction-contract regression tests and verify primary controls at desktop and mobile widths.
- [x] Centralize clipboard success/failure handling for proof links, claim links, and Launchpad references.
- [x] Add focused interaction-contract tests for explicit route selection, single-recipient claim gating, wallet pending lock, and clipboard success/failure behavior.
- [x] Re-run typecheck, full Vitest suite, production build, and desktop/mobile QA before final checkpoint.
- [x] Refactor Launchpad room-reference copy to use the shared clipboard helper, then rerun typecheck/tests/build and responsive QA.

## Launchpad production SaaS upgrade

- [x] Audit and document the current Launchpad gaps versus a production SaaS: onboarding, project portfolio, contributor operations, release readiness, activity/audit, and real execution boundaries.
- [x] Add persisted project operating metadata and workspace-scoped operational APIs for project lifecycle, readiness, contributor allocation status, and release operations.
- [x] Add a real project portfolio and project-detail workspace with actionable status, activity, milestone, allocation, and proof surfaces.
- [x] Add production-oriented validation, permission states, loading/error/empty states, tests, and documentation distinguishing persisted SaaS behavior from pending wallet/onchain execution.

## Launchpad SaaS evidence gaps

- [x] Add a workspace-scoped Launchpad allocations query exposing privacy-safe allocation statuses for operators and render it in the control room.
- [x] Add explicit Launchpad query error/retry UI for portfolio, project operations, readiness, activity, and release-request surfaces.
- [x] Add focused tests for Launchpad project-ops/release-request permissions, readiness/release failure paths, and allocation-status retrieval.

## Launchpad backend test evidence gaps

- [x] Add router-level tests proving project-ops and release-request procedures reject unauthorized member roles.
- [x] Add a focused test for workspace-scoped Launchpad allocation retrieval and privacy-safe projection.

## Launchpad privacy projection evidence

- [x] Assert through the Launchpad allocation procedure that encrypted references and claimed wallet addresses are excluded while workspace scoping is preserved.

## Demo Mode expansion

- [x] Add a clearly labeled, persisted Demo Mode switch with deterministic local workspace data and an exit path back to production mode.
- [x] Make every primary VeilPay and Launchpad interaction demonstrable in Demo Mode without calling production mutations or claiming real onchain execution.
- [x] Add Demo Mode loading, success, error, reset, wallet, claim, proof, governance, treasury, and Launchpad release feedback states.
- [x] Add focused Demo Mode tests, responsive visual QA, and documentation that separates simulated activity from authenticated/onchain evidence.

## Demo Mode completeness gaps

- [x] Make the persisted Demo Mode marker app-wide so Home, Launchpad, Claim, Proof, wallet, and operations surfaces can read the same mode boundary.
- [x] Expand the demo workspace with recipient CRUD, route editing/status transitions, transaction/receipt confirmation, and deeper Launchpad operations.
- [x] Add explicit simulated error and retry states for wallet, treasury, claims, proof publication, governance, and release actions.

## Demo Mode evidence hardening

- [x] Wire the shared Demo Mode context into Home, Launchpad, Claim, and Proof so each route visibly reflects the same boundary and exit behavior.
- [x] Replace toast-only demo controls with deterministic local recipient CRUD, route status/edit, and receipt state updates rendered in the workspace.
- [x] Add per-surface simulated failure and retry handlers for wallet, treasury, claims, proof, governance, and Launchpad release actions.

## Demo Mode final evidence correction

- [x] Add explicit Demo Mode boundary UI and exit behavior inside Launchpad, and consistent visible route-level chrome in Home, Claim, and Proof.
- [x] Add action-level simulated failure and retry flows for demo wallet connection, treasury dry-run, claim redemption, proof publication, governance decisions, and Launchpad release actions.

## Demo Mode final action evidence

- [x] Add visible Demo Mode route chrome on Home regardless of auth state, plus an explicit in-page Demo exit control inside Launchpad.
- [x] Wire action-specific simulated failures and retries directly into wallet connect, treasury dry-run, claim redemption, proof publication, governance decision, and Launchpad release buttons.
- [x] Add focused tests proving route-boundary visibility and named Demo action failure/recovery transitions.

## Product walkthrough video

- [x] Create and deliver a polished VeilPay Demo Mode walkthrough video covering Payroll, Operations, Treasury, Claims, Launchpad, and Proof, with the simulation-only boundary clearly narrated.

## Product teaser video

- [x] Create and deliver a short VeilPay teaser video with a strong privacy-payment hook, Starknet positioning, and a clear product call to action.

## Coming Soon typographic teaser

- [x] Create and deliver a complete Coming Soon teaser film with a typographic intro, cinematic product reveal, privacy/Starknet message, and final VeilPay call to action.

## Audio-enhanced teaser

- [x] Add a restrained cinematic electronic music bed to the Coming Soon teaser and deliver a validated final video with audio.

## Documentation section

- [x] Add a first-class Documentation sidebar entry and route with the Coming Soon teaser video at the top.
- [x] Add complete documentation content covering motivation, market gap, product surfaces, privacy boundaries, Starknet architecture, Demo Mode, and execution limitations.
- [x] Add visual simulations for the payment route, privacy boundary, treasury governance, private claims, Launchpad milestones, proof publication, and Demo Mode flow.
- [x] Add uploaded teaser media, responsive QA, focused tests, and documentation route verification.

## Complete Demo Mode walkthrough film

- [x] Create and deliver a complete intro-to-demo walkthrough film explaining every Demo Mode function, simulated state, failure/retry path, and production boundary.

## Corrected detailed voiceover walkthrough

- [x] Rebuild the Demo Mode walkthrough as a 2+ minute video with dedicated visuals for every surface, no music bed, and clear loud voiceover explaining each workflow, simulation state, failure/retry path, and production boundary.

## Standalone function videos

- [x] Create separate clear-voice videos for Payroll, Operations, Treasury, Private Claims, Launchpad, Public Proof, Wallet/Execution Boundary, and Demo Mode error/retry behavior, with no music and dedicated visuals for each function.

## Video-led Documentation expansion

- [x] Upload all eight standalone function videos to lifecycle-safe project storage and embed them in the Documentation page.
- [x] Add detailed explanations for Payroll, Operations, Treasury, Private Claims, Launchpad, Public Proof, Wallet/Execution Boundary, and Demo Mode Error + Retry beside each video.
- [x] Add responsive video QA, focused documentation-contract tests, and update the project QA record.

## Reference-matched explanatory videos

- [x] Analyze the attached reference’s pacing, screen-led explanation, annotation, narration, and section structure.
- [x] Replace all eight standalone Documentation videos with reference-matched step-by-step VeilPay walkthroughs using dedicated UI sequences and explanatory callouts.
- [x] Upload replacement assets, update Documentation metadata/tests, and verify desktop/mobile playback and layout.

- [x] Update VeilPay deployment narrative and pitch deck to cover both Starknet testnet verification and mainnet execution, with explicit evidence boundaries
- [x] Validate and document the testnet/mainnet readiness checklist without claiming transactions that have not been completed

- [x] Implement a clearly labeled Starknet testnet network path in VeilPay with mainnet separation
- [x] Add testnet transaction status, receipt, and evidence boundaries without claiming mainnet proof
- [x] Add a one-click reproducible testnet round-trip/reconciliation demo with UNKNOWN outcome handling and transcript export
- [x] Add tests, documentation, and responsive verification for the testnet and reconciliation flows

- [x] Make the Mainnet/Testnet selector more prominent and verify safe network switching behavior

- [x] Optimize query refetch behavior and perceived loading smoothness
- [x] Improve mobile/header interaction density and reduce unnecessary visual motion
- [x] Verify final smoothness pass with tests, build, and responsive screenshots

- [x] Simplify the top header by removing unnecessary labels and reducing control density

- [x] Inspect the referenced StarkWare post and select 2–3 ideas relevant to VeilPay
- [x] Implement the selected StarkWare-inspired features with privacy and network safety preserved
- [x] Add tests, documentation, and responsive verification for the new features

- [x] Audit every Demo Mode-only path and current Starknet execution boundary
- [x] Convert simulated business actions into authenticated persisted backend workflows
- [x] Replace demo-only UI actions with real database-backed state and network-aware transaction records
- [x] Add real privacy, authorization, testnet, and failure-path verification for the converted workflows
- [x] Update documentation to distinguish real SaaS behavior, testnet execution, mainnet readiness, and remaining wallet-owned evidence

- [x] Add a Veyl-inspired Private Markets workspace with private trader identity and public aggregate signals
- [x] Add persisted shielded funding intent and sealed-bid launch workflows with authorization boundaries
- [x] Optimize the app around the new markets surface and verify privacy, tests, build, and responsive behavior
- [x] Document the Veyl-inspired markets boundary and remaining wallet-owned onchain evidence

- [x] Audit VeilPay against the Strix repository’s relevant security and quality patterns
- [x] Run safe static, dependency, authorization, privacy, transaction, and UX checks
- [x] Fix confirmed defects and add regression coverage
- [x] Document confirmed findings, limitations, and final verification results

- [x] Rebrand VeilPay as Veyra across app metadata, workspace identity, navigation, and product-line copy
- [x] Preserve technical VeilPay history only where required for evidence and compatibility
- [x] Verify Veyra branding consistency with tests, build, and responsive visual QA

- [x] Apply the Veyra Obsidian, Moon Ivory, Deep Tide, Emerald, Moon Silver, and restrained Vermilion palette across core surfaces
- [x] Verify color contrast, responsive rendering, tests, and production build after the palette update

- [x] Make the Veyra palette more prominent across navigation, controls, cards, and product surfaces
- [x] Create and integrate a distinctive legacy-grade Veyra logo mark and wordmark
- [x] Verify logo legibility, contrast, responsive rendering, tests, and production build

- [x] Refine the Veyra emblem into a clean Starknet-inspired shield mark with transparent background
- [x] Integrate the revised logo asset into the app and verify mark legibility across sizes

- [x] Remove the emblem container background, border, and radius so the Veyra logo reads as an independent transparent mark

- [x] Recolor and refine the Veyra emblem so its geometry, contrast, and accents match the app palette exactly

- [x] Remove the baked white square from the Veyra logo so it floats naturally on the dark sidebar

- [x] Improve Veyra font pairing, text scale, contrast, and line-height across core surfaces

- [x] Refine affected panel labels, statuses, metadata, and card typography for stronger contrast and easier scanning

- [x] Replace remaining mono-styled interface labels with a cleaner sans-serif treatment while preserving mono for code and wallet identifiers

- [x] Refine section eyebrow labels and divider treatment for stronger readability and hierarchy

- [x] Right-align workspace/account, Sign Out, network switch, and Connect Wallet controls in the desktop header while preserving mobile behavior

- [x] Remove the desktop workspace dropdown from the header while preserving mobile workspace switching

- [x] Replace native amount input controls with a smooth custom stepper and accessible up/down buttons

- [x] Complete a 10/10 pre-mainnet audit and polish pass across all workflows, states, responsive surfaces, privacy boundaries, documentation, and demo readiness

- [x] Upgrade Veyra toward a genuine on-chain Starknet protocol with wallet-authorized execution, contract configuration, reconciliation, and explicit pre-mainnet evidence boundaries

- [x] Generate a tested Cairo payroll settlement contract, ABI output, and user-operated Sepolia deployment package

- [x] Add Change wallet and Sign out wallet actions, detected Starknet wallet selection, and provider-supported QR/deep-link connection handling

- [x] Blend the privacy-state illustration into its existing panel while preserving current text layout and hierarchy

- [x] Benchmark competitor capability patterns and add authenticated Private Markets insights, operator control room, portfolio/risk summaries, and Private Primitives disclosure studio
- [x] Continue the competitor-grade expansion with persisted RFQ/quote workflows, market reveal/settlement lifecycle, richer portfolio history, configurable risk limits, alerts, exports, and contract-backed settlement for every new surface

- [x] Upgrade Veyra into a full institutional flagship app with persisted RFQ/execution workflows, configurable risk and approvals, alerts, portfolio analytics, reconciliation, exports, audit views, and hardened privacy/contract boundaries

- [x] Add persisted RFQ quote creation, all-in quote comparison, accept/reject lifecycle, configurable market risk policy, and privacy-safe CSV book export

- [x] Correct Private Primitives so links and values remain explicitly unsigned/pending until a real wallet signature and confirmed Starknet receipt exist

- [x] Apply explicit persisted/unsigned/wallet-pending/submitted/confirmed/failed semantics across every Veyra option and prevent unconfirmed records from appearing as real settlement evidence

- [x] Create and deliver a rebranded Veyra teaser video covering institutional privacy-finance features and honest Starknet receipt boundaries

- [x] Create and deliver a three-minute, submission-grade Veyra product demo video with accurate feature narration and an explicit mainnet-evidence boundary

- [x] Rebuild the Veyra submission demo as a memorable, cinematic institutional product film with premium motion typography and teaser-grade visual storytelling

- [x] Add premium animated cursor movement, click feedback, and scroll-through interactions to the cinematic Veyra submission film

- [x] Elevate the Veyra interactive cinematic film with a beast-level opening hook, richer dimensional motion, premium transitions, a Private Markets climax, and an unforgettable final resolve

- [x] Restore the preferred prior teaser-style opening to the final Veyra cinematic film while preserving the upgraded interactive middle and ending

- [x] Replace every VeilPay-era in-app documentation video with Veyra-branded section walkthroughs using animated cursor interactions and smooth scrolling

- [x] Refresh the Documentation teaser presentation around the restored-final Veyra cinematic asset with Veyra-specific framing and copy

- [x] Create a 30-second Veyra cinematic teaser with voice and original music, embed it in the lower-right main hero, and remove the standalone teaser button

- [x] Fix the main-hero Veyra teaser visibility so the embedded 30-second film is immediately visible in the user-facing viewport

- [x] Move the 30-second Veyra teaser out of the main hero and into a dedicated lower main-page cinematic section

- [x] Add a clear Veyra wordmark beside the shield in the opening reveal of the 30-second teaser and republish it in the lower-page player

- [x] Rebuild the first ten seconds of the teaser to eliminate transition overlap and deliver a clean world-class Veyra opening

- [x] Repair the Veyra Documentation sidebar route, which currently returns a 404 and blocks a complete submission-demo walkthrough

- [x] Replace the in-app Veyra logo with the exact teaser shield-and-wordmark treatment and verify responsive presentation

- [x] Replace the earlier shield artwork with the actual Veyra cinematic teaser logo mark across all brand lockups

- [x] Remove the STRK20 slash descriptor and refine the Veyra wordmark into a clean premium title-case lockup

- [x] Redesign the workspace sidebar navigation into an institutional control rail with refined grouping, active states, and responsive behavior

- [x] Remove shivering and shaking artifacts from the Veyra teaser, submission demo, and documentation videos, then republish stable cuts

- [x] Refine teaser and documentation video-section typography, spacing, player framing, and metadata into premium editorial viewing surfaces

- [x] Complete the Vercel frontend deployment path with Veyra-owned authentication; no Manus callback configuration is required

- [x] Rebuild the GitHub README as a flagship Veyra product document with branding, teaser, walkthrough, architecture, verified boundaries, and developer guidance

- [x] Expand the Veyra README into a code-grounded institutional technical guide with architecture, trust boundaries, data model, state machines, deployment topology, testing, and evidence matrix

- [x] Recompose the documentation into a reviewer-first premium experience with visual architecture plates, trust map, invariants, threat model, decision log, and 90-second evaluation path

- [x] Replace README teaser and walkthrough links with direct in-page video players and preserve accessible fallback text

- [x] Correct the trust-map proof-card overflow and republish the balanced documentation visual

- [x] Recompose the trust-map heading into a fully visible two-line editorial title and republish the corrected asset

- [x] Separate trust-map flow captions from arrows and card edges, then republish the collision-free visual

- [x] Complete a full trust-map visual QA rebuild covering headline fit, card padding, caption lanes, arrow spacing, and GitHub-scale readability

- [x] Rebuild the system-architecture plate with contained card titles, dedicated connector captions, and full README-scale visual QA

- [x] Add a Vercel-ready manual deployment package with serverless routing, environment template, and Manus OAuth configuration guidance
- [x] Restore missing embedded video players in the Documentation film library and verify playback surfaces
- [x] Recompose the Documentation product-film metadata at narrow widths and elevate chapter-navigation controls with premium accessible motion
- [x] Remove the redundant Format, Audio, and Motion metadata strip from the Documentation film presentation
- [x] Redesign sidebar group labels, dividers, and navigation states into a clearer premium institutional control rail
- [x] Assign distinct semantic icons to every sidebar destination, eliminating duplicated Identity, Private Primitives, Operations, and Private Markets symbols
- [x] Restore the stronger Veyra shield-and-wordmark opening to the current 30-second teaser while preserving stabilized pacing
- [x] Replace Manus OAuth Sign In on the Vercel-hosted frontend with Veyra-owned account registration, sign-in, and same-origin session handling
- [x] Verify that the Vercel project deploys the latest Veyra GitHub commit and resolve any stale-deployment path
- [x] Retire the Vercel callback-origin allowlist dependency by moving Veyra authentication to an application-owned credential flow
- [x] Align the Vercel deployment with a server-side OAuth configuration and session path without exposing backend secrets
- [x] Reconcile the Vercel frontend-plus-managed-backend OAuth architecture with the supplied full-stack deployment guidance
- [x] Conduct a full frontend, backend, persistence, authorization, deployment, and critical-flow audit; fix verified defects with regression coverage
- [x] Harden public claim responses and redemption against route-total disclosure and concurrent double-redemption races
- [x] Enforce route allocation uniqueness and exact totals, and validate backend route lifecycle transitions against the shared state machine
- [x] Remove unused template-only UI modules and their vulnerable production dependencies from the shipped Veyra application
- [x] Perform an independent second-pass verification of the hardened release across runtime, database, builds, dependencies, and public boundaries
- [x] Repair the confirmed Private Markets sidebar route, which currently resolves to a generic 404 instead of the Private Markets workspace
- [x] Bring missing-resource and unavailable claim/proof screens into the Veyra institutional visual system with precise privacy-aware recovery guidance
- [x] Reassert Veyra’s graphite, ivory, and vermilion hierarchy on selected teal-heavy core workspace cards without reducing operational legibility
- [x] Add tangible sealed-record and receipt/provenance artifacts to selected core workspace surfaces, with focused visual regression coverage
- [x] Replace Manus-dependent OAuth with Veyra-owned email-and-password registration, sign-in, session, and sign-out flows that work without a callback allowlist
- [x] Preserve existing protected workspace authorization and add tests for account registration, sign-in, session creation, protected access, and sign-out
- [x] Replace the Vercel OAuth blocker documentation with the Veyra-owned authentication deployment path and verify both deployment builds
- [x] Resolve the confirmed stale Vercel deployment, which still serves the pre-migration generic 404 at /sign-in after the current GitHub revision was pushed
- [x] Add an explicit Sign Up entry point for unauthenticated visitors and make wallet discovery and Connect Wallet controls visible only after successful Veyra authentication
- [x] Repair the new-account workspace bootstrap failure that occurs when the backend inserts the first private workspace after authentication
- [x] Remove testnet selection and testnet-only product paths, then enforce a mainnet-only Veyra interface with updated transaction-boundary copy and regression coverage
- [x] Redesign Veyra into a cohesive glass interface across workspace, authentication, and protocol pages while preserving every functional behavior and adding visual regression coverage
- [x] Optimize client delivery, query behavior, and heavy media handling for smoother Veyra operations without changing features or security boundaries
- [x] Complete a fresh top-tier security audit of all Veyra source, schema, routes, dependencies, deployment boundaries, and runtime behavior; fix verified code-owned findings and revalidate the release
- [x] Harden launchpad release-request transitions so terminal decisions cannot be overwritten or audited repeatedly
- [x] Serialize private-market bid acceptance and aggregate updates so concurrent sealed bids cannot overwrite public volume or participant counts
- [x] Sanitize scheduled-payroll failure responses so database and internal error strings are never returned to the caller
- [x] Require a non-empty receipt or proof reference before creating any active public proof link
- [x] Make payment-route creation and draft editing atomic so route rows cannot outlive failed allocation or audit writes
- [x] Add origin and Fetch Metadata protection for browser state-changing tRPC requests so cross-site callers cannot replay cookie-authenticated mutations
- [x] Complete one-by-one source audit of every tracked Veyra application, configuration, migration, and test file; fix verified defects and revalidate the complete release
- [x] Remove the private-market Sepolia schema fallback and align the persisted network default with the mainnet-only contract
- [x] Make payment-route editing atomic so route metadata, allocations, and audit events cannot partially persist
- [x] Make blockchain transaction recording and confirmation atomic with route lifecycle transitions
- [x] Fail closed on unknown wallet chain IDs so mainnet actions cannot execute without verified Starknet mainnet identity
- [x] Remove retired Manus sessionStorage/Bearer forwarding from the tRPC client so the local-auth security posture is explicit and stale tokens are never transmitted
- [x] Replace the unresolved Vercel document-title placeholder with a stable Veyra fallback so production metadata never exposes template syntax
- [x] Polish Veyra user experience with smoother loading states, button feedback, navigation transitions, responsive spacing, and verified desktop/mobile behavior
- [x] Fix Private Markets market-creation response-transform failure UX with safe actionable feedback and regression coverage
- [x] Fix Private Markets and Launchpad response-transform failures and white loading/scroll flashes across the route shells
- [x] Fix deployed Vercel account-registration response-transform failure and verify signup on mobile and desktop
- [x] Resolve persistent live Vercel signup server/transform error after the first JSON-safe auth response fix; screenshot was from retired `mma-gold.vercel.app`, while corrected release is live at `veyra-gamma-gold.vercel.app`
- [x] Resolve signup transform failure still reproduced on the current `veyra-gamma-gold.vercel.app` deployment after the JSON-safe auth projection; live proxied POST now reaches tRPC and returns a normal validation response
- [x] Audit every interactive button, link, form, mutation, wallet action, and navigation path; fix confirmed defects and add regression coverage
- [x] Add secure forgot-password and reset-password recovery with single-use expiry, generic account responses, session invalidation, UI, migration, tests, and documented email delivery requirements
- [x] Decide on Resend transactional email delivery for password-reset links: intentionally optional because the no-cost free test-sender/default secure fallback is shipped
- [x] Implement approved development-safe password recovery fallback with explicit production delivery gating and no production token disclosure

## Secure password recovery

- [x] Add single-use, expiring password-reset token persistence with hashed token storage.
- [x] Add session-version invalidation when a password reset is consumed.
- [x] Add generic forgot-password response, optional Resend delivery, and development-only preview fallback.
- [x] Add forgot-password and reset-password UI modes with URL token handling and safe client-side navigation.
- [x] Add router regression coverage and pass typecheck, 109 Vitest tests, and production build.
- [x] User-owned delivery configuration reviewed: intentionally deferred because production email is optional and the no-cost secure recovery fallback is shipped.

## Final evidence and receipt pass

- [x] Historical final-evidence checklist superseded by the current user-owned Mainnet evidence item below.

## No-cost password recovery refinement

- [x] Make the free development-safe recovery path the explicit default when Resend credentials are unavailable, with no paid infrastructure requirement and clear demo/local labeling.
- [x] Verify the no-cost recovery behavior with regression tests, typecheck, build, and runtime screenshots.

## Workspace-return navigation consistency

- [x] Standardize the Private Markets back-to-workspace button treatment and behavior across every dedicated Veyra surface.
- [x] Verify shared navigation behavior, desktop/mobile presentation, regression tests, and production build before checkpointing.

## Comprehensive interaction audit follow-up

- [x] Inventory every visible Veyra button, link, form submit, wallet action, navigation action, and demo control with its expected outcome.
- [x] Trace each interactive control to its handler, route, tRPC procedure, auth/wallet gate, and success/error state.
- [x] Audit confirmed interaction defects and responsive control issues: no new defect requiring product-code changes was found; privacy, auth, and mainnet-only semantics remain intact.
- [x] Add or update regression coverage for the audited interaction contracts and verify all primary controls at desktop and mobile widths.
- [x] Run the complete Vitest suite, TypeScript check, production build, and save a published checkpoint.

## Full source audit follow-up

- [x] Enumerate every tracked application, configuration, schema, migration, and test file for the line-by-line audit.
- [x] Inspect server, database, authentication, security, network, and privacy boundaries in full.
- [x] Inspect client state, handlers, routing, dependency usage, and build/deployment configuration in full.
- [x] Fix every confirmed defect found by the audit and add regression coverage; record warnings separately when no safe code change is justified.
- [x] Re-run exhaustive tests, typecheck, production build, and runtime checks, then publish the audited checkpoint.

- [x] Audit finding: prevent client-controlled transaction statuses from marking routes confirmed or settled
- [x] Audit finding: replace precision-unsafe market utilization arithmetic with exact decimal comparisons
- [x] Audit finding: route tRPC workspace headers through the shared safe browser-storage boundary
- [x] Publish the audited Veyra source revision to the public GitHub repository at https://github.com/sands786/veyra.
- [ ] User-owned final submission remains: include the verified Ready X Mainnet STRK shield receipt in the final hackathon materials and submit them.
- [x] Audit finding: prevent a production route from advancing to shielded/routed stages when the connected wallet cannot submit the required STRK20 transaction
- [x] Fix reported Braavos wallet capability detection so supported Starknet Mainnet submission is recognized without weakening the fail-closed guard
- [x] Fix reported Mainnet asset-integrity gap: prevent a visible USDC route from invoking a hardcoded STRK token action
- [x] Require configured public STRK20 contract addresses and verified entrypoints before any Veyra-owned registry execution path; keep official wallet actions capability-gated
- [x] Mainnet readiness: verify the official STRK20 contract interface and deployment details from authoritative sources
- [x] Mainnet readiness: implement the official wallet-standard STRK20 execution request path; keep unknown contract calls fail-closed
- [x] Mainnet readiness: complete safe production configuration and regression coverage; retain user-owned transaction evidence as a separate prerequisite

- [x] Mainnet adapter: support the official `wallet_strk20InvokeTransaction` wallet-standard request path for Braavos-compatible wallets
- [x] Audit finding: prevent proof-card preparation from advancing a submitted route to confirmed without receipt verification
- [x] Audit finding: prevent the current single-recipient action from silently signing a multi-recipient route with incorrect allocations
- [x] Mainnet UI: expose only verified STRK and ETH Mainnet assets through the executable route selector
- [x] Add verified Starknet Mainnet ETH token mapping and exact 18-decimal route support alongside STRK

- [x] Complete safe Mainnet readiness configuration and explicit protocol readiness diagnostics
- [x] Add production evidence-capture fields for verified Mainnet transaction hashes and Starkscan receipts
- [x] Document user-owned contract deployment/configuration and wallet approval prerequisites without exposing credentials
- [x] Re-run full tests, typecheck, build, dependency audit, runtime checks, and publish the final safe release
- [x] Fix reported Braavos/Mainnet wallet chain-ID normalization so genuine Mainnet wallets pass strict network verification
- [x] Resolve persistent STRK20 capability error reported with Braavos/Mainnet wallet without weakening the fail-closed execution boundary
- [x] Integrate the official StarknetInjectedWallet wrapper for legacy Braavos-compatible injection and verify wallet-standard request hydration with the full 143-test, TypeScript, and production-build suite

## Live NOT_REGISTERED submission investigation

- [x] Diagnose the reported Starknet Mainnet STRK20 `NOT_REGISTERED` wallet response and identify it as a protocol registration/SDK readiness boundary rather than a chain-ID capability failure.
- [x] Apply only a verified safe correction: add explicit NOT_REGISTERED guidance stating that no transaction was created and preserve fail-closed Mainnet execution; do not enable unverified contract execution.
- [x] Re-run regression, TypeScript, production build, formatting, and diff-hygiene verification after the investigation.

## Institutional Web3 brand and full-product audit

- [x] Audit current Veyra routes, visible controls, forms, wallet states, Demo Mode boundaries, loading/error/empty states, and responsive surfaces; the server-authoritative workspace header, event-driven auth triggers, and Mainnet gates were verified.
- [x] Refine Veyra’s institutional Web3 brand system with semantic brand lockup labeling, a recurring Copper Veil motif, and preserved privacy-outcome product language without changing core financial semantics.
- [x] Fix confirmed defects from the audit: Demo Mode mobile header clipping, missing semantic brand labeling, and targeted non-submit button type safety; preserve fail-closed wallet behavior.
- [x] Add regression coverage for the verified brand and responsive fixes and re-run the complete production verification suite.

## Institutional audit findings

- [x] Verify workspace switching is server-authoritative through the validated `x-workspace-id` request header and membership-scoped resolver; no refactor was necessary.
- [x] Verify every authentication trigger is event-driven and no stale OAuth helper remains.
- [x] Audit secondary pages for consistent institutional brand chrome, landmarks, focus states, and query retry/empty behavior; no new blocking defect was confirmed.
- [x] Audit mobile navigation semantics and icon-only control labels; confirmed the Home menu semantics and fixed the Demo Mode mobile control rail clipping.

## Repeated live STRK20 registration response

- [x] Verify the registration boundary against the official STRK20 launch and SDK documentation: the connected wallet must use a supported, initialized privacy-pool flow; generic Starknet wallet capability is insufficient.
- [x] Keep Veyra fail-closed and provide a precise operator-facing recovery path; never substitute an unverified contract or generic execute call.

## Braavos wallet connection hydration follow-up

- [x] Diagnose why detected Braavos returned no usable account: the official injected-wallet wrapper’s connect result did not reliably expose its hydrated standard account to Veyra’s merge boundary.
- [x] Implement the narrowest safe hydration correction with regression coverage; preserve Mainnet chain validation and fail-closed STRK20 capability checks.
- [x] Re-run wallet tests, full verification, responsive smoke checks, and publish the verified correction.

## Persistent Braavos provider account discovery

- [x] Reproduce the provider shape where Braavos detects successfully but exposes no account through the current official wrapper response.
- [x] Add only a validated wallet-API account discovery fallback, preserving strict Mainnet chain checks and refusing ambiguous account responses.
- [x] Run regression, TypeScript, production build, and deployed runtime checks before retrying the user’s wallet.

## Wallet-specific live verification follow-up

- [x] Trace Braavos-specific provider discovery and connection behavior independently from the working Ready X account flow.
- [x] Keep Ready X’s confirmed STRK20 `NOT_REGISTERED` response documented as a protocol-registration prerequisite; do not mislabel it as a wallet connection failure.
- [x] Apply only a verified Braavos compatibility correction, then run the full regression and deployment verification suite.

## Braavos prototype event-handler compatibility

- [x] Preserve prototype-defined injected wallet event handlers through the official wallet-standard adapter lifecycle so Braavos can initialize its account and network listeners.
- [x] Add a realistic Braavos prototype-provider regression and pass the complete TypeScript, production-build, formatting, and diff-hygiene suite.

## Braavos unsupported STRK20 action response

- [x] Classify the live Braavos `Not implemented` response for `wallet_strk20InvokeTransaction` separately from connection and registration errors.
- [x] Improve Veyra’s actionable unsupported-wallet messaging without substituting a generic invoke/transfer for a private STRK20 action.
- [x] Add regression coverage, run full verification, and publish the safe diagnostic correction.

## Official STRK20 wallet support clarification

- [x] Confirm that the official first-phase wallet privacy flow is exposed through Ready X and Xverse, while broader wallet and developer API support remains a future expansion.
- [x] Align Veyra’s unsupported-action guidance and regression coverage with that verified wallet-support boundary without weakening Mainnet execution safeguards.

## Wallet-native Mainnet evidence path

- [x] Receive a user-approved Ready X or Xverse STRK20 privacy transaction hash created through the supported wallet-native shield/transfer flow.
- [x] Verify the submitted hash and receipt on Starknet Mainnet, then record only public evidence in Veyra’s proof materials.

## Private recipient channel-context boundary

- [x] Preserve the failed Ready X private-transfer attempt as non-evidence and document that a recipient needs supported STRK20 receiver/channel context.
- [x] Capture and verify only the confirmed wallet-native STRK shield transaction as public Mainnet evidence.

## Shielded self-transfer verification

- [x] Obtain the user-provided hash for the reported 1 STRK wallet-native shield and verify its public Mainnet receipt before inferring any balance outcome.
- [x] Explain the verified public receipt alongside the wallet’s shielded-versus-public balance display without exposing private note data.

## Additional wallet-native shield reconciliation

- [x] Obtain and verify the user-provided hash for the second 1 STRK Ready X shield transaction.
- [x] Reconcile the public confirmation with the user-visible public and shielded balance buckets without inferring private note details; the public receipts explain confirmed fees but cannot expose wallet-private note ownership.

## Unexpected shielded-balance decrease investigation

- [ ] Obtain the hashes for all recent Ready X privacy actions associated with the observed shielded-balance decrease.
- [ ] Verify each public Mainnet receipt and reconcile only publicly observable transfers and fees before making a balance-loss conclusion.

## Reported privacy-fee reconciliation

- [x] Verify the reported $0.17 Ready X privacy presentation against the relevant public Mainnet receipts; the receipts show distinct 2.905315 and 2.905316 STRK on-chain fees plus separate protocol transfer legs.
- [x] Reconcile the verified public fees with the observed balance deltas without asserting private-note ownership; no failed public receipt was found, while wallet-private accounting remains outside public-chain visibility.

## False Shielded state after unsubmitted wallet error

- [x] Trace why an `UNKNOWN_ERROR` that did not submit a STRK20 action still displays the Veyra route as Shielded: stage 1 was misleadingly named Shielded before wallet submission.
- [x] Keep the route as explicit Ready to sign / wallet-action-unavailable state until a transaction hash and verified receipt exist; improve unknown-error guidance.
- [x] Add regression coverage and run the full production verification suite before publishing the correction.

## Final hackathon submission package

- [x] Inventory and verify the live Veyra app URL, repository, demo materials, documentation, and real Mainnet evidence URL.
- [x] Prepare concise submission-ready product, architecture, privacy, and evidence copy that does not overclaim direct wallet execution.
- [x] Deliver the final checklist for the user-owned submission action in the repository submission pack.
- [x] Publish the local verified three-hash `strk20.json` to the public GitHub `main` branch; the public repository initially exposed an obsolete empty transaction list.
- [x] Revalidate the public GitHub repository metadata after publication through the authoritative Contents API; it confirms all three verified hashes, while the raw endpoint remained temporarily cache-stale.
- [x] Remove the obsolete registry/Telegram submission guidance and replace it with the official repository-at-deadline entry rule.
- [x] Verify the public Veyra repository against the official live-demo, 189.97-second demo-video, three-hash, public-license, and working-Mainnet-product criteria, preserving the recipient-delivery caveat.
- [x] Preserve the Vercel deployment as Veyra’s public GitHub Website field and verify that exact public URL resolves to the current Veyra entry point for judges.

## Final competitive hardening pass

- [x] Score the current Veyra package against the official STRK20 judging weights and identify only evidence-backed high-impact gaps in `docs/audit/final-competitive-readiness-2026-08-25.md`.
- [x] Audit and correct the final code-owned private-route defect: request-capable Mainnet wallets now reach the same fail-closed `submitShieldedRoute` boundary without a generic-invoke or public-transfer fallback.
- [x] Refine the public README and judge-facing demo path to foreground real Mainnet evidence, private-finance differentiation, and fail-closed wallet integrity.
- [x] Re-run complete automated, build, visual, and public-artifact verification: 152 tests across 37 files, TypeScript, production build, diff hygiene, desktop and mobile smoke checks, plus public Vercel and GitHub metadata checks.

## Official STRK20 evidence-count reconciliation

- [x] Reconcile the official three-transaction Mainnet evidence requirement with the three verified Ready X STRK20 pool transactions now recorded.
- [x] Update the evidence handoff to include only verified hashes and distinguish the completed public-evidence prerequisite from remaining repository, registry, and submission actions.

## Ready X recipient channel-context prerequisite

- [ ] Confirm the Ready X recipient wallet has completed its own private-token or privacy-channel initialization before any retry.
- [ ] Record only a user-approved successful transfer hash after the recipient context exists; preserve failed channel-context attempts as non-evidence.
- [ ] Verify the newly reported completed Ready X-to-Ready X private transfer from its hash and reconcile it with the recipient’s Shielded Starknet balance before treating it as delivery or hackathon evidence.
- [x] Verify the supplied third hash as a successful Starknet Mainnet STRK20 privacy-pool action and record it as public evidence only, without asserting recipient delivery.
- [ ] Resolve the recipient delivery state for the third privacy-pool action: the recipient wallet already had its displayed private balance and still shows no incoming activity, so no delivery conclusion is currently justified.

## Controlled product feature-test pass

- [x] Exercise the workspace, route, treasury, proof, claim, and Launchpad flows in clearly labeled Demo Mode without submitting a wallet action.
- [ ] Exercise authenticated record-only flows without signing or submitting a Mainnet transaction, and report every observed state accurately.
- [x] Keep the unresolved Ready X private-transfer recipient-delivery investigation isolated from this feature-test pass.
- [x] Verify the user-created recipient claim link remains an off-chain claim record until a supported wallet action returns a Mainnet transaction hash and receipt.
- [x] Locate the sender-side route action after a recorded claim and correct the hand-off copy so it directs the owner to claim review rather than implying settlement.

## Production claim-to-private-transaction handoff

- [x] Surface the recorded claimed recipient, route allocation, asset, Mainnet, and payment state to the authenticated route owner for explicit review.
- [x] Add a guarded sender-side private submission control that uses only `wallet_strk20InvokeTransaction`, requires a final wallet review, and never substitutes a public transfer or generic wallet execution.
- [x] Record a route transaction only after the private wallet action returns a real hash, then require receipt verification before any confirmed state.
- [x] Add focused regression coverage and complete Mainnet-safe test, type, build, changed-file format, and interaction-contract verification.

## Claim-review navigation discoverability

- [x] Make the sender route-selection path to Claim review explicit after a recipient redeems a claim link, so users do not mistake the blank Route Builder for the approval surface.
- [x] Reverify the saved-route claim-review picker and guarded submit boundary through interaction regression coverage, typechecking, full tests, and a production build without creating a duplicate route or submitting a transaction.

## Claimed-route duplicate-submission and delivery investigation

- [x] Verify the reported first claimed-route Mainnet hash `0x00c254e48eabc23bc3f0f25343c98876d8351ff3fe9fe63b9808b4126b9f59c3` as a successful public Mainnet STRK20 privacy-pool receipt without inferring settlement or recipient delivery.
- [x] Prevent the claimed-route submit control from requesting a second wallet signature after Veyra has recorded a submitted transaction for that route.
- [x] Determine that the successful claimed-route wallet hash was not persisted in Veyra and add durable post-signature hash retention plus verified recovery before any further submit control is exposed.
- [ ] Reconcile the recipient wallet’s Shielded Starknet state separately; public receipt evidence cannot prove private-note discovery or delivery.
- [ ] Use the exact claimed saved route’s new no-signature recovery control to verify and record the already returned hash before any receipt confirmation attempt.

## Evidence-driven private-payment production hardening

- [x] Audit the claim creation, redemption, sender review, STRK20 request, hash persistence, receipt verification, duplicate prevention, and recipient-discovery boundaries one by one.
- [x] Compare Veyra’s wallet invocation and transaction-recording behavior with verified Starknet/STRK20 public implementation guidance and document the non-negotiable wallet limitations.
- [x] Correct verified code-owned persistence, duplicate-prevention, and receipt-state defects with atomic persistence and retry-safe state transitions.
- [x] Add focused tests for every corrected private-payment failure path and rerun the complete production verification suite.
- [x] Publish an evidence-based hardening report that separates corrected SaaS behavior from user-owned wallet and privacy-pool outcomes.

## Final competitive hardening pass

- [x] Score the current Veyra package against the official STRK20 judging weights and identify only evidence-backed high-impact gaps in `docs/audit/final-competitive-readiness-2026-08-25.md`.
- [x] Audit and correct the final code-owned private-route defect: request-capable Mainnet wallets now reach the same fail-closed `submitShieldedRoute` boundary without a generic-invoke or public-transfer fallback.
- [x] Refine the public README and judge-facing demo path to foreground real Mainnet evidence, private-finance differentiation, and fail-closed wallet integrity.
- [x] Re-run complete automated, build, visual, and public-artifact verification: 152 tests across 37 files, TypeScript, production build, diff hygiene, desktop and mobile smoke checks, plus public Vercel and GitHub metadata checks.
- [x] Correct submission documentation to distinguish the one-time official registry application from the no-manual-final-submission rule.
- [x] Obtain the team’s public Telegram username and explicit approval, then prepare the minimal official registry branch containing only `https://github.com/sands786/veyra` and `Forgeclaw` for user-owned pull-request submission.
- [ ] User-owned: open the already prepared official registry pull request from `https://github.com/starkience/strk20-hackathon/compare/main...sands786:strk20-hackathon:register-veyra?expand=1`.
- [x] Remove the UI’s stale direct-method-only STRK20 gate so Mainnet-verified wallets exposing the standard request capability can reach the existing fail-closed `submitShieldedRoute` adapter without enabling any generic-invoke or public-transfer fallback; verified by the 152-test suite, `tsc --noEmit`, and the production build.

## Approval-first hackathon demo refresh

- [x] Draft an evidence-grounded, timestamped Veyra three-minute demo script with voiceover, screen actions, caption emphasis, and audio direction for user approval before any video generation in `docs/video/VEYRA_HACKATHON_DEMO_SCRIPT_v2.md`.
- [x] After approval, produce a clean and a burned-caption Veyra demo export at 1080p60, H.264, 8–12 Mbps, at or under three minutes; both masters are 1920×1080 at 60 fps, H.264 at approximately 8 Mbps, with a 176-second runtime.
- [x] Revise the production narrative so Private Payroll, Private Primitives, Private Markets, and Launchpad each receive an explicit evidence-accurate feature demonstration while preserving the user-specified capture, captions, sound, and runtime requirements.
- [x] Rebuild the hackathon demo after the burned captions were judged frame-dominating: use sparse lower-third accessibility captions, screen-led guided interactions, smooth cursor choreography, purposeful scrolls, and judge-optimized chapter motion rather than full-frame subtitle walls; verified in a sampled export frame and 176-second 1080p60 H.264 masters.
- [x] Add a stronger problem-first cold open and a non-fade final resolve that retains a working Veyra product frame, lands the final punchline, and reveals the Veyra shield/wordmark; verified in the 176-second 1080p60 rebuilt master.
- [x] Replace the rejected intro and ending overlay treatment: construct clean full-frame brand scenes and separate product-only proof scenes so logo, caption, punchline, and dense UI never collide in one composition.
- [x] Replace both rejected brand scenes with the user-approved teaser opening and ending clips, keeping the middle exclusively for real Veyra product footage; the clean master’s opening, 2:48 product handoff, and final punchline lockup were visually verified.
- [x] Replace the animated screenshot middle with concise authentic live Veyra interaction recordings that demonstrate real navigation, input, state change, and a visible outcome before recommending the hackathon video for submission.
- [x] Rebuild the demo as a maximum 120-second teaser-framed judge cut that contains only authentic live interaction proof, highest-value Veyra features, and the approved teaser closing sequence.

## User-rejected live judge cut rebuild

- [x] Diagnose the concrete pacing, visual, live-interaction, and closing-treatment failures in the rejected 112-second master.
- [x] Rebuild the product film around deliberate on-screen outcomes rather than generic route changes or static dwell shots.
- [x] Re-render and visually QA a replacement cut before any recommendation or delivery claim.

## Official demo-duration verification

- [x] Verify the current STRK20 hackathon rule for demo-video minimum and maximum duration against the official source.
- [x] Compare the verified rule with the delivered Veyra outcome-led judge cut and record any required edit.
- [x] User decision: retain a concise two-minute outcome-led demo instead of extending the 81-second cut to a three-minute version; the official wording caveat remains documented.

## Approved two-minute official demo extension

- [x] Expand the 81-second outcome-led core into an approximately two-minute official STRK20 demo using only authentic live Veyra interactions and evidence-safe product states.
- [x] Add a captioned export with one short lower-third line at a time, excluding teaser scenes and never covering active controls.
- [x] Visually and technically QA the two-minute clean and captioned masters before delivery.

## Downloadable video package repair

- [x] Package the two-minute clean and captioned Veyra masters with explicit `.mp4` filenames so the user can download and open them reliably.
- [x] Upload and verify a direct downloadable package containing both MP4 files.

## Official hackathon competitor comparison

- [x] Review the official STRK20 hackathon project list and collect verifiable evidence for the visible top ten competitors.
- [x] Compare Veyra and the visible top ten against the official judging dimensions without assuming unverified capabilities.
- [x] Deliver an honest ranked comparison, identifying Veyra’s defensible advantages and winner-critical gaps.

## Top-three STRK20 improvement pass

- [x] Audit the official STRK20 skills, starter kit, protocol documentation, ecosystem directory, and privacy-protocol repository against Veyra’s current integration.
- [x] Add only safe, source-aligned STRK20 integration improvements without copying unverified code or weakening the wallet-owned fail-closed boundary.
- [x] Improve Veyra’s operator-facing evidence, privacy-boundary explanation, and reviewer path using verified protocol concepts and explicit limitations.
- [x] Add regression coverage for the new integration/evidence behavior and run tests, typecheck, build, and visual checks.
- [x] Update the top-three assessment honestly; do not claim top-three placement, Mainnet settlement, contract deployment, or recipient delivery without evidence.

## Fully on-chain Launchpad scope

- [x] Audit Launchpad routes, schema, server procedures, existing wallet adapter, and official STRK20/Privacy references.
- [x] Define a minimal audited-scope Launchpad contract model for projects, commitments, milestone approvals, and releases; do not add unverified token custody.
- [x] Implement only the verified contract and wallet execution path that can be safely supported by the current Mainnet environment.
- [x] Integrate receipt-first on-chain state into server and UI, keeping database records as indexed coordination metadata rather than settlement authority.
- [x] Add Cairo/TypeScript regression tests, typecheck, production build, visual checks, and deployment documentation.
- [x] Do not claim the Launchpad is fully on-chain until a deployed Mainnet contract, verified wallet transaction, receipt, and state transition exist.

### Selected architecture decision

- [x] Implement the first Launchpad contract as a non-upgradable milestone escrow for one verified Mainnet token, with no owner withdrawal or upgrade path.
- [x] Require explicit investor deposit, project activation, allocation reservation, milestone approval, release, and refund transitions with replay protection and event emission.
- [x] Keep private STRK20 payroll/claim execution separate from the public escrow contract unless a verified protocol-compatible private escrow interface is available.
- [x] Require owner-signed Mainnet deployment and at least one end-to-end test lifecycle before changing Launchpad copy from “coordination” to “live settlement.”

## Renewed fully-on-chain requirement

- [x] Do not leave Launchpad mutations as the only execution path; expose guarded on-chain escrow actions only when a verified contract address and supported wallet capability are available.
- [x] Keep the Launchpad UI’s live/settled labels driven by verified receipt state rather than optimistic database status.
- [x] Reassess and mark the Launchpad as fully on-chain only after public Mainnet deployment and end-to-end receipt evidence.

### Deployment funding decision

- [x] Re-estimate Mainnet declaration after contract-footprint review; never treat willingness to add STRK as proof the contract is safe to deploy.
- [x] Obtain explicit owner confirmation immediately before any real declaration/deployment transaction and record only public hashes and addresses.
## Fully on-chain Private Markets scope
- [x] Audit current Private Markets UI, server procedures, schema, and wallet boundaries.
- [x] Implement and locally validate a minimal non-upgradable Private Markets Mainnet contract.
- [x] Wire strict wallet calls and receipt-first state into the Private Markets UI.
- [x] Deploy and verify one complete Private Markets Mainnet lifecycle with owner-signed actions.
- [x] Update STRK20 metadata and documentation with verified Private Markets evidence.
- [x] Add live Mainnet receipt polling and contract-state reads to the Private Markets browser panel; keep submitted hashes distinct from confirmed settlement.
- [x] Configure an approved HTTPS Starknet Mainnet RPC URL so browser-side receipt/state verification is available in production.

## Fully on-chain Private Primitives scope
- [x] Audit Private Primitives UI, wallet adapter, protocol readiness, and existing evidence boundaries.
- [x] Add a guarded official STRK20 wallet-signed Mainnet action panel with no generic public-transfer fallback.
- [x] Add public receipt capture and verification while keeping private-note discovery wallet/pool-owned.
- [ ] Verify a fresh user-owned Private Primitives Mainnet receipt and wallet-private note discovery before claiming private delivery.

## Production route regression
- [x] Fix production `/private-primitives` failure: dynamically imported `PrivatePrimitives` chunk is not fetchable from the deployed asset URL.
- [x] Rebuild, checkpoint, and verify the production Private Primitives route after the chunk fix.

## Global scale regression
- [x] Restore readable global typography and icon sizing across desktop and mobile without changing wallet/privacy behavior.
- [x] Verify the scale correction with typecheck, tests, production build, and responsive screenshots.

## Veyra Agent commit–reveal capability
- [x] Audit the agent surface, current Starknet adapter, and commit–reveal protocol requirements.
- [x] Implement and locally validate a Starknet-native non-upgradable commit–reveal Cairo contract.
- [x] Add strict calldata builders, wallet-signed commit/reveal controls, and receipt/state verification to Veyra.
- [x] Add honest documentation that commit–reveal hides committed values until reveal but does not make wallet identities or transfers anonymous.
- [x] Deploy and verify a fresh Mainnet commit/reveal lifecycle with owner-signed transactions.

## Veyra Agent selected architecture
- [x] Build Approach A: wallet-assisted commit–reveal Agent; no autonomous signer or private-key custody.
- [x] Add Starknet-native sealed-bid contract with commit/reveal verification, replay protection, and explicit round states.
- [x] Add Agent UI for payload preparation, wallet review/signing, receipt polling, and chain-state evidence.

## Veyra Agent mount regression
- [x] Fix the malformed Private Markets JSX mount and pass the required `isDemoMode` props for both on-chain panels.
- [x] Re-run TypeScript, 161 Vitest tests, and the production build after the mount fix.

## Veyra Agent Mainnet deployment pass
- [x] Correct prior Veyra Agent evidence labels so local implementation is not described as deployed proof.
- [x] Revalidate the Agent Cairo package and deployment helper on the owner branch.
- [x] Declare and deploy the Veyra Agent coordinator on Starknet Mainnet with owner confirmation.
- [x] Verify declaration and deployment receipts, then execute and verify one complete commit–reveal round.
- [x] Configure the verified Agent address and update public metadata without claiming anonymous identity or transfer privacy.

## Veyra Agent visibility regression
- [x] Expose the deployed Veyra Agent as a visible sidebar entry and navigable route, with direct access to the wallet-signed panel.
- [x] Verify Agent visibility with focused tests, TypeScript, production build, and responsive route QA.

## Institutional homepage redesign
- [x] Reframe the front page as an information-first institutional overview without adding Agent functionality to the homepage.
- [x] Make existing Veyra functions and dedicated action routes visibly legible to judges, including Payroll, Proof Ledger, Treasury, Claims, Operations, Private Primitives, Private Markets, Launchpad, and Veyra Agent.
- [x] Add an institutional footer with clear navigation, evidence/privacy boundary, and project identity.
- [x] Verify homepage responsiveness, route links, focused tests, TypeScript, and production build.

## Canonical homepage surface alignment
- [x] Mirror the exact sidebar labels and ordering on the homepage system map, including Identity keys and the concise Treasury/Claims labels.
- [x] Re-verify each canonical homepage action link and responsive presentation after alignment.

## Authentication control visibility change
- [x] Remove visible Sign In, Sign Up, and sign-out controls from every user-facing Veyra surface while preserving session and authorization logic.
- [x] Verify no visible authentication-control labels remain in rendered UI, then run tests, TypeScript, build, and responsive QA.

## Homepage geometric surface refinement
- [x] Replace the uniform homepage function boxes with a deliberate mixed-shape treatment using curved, circular, hexagonal, pentagonal, and triangular geometry without sacrificing label readability.
- [x] Verify the new geometry on desktop and mobile, then run tests, TypeScript, build, and save a checkpoint.

## Homepage circular surface containment
- [x] Convert every homepage function-directory tile to a circular or controlled oval silhouette with all visible content contained inside the curved boundary.
- [x] Verify circle containment and responsive readability, then run tests, TypeScript, build, and save a checkpoint.
