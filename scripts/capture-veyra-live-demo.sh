#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-/home/ubuntu/webdev-static-assets/veyra-demo-v2/live-capture}"
DISPLAY_NUM=":99"
URL="${VEYRA_CAPTURE_URL:-http://127.0.0.1:3000/}"
PROFILE_DIR="$(mktemp -d)"
mkdir -p "$OUT_DIR"

cleanup() {
  pkill -f "$PROFILE_DIR" >/dev/null 2>&1 || true
  pkill -f "chromium.*$DISPLAY_NUM" >/dev/null 2>&1 || true
  pkill -f "Xvfb $DISPLAY_NUM" >/dev/null 2>&1 || true
  sleep 1
  rm -rf "$PROFILE_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT

Xvfb "$DISPLAY_NUM" -screen 0 1920x1080x24 >/dev/null 2>&1 &
sleep 1
DISPLAY="$DISPLAY_NUM" chromium --no-sandbox --test-type --disable-dev-shm-usage --disable-notifications --disable-extensions --no-first-run --user-data-dir="$PROFILE_DIR" --kiosk --window-size=1920,1080 --app="$URL" >/dev/null 2>&1 &
sleep 6
DISPLAY="$DISPLAY_NUM" xdotool getdisplaygeometry

if [[ "${VEYRA_CAPTURE_ACTION:-baseline}" == "demo" ]]; then
  DISPLAY="$DISPLAY_NUM" xdotool mousemove 90 625
  DISPLAY="$DISPLAY_NUM" xdotool click 1
  sleep 3
fi

if [[ -n "${VEYRA_PROBE_X:-}" && -n "${VEYRA_PROBE_Y:-}" ]]; then
  DISPLAY="$DISPLAY_NUM" xdotool mousemove "$VEYRA_PROBE_X" "$VEYRA_PROBE_Y"
  DISPLAY="$DISPLAY_NUM" xdotool click 1
  sleep 3
fi

if [[ -n "${VEYRA_TAB_COUNT:-}" ]]; then
  for ((i = 0; i < VEYRA_TAB_COUNT; i += 1)); do
    DISPLAY="$DISPLAY_NUM" xdotool key Tab
  done
  DISPLAY="$DISPLAY_NUM" xdotool key space
  sleep 3
fi

DISPLAY="$DISPLAY_NUM" xdotool mousemove 960 540
ffmpeg -y -f x11grab -video_size 1920x1080 -i "$DISPLAY_NUM" -frames:v 1 "$OUT_DIR/live_capture_baseline.png" >/dev/null 2>&1
echo "Captured $OUT_DIR/live_capture_baseline.png"
