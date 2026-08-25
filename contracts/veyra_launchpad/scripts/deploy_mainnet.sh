#!/usr/bin/env bash
set -euo pipefail

: "${MAINNET_RPC_URL:?Set MAINNET_RPC_URL to an approved Starknet Mainnet RPC endpoint}"
: "${STARKNET_ACCOUNT:?Set STARKNET_ACCOUNT to a local sncast account name or path}"
: "${LAUNCHPAD_TOKEN_ADDRESS:?Set LAUNCHPAD_TOKEN_ADDRESS to the independently verified Mainnet token address}"
: "${LAUNCHPAD_CLASS_HASH:?Set LAUNCHPAD_CLASS_HASH after a successful, reviewed declaration}"

case "$LAUNCHPAD_TOKEN_ADDRESS" in
  0x|0x0|0x0000000000000000000000000000000000000000000000000000000000000000)
    echo "Refusing to deploy with an empty token address." >&2
    exit 1
    ;;
esac

if [[ "${CONFIRM_MAINNET_DEPLOY:-}" != "I_HAVE_REVIEWED_THE_CONTRACT_AND_TOKEN" ]]; then
  echo "Refusing Mainnet deployment. Set CONFIRM_MAINNET_DEPLOY=I_HAVE_REVIEWED_THE_CONTRACT_AND_TOKEN only after independent review." >&2
  exit 1
fi

command -v sncast >/dev/null 2>&1 || { echo "sncast is required; install and pin the Starknet toolchain first." >&2; exit 1; }

cd "$(dirname "$0")/.."
scarb build
sncast declare --url "$MAINNET_RPC_URL" --account "$STARKNET_ACCOUNT" --contract-name VeyraLaunchpadEscrow
sncast deploy --url "$MAINNET_RPC_URL" --account "$STARKNET_ACCOUNT" --class-hash "$LAUNCHPAD_CLASS_HASH" --constructor-calldata "$LAUNCHPAD_TOKEN_ADDRESS"
