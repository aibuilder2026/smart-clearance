#!/usr/bin/env bash
# a memory guard while Qwen renders: logs the free share every 20 s and kills the render if it falls under 6% twice running
cd "$(dirname "$0")"; low=0
while pgrep -f gen-qwen.sh >/dev/null; do
  f=$(memory_pressure 2>/dev/null | awk '/free percentage/ {gsub("%","",$NF); print $NF}')
  echo "$(date +%H:%M:%S) free ${f}%" >> guard.log
  if [ -n "$f" ] && [ "$f" -lt 6 ]; then low=$((low+1)); else low=0; fi
  if [ "$low" -ge 2 ]; then echo "$(date +%H:%M:%S) KILLED qwen at ${f}% free" >> guard.log; pkill -f qwen_image_bf16_mac; pkill -f gen-qwen.sh; break; fi
  sleep 20
done
