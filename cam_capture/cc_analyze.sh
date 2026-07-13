#!/bin/bash
# === SEGMENT ANALYSIS TOOL ===
# Usage: ./cc_analyze.sh <camera_dir>
# Shows: gaps, shorts, corruption, bitrate anomalies

DIR="${1:-.}"

echo "=== Analyzing $DIR ==="

find "$DIR" -name "*.mp4" -type f | sort | while read -r file; do
  duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null)
  size=$(stat -c%s "$file" 2>/dev/null)
  
  [[ -z "$duration" ]] && { echo "[CORRUPT] $file - ffprobe failed"; continue; }
  
  # Bitrate check (rough h.265 should be 1.5-2.5Mbps)
  bitrate=$((size * 8 / (${duration%.*} + 1) / 1000000))
  
  # Duration check (should be ~1800s)
  dur_int=${duration%.*}
  if (( dur_int < 1770 )); then
    echo "[SHORT] $file - ${duration%.*}s"
  elif (( dur_int > 1830 )); then
    echo "[LONG] $file - ${duration%.*}s"
  elif (( bitrate < 1 || bitrate > 4 )); then
    echo "[BITRATE] $file - ${bitrate}Mbps (size: $((size/1000000))MB)"
  else
    echo "[OK] $file - ${duration%.*}s @ ${bitrate}Mbps"
  fi
done

echo ""
echo "=== Summary ==="
total=$(find "$DIR" -name "*.mp4" -type f | wc -l)
corrupt=$(find "$DIR" -name "*.mp4" -type f -exec sh -c 'ffprobe -v error "$1" 2>&1 | grep -q "Invalid" && echo 1' _ {} \; | wc -l)
echo "Total segments: $total"
echo "Corrupt: $corrupt"
