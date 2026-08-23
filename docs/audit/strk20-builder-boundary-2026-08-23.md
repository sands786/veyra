# STRK20 Builder and Wallet Boundary — 2026-08-23

## Purpose

This evidence note records public official guidance used to assess Veyra's private-payment integration boundary. It does not contain wallet credentials, viewing keys, encrypted notes, or recipient-private data.

## Verified public guidance

| Source                                                                                                                 | Relevant public finding                                                                                                                                                                                                                                                                                     | Veyra hardening implication                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Privacy Is Now Live on Starknet](https://www.starknet.io/blog/privacy-live-on-starknet/)                              | The first live STRK20 phase is wallet-led through Ready X and Xverse; private transfers occur inside privacy pools. Private actions spend encrypted notes and create new notes, while public observers cannot identify the private sender, receiver, amount, or notes used.                                 | A public receipt can establish an accepted privacy-pool action but cannot confirm the claimed recipient's private-note discovery. Veyra must retain a receipt-only settlement boundary.                                         |
| [Push to Private](https://www.starknet.io/blog/push-to-private/)                                                       | The Privacy Wallet API is the recommended application-layer route for normal dapps. A privacy-enabled wallet handles proving and notes so the app does not touch viewing keys. The direct SDK route requires viewing-key registration, channel and subchannel management, proving, and on-chain submission. | Veyra must submit only through the wallet privacy API, never persist privacy secrets, and treat a returned transaction hash as the sole basis for recording a submitted state.                                                  |
| [Make all ERC-20 tokens private with STRK20](https://www.starknet.io/blog/make-all-erc-20-tokens-private-with-strk20/) | The pool operates with encrypted notes and client-side proof generation; transfers are private at the recipient and amount level.                                                                                                                                                                           | Product records must distinguish a claimed public wallet address, wallet-requested submission, public receipt success, and private recipient-wallet discovery. These are distinct states.                                       |
| [starkware-libs/starknet-privacy](https://github.com/starkware-libs/starknet-privacy)                                  | The official repository describes an SDK that orchestrates registration, private transfer, and discovery; it builds a transaction that the wallet submits to Starknet.                                                                                                                                      | Veyra must treat wallet submission and its returned hash as a durable boundary: a post-wallet application write must be retry-safe and must not trigger another wallet request when persistence is interrupted.                 |
| [Starknet developer tools](https://docs.starknet.io/learn/cheatsheets/tools)                                           | Official developer guidance links STRK20 by Example for runnable integrations covering privacy SDK deposits, transfers, withdrawals, note discovery, DeFi helpers, and wallet integration.                                                                                                                  | Veyra’s hardening test plan must cover the application lifecycle around wallet submission and receipt recording, while leaving note discovery to the supported privacy wallet/SDK rather than inventing a public-balance proxy. |

## Audit conclusions

1. A claimed-recipient workflow cannot automatically establish recipient delivery. The recipient wallet must discover its own encrypted note.
2. A wallet-originated private transaction may be publicly verifiable on Starkscan, but Veyra must persist the returned hash atomically or provide a recovery/import pathway; otherwise the app can incorrectly offer a second signature.
3. Veyra must never request or retain a viewing key, encrypted note, seed phrase, private key, or recovery words as a workaround for wallet discovery.
4. Wallet submission, server-side transaction recording, public receipt confirmation, and recipient-note discovery are four separate lifecycle events. The UI must show their ordering without conflating any two.

## Sources

1. https://www.starknet.io/blog/privacy-live-on-starknet/
2. https://www.starknet.io/blog/push-to-private/
3. https://www.starknet.io/blog/make-all-erc-20-tokens-private-with-strk20/
4. https://github.com/starkware-libs/starknet-privacy
5. https://docs.starknet.io/learn/cheatsheets/tools
