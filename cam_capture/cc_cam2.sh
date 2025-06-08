#!/bin/bash


# === OVERVIEW ===
# This script handles downloading and streaming footage from CAM2


# === CONFIGURATION ===
RTSP_SUB="rtsp://admin:Hovnokleslo123.@192.168.88.244:554/media/video2"   # Lower-res stream for live view
RTSP_MAIN="rtsp://admin:Hovnokleslo123.@192.168.88.244:554/media/video1"  # Full-res stream for recording

TMP_DIR="/tmp/cam2_gstream_chunks"             # Temporary location for FIFOs and buffers
OUTPUT_DIR="/var/www/html/cam2"                # HLS output directory (served via web)
RECORD_DIR="/home/raspberrypi5/footage/cam2"   # Long-term MKV recordings directory
HLS_SEGMENT_TIME=5                             # HLS segment duration in seconds
RECORD_SEGMENT_TIME=1800                       # Recording segment duration in seconds


# === SETUP ===
echo "[Init] Cleaning up old files and preparing directories..."
rm -rf "$OUTPUT_DIR"/*
rm -rf "$TMP_DIR"
mkdir -p "$OUTPUT_DIR" "$TMP_DIR" "$RECORD_DIR"

# Create named pipes (FIFOs) for FFmpeg to read from
mkfifo "$TMP_DIR/stream_live.ts"
mkfifo "$TMP_DIR/stream_record.ts"


# === START GSTREAMER: SUB Stream for Live View ===
# This pipeline pulls the sub stream (lower res) and writes it into a FIFO.
# FFmpeg will pick it up and segment it into HLS for web playback.
echo "[GStreamer] Starting SUB stream for live HLS..."
gst-launch-1.0 -e rtspsrc location="$RTSP_SUB" latency=100 ! \
  rtph265depay ! h265parse ! mpegtsmux ! filesink location="$TMP_DIR/stream_live.ts" &
GST_LIVE_PID=$!


# === START GSTREAMER: MAIN Stream for Recording ===
# This pipeline pulls the main stream (high res) and writes it into a second FIFO.
# FFmpeg will segment this into 1-hour MKV files with timestamped filenames.
echo "[GStreamer] Starting MAIN stream for recording..."
gst-launch-1.0 -e rtspsrc location="$RTSP_MAIN" latency=100 ! \
  rtph265depay ! h265parse ! mpegtsmux ! filesink location="$TMP_DIR/stream_record.ts" &
GST_RECORD_PID=$!


sleep 2  # Let GStreamer pipelines warm up


# === START FFMPEG: Live Streaming via HLS ===
echo "[FFmpeg] Starting HLS live stream with $HLS_SEGMENT_TIME sec segments..."
ffmpeg -y -re -i "$TMP_DIR/stream_live.ts" -c copy -f hls \
  -hls_time "$HLS_SEGMENT_TIME" -hls_list_size 5 -hls_segment_type fmp4 \
  -hls_fmp4_init_filename init.mp4 \
  -hls_segment_filename "$OUTPUT_DIR/segment_%03d.m4s" "$OUTPUT_DIR/index.m3u8" &
FFMPEG_LIVE_PID=$!


# === START FFMPEG: Recording to MKV ===
echo "[FFmpeg] Starting $RECORD_SEGMENT_TIME second MKV recording with timestamped filenames..."
ffmpeg -y -re -i "$TMP_DIR/stream_record.ts" -c copy -f segment \
  -segment_time "$RECORD_SEGMENT_TIME" -reset_timestamps 1 -strftime 1 \
  -segment_list "$RECORD_DIR/segments.txt" \
  "$RECORD_DIR/%Y-%m-%d_%H-%M-%S.mp4" &
FFMPEG_RECORD_PID=$!


# Monitor segment list for new files and check integrity
(
  tail -Fn0 "$RECORD_DIR/segments.txt" | while read FILE
  do
    # Remove carriage returns and whitespace
    FILE=$(echo "$FILE" | tr -d '\r\n[:space:]')
    # Only process if file exists and is not empty
    if [[ -f "$FILE" && -s "$FILE" ]]; then
      # Check file with ffprobe
      if ffprobe -v error "$FILE" > /dev/null; then
        touch "${FILE}.ok"
      else
        echo "[WARN] File $FILE failed ffprobe check, not marking as OK."
      fi
    fi
  done
) &
INTEGRITY_CHECKER_PID=$!


# Periodically clean up old HLS segments, keeping only the last 10
(
  while true; do
    ls -1t "$OUTPUT_DIR"/segment_*.m4s 2>/dev/null | tail -n +11 | xargs -r rm --
    sleep 10
  done
) &
CLEANUP_HLS_PID=$!


# === CLEANUP HANDLER ===
cleanup() {
  echo "[EXIT] Stopping all processes..."
  kill $GST_LIVE_PID $GST_RECORD_PID $FFMPEG_LIVE_PID $FFMPEG_RECORD_PID $CLEANUP_HLS_PID $INTEGRITY_CHECKER_PID 2>/dev/null
  wait
  exit 1
}
trap cleanup SIGINT SIGTERM


# === WAIT AND MONITOR ALL BACKGROUND PROCESSES ===
# Use wait -n to detect if any background process exits early or with error
while true; do
  if ! wait -n; then
    echo "[ERROR] One of the streaming processes exited unexpectedly."
    cleanup
  fi
done