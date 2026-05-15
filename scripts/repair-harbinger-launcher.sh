#!/usr/bin/env bash
set -euo pipefail

LEGACY_APP="/Applications/HarbingerClass.app"
TARGET_APP="/Applications/FableCode.app"
MODE="bundle"
LAUNCH_AFTER="false"

usage() {
  cat <<'EOF'
Usage:
  repair-harbinger-launcher.sh [target_app_path] [--launch] [--bundle|--symlink]

Examples:
  repair-harbinger-launcher.sh
  repair-harbinger-launcher.sh --bundle
  repair-harbinger-launcher.sh /Applications/FableCode.app --launch
  repair-harbinger-launcher.sh --symlink

Notes:
- Default mode is --bundle, which creates a real launcher app bundle:
  /Applications/HarbingerClass.app
- --symlink mode creates:
  /Applications/HarbingerClass.app -> /Applications/FableCode.app
- Existing HarbingerClass.app is moved to a timestamped backup before replacement.
EOF
}

for arg in "$@"; do
  if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
    usage
    exit 0
  fi

  if [[ "$arg" == "--launch" ]]; then
    LAUNCH_AFTER="true"
    continue
  fi

  if [[ "$arg" == "--bundle" ]]; then
    MODE="bundle"
    continue
  fi

  if [[ "$arg" == "--symlink" ]]; then
    MODE="symlink"
    continue
  fi

  if [[ "$arg" == -* ]]; then
    echo "Unknown option: $arg" >&2
    usage
    exit 1
  fi

  TARGET_APP="$arg"
done

if [[ ! -d "$TARGET_APP" ]]; then
  echo "Target app not found: $TARGET_APP" >&2
  exit 1
fi

if [[ -e "$LEGACY_APP" || -L "$LEGACY_APP" ]]; then
  BACKUP_PATH="${LEGACY_APP}.backup.$(date +%Y%m%d-%H%M%S)"
  mv "$LEGACY_APP" "$BACKUP_PATH"
  echo "Backed up existing launcher: $BACKUP_PATH"
fi

if [[ "$MODE" == "symlink" ]]; then
  ln -s "$TARGET_APP" "$LEGACY_APP"
  echo "Created launcher: $LEGACY_APP -> $TARGET_APP"
else
  CONTENTS_DIR="$LEGACY_APP/Contents"
  MACOS_DIR="$CONTENTS_DIR/MacOS"
  RESOURCES_DIR="$CONTENTS_DIR/Resources"
  EXECUTABLE_NAME="HarbingerClassLauncher"

  mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

  cat > "$CONTENTS_DIR/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>$EXECUTABLE_NAME</string>
  <key>CFBundleIdentifier</key>
  <string>com.fableharbinger.harbingerclass.launcher</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>HarbingerClass</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
EOF

  cat > "$MACOS_DIR/$EXECUTABLE_NAME" <<EOF
#!/usr/bin/env bash
set -euo pipefail

TARGET_APP="$TARGET_APP"

if [[ ! -d "\$TARGET_APP" ]]; then
  osascript -e 'display dialog "FableCode.app not found at expected path:\n'"\$TARGET_APP"'" buttons {"OK"} default button "OK" with icon caution'
  exit 1
fi

open -a "\$TARGET_APP"
EOF

  chmod +x "$MACOS_DIR/$EXECUTABLE_NAME"

  TARGET_ICON="$TARGET_APP/Contents/Resources/electron.icns"
  if [[ -f "$TARGET_ICON" ]]; then
    cp "$TARGET_ICON" "$RESOURCES_DIR/HarbingerClass.icns"
    /usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string HarbingerClass.icns" "$CONTENTS_DIR/Info.plist" >/dev/null 2>&1 || true
  fi

  echo "Created app launcher bundle: $LEGACY_APP"
  echo "Launch target: $TARGET_APP"
fi

if [[ "$LAUNCH_AFTER" == "true" ]]; then
  open -a "$LEGACY_APP"
  echo "Launched via legacy path: $LEGACY_APP"
fi
