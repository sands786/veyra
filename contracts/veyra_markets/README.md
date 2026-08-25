# Veyra Private Markets — Mainnet Contract

This package contains the first non-upgradable Private Markets escrow for Veyra. It is intentionally narrow: one constructor-configured ERC-20 token, market creation and opening, commitment-hash bid deposits, creator-controlled close and accept transitions, settlement to the market creator, and bidder refunds for unaccepted bids.

## Privacy boundary

The contract stores a commitment hash for bid terms, but it does not hide the submitting wallet, token transfer, amount, or settlement transfer. The product must describe this version as **private terms / public settlement**. Anonymous STRK20 market settlement requires the official Starknet Privacy pool, proving, discovery, and anonymizer path and must not be implied by this contract alone.

## State transitions

`DRAFT → OPEN → CLOSED → SETTLED` is the market lifecycle. Each bid moves from `COMMITTED` to either `ACCEPTED → SETTLED` or `COMMITTED → REFUNDED`. IDs are single-use and every mutation emits an event. There is no upgrade or owner withdrawal function.

## Local validation

```bash
scarb build
snforge test
```

The package uses Scarb 2.20.1, Starknet 2.20.0, and Starknet Foundry 0.63.0 to match the verified Launchpad toolchain.

## Mainnet deployment

Compile and declare the package, then deploy the declared class with the verified token address as constructor calldata. The deployer must use its own configured account; Veyra never handles private keys or seeds.

```bash
sncast declare --network mainnet --contract-name VeyraPrivateMarkets
sncast deploy --network mainnet --class-hash <DECLARED_CLASS_HASH> --constructor-calldata 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
```

Before any real declaration or deployment, independently inspect the compiled artifact, estimate fees, confirm the exact class hash, and obtain explicit owner confirmation. After deployment, record only the public class hash, contract address, and transaction hashes. Configure the resulting address as `VITE_VEYRA_MARKETS_CONTRACT_MAINNET` through the project configuration flow; do not commit secrets or private keys.
