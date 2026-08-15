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
- [ ] User-owned final evidence: sign in, connect a real STRK20 wallet, run authenticated CRUD/transaction flows, publish the public repository, record three mainnet transactions, and submit the demo video.

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
