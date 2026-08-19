# Veyra — STRK20 Private Sprint evidence handoff

Veyra’s source code includes a full-stack privacy-finance workspace, wallet-controlled Starknet intent construction, receipt gating, and a non-custodial Cairo payroll registry. The public three-minute cinematic demo film is complete and linked in `strk20.json`. This document records the remaining evidence still owned by the submitting team. It intentionally does not invent transaction hashes, deployed addresses, or a repository URL.

## Required before the August 31, 2026 deadline

1. Publish this repository publicly on GitHub and keep this `LICENSE` file in the root.
2. Add the public repository URL and Telegram usernames to the official `starkience/strk20-hackathon` registry through the required registration pull request.
3. Use a real Starknet wallet to submit at least three successful mainnet transactions that touch the live STRK20 pool. Save the exact transaction hashes.
4. If the Veyra payroll registry is deployed, add its real deployed address to the `contracts` list in `strk20.json`.
5. The three-minute Veyra cinematic walkthrough is published as `demo_video` in `strk20.json`. Keep that URL available through judging.
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
  "demo_video": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/YdHzChgWKsFyYVYG.mp4",
  "demo_url": "https://veilpay-spri-t4knu9mv.manus.space"
}
```

Only replace placeholders with user-generated, verifiable evidence. The official hub verifies each transaction against Starknet mainnet and the STRK20 pool.
