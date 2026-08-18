# STRK20 on-chain implementation research

## Official sources

- https://www.starknet.io/blog/privacy-live-on-starknet/
- https://strk20.starknet.io/
- https://strk20.starknet.io/rfp/privacy-wallet
- https://www.starknet.io/blog/11-things-you-can-build-with-strk20-on-starknet/

## Verified capabilities

STRK20 is described by Starknet as a privacy framework for ERC-20 assets on Starknet. The official material describes shielding and unshielding, private transfers, private swaps/DeFi flows, encrypted notes stored onchain, zero-knowledge proof validation, double-spend protection, and a compliance path through encrypted viewing keys. The public chain can expose encrypted notes and protocol metadata while hiding sender, receiver, amount, token type, and spent private notes for private transfers.

The official STRK20 site describes the builder surface as wallet/API/SDK integration rather than requiring every app to deploy a separate privacy token. The privacy-wallet RFP explicitly says the pool, channels, discovery service, SDK, and cryptographic primitives already exist; the product work includes viewing-key registration, receive-address publication, discovery, encrypted-note handling, and private sends/withdraws.

The official Starknet use-case material explicitly names private payment links, payroll, claims/grants/donations, trade obfuscation, private swaps/rebalancing, institutional treasury tooling, private lending/yield adapters, private governance, sealed bids/auctions, hidden-state games, and private AI-agent payments as product directions.

## Implications for Veyra

Veyra can honestly become an on-chain protocol by making the wallet-authorized STRK20 operation the source of settlement truth, storing only intent/status/receipt metadata in the database, and reconciling database state from Starknet receipts. Payroll, claims, and treasury can use private transfer/deposit/withdraw operations. Markets and Launchpad require additional deployed application contracts or supported STRK20-compatible contract actions for commitments, escrow, reveal, allocation, and release; these must not be fabricated without real addresses and ABIs. Proofs should distinguish application-level privacy-safe summaries from cryptographic protocol proofs.

The existing app already has a STRK20 wallet adapter, network-aware chain checks, Explorer URLs, transaction persistence, receipt verification, and explicit mainnet/testnet evidence boundaries. The next implementation should centralize typed on-chain intents and contract configuration, add safe preflight checks, improve reconciliation, and expose configuration status rather than pretending unsupported contracts are deployed.

## Hard boundary

No public source reviewed here supplied Veyra-specific deployed contract addresses or a complete public ABI for payroll, treasury, Launchpad, or markets. Therefore those workflows can be made contract-ready and wallet-authorized only when the actual contract addresses/ABIs and user-approved wallet transactions are available. Do not claim a fully deployed production protocol or fabricate mainnet evidence before that point.
