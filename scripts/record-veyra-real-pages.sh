#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-/home/ubuntu/webdev-static-assets/veyra-demo-v2/real-pages}"
DISPLAY_NUM=":97"
PROFILE_DIR="$(mktemp -d)"
mkdir -p "$OUT_DIR"

cleanup() {
  pkill -f "$PROFILE_DIR" >/dev/null 2>&1 || true
  pkill -f "Xvfb $DISPLAY_NUM" >/dev/null 2>&1 || true
  rm -rf "$PROFILE_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT

Xvfb "$DISPLAY_NUM" -screen 0 1920x1080x24 >/dev/null 2>&1 &
sleep 1

record_page() {
  local key="$1" url="$2" seconds="${3:-9}"
  DISPLAY="$DISPLAY_NUM" chromium --no-sandbox --test-type --disable-dev-shm-usage --disable-notifications --disable-extensions --no-first-run --user-data-dir="$PROFILE_DIR/$key" --kiosk --window-size=1920,1080 --app="http://127.0.0.1:3000$url" >/dev/null 2>&1 &
  local browser_pid=$!
  sleep 4
  ffmpeg -y -thread_queue_size 512 -f x11grab -framerate 60 -video_size 1920x1080 -i "$DISPLAY_NUM" -t "$seconds" -c:v libx264 -preset ultrafast -crf 15 -pix_fmt yuv420p -movflags +faststart "$OUT_DIR/${key}.mp4" >/dev/null 2>&1
  kill "$browser_pid" >/dev/null 2>&1 || true
  sleep 1
}

record_section() {
  local key="$1" y="$2" seconds="${3:-9}"
  DISPLAY="$DISPLAY_NUM" chromium --no-sandbox --test-type --disable-dev-shm-usage --disable-notifications --disable-extensions --no-first-run --user-data-dir="$PROFILE_DIR/$key" --kiosk --window-size=1920,1080 --app="http://127.0.0.1:3000/" >/dev/null 2>&1 &
  local browser_pid=$!
  sleep 4
  local window_id
  window_id=$(DISPLAY="$DISPLAY_NUM" xdotool search --sync --onlyvisible --class chromium | head -1)
  DISPLAY="$DISPLAY_NUM" xdotool windowraise "$window_id" || true
  ffmpeg -y -thread_queue_size 512 -f x11grab -framerate 60 -video_size 1920x1080 -i "$DISPLAY_NUM" -t "$seconds" -c:v libx264 -preset ultrafast -crf 15 -pix_fmt yuv420p -movflags +faststart "$OUT_DIR/${key}.mp4" >/dev/null 2>&1 &
  local ffmpeg_pid=$!
  sleep 1
  DISPLAY="$DISPLAY_NUM" xdotool mousemove --sync 90 "$y"
  DISPLAY="$DISPLAY_NUM" xdotool click 1
  sleep 2
  wait "$ffmpeg_pid"
  kill "$browser_pid" >/dev/null 2>&1 || true
  sleep 1
}

# Real workspace sections on the root page; no Demo Mode activation.
record_section "01_payment_routes" 135 9
record_section "02_proof_ledger" 185 9
record_section "03_identity_keys" 225 9
record_section "04_operations" 295 9
record_section "05_treasury" 330 9
record_section "06_claims" 365 9

# Real protocol/resource pages.
record_page "07_launchpad" "/launchpad" 10
record_page "08_private_primitives" "/private-primitives" 10
record_page "09_private_markets" "/private-markets" 10
record_page "10_agent" "/agent" 10
record_page "11_documentation" "/documentation" 8

echo "Captured real Veyra pages in $OUT_DIR"
