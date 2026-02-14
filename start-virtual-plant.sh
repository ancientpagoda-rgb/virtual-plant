#!/usr/bin/env bash
set -euo pipefail

# Starts the Virtual Plant desktop window.
# - Chromium app-mode window
# - If wmctrl is installed, marks the window as always-on-top ("above").

URL="file:///home/joe/.openclaw/workspace/virtual-plant/index.html"
CHROMIUM_BIN="$(command -v chromium)"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/virtual-plant-chromium"

"$CHROMIUM_BIN" \
  --app="$URL" \
  --window-size=520,720 \
  --class=VirtualPlant \
  --user-data-dir="$STATE_DIR" \
  "$@" &

CHROME_PID=$!

# Best-effort always-on-top.
if command -v wmctrl >/dev/null 2>&1; then
  # Wait up to ~5s for the window to appear, then set it above.
  for _ in {1..25}; do
    if wmctrl -lx | grep -qi "virtualplant"; then
      # Works on many WMs: set _NET_WM_STATE_ABOVE
      wmctrl -r "VirtualPlant" -b add,above 2>/dev/null || true
      # Fallback: try by class match
      wmctrl -x -r "virtualplant.VirtualPlant" -b add,above 2>/dev/null || true
      break
    fi
    sleep 0.2
  done
fi

wait "$CHROME_PID"
