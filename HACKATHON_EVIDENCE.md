# Veyra — STRK20 Private Sprint evidence handoff

Veyra’s source code includes a full-stack privacy-finance workspace, wallet-controlled Starknet intent construction, receipt gating, and a non-custodial Cairo payroll registry. The public three-minute cinematic demo film is linked in `strk20.json`. Three wallet-native Ready X STRK20 Mainnet privacy-pool transactions have been supplied by the wallet holder and independently verified on Starkscan. This handoff records public receipt evidence only; it does not invent deployed addresses, recipient balances, or private wallet data.

## Required before the August 31, 2026 deadline

1. Confirm the public repository and `LICENSE` remain available at submission time.
2. Add the public repository URL and Telegram usernames to the official `starkience/strk20-hackathon` registry through the required registration pull request.
3. The official transaction-count prerequisite is now met with the three verified Mainnet privacy-pool hashes below. Do not add any further hash unless it is publicly verifiable on Starknet Mainnet and touches the live STRK20 pool.
4. If the Veyra payroll registry is deployed, add its real deployed address to the `contracts` list in `strk20.json`.
5. The three-minute Veyra cinematic walkthrough is published as `demo_video` in `strk20.json`. Keep that URL available through judging.
6. Keep the public demo URL in `strk20.json` current. The currently configured Veyra deployment URL is included as a starting value.

## Final `strk20.json` shape

```json
{
  "transactions": [
    "0x0336a6a8d3cc51290ed19e17b3f927d253389dea5f5408ff6b33cf926c3bed57",
    "0x03dd3037a3d6cada35b764e57f94f3fac0fc5f55cd6592bb214c1a5ec2c11890",
    "0x02437fc5f800a691602781a26fa98e3eea494eb94c909f6db347ae3003743c9f"
  ],
  "contracts": [],
  "demo_video": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663488625248/veJaWSgpcQWfhFVT.mp4",
  "demo_url": "https://veilpay-spri-t4knu9mv.manus.space"
}
```

The official hub verifies each transaction against Starknet Mainnet and the STRK20 pool. The three hashes above are public evidence records only; they do not disclose private notes, recipient rosters, or wallet credentials. In particular, the third hash is a successful privacy-pool **Send** action, but its public receipt cannot prove that a designated recipient wallet has discovered or credited the encrypted private note. Recipient delivery must be confirmed inside that recipient wallet’s Shielded Starknet view.

## Availability check — 23 August 2026

| Asset | Verified public location | Result |
| --- | --- | --- |
| Live application | [veilpay-spri-t4knu9mv.manus.space](https://veilpay-spri-t4knu9mv.manus.space) | Resolved to the Veyra public product entry point. |
| Source repository | [github.com/sands786/veyra](https://github.com/sands786/veyra) | Public repository; default branch `main`; description identifies Veyra as privacy-first Starknet financial coordination. |
| Repository license | [MIT License](https://github.com/sands786/veyra/blob/main/LICENSE) | Publicly available and verified through the GitHub repository license endpoint. |
| Active metadata | [`strk20.json`](./strk20.json) | Valid JSON with exactly the three verified public Mainnet hashes, no fake placeholder, an empty contracts list, and the public app URL. |
| Demo video | `demo_video` in `strk20.json` | HTTP `200`, `video/mp4`, 17,369,355 bytes at validation time. |

This availability check does not replace the registry pull request or the user-owned final submission action.
