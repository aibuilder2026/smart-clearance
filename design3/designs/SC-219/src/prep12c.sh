#!/usr/bin/env bash
# SC-219 cut 12's concept round: the Remotion project's media (remo12/public/), rebuilt from this folder: the fonts, the
# app screens and label photo (prep10.py's copies of cut 9's), the voice of the scene's first two lines, the sounds
# (sfx12c.py), the Qwen plates (plates12c.py), the LTX clips made to their shots (retime12c.sh) and their tracks.
#   ./prep12c.sh   (then: cd remo12 && npm i && npx remotion render src/index.ts <A-DataHall|B-Blueprint|C-InsideMachine> …)
set -eu
cd "$(dirname "$0")"
P=remo12/public; mkdir -p "$P/fonts" "$P/img" "$P/audio"
cp fonts/Bricolage.ttf fonts/Geist.ttf "$P/fonts/"
[ -f arch11/app-console.webp ] || .venv/bin/python prep10.py >/dev/null
cp arch11/app-*.webp arch11/label-photo.webp "$P/img/"
V=tts/vo3/maya1w-warm
ffmpeg -v error -y -f lavfi -t 10.4 -i anullsrc=r=48000:cl=mono -i "$V/t01.wav" -i "$V/u02.wav" \
  -filter_complex "[1]adelay=900|900[a];[2]adelay=3373|3373[b];[0][a][b]amix=inputs=3:normalize=0:duration=first,aformat=sample_rates=48000:channel_layouts=stereo[o]" \
  -map "[o]" -c:a pcm_s16le "$P/audio/voice.wav"
.venv/bin/python sfx12c.py >/dev/null
python3 plates12c.py >/dev/null
./retime12c.sh
for c in dc-a2-aisle dc-c1-fibre dc-c2-blade; do [ -f "$P/clips/$c.mp4" ] && .venv/bin/python track12c.py "$P/clips/$c.mp4" "$c"; done
echo "prep12c done"
