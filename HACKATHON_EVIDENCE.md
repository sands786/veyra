# Veyra — STRK20 Private Sprint evidence handoff

Veyra’s source code includes a full-stack privacy-finance workspace, wallet-controlled Starknet intent construction, receipt gating, and a non-custodial Cairo payroll registry. This document records the final evidence still owned by the submitting team. It intentionally does not invent transaction hashes, deployed addresses, a repository URL, or a demo video URL.

## Required before the August 31, 2026 deadline

1. Publish this repository publicly on GitHub and keep this `LICENSE` file in the root.
2. Add the public repository URL and Telegram usernames to the official `starkience/strk20-hackathon` registry through the required registration pull request.
3. Use a real Starknet wallet to submit at least three successful mainnet transactions that touch the live STRK20 pool. Save the exact transaction hashes.
4. If the Veyra payroll registry is deployed, add its real deployed address to the `contracts` list in `strk20.json`.
5. Record and upload a three-minute Veyra walkthrough. Add the public URL as `demo_video` in `strk20.json`.
6. Keep the public demo URL in `strk20.json` current. The currently configured Veyra deployment URL is included as a starting value.

## Final `strk20.json` shape

```json
{
  "transactions": [
    "0xREAL_SUCCESSFUL_MAINNET_STRK20_HASH_1",
    "0xREAL_SUCCESSFUL_MAINNET_STRK20_HASH_2",
    "0xREAL_SUCCESSFUL_MAINNET_STRK20_HASH_3"
  ],
  "contracts": ["0xOPTIONAL_REAL_DEPLOYED_VEYRA_CONTRACT"],
  "demo_video": "https://youtu.be/REAL_THREE_MINUTE_VEYRA_DEMO",
  "demo_url": "https://veilpay-spri-t4knu9mv.manus.space"
}
```

Only replace placeholders with user-generated, verifiable evidence. The official hub verifies each transaction against Starknet mainnet and the STRK20 pool.

