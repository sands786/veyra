#!/usr/bin/env bash
set -euo pipefail

BASE="/home/ubuntu/webdev-static-assets/veyra-demo-v2/ending-fix/veyra_submission_judge_cut_90s_preserved_corrected.mp4"
INSERT="/home/ubuntu/upload/veyra_privacy_cinematic_insert.mp4"
OUT_DIR="/home/ubuntu/webdev-static-assets/veyra-demo-v2/4k60"
OUT="$OUT_DIR/veyra_submission_judge_cut_90s_4k60_cinematic.mp4"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

mkdir -p "$OUT_DIR"
ffmpeg -y -i "$BASE" -i "$INSERT" \
  -filter_complex "[0:v]scale=3840:2160:flags=lanczos,setsar=1,format=yuv420p[base];[1:v]scale=3840:2160:flags=lanczos,trim=duration=8,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.45,fade=t=out:st=7.2:d=0.8,drawbox=x=140:y=1840:w=820:h=170:color=0x080B0BDB:t=fill,drawtext=fontfile=$FONT:text='CONCEPTUAL VISUAL':fontcolor=0xF0563A:fontsize=44:x=185:y=1870,drawtext=fontfile=$FONT:text='NOT LIVE PRODUCT FOOTAGE':fontcolor=0xF5F0E8:fontsize=30:x=185:y=1930,setpts=PTS-STARTPTS+42/TB,format=yuv420p[cinematic];[base][cinematic]overlay=x=0:y=0:eof_action=pass:enable='between(t,42,50)'[v]" \
  -map "[v]" -map 0:a -t 90 -r 60 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$OUT"

echo "Rendered $OUT"
