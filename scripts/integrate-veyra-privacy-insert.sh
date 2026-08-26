#!/usr/bin/env bash
set -euo pipefail

BASE="/home/ubuntu/webdev-static-assets/veyra-demo-v2/ending-fix/veyra_submission_judge_cut_90s_preserved_corrected.mp4"
INSERT="/home/ubuntu/webdev-static-assets/veyra-demo-v2/integrated/veyra_privacy_cinematic_insert.mp4"
OUT_DIR="/home/ubuntu/webdev-static-assets/veyra-demo-v2/integrated"
OUT="$OUT_DIR/veyra_submission_judge_cut_90s_with_privacy_insert.mp4"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

mkdir -p "$OUT_DIR"
ffmpeg -y -i "$BASE" -i "$INSERT" \
  -filter_complex "[1:v]scale=640:360:flags=lanczos,format=yuv420p,drawbox=x=0:y=318:w=640:h=42:color=0x0B0F0CE6:t=fill,drawtext=fontfile=$FONT:text='CONCEPTUAL PRIVACY MODEL':fontcolor=0xF5F0E8:fontsize=22:x=22:y=330,drawbox=x=0:y=0:w=640:h=360:color=0xF0563A:t=8,setpts=PTS-STARTPTS+42/TB,format=yuv420p[ins];[0:v][ins]overlay=x=1200:y=600:eof_action=pass:enable='between(t,42,50)'[v]" \
  -map "[v]" -map 0:a -t 90 -c:v libx264 -preset medium -crf 18 -r 60 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"

echo "Rendered $OUT"
