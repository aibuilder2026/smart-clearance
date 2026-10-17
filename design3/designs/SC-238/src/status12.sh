#!/usr/bin/env bash
# SC-238 pass 12's progress, a line every two minutes (the step, and how much of it is made) and every step, failure
# or finish as it happens; it ends when finish12.sh does.
cd "$(dirname "$0")"
LOG=build/finish12b.log
last=""
lastprob=""
n=0
while true; do
  step=$(grep '^== ' "$LOG" | tail -1)
  if [ "$step" != "$last" ]; then echo "STEP $step"; last="$step"; fi
  prob=$(grep -E 'Traceback|failed:|JUDDER|SOURCE MISSING' "$LOG" | tail -2 | tr '\n' ' ')
  if [ -n "$prob" ] && [ "$prob" != "$lastprob" ]; then echo "PROBLEM: $prob"; lastprob="$prob"; fi
  if ! pgrep -f "[f]inish12b.sh" >/dev/null; then echo "FINISHED: $(tail -1 "$LOG")"; exit 0; fi
  n=$((n + 1))
  if [ $((n % 12)) -eq 0 ]; then
    prog=$(python3 - <<'EOF'
import json, os, glob
M = json.load(open('build/media.json'))
t0 = os.path.getmtime('build/made-60fps.json')
new = lambda p: os.path.exists(p) and os.path.getmtime(p) > t0
media = [k for k, m in M.items() if m['kind'] not in ('ots', 'xcam')]
ots = [k for k, m in M.items() if m['kind'] == 'ots']
parts = [f"media {sum(new(f'film/public/media/{k}.mp4') for k in media)}/{len(media)}",
         f"screens {sum(new(f'film/public/media/{k}.mp4') for k in ots)}/{len(ots)}"]
for d in ('build/cap-agents3d', 'build/cap-pwa'):
    if os.path.isdir(d): parts.append(f"{d.split('-', 1)[1]} {len(glob.glob(d + '/*.jpg'))} frames")
r = sorted(glob.glob('film/out/**/*', recursive=True) + glob.glob('build/render/*'), key=os.path.getmtime)
if r and os.path.getmtime(r[-1]) > t0: parts.append(f"render {os.path.basename(r[-1])}")
print(', '.join(parts))
EOF
)
    echo "$(date +%H:%M) $prog"
  fi
  sleep 10
done
