# Claimed-Route Hash Recovery Runbook

Use this runbook only when a sender’s wallet already returned a Starknet Mainnet transaction hash but Veyra did not show the route as submitted. It does **not** send funds, prompt a wallet, or request any secret.

## Preconditions

The operator must be signed in to the same Veyra workspace that created the claimed route. The operator needs only the transaction hash already shown by the sender wallet. Do not provide a seed phrase, recovery words, private key, viewing key, encrypted note, or exported wallet file.

| Check | Expected value |
| --- | --- |
| Network | Starknet Mainnet |
| Saved route | The exact route that created the wallet request, not a later duplicate draft |
| Hash | A hexadecimal `0x…` hash from the wallet’s completed transaction |
| Wallet action | **None** during recovery |

## Recovery procedure

1. Open **Operations → Claims** in the authenticated sender workspace.
2. Choose the exact claimed saved route from **Select a saved route for claim review**.
3. Confirm the claimed recipient address, asset, route amount, and Mainnet label. Do not press **Review & Submit Private Transaction**.
4. In **Recover a returned wallet hash / No new signature**, paste the existing transaction hash.
5. Select **Verify & Record Existing Hash**.
6. Veyra checks the Mainnet receipt before it writes the submission record. It does not create a wallet prompt.
7. When the route shows **Private transaction submitted — Verify receipt**, select **Verify receipt**. Only an accepted, successful receipt can move the application state to confirmed.

> If receipt verification fails, leaves the state unknown, or shows the route does not match the intended action, stop. Do not request another signature. Preserve the hash and inspect the public explorer record or contact the wallet provider using only public details.

## Scope and privacy limit

Recovery proves only that the route has a stored public transaction hash and that Veyra can evaluate its public receipt. It does **not** prove that a private recipient wallet discovered the encrypted note. The recipient’s own Shielded Starknet/private-balance view remains the authority for that outcome.
