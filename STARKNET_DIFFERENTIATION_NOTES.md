# Starknet Differentiation Notes

VeilPay should differentiate by using Starknet-native capabilities rather than presenting generic payroll features.

Starknet accounts are natively account-abstraction-based, which supports custom validation, fee abstraction, and flexible replay/nonce logic. This makes policy-controlled treasury accounts, session-style operator permissions, and sponsored or delegated workflows strong product directions.

Official Starknet transaction receipts expose execution/finality status and emitted events. VeilPay can use this foundation for receipt monitoring, proof health, and operational reconciliation rather than treating a submitted hash as final.

STRK20 is described by Starknet as a privacy framework for ERC-20 assets using encrypted notes and zero-knowledge proofs. Public observers can verify protocol metadata without seeing sender, receiver, amount, or private balances. It also includes an encrypted viewing-key path for defined disclosure. VeilPay should therefore make its distinctive value the operational layer around this privacy: policy templates, treasury guardrails, recipient claim flows, selective disclosure, and proof-aware reconciliation.

The proposed next features are: a privacy-safe treasury command center with budgets and spending limits; reusable payment policy templates with dry-run simulation; recipient self-claim links that never expose the roster; and Starknet-native operational intelligence for receipt/proof health and team activity.

## References

[1]: https://docs.starknet.io/learn/protocol/accounts "Starknet accounts and native account abstraction"
[2]: https://docs.starknet.io/learn/protocol/transactions "Starknet transaction lifecycle and receipts"
[3]: https://www.starknet.io/blog/privacy-live-on-starknet/ "STRK20 privacy framework and disclosure model"
[4]: https://www.starknet.io/blog/starknet-v0-14-2-the-privacy-engine-arrives/ "Starknet v0.14.2 native proof verification and privacy infrastructure"
