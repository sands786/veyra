# Veyra Payroll Settlement Registry

This Cairo contract is the first contract-backed Veyra surface. It is deliberately **non-custodial**: it records a private recipient commitment and a settlement commitment on Starknet, but it does not hold or transfer tokens. Token movement remains delegated to the STRK20 wallet privacy API until the official transfer interface and deployment addresses are supplied.

## Lifecycle

A workspace operator creates a route with a token address, amount, and recipient commitment. The creator can cancel an active route. The configured owner can record a settlement commitment after an independently verified STRK20 receipt. The contract emits `RouteCreated` and `RouteSettled` events.

The contract never stores a recipient roster, plaintext payroll note, private key, or wallet secret.

## Compile

```bash
scarb build
```

The generated artifacts are under `target/dev/`, including the Sierra contract class and the artifact JSON containing the ABI.

## Deploy on Starknet Sepolia

Use a funded testnet account and never place its private key or keystore in the repository.

```bash
scarb build
sncast declare --url "$SEPOLIA_RPC_URL" --account "$STARKNET_ACCOUNT" --contract-name VeyraPayrollRegistry
sncast deploy --url "$SEPOLIA_RPC_URL" --account "$STARKNET_ACCOUNT" --class-hash <CLASS_HASH> --constructor-calldata <OWNER_CONTRACT_ADDRESS>
```

Record the declaration hash, deployment transaction hash, deployed contract address, network, and compiler version. Verify the address on [Voyager Sepolia](https://sepolia.voyager.online/).

## Production boundary

This registry is not a completed custody or escrow contract. Before using it for real funds, the team must add and independently audit the intended STRK20 transfer/escrow semantics, define role rotation and emergency controls, deploy on Sepolia, run adversarial tests, and only then consider a mainnet deployment.
