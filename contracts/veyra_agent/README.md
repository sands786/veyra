# Veyra Agent Coordinator

This package implements a non-upgradable Starknet Cairo commit–reveal coordinator for Veyra Agent. It is designed for wallet-assisted execution: the Agent prepares and validates payloads, while the connected Starknet wallet signs every state-changing call.

## Lifecycle

A coordinator creates a typed round, opens it, and participants submit sender-bound commitments. The coordinator closes the round; each participant can reveal a value and nonce only when the Poseidon hash of `[value, nonce]` matches the stored commitment. The coordinator can then resolve an item to a participant whose value was revealed.

The contract does not custody tokens. It also does not anonymize wallets, values after reveal, or transaction history. Commit–reveal hides the committed value until reveal; it is not a privacy pool or a replacement for official STRK20 private-token infrastructure.

## Mainnet deployment boundary

Compilation and local Cairo tests must pass before declaration. Declaration, deployment, and lifecycle execution remain owner-signed actions. Never place private keys, seed phrases, viewing keys, or wallet credentials in this repository or in Veyra’s server.

The constructor has no arguments. A deployment helper should be invoked only after reviewing the compiled class hash and current gas estimate.
