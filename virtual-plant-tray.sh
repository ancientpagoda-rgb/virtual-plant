#!/usr/bin/env bash
set -euo pipefail

# Tray icon for Virtual Plant.
# Requires: yad
# Left-click opens/raises the Virtual Plant app window.
# Right-click menu includes Open Web + Quit.

APP_SH="/home/joe/.openclaw/workspace/virtual-plant/start-virtual-plant.sh"
WEB_URL="http://localhost:8787"

if ! command -v yad >/dev/null 2>&1; then
  echo "yad not installed. Install it (and wmctrl) then re-run." >&2
  exit 1
fi

open_app(){
  # If it's already open, try to focus it; else start it.
  if command -v wmctrl >/dev/null 2>&1 && wmctrl -lx | grep -qi "virtualplant"; then
    wmctrl -a "VirtualPlant" 2>/dev/null || true
  else
    "$APP_SH" >/dev/null 2>&1 &
  fi
}

export -f open_app
export APP_SH WEB_URL

# yad tray: --command runs on click; menu via --menu entries.
# Menu format: label!command

yad \
  --notification \
  --image=applications-games \
  --text="Virtual Plant" \
  --command="bash -lc open_app" \
  --menu="Open App!bash -lc open_app|Open Web!xdg-open $WEB_URL|Quit!killall yad"
