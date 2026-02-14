#!/usr/bin/env bash
set -euo pipefail

cd /home/joe/.openclaw/workspace/virtual-plant
exec python -m http.server 8787 --bind 0.0.0.0
