#!/usr/bin/env bash
# reviews each cut-3 clip as it lands: a 1 fps contact sheet and Gemini's verdict (eyes.py), into the scratchpad
cd "$(dirname "$0")"; S="/private/tmp/claude-501/-Users-arundutta-projects-smart-clearance--claude-worktrees-console-ui-db-migration-b9ab01/a555fdcd-76b6-49e8-9d1a-c1f383a32bd2/scratchpad"; mkdir -p "$S/dense" "$S/eyes"
done_list=""
until grep -q "== done" gen-ltx3.log 2>/dev/null && [ "$(ls clips/c5*.mp4 2>/dev/null | wc -l)" -eq "$(echo $done_list | wc -w)" ]; do
  for f in clips/c5*.mp4; do [ -f "$f" ] || continue; c=$(basename "$f" .mp4)
    case " $done_list " in *" $c "*) continue;; esac
    sleep 3; ffmpeg -hide_banner -loglevel error -y -i "$f" -vf "fps=1,scale=640:-1,tile=4x2" -frames:v 1 "$S/dense/$c.png"
    python3 eyes.py "$f" > "$S/eyes/$c.txt" 2>&1; echo "reviewed $c $(date +%H:%M:%S)"; done_list="$done_list $c"
  done
  sleep 20
done
echo "review done"
