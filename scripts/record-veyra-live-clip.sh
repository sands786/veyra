#!/usr/bin/env bash
set -euo pipefail

CLIP="${1:?Usage: record-veyra-live-clip.sh <payroll|primitives|markets|launchpad|demo_governance> [output-dir]}"
OUT_DIR="${2:-/home/ubuntu/webdev-static-assets/veyra-demo-v2/live-capture/recorded}"
DISPLAY_NUM=":98"
PROFILE_DIR="$(mktemp -d)"
CHROME_INPUT_Y_OFFSET="${CHROME_INPUT_Y_OFFSET:-108}"
mkdir -p "$OUT_DIR"

case "$CLIP" in
  payroll|demo_governance) URL="http://127.0.0.1:3000/demo" ;;
  primitives) URL="http://127.0.0.1:3000/private-primitives" ;;
  markets) URL="http://127.0.0.1:3000/private-markets" ;;
  launchpad) URL="http://127.0.0.1:3000/launchpad" ;;
  *) echo "Unknown clip: $CLIP" >&2; exit 2 ;;
esac

OUTPUT="$OUT_DIR/${CLIP}_live.mp4"

cleanup() {
  pkill -f "$PROFILE_DIR" >/dev/null 2>&1 || true
  pkill -f "Xvfb $DISPLAY_NUM" >/dev/null 2>&1 || true
  rm -rf "$PROFILE_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT

move() {
  local target_y=$(( $2 + CHROME_INPUT_Y_OFFSET ))
  DISPLAY="$DISPLAY_NUM" xdotool mousemove --sync "$1" "$target_y"
  sleep "${3:-0.45}"
}

click() {
  move "$1" "$2" "${3:-0.45}"
  DISPLAY="$DISPLAY_NUM" xdotool click 1
  sleep "${4:-1.2}"
}

scroll_down() {
  DISPLAY="$DISPLAY_NUM" xdotool click --repeat "$1" 5
  sleep "${2:-1.4}"
}

Xvfb "$DISPLAY_NUM" -screen 0 1920x1080x24 >/dev/null 2>&1 &
sleep 1
DISPLAY="$DISPLAY_NUM" chromium --no-sandbox --test-type --disable-dev-shm-usage --disable-notifications --disable-extensions --no-first-run --user-data-dir="$PROFILE_DIR" --kiosk --window-size=1920,1080 --app="$URL" >/dev/null 2>&1 &
sleep 6

# Every recorded clip is a real DOM interaction captured from an isolated browser session.
ffmpeg -y -thread_queue_size 512 -f x11grab -framerate 60 -video_size 1920x1080 -i "$DISPLAY_NUM" -t 25 -c:v libx264 -preset ultrafast -crf 15 -pix_fmt yuv420p -movflags +faststart "$OUTPUT" >/dev/null 2>&1 &
RECORD_PID=$!
sleep 1

case "$CLIP" in
  payroll)
    move 1120 355 0.8
    DISPLAY="$DISPLAY_NUM" xdotool click 1
    DISPLAY="$DISPLAY_NUM" xdotool key ctrl+a
    DISPLAY="$DISPLAY_NUM" xdotool type --delay 85 "4800"
    sleep 1
    click 708 484 0.8 1.3
    click 760 717 0.8 2.0
    click 1135 664 0.8 1.5
    move 960 590 0.8
    ;;
  primitives)
    click 410 455 0.9 2.0
    click 410 525 0.9 2.0
    move 985 705 0.8
    scroll_down 5 1.8
    move 970 670 0.8
    ;;
  markets)
    click 455 615 0.9 0.7
    DISPLAY="$DISPLAY_NUM" xdotool key End
    DISPLAY="$DISPLAY_NUM" xdotool type --delay 70 " builder"
    sleep 1.0
    click 455 685 0.8 0.7
    DISPLAY="$DISPLAY_NUM" xdotool key End
    DISPLAY="$DISPLAY_NUM" xdotool type --delay 70 "0"
    sleep 1.4
    move 1010 590 0.8
    scroll_down 4 1.8
    move 1180 400 0.8
    ;;
  launchpad)
    move 1030 228 1.0
    scroll_down 3 1.6
    move 960 520 0.9
    scroll_down 3 1.6
    move 1260 405 0.9
    ;;
  demo_governance)
    for ((i = 0; i < 12; i += 1)); do
      DISPLAY="$DISPLAY_NUM" xdotool key Tab
    done
    DISPLAY="$DISPLAY_NUM" xdotool key space
    sleep 2.0
    click 1120 350 0.8 1.3
    click 815 485 0.8 1.3
    click 770 540 0.8 2.0
    click 1165 133 0.8 2.0
    click 820 400 0.8 2.0
    move 1010 575 0.8
    ;;
esac

wait "$RECORD_PID"
echo "Recorded $OUTPUT"
