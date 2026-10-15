#!/usr/bin/env bash
# SC-210: the sales film's deliverables, from build/film-silent.mp4 (the crf-12 picture) and build/mix10.wav:
#   - a crf-17 master and a 720p copy for landing-demo/sales-film/ at the repository root, named with the export's date
#     and time, beside the SC-187 film it reworks (local, not in git);
#   - a 1080p copy (crf 21, or as much higher as it takes to stay under 95 MB, GitHub refusing files over 100 MB), a 720p
#     copy and the captions for design3/designs/SC-210/media/;
#   - the six talking scenes the film uses (Veo 3.1 with sound, re-encoded at crf 20) and the seven Lyria cues the score uses (AAC),
#     each with its sidecar, into media/talk/ and media/music/.
set -eu
cd "$(dirname "$0")"
B=build; M=../media; ROOT=/Users/arundutta/projects/smart-clearance; LD="$ROOT/landing-demo/sales-film"; STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$M/talk" "$M/music" "$LD"
enc(){ ffmpeg -v error -y -i "$B/film-silent.mp4" -i "$B/mix10.wav" -map 0:v -map 1:a $1 -c:v libx264 -preset slow -crf "$2" \
  -pix_fmt yuv420p -profile:v high -tune film -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$3"; }
enc "" 17 "$B/smart-clearance-sales-film-master.mp4"
crf=21
while :; do
  enc "" "$crf" "$M/smart-clearance-sales-film.mp4"
  [ "$(stat -f %z "$M/smart-clearance-sales-film.mp4")" -lt 95000000 ] && break
  crf=$((crf + 1))
done
enc "-vf scale=1280:720:flags=lanczos" 26 "$M/smart-clearance-sales-film-720p.mp4"   # the film's grain makes crf 23 heavy at 720p
cp "$B/smart-clearance-sales-film.srt" "$M/"
# the six talking scenes the film uses (lines.json's clips); the takes they replaced stay in src/clips/talk/
for n in $(python3 -c "import json; print(' '.join(l['clip'] for l in json.load(open('lines.json'))['lines'] if l.get('kind') == 'talk'))"); do
  f=clips/talk/$n.mp4
  ffmpeg -v error -y -i "$f" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$M/talk/$n.mp4"
  python3 - "$f" "$M/talk/$n.prompt.json" <<'PY'
import json, sys
src, out = sys.argv[1], sys.argv[2]
side = json.load(open(src.replace('.mp4', '.prompt.json')))
side.pop('probe', None)
side['shipped'] = 'the Veo output re-encoded for the repository (H.264 crf 20, AAC 160k); the original stays in src/clips/talk/'
side['derived_from'] = src   # cost.py counts the original, not this copy
json.dump(side, open(out, 'w'), indent=1)
PY
done
for c in waste-2102 reveal-2101 eco-2102 journey-2101 journey-2102 papers-2101 close-2102; do
  ffmpeg -v error -y -i "music10/$c.wav" -c:a aac -b:a 192k "$M/music/$c.m4a"
  python3 - "music10/$c.prompt.json" "$M/music/$c.prompt.json" <<'PY'
import json, sys
side = json.load(open(sys.argv[1]))
side['shipped'] = 'the Lyria 2 output as AAC 192k; the WAV stays in src/music10/'
side['derived_from'] = sys.argv[1].replace('.prompt.json', '.wav')
json.dump(side, open(sys.argv[2], 'w'), indent=1)
PY
done
cp "$B/smart-clearance-sales-film-master.mp4" "$LD/smart-clearance-sales-film-$STAMP.mp4"
cp "$M/smart-clearance-sales-film-720p.mp4" "$LD/smart-clearance-sales-film-$STAMP-720p.mp4"
cp "$M/smart-clearance-sales-film.srt" "$LD/smart-clearance-sales-film-$STAMP.srt"
echo "1080p at crf $crf"
ls -la "$M" "$M/talk" "$M/music" "$LD"
