#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/ubuntu/webdev-static-assets/veyra-demo-v2"
LIVE="$ROOT/live-capture/rebuild-recorded"
OUT_DIR="$ROOT/submission-90s"
SEG="$OUT_DIR/segments"
TEASER="/home/ubuntu/webdev-static-assets/veyra-30s-logo-led-stable-teaser.mp4"
VOICE_SRC="$ROOT/veyra_92s_outcome_voiceover.wav"
SCORE="/home/ubuntu/Downloads/veyra-cinematic-institutional-score.wav"
OUT="$OUT_DIR/veyra_submission_judge_cut_90s.mp4"
mkdir -p "$SEG"

for source in "$TEASER" "$VOICE_SRC" "$SCORE" "$LIVE/payroll_outcome.mp4" "$LIVE/operations_outcome.mp4" "$LIVE/treasury_outcome.mp4" "$LIVE/claims_outcome.mp4" "$LIVE/primitives_outcome.mp4" "$LIVE/markets_context.mp4" "$LIVE/launchpad_outcome.mp4" "$LIVE/proof_outcome.mp4"; do
  [[ -f "$source" ]] || { echo "Missing source: $source" >&2; exit 1; }
done

render() {
  local source="$1" start="$2" duration="$3" target="$4"
  ffmpeg -y -ss "$start" -t "$duration" -i "$source" \
    -vf "scale=1920:1080:flags=lanczos,fps=60,eq=contrast=1.03:saturation=1.06" \
    -an -r 60 -c:v libx264 -preset fast -crf 15 -pix_fmt yuv420p -movflags +faststart "$target" >/dev/null 2>&1
}

render "$TEASER" 0 3 "$SEG/00_open.mp4"
render "$LIVE/payroll_outcome.mp4" 1 12 "$SEG/01_payroll.mp4"
render "$LIVE/operations_outcome.mp4" 1 9 "$SEG/02_operations.mp4"
render "$LIVE/treasury_outcome.mp4" 1 9 "$SEG/03_treasury.mp4"
render "$LIVE/claims_outcome.mp4" 1 8 "$SEG/04_claims.mp4"
render "$LIVE/primitives_outcome.mp4" 0 10 "$SEG/05_primitives.mp4"
render "$LIVE/markets_context.mp4" 0 9 "$SEG/06_markets.mp4"
render "$LIVE/launchpad_outcome.mp4" 1 14 "$SEG/07_launchpad.mp4"
render "$LIVE/proof_outcome.mp4" 1 10 "$SEG/08_proof.mp4"
render "$TEASER" 8 6 "$SEG/09_close.mp4"

cat > "$OUT_DIR/concat.txt" <<EOF
file '$SEG/00_open.mp4'
file '$SEG/01_payroll.mp4'
file '$SEG/02_operations.mp4'
file '$SEG/03_treasury.mp4'
file '$SEG/04_claims.mp4'
file '$SEG/05_primitives.mp4'
file '$SEG/06_markets.mp4'
file '$SEG/07_launchpad.mp4'
file '$SEG/08_proof.mp4'
file '$SEG/09_close.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$OUT_DIR/concat.txt" -c copy "$OUT_DIR/visuals.mp4" >/dev/null 2>&1
ffmpeg -y -i "$OUT_DIR/visuals.mp4" -i "$VOICE_SRC" -stream_loop -1 -i "$SCORE" \
  -filter_complex "[1:a]atempo=1.022,atrim=duration=90,volume=1.03,asplit=2[vduck][voice];[2:a]atrim=duration=90,volume=0.16[music];[music][vduck]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[ducked];[ducked][voice]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[aout]" \
  -map 0:v:0 -map "[aout]" -t 90 -r 60 -c:v libx264 -preset slow -profile:v high -level 4.2 -pix_fmt yuv420p -b:v 8M -minrate 8M -maxrate 8M -bufsize 16M -x264-params nal-hrd=cbr -movflags +faststart -c:a aac -b:a 192k -ar 48000 "$OUT" >/dev/null 2>&1

echo "Rendered $OUT"
