#!/usr/bin/env bash
# SC-211: the sales film v2's deliverables, from build/film11-silent.mp4 (the crf-12 picture) and build/mix11.wav, on the
# settings of the ffmpeg skills installed for this work (ffmpeg, ffmpeg-usage, stitch-videos-ffmpeg, video-engineer):
#   - one harmonising grade over the whole joined film (stitch-videos-ffmpeg: generated clips drift in colour at every
#     cut), gentler than its starting point so the app's own screens keep their colours (GRADE);
#   - a crf-17 master (slow, high profile, film tune) for landing-demo/sales-film/ at the repository root, named with the
#     export's date and time (local, not in git), and its 720p copy, a phone preview under 30 MB (960 x 540) and the
#     captions beside it;
#   - a YouTube copy (crf 18, high profile, a GOP of 2 s, AAC 48 kHz, faststart: the ffmpeg skill's YouTube settings);
#   - for design3/designs/SC-211/media/: a 1080p copy (crf 21, or as much higher as keeps it under 95 MB, GitHub refusing
#     files over 100 MB), a 720p web copy (crf 24, main profile), the captions,
#     a palette GIF of the agents' graph (ffmpeg skill: palettegen, paletteuse) and the nine talking clips made here;
#   - every output checked: frame count against the film's length, the sound as long as the picture (video-engineer:
#     verify A/V alignment after processing), loudness -14 LUFS and true peak at most -1 dB on the master.
set -eu
cd "$(dirname "$0")"
B=build; M=../media; ROOT=/Users/arundutta/projects/smart-clearance; LD="$ROOT/landing-demo/sales-film"; STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
GRADE="eq=contrast=1.03:saturation=0.97,colorbalance=bs=0.03:bm=-0.01"
mkdir -p "$M/talk" "$LD"
SRC="$B/film11-silent.mp4"; MIX="$B/mix11.wav"
enc(){   # enc <video filters> <crf> <profile> <audio kbps> <out>
  ffmpeg -v error -y -i "$SRC" -i "$MIX" -map 0:v -map 1:a -vf "$1" -c:v libx264 -preset slow -crf "$2" -profile:v "$3" \
    -pix_fmt yuv420p -tune film -g 50 -bf 2 -c:a aac -b:a "$4k" -ar 48000 -movflags +faststart -shortest "$5"; }
enc "$GRADE" 17 high 256 "$B/smart-clearance-sales-film-v2-master.mp4"
enc "$GRADE" 18 high 192 "$B/smart-clearance-sales-film-v2-youtube.mp4"
# the repository's copy: crf 21 if it fits under 95 MB; else two passes at the bitrate that fills 93 MB (the ffmpeg
# skill's target-size recipe), which spends the same bits better than a high crf on a grainy film
crf=21
enc "$GRADE" "$crf" high 192 "$M/smart-clearance-sales-film-v2.mp4"
if [ "$(stat -f %z "$M/smart-clearance-sales-film-v2.mp4")" -ge 95000000 ]; then
  dur0=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
  vb=$(python3 -c "print(int(93.0e6 * 8 / $dur0 / 1000) - 200)")
  ffmpeg -v error -y -i "$SRC" -vf "$GRADE" -c:v libx264 -preset slow -b:v "${vb}k" -pass 1 -passlogfile "$B/p1080" -profile:v high -tune film -g 50 -bf 2 -pix_fmt yuv420p -an -f null /dev/null
  ffmpeg -v error -y -i "$SRC" -i "$MIX" -map 0:v -map 1:a -vf "$GRADE" -c:v libx264 -preset slow -b:v "${vb}k" -pass 2 -passlogfile "$B/p1080" \
    -profile:v high -tune film -g 50 -bf 2 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$M/smart-clearance-sales-film-v2.mp4"
  crf="two-pass ${vb}k"
fi
enc "$GRADE,scale=1280:720:flags=lanczos" 24 main 128 "$M/smart-clearance-sales-film-v2-720p.mp4"
# the phone preview: 960 x 540 at the bitrate that keeps it under 30 MB, two passes
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
vk=$(python3 -c "print(int(29.0e6 * 8 / $dur / 1000) - 72)")
ffmpeg -v error -y -i "$SRC" -vf "$GRADE,scale=960:540:flags=lanczos" -c:v libx264 -preset slow -b:v "${vk}k" -pass 1 -passlogfile "$B/p2" -pix_fmt yuv420p -an -f null /dev/null
ffmpeg -v error -y -i "$SRC" -i "$MIX" -map 0:v -map 1:a -vf "$GRADE,scale=960:540:flags=lanczos" -c:v libx264 -preset slow -b:v "${vk}k" -pass 2 \
  -passlogfile "$B/p2" -pix_fmt yuv420p -c:a aac -b:a 64k -ar 48000 -movflags +faststart -shortest "$LD/smart-clearance-sales-film-v2-$STAMP-phone.mp4"
cp "$B/smart-clearance-sales-film-v2.srt" "$M/"
# a GIF of the agents' graph, for a pull request or a channel (palettegen, paletteuse)
g0=$(python3 -c "import json; print(json.load(open('build/gif11.json'))['t0'])"); gd=$(python3 -c "import json; print(json.load(open('build/gif11.json'))['dur'])")
ffmpeg -v error -y -ss "$g0" -t "$gd" -i "$B/smart-clearance-sales-film-v2-master.mp4" \
  -vf "fps=12,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=192[p];[s1][p]paletteuse=dither=sierra2_4a" "$M/smart-clearance-agents-graph.gif"
# the talking clips made here (LTX, with their sound), re-encoded for the repository, each with its sidecar
for n in $(python3 -c "import json; print(' '.join(l['clip'] for l in json.load(open('lines.json'))['lines'] if l.get('kind') == 'talk' and l.get('clip_dir', 'clips/talk11') == 'clips/talk11'))"); do
  f=clips/talk11/$n.mp4
  ffmpeg -v error -y -i "$f" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$M/talk/$n.mp4"
  python3 - "$f" "$M/talk/$n.prompt.json" <<'PY'
import json, sys
src, out = sys.argv[1], sys.argv[2]
side = json.load(open(src.replace('.mp4', '.prompt.json')))
side['shipped'] = 'the LTX output re-encoded for the repository (H.264 crf 20, AAC 160k); the original stays in src/clips/talk11/'
side['derived_from'] = src
json.dump(side, open(out, 'w'), indent=1)
PY
done
cp "$B/smart-clearance-sales-film-v2-master.mp4" "$LD/smart-clearance-sales-film-v2-$STAMP.mp4"
cp "$M/smart-clearance-sales-film-v2-720p.mp4" "$LD/smart-clearance-sales-film-v2-$STAMP-720p.mp4"
cp "$M/smart-clearance-sales-film-v2.srt" "$LD/smart-clearance-sales-film-v2-$STAMP.srt"
# the checks
want=$(python3 -c "print(round($dur * 25))")
for f in "$B/smart-clearance-sales-film-v2-master.mp4" "$B/smart-clearance-sales-film-v2-youtube.mp4" "$M/smart-clearance-sales-film-v2.mp4" \
         "$M/smart-clearance-sales-film-v2-720p.mp4" "$LD/smart-clearance-sales-film-v2-$STAMP-phone.mp4"; do
  nf=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$f")
  vd=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$f")
  ad=$(ffprobe -v error -select_streams a:0 -show_entries stream=duration -of csv=p=0 "$f")
  sz=$(stat -f %z "$f")
  echo "$(basename "$f"): $nf frames (want $want), video $vd s, sound $ad s, $((sz / 1000000)) MB"
done
ffmpeg -hide_banner -i "$B/smart-clearance-sales-film-v2-master.mp4" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | \
  python3 -c "import sys, re, json; m = json.loads(re.findall(r'\{[^{}]*\}', sys.stdin.read())[-1]); print('master loudness', m['input_i'], 'LUFS, true peak', m['input_tp'], 'dBTP')"
echo "1080p at crf $crf"
ls -la "$M" "$LD" | tail -20
