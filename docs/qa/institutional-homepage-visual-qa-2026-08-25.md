# Institutional homepage visual QA

The homepage now presents an information-first institutional hierarchy: the existing private payroll hero and teaser lead into a new `03 / INSTITUTIONAL MAP` section with nine destination cards for Private payroll, Proof ledger, Operations, Treasury guardrails, Recipient claims, Private primitives, Private markets, Launchpad, and Veyra Agent. Each card has a clear action label and uses the existing navigation helpers; no Agent function was added to Home.

Desktop QA shows the system map reads as a distinct judge-facing directory before the live route-builder controls, and the closing footer now carries Veyra identity, Explore links, Protocol links, public-evidence access, and the explicit wallet/receipt/privacy boundary. Mobile QA shows the nine cards stack vertically without horizontal overflow; the homepage remains long by design, with the operational route-builder and footer following the overview.

Build and tests passed after implementation: TypeScript, production build, 39 Vitest files / 162 tests. Known non-blocking build warnings remain from the dependency tree’s Rollup purity annotations and a large existing JavaScript chunk.
