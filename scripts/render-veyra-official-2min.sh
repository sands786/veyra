#!/usr/bin/env bash
set -euo pipefail

ASSET_DIR="/home/ubuntu/webdev-static-assets/veyra-demo-v2"
LIVE_DIR="$ASSET_DIR/live-capture/rebuild-recorded"
OUT_DIR="$ASSET_DIR/official-2min-demo"
SEGMENT_DIR="$OUT_DIR/segments"
TEASER="/home/ubuntu/webdev-static-assets/veyra-30s-logo-led-stable-teaser.mp4"
SCORE="/home/ubuntu/Downloads/veyra-cinematic-institutional-score.wav"
VOICE="$ASSET_DIR/veyra_official_2min_voiceover.wav"
CAPTIONS="/home/ubuntu/veilpay-private-sprint/scripts/veyra-official-2min-one-line.ass"
CLEAN="$OUT_DIR/veyra_official_2min_clean.mp4"
CAPTIONED="$OUT_DIR/veyra_official_2min_one_line_captions.mp4"
CONCAT="$OUT_DIR/segments.txt"

mkdir -p "$SEGMENT_DIR"
for source in "$TEASER" "$SCORE" "$VOICE" "$CAPTIONS" \
  "$LIVE_DIR/payroll_outcome.mp4" "$LIVE_DIR/operations_outcome.mp4" \
  "$LIVE_DIR/treasury_outcome.mp4" "$LIVE_DIR/claims_outcome.mp4" \
  "$LIVE_DIR/primitives_outcome.mp4" "$LIVE_DIR/markets_context.mp4" \
  "$LIVE_DIR/launchpad_outcome.mp4" "$LIVE_DIR/proof_outcome.mp4"; do
  [[ -f "$source" ]] || { echo "Missing source: $source" >&2; exit 1; }
done

render_full() {
  local source="$1" start="$2" duration="$3" target="$4"
  ffmpeg -y -ss "$start" -t "$duration" -i "$source" \
    -vf "scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06" \
    -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$target" >/dev/null 2>&1
}

render_focus() {
  local source="$1" start="$2" duration="$3" target="$4"
  # Preserve a very brief full-frame simulation boundary, then cut into the product
  # panel. This prevents the static Demo Mode hero from consuming the interaction.
  ffmpeg -y -ss "$start" -t "$duration" -i "$source" \
    -filter_complex "
      [0:v]trim=duration=0.8,setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06[boundary];
      [0:v]trim=start=0.8,setpts=PTS-STARTPTS,crop=1200:675:720:170,scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06[focus];
      [boundary][focus]concat=n=2:v=1:a=0[v]
    " -map "[v]" -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$target" >/dev/null 2>&1
}

# 120 seconds exactly: 114 seconds of authentic product state changes, framed by
# a 3-second teaser cue and a 3-second clean resolve. No repeated screenshot montage.
render_full "$TEASER" 0 3 "$SEGMENT_DIR/00_open.mp4"
render_focus "$LIVE_DIR/payroll_outcome.mp4" 1 19 "$SEGMENT_DIR/01_payroll.mp4"
render_focus "$LIVE_DIR/operations_outcome.mp4" 1 12 "$SEGMENT_DIR/02_operations.mp4"
render_focus "$LIVE_DIR/treasury_outcome.mp4" 1 12 "$SEGMENT_DIR/03_treasury.mp4"
render_focus "$LIVE_DIR/claims_outcome.mp4" 1 12 "$SEGMENT_DIR/04_claims.mp4"
render_full "$LIVE_DIR/primitives_outcome.mp4" 0 10 "$SEGMENT_DIR/05_primitives.mp4"
render_full "$LIVE_DIR/markets_context.mp4" 0 11 "$SEGMENT_DIR/06_markets.mp4"
render_focus "$LIVE_DIR/launchpad_outcome.mp4" 1 17 "$SEGMENT_DIR/07_launchpad.mp4"
render_focus "$LIVE_DIR/proof_outcome.mp4" 1 14 "$SEGMENT_DIR/08_proof.mp4"
render_full "$LIVE_DIR/payroll_outcome.mp4" 0 7 "$SEGMENT_DIR/09_mainnet_boundary.mp4"
ffmpeg -y -ss 8 -t 0.2 -i "$TEASER" \
  -vf "scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06,tpad=stop_mode=clone:stop_duration=2.8" \
  -t 3 -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$SEGMENT_DIR/10_close.mp4" >/dev/null 2>&1

cat > "$CONCAT" <<EOF
file '$SEGMENT_DIR/00_open.mp4'
file '$SEGMENT_DIR/01_payroll.mp4'
file '$SEGMENT_DIR/02_operations.mp4'
file '$SEGMENT_DIR/03_treasury.mp4'
file '$SEGMENT_DIR/04_claims.mp4'
file '$SEGMENT_DIR/05_primitives.mp4'
file '$SEGMENT_DIR/06_markets.mp4'
file '$SEGMENT_DIR/07_launchpad.mp4'
file '$SEGMENT_DIR/08_proof.mp4'
file '$SEGMENT_DIR/09_mainnet_boundary.mp4'
file '$SEGMENT_DIR/10_close.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$CONCAT" -stream_loop -1 -i "$SCORE" -i "$VOICE" \
  -filter_complex "
    [1:a]atrim=duration=120,volume=0.15[music];
    [2:a]volume=1.03,asplit=2[voice_for_duck][voice];
    [music][voice_for_duck]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[ducked];
    [ducked][voice]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[aout]
  " -map 0:v:0 -map "[aout]" -t 120 \
  -r 60 -c:v libx264 -preset slow -profile:v high -level 4.2 -pix_fmt yuv420p \
  -b:v 8M -minrate 8M -maxrate 8M -bufsize 16M -x264-params nal-hrd=cbr -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 "$CLEAN"

# Accessibility alternative: precisely one compact one-line lower-third at a time.
ffmpeg -y -i "$CLEAN" -vf "subtitles=$CAPTIONS" -map 0:v:0 -map 0:a? \
  -r 60 -c:v libx264 -preset slow -profile:v high -level 4.2 -pix_fmt yuv420p \
  -b:v 8M -minrate 8M -maxrate 8M -bufsize 16M -x264-params nal-hrd=cbr -movflags +faststart \
  -c:a copy "$CAPTIONED"

echo "Rendered $CLEAN"
echo "Rendered $CAPTIONED"
