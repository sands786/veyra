#!/usr/bin/env bash
set -euo pipefail

: "${CLASS_HASH:?Set CLASS_HASH after reviewing the declared VeyraAgentCoordinator class}"

if [[ "${CONFIRM_MAINNET:-}" != "YES" ]]; then
  echo "Refusing Mainnet deployment. Re-run with CONFIRM_MAINNET=YES after reviewing CLASS_HASH and fee estimate." >&2
  exit 1
fi

sncast deploy \
  --network mainnet \
  --class-hash "$CLASS_HASH"
