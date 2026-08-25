# Launchpad live wiring visual QA — 2026-08-25

The `/launchpad` route was captured at desktop 1280×720 and mobile 375×812 after the Mainnet escrow configuration and live panel wiring.

The unauthenticated access gate renders cleanly at both sizes. The desktop composition preserves the dark Copper Veil treatment, clear identity-required boundary, and readable sign-in CTA. The mobile view keeps the back-to-workspace control, Mainnet/private-launchpad label, headline, explanatory copy, and Demo Mode boundary legible without horizontal overflow in the captured viewport.

The authenticated live escrow panel is not visible in these screenshots because the preview session is unauthenticated. This QA therefore verifies the access gate only; an authenticated wallet-session capture is still required before claiming the live controls are visually verified end to end.

Known unrelated stale log item: an old console entry references a missing `recoverBlockchainTransaction` export. Current TypeScript and production builds pass; this stale entry was not treated as a newly reproduced regression.
