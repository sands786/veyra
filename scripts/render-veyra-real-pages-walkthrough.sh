#!/usr/bin/env bash
set -euo pipefail

BASE="/home/ubuntu/webdev-static-assets/veyra-demo-v2/real-pages-v2"
OUT="/home/ubuntu/webdev-static-assets/veyra-demo-v2/veyra_real_pages_highlighted_walkthrough.mp4"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

files=(
  01_payment_routes.mp4
  02_proof_ledger.mp4
  03_identity_keys.mp4
  04_operations.mp4
  05_treasury.mp4
  06_claims.mp4
  07_launchpad.mp4
  08_private_primitives.mp4
  09_private_markets.mp4
  10_agent.mp4
  11_documentation.mp4
)
labels=(
  "01 / PAYMENT ROUTES"
  "02 / PROOF LEDGER"
  "03 / IDENTITY KEYS"
  "04 / OPERATIONS"
  "05 / TREASURY"
  "06 / CLAIMS"
  "07 / LAUNCHPAD"
  "08 / PRIVATE PRIMITIVES"
  "09 / PRIVATE MARKETS"
  "10 / VEYRA AGENT"
  "11 / DOCUMENTATION"
)

inputs=()
filter_complex=""
for i in "${!files[@]}"; do
  inputs+=( -stream_loop -1 -i "$BASE/${files[$i]}" )
  safe_label=$(printf '%s' "${labels[$i]}" | sed "s/'/'\\\\''/g")
  filter_complex+="[$i:v]trim=duration=13,setpts=PTS-STARTPTS,drawbox=x=185:y=70:w=1645:h=930:color=0xF0563A@0.86:t=4,drawbox=x=205:y=90:w=1605:h=48:color=0x111210@0.88:t=fill,drawtext=fontfile=$FONT:text='$safe_label':x=225:y=105:fontsize=22:fontcolor=0xF3EEE5[v$i];"
done
concat_inputs=""
for i in "${!files[@]}"; do concat_inputs+="[v$i]"; done
filter_complex+="$concat_inputs concat=n=${#files[@]}:v=1:a=0,format=yuv420p[v]"

ffmpeg -y "${inputs[@]}" -i "$BASE/veyra_real_pages_narration.wav" -filter_complex "$filter_complex" -map "[v]" -map ${#files[@]}:a -c:v libx264 -preset medium -crf 18 -r 30 -c:a aac -b:a 160k -af "aresample=async=1:first_pts=0" -shortest -movflags +faststart "$OUT"

echo "Rendered $OUT"
