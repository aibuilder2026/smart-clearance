#!/usr/bin/env bash
cd "$(dirname "$0")"; until grep -q "keyframes done" keyframes2c.log; do sleep 10; done; ./keyframes3.sh
