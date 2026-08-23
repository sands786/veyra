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
| Public token metadata | STRK token contract `0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` |

## Second wallet-native shield receipt

| Field | Verified public value |
| --- | --- |
| Transaction hash | `0x03dd3037a3d6cada35b764e57f94f3fac0fc5f55cd6592bb214c1a5ec2c11890` |
| Explorer | [Starkscan transaction page](https://starkscan.co/tx/0x03dd3037a3d6cada35b764e57f94f3fac0fc5f55cd6592bb214c1a5ec2c11890) |
| Receipt status | Succeeded; Accepted on L2 |
| Block | `13,761,602` |
| Public pool transfer leg | 1 STRK to the Starknet Canonical Privacy Pool |
| Public on-chain fee | 2.905316 STRK (`$0.0829` at transaction time) |

## Interpretation

Ready X reports the wallet-native action as **Shield** and **Success**. Starkscan independently reports the supplied transaction as accepted on Starknet L2 and includes a public 1 STRK transfer leg to the canonical privacy pool. This establishes real Mainnet shield evidence.

The transaction does **not** prove a public balance increase. A successful shield action moves the selected asset into the wallet's private balance, so it should be evaluated in Ready X's private or shielded balance view rather than added to the wallet's public STRK balance.

The two public receipt fees are 2.905315 STRK and 2.905316 STRK, totaling 5.810631 STRK. Starkscan also displays 6 STRK privacy-pool release legs in each transaction. Those release legs are protocol-level movements and are not, by themselves, a reliable statement of the wallet holder's private-note ownership or a substitute for Ready X's private balance accounting. The wallet's displayed $0.17 amount therefore must not be described as a confirmed 6 STRK network fee; the public receipt confirms the exact on-chain fee separately.

No private transfer, recipient, private amount, or note ownership claim is inferred from this public record.

## Sources

1. [Starkscan transaction record](https://starkscan.co/tx/0x0336a6a8d3cc51290ed19e17b3f927d253389dea5f5408ff6b33cf926c3bed57)
2. [Second Starkscan transaction record](https://starkscan.co/tx/0x03dd3037a3d6cada35b764e57f94f3fac0fc5f55cd6592bb214c1a5ec2c11890)
3. Ready X transaction confirmations supplied by the wallet holder during this evidence review.
