#!/usr/bin/env bash
set -euo pipefail

SOURCE="/home/ubuntu/upload/veyra_submission_judge_cut_90s.mp4"
OUT_DIR="/home/ubuntu/webdev-static-assets/veyra-demo-v2/ending-fix"
LOGO="$OUT_DIR/correct-veyra-closing-card.png"
OUTRO="$OUT_DIR/veyra_submission_outro.wav"
OUT="$OUT_DIR/veyra_submission_judge_cut_90s_preserved_corrected.mp4"

mkdir -p "$OUT_DIR"
ffmpeg -y -i "$SOURCE" -loop 1 -framerate 60 -i "$LOGO" -i "$OUTRO" \
  -filter_complex "[0:v]setpts=PTS-STARTPTS,format=yuv420p[base];[1:v]setpts=PTS-STARTPTS,format=yuv420p[logo];[base][logo]overlay=x=0:y=0:eof_action=repeat:enable='between(t,83.4,86.2)'[v];[0:a]aresample=async=1:first_pts=0[a0];[2:a]aresample=async=1:first_pts=0,adelay=70400|70400[a1];[a0][a1]amix=inputs=2:duration=longest:dropout_transition=0,atrim=duration=90,asetpts=PTS-STARTPTS[a]" \
  -map "[v]" -map "[a]" -t 90 -c:v libx264 -preset medium -crf 18 -r 60 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"

echo "Rendered $OUT"
