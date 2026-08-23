# Veyra Mainnet Readiness

## Execution boundary

Veyra is configured for Starknet Mainnet only. The application can persist workspace records, route drafts, recipient records, approvals, claims, proofs, markets, Launchpad state, and audit events without sending a blockchain transaction. A blockchain action is real only when a compatible Starknet wallet opens a signing request, the user approves it, a transaction hash is returned, and the receipt is verified on Starknet Mainnet.

The current executable STRK20 asset mappings are the canonical Starknet Mainnet STRK and ETH ERC-20 addresses from the official Starknet chain-information documentation. Both use 18 decimals. Unknown token addresses are rejected before wallet invocation, and the route builder forwards the selected token address rather than a display symbol.

## Required public protocol configuration

A Veyra-owned contract integration requires a verified Mainnet privacy-pool deployment address, matching ABI and entrypoints, and the exact SDK release and provider configuration that produced the deployment. A class hash is not a deployed address. Until those public values are available from an authoritative STRK20 release or deployment manifest, Veyra must not invent a pool address, construct a generic fallback call, or claim that a route is confirmed.

The official wallet-standard request path is capability-based. Veyra may request `wallet_strk20InvokeTransaction` only through a wallet that explicitly exposes that STRK20 action. Generic `execute` is not used as a substitute for private actions, because it would not prove that the wallet and privacy SDK understand the required proof, pool, token, and action semantics.

## NOT_REGISTERED response

A wallet can expose a generic Starknet wallet API and still reject `wallet_strk20InvokeTransaction` with `NOT_REGISTERED`. This response means the STRK20 privacy flow has not been registered or initialized for the connected wallet, asset, or privacy-pool deployment; it does not create a transaction hash and must not advance a route to submitted or confirmed. Veyra now surfaces this distinction explicitly and remains fail-closed.

The official Starknet launch material describes the first live STRK20 phase as wallet-enabled privacy through Ready X and Xverse. A Braavos connection should therefore be treated as compatible only when it explicitly supports the required STRK20 action and the relevant registration flow; a generic `request` method alone is not sufficient evidence. A Braavos `Not implemented` response means it connected but did not create a private-action transaction.

## Wallet-native transaction path

For a real first-phase STRK20 transaction, the user must use the Privacy or Shield flow inside Ready X or Xverse on Starknet Mainnet. The user selects a supported asset, reviews the exact wallet-provided amount, fee, network, and privacy-pool details, and approves the wallet-native shielding action. After it confirms, a private transfer may be created through the same supported wallet flow. The user must provide Veyra only the resulting public transaction hash for receipt verification.

Veyra's route-builder private-action request remains fail-closed until an official developer-facing STRK20 wallet API/SDK release, verified privacy-pool deployment configuration, and compatible wallet action support are available. Veyra must not route around this limitation with a public ERC-20 transfer or an unverified contract call.

For a private transfer, the recipient must also have the wallet-native STRK20 receiver or channel context required by the supporting wallet. A `Missing channel context for recipient` error does not create a completed transfer and must be rejected rather than retried with a public-transfer workaround.

## User-owned completion steps

For wallet-native evidence, the user must connect Ready X or Xverse on Starknet Mainnet, complete a small intended Shield action only after inspecting the wallet request, record the returned hash, confirm the contract and token on Starkscan, wait for a receipt, and run Veyra receipt verification. Only the verified receipt should be recorded as confirmed evidence.

For a future Veyra-owned contract integration, the user must separately provide or deploy the verified Mainnet privacy-pool contract using the pinned official STRK20 source and release, then configure the public deployment values in the environment. This is not a prerequisite for using the official wallet-native Ready X/Xverse flow.

Never provide a seed phrase, private key, password, recovery code, or wallet backup to Veyra or any third party. Never use a testnet address in the Mainnet configuration. Never treat a proof card, saved route, submitted hash, or UI badge as proof of settlement without a verified Mainnet receipt.

## Evidence record

For each real transaction, retain the following public evidence: network (`Starknet Mainnet`), wallet type, transaction hash, Starkscan URL, contract address, selected token address, human-readable amount, receipt status, and the resulting Veyra transaction/route state. Do not include private recipient rosters, individual amounts, private claim links, signing credentials, or encrypted viewing keys in public evidence.

## References

1. [Starknet Mainnet chain information and token addresses](https://docs.starknet.io/learn/cheatsheets/chain-info)
2. [STRK20: Make all ERC-20 tokens private](https://www.starknet.io/blog/make-all-erc-20-tokens-private-with-strk20/)
3. [Official Starknet privacy repository](https://github.com/starkware-libs/starknet-privacy)
4. [Starknet ERC-20 guidance](https://docs.starknet.io/build/starkzap/erc20)
5. [Privacy is now live on Starknet: supported wallet phase](https://www.starknet.io/blog/privacy-live-on-starknet/)
