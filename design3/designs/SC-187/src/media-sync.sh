#!/usr/bin/env bash
# the clips cut 2 uses into ../media with their sidecars; cut 1's superseded clips out (history keeps them)
set -e; cd "$(dirname "$0")"; W=/Users/arundutta/projects/smart-clearance/.claude/worktrees/console-ui-db-migration-b9ab01
USED=$(python3 -c "import json; print(' '.join(sorted({s['name'] for s in json.load(open('film.json'))['segments'] if s['kind']=='clip' and not s['name'].startswith('r')})))")
for c in $USED; do
  if [ -f "clips/$c.mp4" ]; then cp "clips/$c.mp4" "../media/$c.mp4"; cp "clips/$c.prompt.json" "../media/$c.prompt.json"; else echo "no clip $c (keyframe stand-in)"; rm -f "../media/$c.mp4" "../media/$c.prompt.json"; fi
done
for c in c02-priya-phone c04-priya-approve c05-kirana-nagpur-offer c06-agrawal-raipur c07-staff-sale-gate c08-feeding-india-van c11-neha-console c13-lakshmi-godown ui-approve ui-order ui-sign; do
  git -C "$W" rm -q --cached "design3/designs/SC-187/media/$c.mp4" "design3/designs/SC-187/media/$c.prompt.json" 2>/dev/null || true; rm -f "../media/$c.mp4" "../media/$c.prompt.json"
done
rm -f ../media/preview-cut2-*.mp4
mkdir -p ../img/retakes && for f in ../img/*-t[0-9].webp ../img/*-t[0-9].prompt.json ../img/*-cut1.webp ../img/*-cut1.prompt.json; do [ -f "$f" ] && git -C "$W" mv -k "design3/designs/SC-187/img/$(basename "$f")" "design3/designs/SC-187/img/retakes/$(basename "$f")" 2>/dev/null || mv -f "$f" ../img/retakes/; done
ls ../media | grep -c mp4; du -sh ../media | cut -f1
