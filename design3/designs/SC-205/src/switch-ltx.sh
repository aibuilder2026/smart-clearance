#!/usr/bin/env bash
# after the clip in progress is saved, stop the queue with SIGINT (so it stops the LTX backend too) and restart it on
# the 540p list; finished clips are skipped
cd "$(dirname "$0")"
until grep -q "saved m3-priya-approve" gen-ltx2.log; do sleep 2; done
pkill -INT -f "gen-ltx2.py"; sleep 25
cp gen-ltx2-next.py gen-ltx2.py
nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx2.py >> gen-ltx2.log 2>&1 &
