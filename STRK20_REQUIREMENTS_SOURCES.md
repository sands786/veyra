# STRK20 Private Sprint — Official Requirements Sources

## Official hackathon page
Source: https://strk20.starknet.io/hackathon

The Private Sprint runs for eighteen days. Applications and hacking open on August 14, 2026; submissions close August 31, 2026 at 23:59 UTC; winners are announced September 4, 2026. The prize pool is $5,000 USD paid in STRK: $2,500 first, $1,500 second, and $1,000 third.

Application requires one pull request against https://github.com/starkience/strk20-hackathon with the project, GitHub usernames, Telegram usernames, and a description. Nothing needs to be deployed to apply; the merged PR gives a place in the builders group. The official page states that the first PR is the only required PR and that pushes, stack, contracts, and demo are read from the project repository.

Judging weights are STRK20 integration depth 30%, working mainnet product 30%, innovation 25%, and documentation/open-source quality 15%.

## Official hackathon repository
Source: https://github.com/starkience/strk20-hackathon

The repository states that the project repository must be public and open-source with a license. The project must run on Starknet mainnet against the live STRK20 pool to win. The repository must provide a public demo URL anyone can open, a three-minute demo video, and one payout address per winning team.

The root `strk20.json` file is the scoring metadata. It may include:

```json
{
  "transactions": ["0x...", "0x...", "0x..."],
  "contracts": ["0x..."],
  "demo_video": "https://youtu.be/...",
  "demo_url": "https://..."
}
```

The `transactions` field is required for scoring and must contain at least three mainnet transaction hashes. Each hash is checked against the chain: it must exist, succeed, and touch the STRK20 pool. The `demo_video` field is required for scoring and must point to a three-minute demo video. `contracts` and `demo_url` are optional, although a public demo URL is required to win and the repository website/deployment field is used for automatic discovery.

The repository says there is nothing separate to submit: whatever the public repository shows at August 31, 2026 at 23:59 UTC is the entry. To be scored, the project needs a live demo, a three-minute demo video, and three mainnet transaction hashes in `strk20.json` proving real calls against the STRK20 pool.

The registry application entry requires a public repository URL and Telegram usernames without the `@` symbol. The registry derives the project name, one-liner, slug, and usually team information from the public repository. The repository must have a first commit before it appears on the hub.

## Official STRK20 build page
Source: https://strk20.starknet.io/build

The build page describes four routes: a private dapp through the Starknet Wallet API, a privacy wallet through the low-level Privacy SDK, a prover backend, or private sub-accounts when available. For most private dapps, the recommended route is the Starknet Wallet API through starknet.js and a privacy-enabled wallet; the dapp does not handle viewing keys or the SDK directly.

The build page identifies the live STRK20 pool, Starknet Wallet API, anonymizer contracts, Privacy SDK, and prover backend as relevant components. It emphasizes protocol-level privacy, existing wallets, composability, and compliance-first deposit screening.

## Official Wallet API documentation
Source: https://strk20-by-example.org/starknet-wallet-api/overview

The Wallet API is the recommended route for most private dapps. The wallet holds viewing keys, discovers notes, builds transactions, generates proofs, and submits them. The dapp must use starknet.js and a privacy-enabled wallet. STRK20 support requires starknet.js 10.4.0 or newer; the docs warn that the default latest package may not contain the STRK20 API. Supported actions include shield, private transfer, withdraw/unshield, and wallet-dependent swap.

## Official anonymizer documentation
Source: https://strk20-by-example.org/helpers/privacy-invoke

Anonymizer contracts are required for app-specific private DeFi integrations. The pool invokes `privacy_invoke` atomically; the helper performs the external action, approves the pool to pull output tokens, and returns `Span<OpenNoteDeposit>` instructions. This is relevant only if Veyra adds a custom privacy DeFi/helper contract.

## Official Privacy SDK documentation
Source: https://strk20-by-example.org/sdk/getting-started

The low-level SDK route is intended for privacy wallets and advanced integrations that manage accounts, viewing keys, note discovery, and proving. It requires a viewing-key provider, proving provider, discovery provider, and pool address. A normal private payroll dapp should prefer the Wallet API route so private material stays inside the wallet.

## Veyra compliance status at audit time

Implemented locally: a public repository-ready SaaS product, a live Manus demo deployment, an STRK20-compatible wallet adapter boundary, authenticated workspaces, persistent routes and recipients, audit/receipt views, and responsive UI.

Not yet evidenced: a public GitHub repository/registry PR, Telegram usernames, a public project license and repository metadata, three successful Starknet mainnet transactions touching the live STRK20 pool, a three-minute demo video, and a completed user-owned wallet flow. These are the decisive remaining requirements for scoring and must not be fabricated.
