#!/usr/bin/env bash
# ==============================================================================
# Script: capture_screenshots.sh
# Purpose: Take store-ready screenshots for:
#   1) Google Play Store (via connected Android Emulator / Device)
#   2) iOS iPhone 6.5" / 6.7" / 6.9" (via iOS Simulator)
#   3) iOS iPad 13" / 12.9" Pro (via iPad Simulator)
# ==============================================================================

set -e

PROJECT_DIR="/Users/flymedia/Documents/clinicbychoice/mobile"
OUTPUT_DIR="$PROJECT_DIR/screenshots"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ANDROID_DIR="$OUTPUT_DIR/playstore"
IOS_IPHONE_DIR="$OUTPUT_DIR/appstore_iphone"
IOS_IPAD_DIR="$OUTPUT_DIR/appstore_ipad"

mkdir -p "$ANDROID_DIR" "$IOS_IPHONE_DIR" "$IOS_IPAD_DIR"

echo "======================================================="
echo "   Clinic By Choice - App Store Screenshot Utility     "
echo "======================================================="
echo "Output Directory: $OUTPUT_DIR"
echo ""

# -------------------------------------------------------------
# Function: Capture Android Screenshot via ADB
# -------------------------------------------------------------
capture_android() {
  local name=$1
  local filename="${name}_${TIMESTAMP}.png"
  
  if adb get-state 1>/dev/null 2>&1; then
    echo "📸 [Android] Capturing '$name'..."
    adb shell screencap -p /sdcard/screenshot.png
    adb pull /sdcard/screenshot.png "$ANDROID_DIR/$filename" >/dev/null 2>&1
    adb shell rm /sdcard/screenshot.png
    echo "   Saved: $ANDROID_DIR/$filename"
  else
    echo "⚠️  [Android] No running Android emulator or device found via adb."
  fi
}

# -------------------------------------------------------------
# Function: Capture iOS Simulator Screenshot via xcrun simctl
# -------------------------------------------------------------
capture_ios_sim() {
  local target_type=$1 # "iphone" or "ipad"
  local name=$2
  local filename="${name}_${TIMESTAMP}.png"

  # Find booted device
  local booted_device=$(xcrun simctl list devices | grep "Booted" | head -n 1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

  if [ -n "$booted_device" ]; then
    local target_dir="$IOS_IPHONE_DIR"
    if [ "$target_type" == "ipad" ]; then
      target_dir="$IOS_IPAD_DIR"
    fi
    echo "📸 [iOS - $booted_device] Capturing '$name'..."
    xcrun simctl io "$booted_device" screenshot "$target_dir/$filename"

    # Automatically ensure exact Apple App Store Connect specifications
    if [ "$target_type" == "iphone" ]; then
      sips -z 2688 1242 "$target_dir/$filename" >/dev/null 2>&1
      echo "   Saved (1242x2688 6.5\"): $target_dir/$filename"
    elif [ "$target_type" == "ipad" ]; then
      sips -z 2732 2048 "$target_dir/$filename" >/dev/null 2>&1
      echo "   Saved (2048x2732 iPad 13\"): $target_dir/$filename"
    else
      echo "   Saved: $target_dir/$filename"
    fi
  else
    echo "⚠️  [iOS] No booted iOS simulator found. Please boot a simulator first (e.g. xcrun simctl boot 'iPhone 17 Pro Max')."
  fi
}

# -------------------------------------------------------------
# Interactive Menu / Options
# -------------------------------------------------------------
case "$1" in
  android)
    SCREEN_NAME=${2:-"screen"}
    capture_android "$SCREEN_NAME"
    ;;
  ios)
    SCREEN_NAME=${2:-"screen"}
    capture_ios_sim "iphone" "$SCREEN_NAME"
    ;;
  ipad)
    SCREEN_NAME=${2:-"screen"}
    capture_ios_sim "ipad" "$SCREEN_NAME"
    ;;
  all)
    SCREEN_NAME=${2:-"screen"}
    capture_android "$SCREEN_NAME"
    capture_ios_sim "iphone" "$SCREEN_NAME"
    ;;
  interactive|*)
    echo "Select an action:"
    echo "  1) Capture screenshot from Android emulator (Play Store)"
    echo "  2) Capture screenshot from Booted iOS Simulator (iPhone)"
    echo "  3) Capture screenshot from Booted iPad Simulator (iPad)"
    echo "  4) Capture both Android & iOS currently open screen"
    echo "  5) Exit"
    echo ""
    read -p "Enter choice [1-5]: " choice
    read -p "Enter screenshot name (e.g. 01_home, 02_clinics, 03_booking): " sname
    sname=${sname:-"screenshot"}

    case "$choice" in
      1) capture_android "$sname" ;;
      2) capture_ios_sim "iphone" "$sname" ;;
      3) capture_ios_sim "ipad" "$sname" ;;
      4) 
        capture_android "$sname"
        capture_ios_sim "iphone" "$sname"
        ;;
      *) echo "Exiting." ;;
    esac
    ;;
esac

echo ""
echo "✅ Done! All captured screenshots are in: $OUTPUT_DIR"
