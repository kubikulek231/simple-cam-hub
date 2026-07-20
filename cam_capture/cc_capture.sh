#!/bin/bash
# === SHARED CAMERA CAPTURE SCRIPT ===
# Usage: ./cc_capture.sh <camera_number>
# Example: ./cc_capture.sh 2

set -euo pipefail

CAM=${1:?Camera number required (1,2,3)}
CONFIG_FILE="$(dirname "$0")/cameras.conf"

[[ -f "$CONFIG_FILE" ]] || { echo "ERROR: $CONFIG_FILE not found"; exit 1; }
source "$CONFIG_FILE"

eval "RTSP_SUB=\${CAM${CAM}_SUB:?Missing CAM${CAM}_SUB in cameras.conf}"
eval "RTSP_MAIN=\${CAM${CAM}_MAIN:?Missing CAM${CAM}_MAIN in cameras.conf}"

OUTPUT_DIR="/var/www/html/cam$CAM"
RECORD_DIR="/home/raspberrypi5/footage/cam$CAM"
TMP_DIR="/tmp/cam${CAM}_stream"
LOG_DIR="/var/log/cam${CAM}_capture"

SEGMENT_TIME=1800
LATENCY=1000

# === SETUP ===
mkdir -p "$OUTPUT_DIR" "$RECORD_DIR" "$TMP_DIR" "$LOG_DIR" || { echo "ERROR: Failed to create directories"; exit 1; }
sudo chmod 755 "$OUTPUT_DIR" "$RECORD_DIR" "$TMP_DIR" "$LOG_DIR" 2>/dev/null || true
rm -rf "$TMP_DIR"/* "$OUTPUT_DIR"/*
[[ -d "$TMP_DIR" ]] || { echo "ERROR: $TMP_DIR not found after mkdir"; exit 1; }
mkfifo "$TMP_DIR/live.ts" "$TMP_DIR/record.ts" || { echo "ERROR: Failed to create FIFOs in $TMP_DIR"; exit 1; }

log() { 
  printf '[%s] [%-8s] %s\n' "$(date '+%H:%M:%S')" "$1" "$2" | tee -a "$LOG_DIR/main.log"
}

cleanup() {
  log "EXIT" "Shutting down..."
  jobs -p | xargs kill -9 2>/dev/null || true
  rm -f "$TMP_DIR"/*.ts
  exit 0
}
trap cleanup EXIT INT TERM

# === GSTREAMER: RTSP→TS ===
launch_gst() {
  local name=$1 rtsp=$2 output=$3
  log "INFO" "Starting GStreamer $name"
  
  (gst-launch-1.0 -e rtspsrc location="$rtsp" latency=$LATENCY timeout=5000 connection-speed=0 protocols=tcp drop-on-latency=true ! rtpjitterbuffer latency=$LATENCY ! rtph265depay ! h265parse ! tee name=src ! queue ! mpegtsmux ! filesink location="$output" sync=false src. ! queue leaky=2 max-size-buffers=10 ! fakesink dump=true >>"$LOG_DIR/gst_${name}.log" 2>&1 &) &
  disown
  # Give GStreamer time to start
  sleep 1
}

# === FFMPEG: TS→HLS ===
launch_ffmpeg_hls() {
  log "INFO" "Starting FFmpeg HLS..."
  ffmpeg -fflags +genpts -loglevel warning -y -re \
    -i "$TMP_DIR/live.ts" \
    -c copy -tag:v hvc1 -f hls \
    -hls_time 5 -hls_list_size 5 -hls_segment_type fmp4 \
    -hls_fmp4_init_filename init.mp4 \
    "$OUTPUT_DIR/index.m3u8" 2>&1 | tee -a "$LOG_DIR/ffmpeg_hls.log" &
  echo $!
}

# === FFMPEG: TS→Segments ===
launch_ffmpeg_record() {
  log "INFO" "Starting FFmpeg recording..."
  ffmpeg -fflags +genpts -loglevel warning -y -re \
    -i "$TMP_DIR/record.ts" \
    -c copy -f segment \
    -segment_time "$SEGMENT_TIME" -reset_timestamps 0 \
    -strftime 1 -segment_list "$RECORD_DIR/segments.txt" \
    -segment_list_flags +live \
    "$RECORD_DIR/%Y-%m-%d_%H-%M-%S.mp4" 2>&1 | tee -a "$LOG_DIR/ffmpeg_record.log" &
  echo $!
}

# === MAIN ===
log "INIT" "CAM$CAM capture starting"

launch_gst "LIVE" "$RTSP_SUB" "$TMP_DIR/live.ts"
launch_gst "RECORD" "$RTSP_MAIN" "$TMP_DIR/record.ts"
sleep 3

launch_ffmpeg_hls
launch_ffmpeg_record

log "INFO" "All services online"

# Keep script alive
wait
