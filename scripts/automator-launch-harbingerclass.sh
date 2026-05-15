#!/bin/bash
set -euo pipefail

TARGET_APP="/Applications/FableCode.app"

if [[ ! -d "$TARGET_APP" ]]; then
  /usr/bin/osascript -e 'display dialog "FableCode.app not found at /Applications/FableCode.app" buttons {"OK"} default button "OK" with icon caution'
  exit 1
fi

open -a "$TARGET_APP"
