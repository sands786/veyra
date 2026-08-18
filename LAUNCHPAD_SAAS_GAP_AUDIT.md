# Veyra Launchpad SaaS Gap Audit

## Executive assessment

The Launchpad has a credible privacy-oriented foundation and real persistence, but it currently behaves as a **project-and-milestone CRUD workspace** rather than a complete launch operations SaaS. The most important gap is not visual quality. It is the lack of operational entities and workflows that a project team would need after creating a private round.

## Current strengths

The current implementation persists workspace-scoped projects, milestones, shielded allocation commitments, project and milestone status transitions, generic audit events, and privacy-safe public summaries. It also enforces role checks, validates amounts and slugs, prevents allocation duplication through a commitment key, and clearly separates offchain workflow state from wallet-authorized Starknet execution.

## Production SaaS gaps

| Area | Current behavior | Production-oriented requirement |
|---|---|---|
| Project portfolio | Projects are listed and one project is selected implicitly. | A real portfolio view with filters, lifecycle counts, readiness signals, and explicit project selection. |
| Project operations | A project stores name, description, token, target, raised amount, status, and funding end. | Persistent operating metadata: owner/team label, round type, launch stage, risk/readiness flags, operational notes, and updated activity. |
| Contributor operations | Allocations store a commitment and amount but no contributor lifecycle. | Privacy-safe allocation states, claim readiness, fulfillment status, allocation totals, and operational exception visibility without public identity leakage. |
| Release operations | Milestones can move between simple states. | Release readiness checks, approval completion, blocked reasons, proof references, and an explicit release-request workflow. |
| Activity and audit | Generic audit events exist but are not surfaced as a Launchpad activity feed. | Project-scoped activity timeline with actor role, action, timestamp, and privacy-safe context. |
| Readiness | No computed readiness model exists. | Deterministic checks for project metadata, milestone plan, allocation coverage, governance threshold, proof state, and wallet execution readiness. |
| Failure handling | Mutations show toasts and invalidate the project list. | Persistent operational errors, actionable retry/recovery states, and clear separation of saved state from pending wallet execution. |
| Public boundary | Public summaries intentionally omit allocations. | Preserve this boundary while exposing only aggregate progress, milestone status, proof metadata, and publication state. |

## Recommended upgrade sequence

The production pass should add a project portfolio and project-detail model first, then compute a readiness snapshot from persisted project, milestone, allocation, approval, proof, and transaction state. Next, it should expose contributor allocation operations and release requests with explicit permissions and audit events. Finally, the UI should become a real operations workspace with portfolio navigation, project detail, readiness checks, activity, release queue, and exception states.

The product should continue to describe wallet signing and custom Starknet contract settlement as separate execution boundaries until those transactions are implemented and evidenced on a real network. It should not claim deployed privacy circuits, paymaster sponsorship, custom launchpad contracts, or private viewing-key infrastructure without corresponding onchain artifacts.

## Honest standard

After this upgrade, the Launchpad can credibly be presented as a **privacy-first project operations SaaS for Starknet rounds**, not merely as a form that creates projects and milestones. The remaining user-owned mainnet evidence is separate from product completeness and must still be performed by the user.
