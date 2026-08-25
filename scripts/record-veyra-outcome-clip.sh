#!/usr/bin/env bash
set -euo pipefail

CLIP="${1:?Usage: record-veyra-outcome-clip.sh <payroll_outcome|operations_outcome|treasury_outcome|claims_outcome|primitives_outcome|launchpad_outcome|proof_outcome|markets_context>}"
OUT_DIR="${2:-/home/ubuntu/webdev-static-assets/veyra-demo-v2/live-capture/rebuild-recorded}"
DISPLAY_NUM=":96"
DEBUG_PORT=9222
PROFILE_DIR="$(mktemp -d)"
ROOT="/home/ubuntu/veilpay-private-sprint"
mkdir -p "$OUT_DIR"

case "$CLIP" in
  payroll_outcome|operations_outcome|treasury_outcome|claims_outcome|launchpad_outcome|proof_outcome) URL="http://127.0.0.1:3000/demo" ;;
  primitives_outcome) URL="http://127.0.0.1:3000/private-primitives" ;;
  markets_context) URL="http://127.0.0.1:3000/private-markets" ;;
  *) echo "Unknown clip: $CLIP" >&2; exit 2 ;;
esac

cleanup() {
  pkill -f "$PROFILE_DIR" >/dev/null 2>&1 || true
  pkill -f "Xvfb $DISPLAY_NUM" >/dev/null 2>&1 || true
  rm -rf "$PROFILE_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT

click_live() {
  node "$ROOT/scripts/cdp-click.mjs" "$DEBUG_PORT" "$1" >/dev/null
  sleep "${2:-1.0}"
}

tab_activate() {
  local count="$1"
  for ((index = 0; index < count; index += 1)); do
    DISPLAY="$DISPLAY_NUM" xdotool key Tab
  done
  DISPLAY="$DISPLAY_NUM" xdotool key space
  sleep "${2:-1.0}"
}

Xvfb "$DISPLAY_NUM" -screen 0 1920x1080x24 >/dev/null 2>&1 &
sleep 1
DISPLAY="$DISPLAY_NUM" chromium --no-sandbox --test-type --disable-dev-shm-usage --disable-notifications --disable-extensions --no-first-run --user-data-dir="$PROFILE_DIR" --kiosk --window-size=1920,1080 --remote-debugging-address=127.0.0.1 --remote-debugging-port="$DEBUG_PORT" --app="$URL" >/dev/null 2>&1 &
sleep 6

OUTPUT="$OUT_DIR/${CLIP}.mp4"
ffmpeg -y -thread_queue_size 512 -f x11grab -framerate 60 -video_size 1920x1080 -i "$DISPLAY_NUM" -t 25 -c:v libx264 -preset ultrafast -crf 15 -pix_fmt yuv420p -movflags +faststart "$OUTPUT" >/dev/null 2>&1 &
RECORD_PID=$!
sleep 1

case "$CLIP" in
  payroll_outcome)
    # Tab 19 is the calibrated “+ Add recipient” action on a fresh Demo Mode page.
    tab_activate 19 1.4
    # Focus remains on Add recipient; five subsequent tab stops reach the route simulation action.
    tab_activate 5 2.4
    ;;
  operations_outcome)
    # 9 activates Operations. The remaining product tabs and the surface-error
    # control occupy five focus stops before the action itself.
    tab_activate 9 1.0
    tab_activate 6 1.0
    tab_activate 1 2.6
    ;;
  treasury_outcome)
    # 10 activates Treasury; five subsequent stops reach the dry-run action.
    tab_activate 10 1.0
    tab_activate 5 1.0
    tab_activate 1 2.6
    ;;
  claims_outcome)
    # 11 activates Claims; four subsequent stops reach redeem then retry.
    tab_activate 11 1.0
    tab_activate 4 1.0
    tab_activate 1 2.6
    ;;
  primitives_outcome)
    # A fresh Primitives page reaches Selective Proof on tab 3. The resulting
    # preview visibly keeps the roster hidden; lower-page focus traversal is
    # intentionally avoided because it can invoke the workspace return link.
    tab_activate 3 1.5
    sleep 4.0
    ;;
  launchpad_outcome)
    # 12 activates the Demo Launchpad tab, then 4 selects the second project.
    # One further stop reserves its shielded allocation, producing a visible
    # stateful outcome while retaining the persistent simulated-only marker.
    tab_activate 12 1.2
    tab_activate 4 1.2
    tab_activate 1 3.0
    ;;
  proof_outcome)
    # 13 activates Proof, two further stops trigger the simulated publish
    # failure, and one final stop retries into the visible proof-published state.
    tab_activate 13 1.2
    tab_activate 2 1.0
    tab_activate 1 2.6
    ;;
  markets_context)
    DISPLAY="$DISPLAY_NUM" xdotool key Next
    sleep 1.3
    DISPLAY="$DISPLAY_NUM" xdotool key Next
    sleep 1.8
    ;;
esac

wait "$RECORD_PID"
echo "Recorded $OUTPUT"
