## STRK20 Mainnet execution audit — 2026-08-23

The official Starknet launch article at https://www.starknet.io/blog/privacy-live-on-starknet/ states that STRK20 privacy begins in supported wallets, currently names Ready X and Xverse, and describes shielding, private transfers, and unshielding. It states that builders can integrate private flows via an SDK, but the article does not provide a Veyra-specific Mainnet contract address, ABI, or Braavos `execute` calldata specification. The linked builder page https://strk20.starknet.io/build returned no extractable text in the browser session. Consequently, Veyra must remain fail-closed: no invented contract address, ABI, or wallet call should be used for a real transaction.

## Official STRK20 repository audit — 2026-08-23

Source: https://github.com/starkware-libs/starknet-privacy, checked at the current main branch.

The official SDK README identifies the package as `@starkware-libs/starknet-privacy-sdk`. Its `createPrivateTransfers` configuration requires an account or `{ address, signer }`, a viewing-key provider, a proving provider, a discovery provider, and the deployed `poolContractAddress`. The recommended builder flow compiles actions through the SDK and ends in `execute()`; examples include register, deposit, transfer, withdraw, setup, and external invoke.

The official browser client contains `client/src/sdk-wallet.ts`, which defines an `SdkWallet` adapter. Its `strk20InvokeTransaction` method proves actions and sends the resulting call through a paymaster; a deposit additionally requires a user-signed ERC-20 `approve` call. This is not the same as a generic Braavos `account.execute` call. The official demo Mainnet template requires `VITE_RPC_URL`, `VITE_INDEXER_URL`, `VITE_PROVING_SERVICE_URL`, `VITE_POOL_ADDRESS`, `VITE_POOL_CLASS_HASH`, `VITE_COMPLIANCE_PUBLIC_KEY`, `VITE_CHAIN_ID=0x534e5f4d41494e`, a JSON token configuration, and optional paymaster settings.

The repository root README lists the Privacy Pool class hash `0x52107fadffab71bdcbb6b2ccb68ba3e1b5558d94036538053e159d3076ad633`, but a class hash is not a deployed contract address. The checked source tree did not expose a verified Starknet Mainnet pool address or a ready-to-use ABI/deployment manifest. Therefore Veyra must not use that class hash as an address or invent a Braavos call. The appropriate production implementation is to integrate the official SDK and configure the verified Mainnet pool, discovery, proving, and paymaster endpoints when authoritative deployment details are obtained.

## Starknet.js wallet-standard verification — 2026-08-23

The temporary Starknet.js 10.5.0 package inspection confirms the official wallet-standard helper calls `walletWSF.features["starknet:walletApi"].request({ type: "wallet_strk20InvokeTransaction", params: { actions } })`. It also exposes `strk20PrepareInvoke`, `strk20Balances`, and `addInvokeTransaction`. `WalletAccountV6.strk20InvokeTransaction()` delegates to that helper. This confirms Veyra’s current direct property check (`wallet.strk20InvokeTransaction`) is insufficient for standard injected Braavos wallets: the app must wrap a wallet-standard object or call the official request feature. The route still requires a verified STRK20 pool contract, proving/discovery services, and matching SDK revision before it can be safely enabled.
