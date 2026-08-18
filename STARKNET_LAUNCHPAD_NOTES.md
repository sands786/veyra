# Veyra Privacy Launchpad — Starknet Capability Notes

## Product direction
Veyra can extend into a privacy-focused Starknet Launchpad for confidential project fundraising and milestone treasury management. The product should keep investor identities, contribution amounts, allocation state, and treasury intent private by default while publishing only project-level proof metadata and selectively disclosing evidence when authorized.

## Official Starknet capabilities

Starknet’s official privacy announcement describes STRK20 as a privacy framework for ERC-20 assets, with shielded balances, private transfers, and application-level privacy flows. It explains that private transfers use encrypted notes and zero-knowledge proofs; public observers do not see sender, receiver, amount, or private balances used. The same source describes an encrypted viewing-key path for scoped disclosure when required, which supports a launchpad design with private allocations and controlled audit access.

Source: https://www.starknet.io/blog/privacy-live-on-starknet/

Starknet’s official privacy/compliance position frames privacy as contextual rather than absolute: users can prove what needs proving without revealing unrelated information. It explicitly identifies private DAO treasuries and private token distributions as suitable use cases. This supports publishing project-level commitments and milestone proofs while keeping individual allocations private.

Source: https://www.starknet.io/blog/onchain-privacy-and-compliance/

Starknet accounts use native account abstraction. The official account documentation says account contracts can define custom validation and execution logic, enabling programmable authorization, fee abstraction, replay protection, batched actions, social recovery, and other account-level policies. For Veyra, this supports future launchpad wallets or treasury accounts with project-specific spend limits and multi-approver validation, but the current SaaS must not claim these are deployed onchain until a real contract integration exists.

Source: https://docs.starknet.io/learn/protocol/accounts

Starknet transaction fees are composed from L2 computation, L2 data, and L1 data, and the official fee documentation describes fee estimation and resource limits. Launchpad workflows should therefore separate offchain draft/simulation from explicit wallet-authorized execution, show fee estimates when available, and avoid presenting a database state transition as an onchain contribution.

Source: https://docs.starknet.io/learn/protocol/fees

## Proposed Launchpad MVP

1. Private project room: project name, description, target, token, network, fundraising window, and workspace-scoped roles.
2. Shielded allocation registry: store only commitments and encrypted/private metadata references; never expose a public investor roster.
3. Milestone treasury: create milestones, configure release amounts, require configurable approvals, and record proof references.
4. Private claim links: issue expiring single-use contributor claim links that persist redeemed wallet state and route fulfillment.
5. Public proof card: show project status, aggregate progress, milestone status, and commitment/proof identifiers without individual allocations.
6. Explicit execution boundary: clearly label simulated/offchain states versus wallet-signed Starknet transactions; real contract calls require a deployed contract address and wallet evidence.

## Privacy and honesty constraints

The initial implementation can provide a real workspace-backed Launchpad workflow and signed-transaction boundary using the existing STRK20 adapter, but it must not claim that a custom Launchpad contract, ZK allocation circuit, paymaster, or viewing-key system has been deployed unless those artifacts and transaction hashes exist. Public proof pages must remain aggregate and commitment-based, and all private roster or allocation data must remain workspace-authorized.

## References

[1]: https://www.starknet.io/blog/privacy-live-on-starknet/ "Privacy Is Now Live on Starknet"
[2]: https://www.starknet.io/blog/onchain-privacy-and-compliance/ "Starknet: Our View on Onchain Privacy"
[3]: https://docs.starknet.io/learn/protocol/accounts "Starknet Accounts Documentation"
[4]: https://docs.starknet.io/learn/protocol/fees "Starknet Fees Documentation"
