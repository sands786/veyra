# Veyra SaaS Flow Verification

The full-stack server starts successfully with Manus OAuth initialized, and the public preview renders the route builder, dynamic token field, selected-recipient counter, proof ledger, and recipient management surface. TypeScript, Vitest, and the production build all pass.

The protected API paths are covered by workspace-scoped procedures for recipient create/update/archive/restore, route creation and status transition, audit history, and idempotent transaction recording. The browser preview correctly exposes sign-in as an explicit action and does not fabricate authenticated records or transaction hashes.

Live wallet signing and database mutation verification require the user’s own authenticated browser session and privacy-enabled Starknet wallet. The safe manual sequence is: sign in; add a recipient with a valid Starknet address; select the recipient; create a route; approve the STRK20 wallet action; refresh; confirm the route and audit count remain visible; archive and restore the recipient; then confirm the public transaction hash is recorded. No private keys or sensitive notes should be entered into Veyra.
