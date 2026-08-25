#!/usr/bin/env bash
set -euo pipefail

ASSET_DIR="/home/ubuntu/webdev-static-assets/veyra-demo-v2"
LIVE_DIR="$ASSET_DIR/live-capture/rebuild-recorded"
OUT_DIR="$ASSET_DIR/judge-cut-outcome-rebuild"
SEGMENT_DIR="$OUT_DIR/segments"
TEASER="/home/ubuntu/webdev-static-assets/veyra-30s-logo-led-stable-teaser.mp4"
SCORE="/home/ubuntu/Downloads/veyra-cinematic-institutional-score.wav"
VOICE="$ASSET_DIR/veyra_92s_outcome_voiceover.wav"
CONCAT_LIST="/home/ubuntu/veilpay-private-sprint/scripts/veyra-outcome-rebuild-concat.txt"
OUT="$OUT_DIR/veyra_outcome_led_judge_cut_clean.mp4"

mkdir -p "$SEGMENT_DIR"
for source in "$TEASER" "$SCORE" "$VOICE" "$LIVE_DIR/payroll_outcome.mp4" "$LIVE_DIR/primitives_outcome.mp4" "$LIVE_DIR/launchpad_outcome.mp4" "$LIVE_DIR/proof_outcome.mp4" "$LIVE_DIR/markets_context.mp4" "$CONCAT_LIST"; do
  [[ -f "$source" ]] || { echo "Missing source: $source" >&2; exit 1; }
done

render_segment() {
  local source="$1"
  local start="$2"
  local duration="$3"
  local target="$4"
  ffmpeg -y -ss "$start" -t "$duration" -i "$source" \
    -vf "scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06" \
    -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$target" >/dev/null 2>&1
}

render_demo_outcome() {
  local source="$1"
  local start="$2"
  local duration="$3"
  local target="$4"
  ffmpeg -y -ss "$start" -t "$duration" -i "$source" \
    -filter_complex "
      [0:v]trim=duration=2,setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06[boundary];
      [0:v]trim=start=2,setpts=PTS-STARTPTS,crop=1280:720:600:90,scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06[focus];
      [boundary][focus]concat=n=2:v=1:a=0[v]
    " \
    -map "[v]" -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$target" >/dev/null 2>&1
}

# 81 seconds: a three-second identity cue, five unique live product outcomes,
# and a three-second closing resolve. No repeated Payroll shot and no static
# logo hold longer than the product proof it frames.
render_segment "$TEASER" 0 3 "$SEGMENT_DIR/00_teaser_open.mp4"
render_demo_outcome "$LIVE_DIR/payroll_outcome.mp4" 1 19 "$SEGMENT_DIR/01_payroll_outcome.mp4"
render_segment "$LIVE_DIR/primitives_outcome.mp4" 0 11 "$SEGMENT_DIR/02_primitives_outcome.mp4"
render_demo_outcome "$LIVE_DIR/launchpad_outcome.mp4" 1 19 "$SEGMENT_DIR/03_launchpad_outcome.mp4"
render_demo_outcome "$LIVE_DIR/proof_outcome.mp4" 1 17 "$SEGMENT_DIR/04_proof_outcome.mp4"
render_segment "$LIVE_DIR/markets_context.mp4" 0 9 "$SEGMENT_DIR/05_markets_context.mp4"

# The chosen frame is a clean branded Veyra teaser lockup. It is held only long
# enough to resolve the film, avoiding the long static ending rejected by the user.
ffmpeg -y -ss 8 -t 0.2 -i "$TEASER" \
  -vf "scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06,tpad=stop_mode=clone:stop_duration=2.8" \
  -t 3 -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$SEGMENT_DIR/06_teaser_close.mp4" >/dev/null 2>&1

ffmpeg -y \
  -f concat -safe 0 -i "$CONCAT_LIST" \
  -stream_loop -1 -i "$SCORE" \
  -i "$VOICE" \
  -filter_complex "
    [1:a]atrim=duration=81,volume=0.16[music];
    [2:a]volume=1.03,asplit=2[voice_for_duck][voice];
    [music][voice_for_duck]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[ducked];
    [ducked][voice]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[aout]
  " \
  -map 0:v:0 -map "[aout]" \
  -r 60 -c:v libx264 -preset slow -profile:v high -level 4.2 -pix_fmt yuv420p \
  -b:v 8M -minrate 8M -maxrate 8M -bufsize 16M -x264-params nal-hrd=cbr -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 \
  "$OUT"

echo "Rendered $OUT"
