# Veyra Mainnet Evidence Record — Wallet-Native STRK Shield

## Evidence scope

This record contains only the public transaction evidence supplied by the wallet holder and verified on Starkscan. It deliberately excludes private recipient information, encrypted notes, viewing keys, wallet credentials, and any claim links.

| Field                   | Verified public value                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Network                 | Starknet Mainnet                                                                                                                |
| Wallet flow             | Ready X wallet-native Shield / Private balance                                                                                  |
| Transaction hash        | `0x0336a6a8d3cc51290ed19e17b3f927d253389dea5f5408ff6b33cf926c3bed57`                                                            |
| Explorer                | [Starkscan transaction page](https://starkscan.co/tx/0x0336a6a8d3cc51290ed19e17b3f927d253389dea5f5408ff6b33cf926c3bed57)        |
| Receipt status          | Succeeded; Accepted on L2                                                                                                       |
| Block                   | `13,761,415`                                                                                                                    |
| Wallet-confirmed action | Shield 1.0 STRK to the private balance                                                                                          |
| Public pool metadata    | Starkscan identifies `0x40337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a` as the Starknet Canonical Privacy Pool |
| Public token metadata   | STRK token contract `0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`                                         |

## Interpretation

Ready X reports the wallet-native action as **Shield** and **Success**. Starkscan independently reports the supplied transaction as accepted on Starknet L2 and includes a public 1 STRK transfer leg to the canonical privacy pool. This establishes real Mainnet shield evidence.

The transaction does **not** prove a public balance increase. A successful shield action moves the selected asset into the wallet's private balance, so it should be evaluated in Ready X's private or shielded balance view rather than added to the wallet's public STRK balance.

No private transfer, recipient, private amount, or note ownership claim is inferred from this public record.

## Sources

1. [Starkscan transaction record](https://starkscan.co/tx/0x0336a6a8d3cc51290ed19e17b3f927d253389dea5f5408ff6b33cf926c3bed57)
2. Ready X transaction confirmation supplied by the wallet holder during this evidence review.
