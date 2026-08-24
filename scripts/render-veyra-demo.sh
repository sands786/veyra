#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/ubuntu/webdev-static-assets/veyra-demo-v2"
WORK="$ROOT/render"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
mkdir -p "$WORK"

node /home/ubuntu/veilpay-private-sprint/scripts/build-veyra-demo-captions.mjs

ffmpeg -y -i "$ROOT/veyra_demo_voiceover.wav" -af "atempo=0.82,alimiter=limit=0.92" "$WORK/voiceover_slow.wav"

make_ui_clip() {
  local source="$1"
  local duration="$2"
  local label="$3"
  local file="$4"
  local frames=$((duration * 60))
  ffmpeg -y -loop 1 -framerate 60 -i "$source" -f lavfi -i "color=c=0x0B0E10:s=1920x1080:r=60" -filter_complex "[0:v]scale=1780:1002,zoompan=z='min(max(zoom\,1.0)+0.00009\,1.075)':d=$frames:s=1728x972:fps=60,eq=contrast=1.10:saturation=1.13[screen];[1:v][screen]overlay=96:54,drawbox=x=95:y=53:w=1730:h=974:color=0xF0563A@0.32:t=2,drawtext=fontfile=$FONT:text='$label':x=132:y=92:fontsize=26:fontcolor=0xF0563A:box=1:boxcolor=0x111210@0.72:boxborderw=14,drawtext=fontfile=$FONT:text='VEYRA / STARKNET MAINNET':x=132:y=1010:fontsize=18:fontcolor=0xF3EEE5@0.88:box=1:boxcolor=0x111210@0.66:boxborderw=10,format=yuv420p[v]" -map "[v]" -t "$duration" -r 60 -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p "$WORK/$file"
}

ffmpeg -y -i "$ROOT/01_hook_public_to_private.mp4" -vf "scale=1728:972:force_original_aspect_ratio=decrease,pad=1920:1080:96:54:color=0x0B0E10,eq=contrast=1.10:saturation=1.12,drawbox=x=95:y=53:w=1730:h=974:color=0xF0563A@0.32:t=2,drawtext=fontfile=$FONT:text='THE PRIVATE FINANCE PROBLEM':x=132:y=92:fontsize=26:fontcolor=0xF0563A:box=1:boxcolor=0x111210@0.72:boxborderw=14,format=yuv420p" -t 10 -r 60 -an -c:v libx264 -preset medium -crf 17 "$WORK/01_hook.mp4"

make_ui_clip "/home/ubuntu/screenshots/webdev-preview-root-1787606660900206621-3876.png" 20 "PRIVATE FINANCIAL COORDINATION / STRK20" "02_solution.mp4"
make_ui_clip "/home/ubuntu/screenshots/webdev-preview-demo-1787606659095319262-7723.png" 25 "01 / PRIVATE PAYROLL" "03_payroll.mp4"
make_ui_clip "/home/ubuntu/screenshots/webdev-preview-private_primitives-1787606658778089957-1738.png" 25 "02 / PRIVATE PRIMITIVES" "04_primitives.mp4"
make_ui_clip "/home/ubuntu/screenshots/webdev-preview-private_markets-1787606658769815510-5208.png" 27 "03 / PRIVATE MARKETS" "05_markets.mp4"
make_ui_clip "/home/ubuntu/screenshots/webdev-preview-launchpad-1787606657741730400-6729.png" 28 "04 / PRIVATE LAUNCHPAD" "06_launchpad.mp4"
make_ui_clip "/home/ubuntu/screenshots/webdev-preview-private_markets-1787606658769815510-5208.png" 25 "WALLET SIGNS. VEYRA COORDINATES." "07_technical.mp4"
make_ui_clip "/home/ubuntu/screenshots/webdev-preview-root-1787606660900206621-3876.png" 16 "COORDINATE PRIVATELY. VERIFY OPENLY." "08_close.mp4"

cat > "$WORK/concat.txt" <<'EOF'
file '01_hook.mp4'
file '02_solution.mp4'
file '03_payroll.mp4'
file '04_primitives.mp4'
file '05_markets.mp4'
file '06_launchpad.mp4'
file '07_technical.mp4'
file '08_close.mp4'
EOF

pushd "$WORK" >/dev/null
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy visuals.mp4
popd >/dev/null

ffmpeg -y -i "$WORK/visuals.mp4" -i "$WORK/voiceover_slow.wav" -stream_loop -1 -i "/home/ubuntu/Downloads/veyra-cinematic-institutional-score.wav" -filter_complex "[2:a]atrim=duration=176,volume=0.24[music];[music][1:a]sidechaincompress=threshold=0.03:ratio=10:attack=15:release=700[ducked];[ducked][1:a]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.93[audio]" -map 0:v -map "[audio]" -t 176 -r 60 -c:v libx264 -profile:v high -level:v 4.2 -preset slow -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$ROOT/veyra_hackathon_demo_clean_1080p60.mp4"

ffmpeg -y -i "$ROOT/veyra_hackathon_demo_clean_1080p60.mp4" -vf "ass=$ROOT/captions.ass" -c:v libx264 -profile:v high -level:v 4.2 -preset slow -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -c:a copy -movflags +faststart "$ROOT/veyra_hackathon_demo_captioned_1080p60.mp4"

ffmpeg -y -i "$ROOT/veyra_hackathon_demo_clean_1080p60.mp4" -map 0:a:0 -c:a aac -b:a 160k "$ROOT/veyra_hackathon_demo_voice_and_score.m4a"

echo "Rendered Veyra demo masters in $ROOT"
