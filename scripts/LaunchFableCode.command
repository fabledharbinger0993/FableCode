#!/usr/bin/env bash
# LaunchFableCode.command
# Double-click this file in Finder to launch FableCode.
# The .command extension tells macOS to open it in Terminal and execute it.

set -euo pipefail

TARGET_APP="/Applications/FableCode.app"

if [[ ! -d "$TARGET_APP" ]]; then
  osascript -e 'display dialog "FableCode.app not found at /Applications/FableCode.app.\n\nRebuild the app with: npm run build && npm run dist" buttons {"OK"} default button "OK" with icon caution'
  exit 1
fi

open -a "$TARGET_APP"
