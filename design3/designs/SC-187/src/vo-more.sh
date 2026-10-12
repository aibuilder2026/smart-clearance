#!/usr/bin/env bash
cd "$(dirname "$0")"; while pgrep -f "vo.py --voice" >/dev/null; do sleep 5; done
for v in cut2-Kore-1.08 cut2-Kore; do for b in 3b 3e 6g 7d 8c 9e; do rm -f vo/$v/$b.wav vo/$v/$b-trim.wav; done; done
python3 vo.py --voice cut2-Kore-1.08 --voice cut2-Kore > vo-cut2-trim2.log 2>&1; echo "vo done"
