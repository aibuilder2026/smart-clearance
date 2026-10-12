#!/usr/bin/env bash
cd "$(dirname "$0")"; until grep -q "keyframes done" keyframes2b.log; do sleep 10; done; ./keyframes2.sh
