#!/bin/bash
# === FOOTAGE INFO FETCHER ===
# Usage: ./fi_fetch.sh <camera_number>
# Generates JSON metadata for recorded segments

CAM=${1:?Camera number required}

RECORD_DIR="/home/raspberrypi5/footage/cam$CAM"
JSON_FILE="$RECORD_DIR/footage_info.json"
LOG_DIR="/var/log/fi_fetch_cam$CAM"
LOG_FILE="$LOG_DIR/fetch.log"
SLEEP_TIME=300

mkdir -p "$LOG_DIR"

log() {
  local msg="$1"
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$msg" | tee -a "$LOG_FILE"
  logger -t "fi_fetch_cam$CAM" "$msg"
}

log "Starting footage info fetch for CAM$CAM"

while true; do
  # Gather statistics
  file_count=$(ls -1 "$RECORD_DIR"/*.mp4 2>/dev/null | wc -l)
  oldest_file=$(ls -t "$RECORD_DIR"/*.mp4 2>/dev/null | tail -1 | xargs -r basename)
  latest_file=$(ls -t "$RECORD_DIR"/*.mp4 2>/dev/null | head -1 | xargs -r basename)
  
  log "Stats: $file_count files | oldest: ${oldest_file:-none} | latest: ${latest_file:-none}"
  
  {
    echo "["
    
    first=1
    for video_file in $(ls -t "$RECORD_DIR"/*.mp4 2>/dev/null); do
      [[ -f "$video_file" ]] || continue
      
      ok_file="${video_file}.ok"
      filename=$(basename "$video_file")
      
      # Extract metadata from .ok file if it exists
      if [[ -f "$ok_file" ]]; then
        duration=$(grep '^duration=' "$ok_file" | cut -d= -f2 || echo "null")
        segment_time=$(grep '^segment_time=' "$ok_file" | cut -d= -f2 || echo "null")
        end_time=$(grep '^end_time=' "$ok_file" | cut -d= -f2 || echo "null")
      else
        duration="null"
        segment_time="null"
        end_time="null"
      fi
      
      [[ -z "$duration" ]] && duration="null"
      [[ -z "$segment_time" ]] && segment_time="null"
      [[ -z "$end_time" ]] && end_time="null"
      
      if [[ $first -eq 0 ]]; then
        echo ","
      fi
      first=0
      
      cat <<EOF
  {
    "file": "$filename",
    "duration": $duration,
    "segment_time": $segment_time,
    "end_time": $end_time
  }
EOF
    done
    
    echo "]"
  } > "$JSON_FILE.tmp" 2>/dev/null
  
  # Atomic write
  mv "$JSON_FILE.tmp" "$JSON_FILE" 2>/dev/null || true
  
  log "Updated footage_info.json ($(wc -l < "$JSON_FILE" 2>/dev/null || echo 0) lines)"
  sleep "$SLEEP_TIME"
done
