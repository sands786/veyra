# Controlled Demo Mode Feature Test — August 23, 2026

## Scope and boundary

This test pass exercises only Veyra’s deterministic, local Demo Mode. It does not connect a real wallet, persist production data, submit a transaction, or alter the unresolved Ready X recipient-delivery investigation.

## Findings to date

| Surface         | Action                                               | Observed result                                                                                                                                   | Settlement boundary                                                                         |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Demo shell      | Enter Demo Mode                                      | Route changed to `/demo` and prominently showed `DEMO MODE / SIMULATED ONLY`.                                                                     | The page stated `00 REAL TXNS` and `100% LOCAL STATE`.                                      |
| Demo wallet     | Select **Connect Demo Wallet**                       | The interface showed `0xDEMO…BEEF` and appended a `Demo wallet connected` entry to the simulation ledger.                                         | No real injected wallet request or signature was initiated.                                 |
| Private payroll | Select **Simulate Shielded Route**                   | The route displayed `SHIELDED` and `SUBMITTED`, while the interface raised a `Private payroll route simulated` notice.                            | The page continued to state that Demo Mode never creates a real Starknet transaction.       |
| Operations      | Open the Operations surface                          | The UI showed weekly cadence, 2/2 approvals, nominal health, and a local pause/resume schedule control.                                           | The standard Demo Mode local-only boundary remained visible.                                |
| Operations      | Select **Pause / Resume Schedule**                   | The control intentionally exposed a `FAILED / SIMULATED` state with a `RETRY ACTION` affordance.                                                  | This is a visible simulated error/retry path, not a scheduling mutation or wallet action.   |
| Operations      | Select **Retry Action**                              | The schedule returned to a visible `COMPLETE` state and the simulation ledger recorded `Weekly payroll schedule paused and resumed`.              | Recovery remained local and did not request a wallet signature.                             |
| Treasury        | Open the Treasury surface                            | The UI reported a successful Mainnet policy dry-run: 2,840 USDC was below the simulated 10,000 USDC daily limit.                                  | The result was presented as a Demo Mode policy check and not a transfer approval.           |
| Treasury        | Select **Run Policy Dry-Run**, then **Retry Action** | The first interaction surfaced `FAILED / SIMULATED`; retry returned `COMPLETE` and recorded `Treasury policy dry-run passed` in the local ledger. | No wallet request, signature, or Mainnet transfer occurred.                                 |
| Claims          | Open the Claims surface                              | The UI displayed a truncated claim reference, `UNREDEEMED` status, and a redemption control without showing a recipient roster.                   | The shared Demo Mode boundary stated that no real transaction is created.                   |
| Claims          | Select **Redeem Private Link**                       | The action entered a clearly labeled `FAILED / SIMULATED` state with a `RETRY ACTION` control.                                                    | The simulated failure did not create a payment, a claim-link mutation, or a wallet request. |

## Next checks

The remaining Demo Mode surfaces to exercise are Operations, Treasury, Claims, Launchpad, Proof, state advancement, simulated error and retry, and reset behavior. Outcomes will be recorded only after observation.
