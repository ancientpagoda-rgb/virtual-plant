#!/usr/bin/env bash
set -euo pipefail

# Virtual Plant desktop launcher (Chromium app mode)
# Uses a local file URL so it works offline.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="file://${ROOT_DIR}/index.html"

CHROMIUM_BIN="${CHROMIUM_BIN:-chromium}"

exec "$CHROMIUM_BIN" \
  --app="$URL" \
  --window-size=520,720 \
  --class=VirtualPlant \
  --user-data-dir="${XDG_STATE_HOME:-$HOME/.local/state}/virtual-plant-chromium" \
  "$@"
