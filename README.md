# VeilPay — Private Payroll and Split Payments on STRK20

VeilPay is a privacy-first payment workspace for Starknet teams. It turns a recipient roster into a STRK20 private route and produces a compact proof reference that can be shared without publishing the full payment story.

## Why VeilPay

Most private-transfer demos stop at a shield/unshield button. VeilPay focuses on the operational moment around the transfer: a team needs to prepare a payroll run, keep recipient identities and individual amounts private, and still give a finance lead a verifiable record of what happened. The app makes that state explicit through four stages: **Draft**, **Shielded**, **Routed**, and **Settled**.

## STRK20 integration plan

The frontend is structured around the official STRK20 architecture: wallet connection, shielded balance, private transfer route, proof reference, and a mainnet evidence ledger. The current UI intentionally exposes a clear demo mode until a wallet and the live STRK20 adapter are configured. This prevents the app from implying that a transaction occurred when it did not.

For the final sprint entry, the following must be filled in:

| Evidence | File or setting | Requirement |
|---|---|---|
| Mainnet transactions | `strk20.json` | At least three successful Starknet mainnet transaction hashes that touched the STRK20 pool |
| Deployed contracts | `strk20.json` | Any VeilPay anonymizer or helper addresses, with network context in the README |
| Demo | `strk20.json` | Public three-minute demo video URL and optional public demo URL |
| Public project | Repository metadata | Public GitHub repository, open-source license, and the one-time sprint registry PR |

The three transaction hashes are deliberately empty in this repository until a real wallet executes the corresponding live flow. Do not replace them with examples or fabricated hashes.

## Local development

```bash
pnpm install
pnpm dev
```

The project is a React + Vite static frontend. It can be previewed without a wallet in demo mode. The `CREATE PRIVATE ROUTE` action advances the privacy-state explanation; wallet connection is represented honestly as a UI state until the official STRK20 SDK is configured for the target environment.

## Product language

VeilPay uses the Copper Veil design system: graphite surfaces, paper-white type, Veil Vermilion `#F0563A`, Space Grotesk display type, and IBM Plex Mono evidence labels. The interface is intentionally asymmetric and proof-led rather than a generic centered crypto dashboard.

## Hackathon checklist

Before the August 31, 2026 23:59 UTC close, the owner must open the single required registry pull request, keep the repository public, connect the real STRK20 SDK and wallet path, execute three successful mainnet pool transactions, record their hashes in `strk20.json`, publish a three-minute demo video, and verify that the live demo is reachable without a login.

Winners are announced September 4, 2026. See the official sprint repository and [STRK20 Private Sprint page](https://strk20.starknet.io/hackathon) for the current rules.

## License

MIT

## Security and privacy boundary

VeilPay does not custody private keys, seed phrases, viewing keys, proof payloads, or plaintext private-transfer notes. Wallet signing remains in the user’s privacy-enabled Starknet wallet. The database stores workspace metadata, recipient wallet addresses entered by the workspace operator, route totals and lifecycle state, public transaction hashes, and audit metadata. Recipient notes are optional operational labels only; teams must not place secrets, private keys, or sensitive payment narratives in them. The server validates workspace membership and role before every mutation and verifies that route recipients belong to the same workspace.
