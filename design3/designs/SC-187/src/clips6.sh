#!/usr/bin/env bash
# cut 1's five scenes, re-rendered from the labelled keyframes, two lanes queued behind the three re-renders
cd "$(dirname "$0")"
( until grep -q "saved .*c31-dark-store.mp4\|filtered\|Error" clips5-laneA.log; do sleep 10; done; ./clips.sh c01-godown-date c03-rakesh-label-photo c09-rakesh-tally-desk > clips6-laneC.log 2>&1 ) &
( until grep -q "saved .*c32-foodbank-store.mp4\|filtered\|Error" clips5-laneB.log; do sleep 10; done; ./clips.sh c10-landfill-certificate c12-close-lane > clips6-laneD.log 2>&1 ) &
wait; echo "clips done"
