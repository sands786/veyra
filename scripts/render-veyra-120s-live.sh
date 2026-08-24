#!/usr/bin/env bash
set -euo pipefail

ASSET_DIR="/home/ubuntu/webdev-static-assets/veyra-demo-v2"
LIVE_DIR="$ASSET_DIR/live-capture/recorded"
OUT_DIR="$ASSET_DIR/judge-cut-120s"
SEGMENT_DIR="$OUT_DIR/segments"
TEASER="/home/ubuntu/webdev-static-assets/veyra-30s-logo-led-stable-teaser.mp4"
SCORE="/home/ubuntu/Downloads/veyra-cinematic-institutional-score.wav"
VOICE="$ASSET_DIR/veyra_120s_judge_voiceover.wav"
CONCAT_LIST="/home/ubuntu/veilpay-private-sprint/scripts/veyra-120s-live-concat.txt"
OUT="$OUT_DIR/veyra_120s_live_judge_cut_clean.mp4"

mkdir -p "$SEGMENT_DIR"
for source in "$TEASER" "$SCORE" "$VOICE" "$LIVE_DIR/payroll_live.mp4" "$LIVE_DIR/primitives_live.mp4" "$LIVE_DIR/markets_live.mp4" "$LIVE_DIR/demo_governance_live.mp4" "$CONCAT_LIST"; do
  [[ -f "$source" ]] || { echo "Missing source: $source" >&2; exit 1; }
done

render_segment() {
  local source="$1"
  local start="$2"
  local duration="$3"
  local target="$4"
  ffmpeg -y -ss "$start" -t "$duration" -i "$source" \
    -vf "scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.08" \
    -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$target" >/dev/null 2>&1
}

# 112 seconds total. Sources 01–05 are authentic Chromium/Xvfb captures; only
# sources 00 and 06 are the user-approved teaser bookends.
render_segment "$TEASER" 0 10 "$SEGMENT_DIR/00_teaser_open.mp4"
render_segment "$LIVE_DIR/payroll_live.mp4" 5 20 "$SEGMENT_DIR/01_payroll_live.mp4"
render_segment "$LIVE_DIR/primitives_live.mp4" 2 20 "$SEGMENT_DIR/02_primitives_live.mp4"
render_segment "$LIVE_DIR/markets_live.mp4" 1 18 "$SEGMENT_DIR/03_markets_live.mp4"
render_segment "$LIVE_DIR/demo_governance_live.mp4" 3 20 "$SEGMENT_DIR/04_launchpad_live.mp4"
render_segment "$LIVE_DIR/payroll_live.mp4" 10 12 "$SEGMENT_DIR/05_execution_boundary_live.mp4"

# Use the approved teaser's clean Veyra lockup as a deliberate final hold. The
# original teaser then moves back into product footage, so carrying its full
# 22-second tail would weaken the closing hierarchy of this judge cut.
ffmpeg -y -ss 8 -t 0.2 -i "$TEASER" \
  -vf "scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.08,tpad=stop_mode=clone:stop_duration=11.8" \
  -t 12 -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$SEGMENT_DIR/06_teaser_close.mp4" >/dev/null 2>&1

ffmpeg -y \
  -f concat -safe 0 -i "$CONCAT_LIST" \
  -stream_loop -1 -i "$SCORE" \
  -i "$VOICE" \
  -filter_complex "
    [1:a]atrim=duration=112,volume=0.14[music];
    [2:a]volume=1.05[voice];
    [music][voice]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[aout]
  " \
  -map 0:v:0 -map "[aout]" \
  -r 60 -c:v libx264 -preset slow -profile:v high -level 4.2 -pix_fmt yuv420p \
  -b:v 8M -minrate 8M -maxrate 8M -bufsize 16M -x264-params nal-hrd=cbr -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 \
  "$OUT"

echo "Rendered $OUT"
