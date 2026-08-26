# Veyra privacy credibility — final evidence step

Veyra must not claim a complete 10/10 privacy-credibility result from a public transaction receipt alone. The remaining evidence is a real recipient-side private-note discovery flow using a supported Starknet wallet and the official STRK20 privacy-pool path.

## User-owned Mainnet action

1. Use the Veyra **Private Primitives** page with a supported wallet connected to **Starknet Mainnet**.
2. Submit a small, intentional STRK20 action through the official wallet-native boundary. Do not use a private key in Veyra; the wallet must approve the transaction.
3. Save the resulting public transaction hash and verify its Mainnet receipt in the Veyra panel.
4. From the intended recipient wallet, use the wallet or privacy-pool discovery flow to confirm that the private note is discoverable by the recipient and not exposed as a public roster entry.
5. Record only the minimum evidence needed: transaction hash, network, wallet/provider name, discovery confirmation, and timestamp. Never record private keys, seeds, plaintext sensitive notes, or unnecessary recipient metadata.
6. Provide the evidence privately to the submission reviewer or update the project evidence file. The public UI should continue to state that recipient-note discovery is wallet/pool-owned until this step is independently confirmed.

## What this proves

A successful result would support the claim that Veyra can coordinate a wallet-signed private-note flow with recipient-side discovery through the supported privacy infrastructure. It would not make wallet callers, public transaction metadata, or any later public transfer anonymous. The claim should remain narrowly scoped to the tested wallet/provider, network, asset, and privacy-pool path.

## Current code-owned evidence

The application now separates three evidence levels: public receipt verification, wallet-owned private-note discovery, and recipient proof. Launchpad, Private Markets, and Veyra Agent expose deployed Mainnet contract addresses, lifecycle labels, and direct explorer links without fabricating settlement or privacy claims.
