# Veyra — Private Payroll and Split Payments on STRK20

Veyra is a privacy-first payment workspace for Starknet teams. It turns a recipient roster into a STRK20 private route and produces a compact proof reference that can be shared without publishing the full payment story.

## Why Veyra

Most private-transfer demos stop at a shield/unshield button. Veyra focuses on the operational moment around the transfer: a team needs to prepare a payroll run, keep recipient identities and individual amounts private, and still give a finance lead a verifiable record of what happened. The app makes that state explicit through four stages: **Draft**, **Shielded**, **Routed**, and **Settled**.

## STRK20 integration plan

The product is structured around the official STRK20 architecture: wallet connection, private transfer route, proof reference, receipt verification, and a mainnet evidence ledger. Demo Mode remains explicitly local, while production mode requires a compatible privacy-enabled wallet and user approval. The app never presents a locally recorded hash as a confirmed chain settlement.

For the final sprint entry, the following must be filled in:

| Evidence | File or setting | Requirement |
|---|---|---|
| Mainnet transactions | `strk20.json` | At least three successful Starknet mainnet transaction hashes that touched the STRK20 pool |
| Deployed contracts | `strk20.json` | Any Veyra anonymizer or helper addresses, with network context in the README |
| Demo | `strk20.json` | Public three-minute demo video URL and optional public demo URL |
| Public project | Repository metadata | Public GitHub repository, open-source license, and the one-time sprint registry PR |

The three transaction hashes are deliberately empty in this repository until a real wallet executes the corresponding live flow. Do not replace them with examples or fabricated hashes.

## Local development

```bash
pnpm install
pnpm dev
```

The project is a React + Vite client with an authenticated Express/tRPC backend and database persistence. It can be previewed without a wallet in Demo Mode. Production route execution uses the wallet-owned STRK20 boundary, records only public transaction metadata, and exposes receipt verification and Explorer links. The `contracts/veyra_payroll` package contains a compiled and Foundry-tested non-custodial payroll settlement registry with a user-operated Sepolia deployment helper.

## Product language

Veyra uses an Obsidian, Moon Ivory, Deep Tide, Emerald, Moon Silver, and Vermilion design system with Space Grotesk display type, Manrope interface copy, and JetBrains Mono for compact technical identifiers. The interface is intentionally asymmetric and proof-led rather than a generic centered crypto dashboard.

## Hackathon checklist

Before the August 31, 2026 23:59 UTC close, the owner must open the single required registry pull request, keep the repository public, connect the real STRK20 SDK and wallet path, execute three successful mainnet pool transactions, record their hashes in `strk20.json`, publish a three-minute demo video, and verify that the live demo is reachable without a login.

Winners are announced September 4, 2026. See the official sprint repository and [STRK20 Private Sprint page](https://strk20.starknet.io/hackathon) for the current rules.

## License

MIT

## Security and privacy boundary

Veyra does not custody private keys, seed phrases, viewing keys, proof payloads, or plaintext private-transfer notes. Wallet signing remains in the user’s privacy-enabled Starknet wallet. The database stores workspace metadata, recipient wallet addresses entered by the workspace operator, route totals and lifecycle state, public transaction hashes, and audit metadata. Recipient notes are optional operational labels only; teams must not place secrets, private keys, or sensitive payment narratives in them. The server validates workspace membership and role before every mutation and verifies that route recipients belong to the same workspace.
