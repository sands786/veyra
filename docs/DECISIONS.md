# Veyra Decision Record

> These decisions explain the product’s deliberately narrow truth claims. They are product and engineering choices, not retroactive justification for missing functionality.

## ADR-001 — The wallet is the signing authority

**Decision.** Veyra coordinates requests but never holds a seed phrase, private key, recovery phrase, or keystore.

**Why.** A private-finance operating system should not silently become a wallet custodian. Keeping approval in a Starknet wallet makes the user-visible trust boundary concrete.

**Consequence.** A persisted route is necessarily distinct from a signed transaction. The UI and documentation must explain that distinction every time it matters.

## ADR-002 — A hash is not a receipt

**Decision.** Recording a hash creates a `submitted` state; confirmation comes from Starknet RPC receipt inspection.

**Why.** Wallet flows can fail, revert, remain pending, or be referenced against the wrong network. Treating a locally supplied hash as settlement would be misleading.

**Consequence.** The product exposes `submitted`, `confirmed`, `reverted`, and `unknown`; it can move a route to `settled` only after confirmation logic and approval gates pass.

## ADR-003 — Public proof is smaller than the private operating record

**Decision.** A public proof exposes only a constrained route summary after settlement.

**Why.** The useful public question is often “did this route settle?” rather than “who was paid what?” Privacy is preserved by minimizing the proof surface, not by obscuring an oversized record.

**Consequence.** `getPublicProof` does not return recipient roster data, individual amounts, private notes, bidder identities, or encrypted terms.

## ADR-004 — Policy is enforced before persistence, not merely visualized

**Decision.** Treasury and Private Market policies run as server-side checks before protected workflow mutations persist.

**Why.** A dashboard warning that can be bypassed by calling the API directly is not a control.

**Consequence.** Route policy constraints, role checks, market lifecycle rules, and bid risk checks live in server/database paths and are covered by the test suite.

## ADR-005 — The Cairo registry remains non-custodial until transfer semantics can be audited

**Decision.** The included Cairo registry records route and settlement commitments but does not transfer or escrow tokens.

**Why.** Contract surface area should not be invented for presentation. Fund-moving semantics require real interface design, testnet validation, operational controls, and independent review.

**Consequence.** The registry has explicit limits in its own README; Veyra does not represent it as deployed mainnet custody infrastructure.

## ADR-006 — Demo Mode is intentionally non-evidentiary

**Decision.** Demo Mode is deterministic local product explanation, not a simulated mainnet claim.

**Why.** Reviewers need a fast route through the product, but demonstration data must never be confused with a cryptographic receipt.

**Consequence.** Demo semantics are labeled and not written into `strk20.json` as transaction evidence.

## ADR-007 — Documentation is a product surface

**Decision.** The repository, in-product documentation, stable film library, visual architecture, reviewer guide, threat model, and decision record are one documentation system.

**Why.** Privacy finance products create trust only when their boundaries are intelligible to operators, developers, and reviewers.

**Consequence.** Every major README claim points to product, code, or a stated owner-operated boundary.
