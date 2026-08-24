#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/ubuntu/webdev-static-assets/veyra-demo-v2"
WORK="$ROOT/rebuild"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
ROOT_CAPTURE="/home/ubuntu/screenshots/webdev-preview-root-1787608477770173814-9919.png"
DEMO_CAPTURE="/home/ubuntu/screenshots/webdev-preview-demo-1787608475964548533-6331.png"
PRIMITIVES_CAPTURE="/home/ubuntu/screenshots/webdev-preview-private_primitives-1787608475971959398-2046.png"
MARKETS_CAPTURE="/home/ubuntu/screenshots/webdev-preview-private_markets-1787608474995335040-8052.png"
LAUNCHPAD_CAPTURE="/home/ubuntu/screenshots/webdev-preview-launchpad-1787608473393965539-5034.png"
LOGO="$ROOT/veyra-lockup.png"
mkdir -p "$WORK"

node /home/ubuntu/veilpay-private-sprint/scripts/build-veyra-demo-compact-captions.mjs
ffmpeg -y -i "$ROOT/veyra_demo_voiceover.wav" -af "atempo=0.82,alimiter=limit=0.92" "$WORK/voiceover.wav"

make_scroll_clip() {
  local source="$1"
  local duration="$2"
  local label="$3"
  local description="$4"
  local file="$5"
  local cursor_x="$6"
  local cursor_y="$7"
  local start_y="$8"
  local end_y="$9"
  local fade_start
  fade_start=$(awk "BEGIN {printf \"%.2f\", $duration - 0.18}")
  ffmpeg -y -loop 1 -framerate 60 -i "$source" -filter_complex "[0:v]crop=1920:1080:0:'$start_y+($end_y-$start_y)*t/$duration',eq=contrast=1.11:saturation=1.12,drawbox=x=0:y=0:w=1920:h=1080:color=0x071015@0.08:t=fill,drawbox=x=80:y=54:w=1760:h=972:color=0xF0563A@0.28:t=2,drawtext=fontfile=$FONT:text='$label':x=120:y=92:fontsize=26:fontcolor=0xF0563A:box=1:boxcolor=0x111210@0.74:boxborderw=12,drawtext=fontfile=$FONT:text='$description':x=120:y=132:fontsize=34:fontcolor=0xF3EEE5:box=1:boxcolor=0x111210@0.58:boxborderw=9,drawtext=fontfile=$FONT:text='➤':x=$cursor_x:y=$cursor_y:fontsize=76:fontcolor=white:borderw=3:bordercolor=0x111210:enable='between(t,1.15,3.75)',drawtext=fontfile=$FONT:text='◎':x=$cursor_x+22:y=$cursor_y+18:fontsize=84:fontcolor=0xF0563A:enable='between(t,2.55,3.05)',drawtext=fontfile=$FONT:text='VEYRA / STARKNET MAINNET':x=120:y=1010:fontsize=18:fontcolor=0xF3EEE5@0.9:box=1:boxcolor=0x111210@0.62:boxborderw=9,fade=t=in:st=0:d=0.18,fade=t=out:st=$fade_start:d=0.18,format=yuv420p[v]" -map "[v]" -t "$duration" -r 60 -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p "$WORK/$file"
}

make_problem_open() {
  ffmpeg -y -loop 1 -framerate 60 -i "$ROOT_CAPTURE" -loop 1 -framerate 60 -i "$LOGO" -filter_complex "[0:v]crop=1920:1080:0:'30+110*t/12',eq=contrast=1.14:saturation=1.12,drawbox=x=0:y=0:w=1920:h=1080:color=0x071015@0.36:t=fill,drawbox=x=80:y=54:w=1760:h=972:color=0xF0563A@0.36:t=2,drawtext=fontfile=$FONT:text='PUBLIC DATA IS A LIABILITY.':x=120:y=158:fontsize=64:fontcolor=0xF3EEE5:enable='between(t,0,4.8)',drawtext=fontfile=$FONT:text='The roster should not become the product.':x=124:y=246:fontsize=32:fontcolor=0xF3EEE5@0.84:enable='between(t,0.6,5.5)',drawtext=fontfile=$FONT:text='PRIVATE FINANCE SHOULD STILL OPERATE.':x=120:y=158:fontsize=54:fontcolor=0xF3EEE5:enable='gte(t,5.0)',drawtext=fontfile=$FONT:text='Wallet-owned authorization. Receipt-gated proof.':x=124:y=236:fontsize=30:fontcolor=0xF3EEE5@0.84:enable='gte(t,5.6)'[bg];[1:v]format=rgba,fade=t=in:st=4.2:d=1:alpha=1[mark];[bg][mark]overlay=(W-w)/2:670:enable='gte(t,4.2)',drawtext=fontfile=$FONT:text='VEYRA / PRIVATE FINANCIAL COORDINATION':x=120:y=1010:fontsize=18:fontcolor=0xF3EEE5@0.9:box=1:boxcolor=0x111210@0.62:boxborderw=9,fade=t=in:st=0:d=0.2,fade=t=out:st=11.8:d=0.2,format=yuv420p[v]" -map "[v]" -t 12 -r 60 -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p "$WORK/01_hook.mp4"
}

make_final_resolve() {
  ffmpeg -y -loop 1 -framerate 60 -i "$ROOT_CAPTURE" -loop 1 -framerate 60 -i "$LOGO" -filter_complex "[0:v]crop=1920:1080:0:'1900+(2600-1900)*t/22',eq=contrast=1.12:saturation=1.12,drawbox=x=0:y=0:w=1920:h=1080:color=0x071015@0.10:t=fill,drawbox=x=80:y=54:w=1760:h=972:color=0xF0563A@0.30:t=2,drawtext=fontfile=$FONT:text='THE PRODUCT IS STILL RUNNING.':x=120:y=92:fontsize=26:fontcolor=0xF0563A:box=1:boxcolor=0x111210@0.74:boxborderw=12,drawtext=fontfile=$FONT:text='Coordinate privately.':x=120:y=720:fontsize=62:fontcolor=0xF3EEE5:enable='between(t,0,13.2)',drawtext=fontfile=$FONT:text='Verify openly.':x=120:y=798:fontsize=62:fontcolor=0xF0563A:enable='between(t,0.6,13.2)'[bg];[1:v]format=rgba,fade=t=in:st=13.0:d=1:alpha=1[mark];[bg][mark]overlay=(W-w)/2:360:enable='gte(t,13.0)',drawtext=fontfile=$FONT:text='PRIVATE FINANCIAL COORDINATION, WITHOUT THE PUBLIC ROSTER.':x=(w-text_w)/2:y=720:fontsize=28:fontcolor=0xF3EEE5:enable='gte(t,13.4)',drawtext=fontfile=$FONT:text='WALLET → RECEIPT → PROOF':x=(w-text_w)/2:y=774:fontsize=24:fontcolor=0x70D49D:enable='gte(t,14.1)',drawtext=fontfile=$FONT:text='VEYRA / STARKNET MAINNET':x=120:y=1010:fontsize=18:fontcolor=0xF3EEE5@0.9:box=1:boxcolor=0x111210@0.62:boxborderw=9,fade=t=in:st=0:d=0.2,format=yuv420p[v]" -map "[v]" -t 22 -r 60 -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p "$WORK/09_close.mp4"
}

make_problem_open
make_scroll_clip "$ROOT_CAPTURE" 14 "THE SYSTEM" "A private finance operating layer for STRK20." "02_system.mp4" 250 625 140 420
make_scroll_clip "$DEMO_CAPTURE" 22 "01 / PRIVATE PAYROLL" "Build the route. Gate the action. Confirm the receipt." "03_payroll.mp4" 1480 945 0 260
make_scroll_clip "$ROOT_CAPTURE" 10 "PAYROLL OUTCOME" "Intent, policy, proof, and a visible execution boundary." "04_payroll_outcome.mp4" 1520 700 420 900
make_scroll_clip "$PRIMITIVES_CAPTURE" 24 "02 / PRIVATE PRIMITIVES" "Private links, selective proof, and milestone controls." "05_primitives.mp4" 1600 720 0 280
make_scroll_clip "$MARKETS_CAPTURE" 26 "03 / PRIVATE MARKETS" "Aggregate signal stays public. The actor stays private." "06_markets.mp4" 1570 880 0 0
make_scroll_clip "$LAUNCHPAD_CAPTURE" 24 "04 / PRIVATE LAUNCHPAD" "Allocation, milestone, and release readiness — privately coordinated." "07_launchpad.mp4" 1300 790 0 0
make_scroll_clip "$ROOT_CAPTURE" 22 "THE TRUST BOUNDARY" "Veyra coordinates. Wallets sign. Receipts decide confirmation." "08_technical.mp4" 1260 760 900 1900
make_final_resolve

cat > "$WORK/concat.txt" <<'EOF'
file '01_hook.mp4'
file '02_system.mp4'
file '03_payroll.mp4'
file '04_payroll_outcome.mp4'
file '05_primitives.mp4'
file '06_markets.mp4'
file '07_launchpad.mp4'
file '08_technical.mp4'
file '09_close.mp4'
EOF

pushd "$WORK" >/dev/null
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy visuals.mp4
popd >/dev/null

ffmpeg -y -i "$WORK/visuals.mp4" -i "$WORK/voiceover.wav" -stream_loop -1 -i "/home/ubuntu/Downloads/veyra-cinematic-institutional-score.wav" -filter_complex "[2:a]atrim=duration=176,volume=0.22[music];[music][1:a]sidechaincompress=threshold=0.03:ratio=10:attack=15:release=680[ducked];[ducked][1:a]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.93[audio]" -map 0:v -map "[audio]" -t 176 -r 60 -c:v libx264 -profile:v high -level:v 4.2 -preset medium -b:v 8M -minrate 8M -maxrate 8M -bufsize 8M -x264-params 'nal-hrd=cbr:filler=1:force-cfr=1' -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$ROOT/veyra_hackathon_demo_rebuild_clean_1080p60.mp4"

ffmpeg -y -i "$ROOT/veyra_hackathon_demo_rebuild_clean_1080p60.mp4" -vf "ass=$ROOT/captions_compact.ass" -c:v libx264 -profile:v high -level:v 4.2 -preset medium -b:v 8M -minrate 8M -maxrate 8M -bufsize 8M -x264-params 'nal-hrd=cbr:filler=1:force-cfr=1' -r 60 -pix_fmt yuv420p -c:a copy -movflags +faststart "$ROOT/veyra_hackathon_demo_rebuild_captioned_1080p60.mp4"

echo "Rendered rebuilt Veyra demo masters in $ROOT"
