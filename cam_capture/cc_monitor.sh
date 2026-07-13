#!/bin/bash
# === CAMERA HEALTH MONITOR ===
# Usage: ./cc_monitor.sh <camera_number>
# Detects: RTSP connectivity, GStreamer packet loss, FFmpeg stalls, segment corruption
# Action: Logs root cause issues (does NOT auto-restart - systemd handles that)

CAM=${1:?Camera number required}

LOG_DIR="/var/log/cam${CAM}_capture"
RECORD_DIR="/home/raspberrypi5/footage/cam${CAM}"
SEGMENT_TIME=1800

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$1" >> "$LOG_DIR/monitor.log"; }

# === RTSP CONNECTIVITY ===
check_rtsp_errors() {
  grep -i "timeout\|connection refused\|auth\|socket" "$LOG_DIR/gst_LIVE.log" "$LOG_DIR/gst_RECORD.log" 2>/dev/null | \
  tail -1 | while read -r line; do
    log "[RTSP_ERROR] $line"
  done
}

# === GSTREAMER PACKET LOSS (ROOT CAUSE DATA) ===
check_gst_drops() {
  grep -i "drop\|lost\|error" "$LOG_DIR/gst_LIVE.log" "$LOG_DIR/gst_RECORD.log" 2>/dev/null | \
  tail -5 | while read -r line; do
    log "[GST_DROP] $line"
  done
}

# === FFMPEG STALLS (No segments for 2x expected time) ===
check_ffmpeg_stalls() {
  if [[ ! -f "$RECORD_DIR/segments.txt" ]]; then
    log "[WARNING] No segments.txt - FFmpeg not recording?"
    return
  fi
  
  last_segment_time=$(stat -c%Y "$RECORD_DIR/segments.txt" 2>/dev/null || echo 0)
  now=$(date +%s)
  stale_threshold=$((SEGMENT_TIME * 2 + 30))
  
  if [[ $((now - last_segment_time)) -gt $stale_threshold ]]; then
    log "[FFMPEG_STALL] No new segment for $((now - last_segment_time))s (threshold: ${stale_threshold}s)"
  fi
}

# === SEGMENT CORRUPTION ===
check_segment_corruption() {
  last_segment=$(tail -1 "$RECORD_DIR/segments.txt" 2>/dev/null)
  [[ -z "$last_segment" ]] && return
  
  segment_file="$RECORD_DIR/$last_segment"
  [[ ! -f "$segment_file" ]] && return
  
  # Wait for file to stabilize
  sleep 1
  
  # Check with ffprobe
  duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$segment_file" 2>/dev/null)
  
  if [[ -z "$duration" ]]; then
    log "[CORRUPT_SEGMENT] $last_segment - ffprobe failed"
  elif (( $(echo "$duration < $((SEGMENT_TIME - 30))" | bc -l 2>/dev/null || echo 0) )); then
    log "[SHORT_SEGMENT] $last_segment - only ${duration%.*}s (expected ~${SEGMENT_TIME}s)"
  fi
}

# === RUN CHECKS ===
while sleep 30; do
  check_rtsp_errors
  check_gst_drops
  check_ffmpeg_stalls
  check_segment_corruption
done
