#!/usr/bin/env bash
set -euo pipefail

: "${SEPOLIA_RPC_URL:?Set SEPOLIA_RPC_URL to a Starknet Sepolia RPC endpoint}"
: "${STARKNET_ACCOUNT:?Set STARKNET_ACCOUNT to a local sncast account name}"
: "${OWNER_CONTRACT_ADDRESS:?Set OWNER_CONTRACT_ADDRESS to the intended owner address}"

export PATH="$HOME/.local/bin:$PATH"
cd "$(dirname "$0")/.."

scarb build

echo "1/2 Declaring VeyraPayrollRegistry. Review the command and approve it in your local Starknet account tooling."
sncast declare \
  --url "$SEPOLIA_RPC_URL" \
  --account "$STARKNET_ACCOUNT" \
  --contract-name VeyraPayrollRegistry

echo "Declaration complete. Copy CLASS_HASH from the output and run:"
echo "sncast deploy --url \"$SEPOLIA_RPC_URL\" --account \"$STARKNET_ACCOUNT\" --class-hash <CLASS_HASH> --constructor-calldata $OWNER_CONTRACT_ADDRESS"
echo "Preserve the declaration hash, deployment transaction hash, contract address, network, and compiler version."
