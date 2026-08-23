# STRK20 NOT_REGISTERED Audit Findings

## Authoritative sources

1. Starknet, “Privacy Is Now Live on Starknet | STRK20 Launch”: https://www.starknet.io/blog/privacy-live-on-starknet/
2. Starkware Labs, `starknet-privacy` repository: https://github.com/starkware-libs/starknet-privacy
3. Veyra Mainnet runbook: `MAINNET_READINESS.md`

## Findings

The live wallet response was `NOT_REGISTERED` after the Braavos-shaped wallet-standard adapter successfully passed chain-ID normalization and reached `wallet_strk20InvokeTransaction`. This is therefore not the earlier `SN_MAIN` versus canonical Mainnet chain-ID defect.

The official Starknet launch article describes the first live STRK20 phase as wallet-enabled privacy through supported integrations including Ready X and Xverse. It also describes shielding as a wallet flow and private transfers as actions inside the STRK20 privacy pool. The official repository describes the SDK as orchestrating registration, transfer, discovery, and proving; the privacy-pool contract is the source of truth for protocol actions and storage.

Veyra must not treat a generic Starknet `request` method as proof that the connected wallet is registered for STRK20. A `NOT_REGISTERED` response does not create a transaction hash. The safe product behavior is to explain that registration or initialization for the wallet, asset, and privacy-pool/SDK deployment is missing, keep the route out of submitted/confirmed state, and require a supported registered flow plus verified Mainnet deployment evidence before enabling contract-specific execution.
