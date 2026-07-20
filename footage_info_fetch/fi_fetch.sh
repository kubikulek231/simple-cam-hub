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

is_number() {
  [[ "$1" =~ ^-?[0-9]+([.][0-9]+)?$ ]]
}

abs_diff() {
  awk -v a="$1" -v b="$2" 'BEGIN { d = a - b; if (d < 0) d = -d; printf "%.6f", d }'
}

calc_quality_pct() {
  awk -v diff="$1" -v seg="$2" 'BEGIN {
    if (seg <= 0) { print "null"; exit }
    q = 100 - ((diff / seg) * 100)
    if (q < 0) q = 0
    if (q > 100) q = 100
    printf "%d", q + 0.5
  }'
}

json_bool_from_condition() {
  awk -v a="$1" -v b="$2" 'BEGIN { if (a <= b) print "true"; else print "false" }'
}

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
    ok_count=0
    bad_count=0
    unknown_count=0

    for video_file in $(ls -t "$RECORD_DIR"/*.mp4 2>/dev/null); do
      [[ -f "$video_file" ]] || continue
      
      ok_file="${video_file}.ok"
      filename=$(basename "$video_file")
      quality_estimation="null"
      is_ok="null"
      
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

      if is_number "$duration" && is_number "$segment_time"; then
        duration_diff=$(abs_diff "$duration" "$segment_time")
        tolerance=$(awk -v s="$segment_time" 'BEGIN { t = s * 0.10; if (t < 60) t = 60; printf "%.6f", t }')
        quality_estimation=$(calc_quality_pct "$duration_diff" "$segment_time")
        is_ok=$(json_bool_from_condition "$duration_diff" "$tolerance")
      fi

      case "$is_ok" in
        true) ok_count=$((ok_count + 1)) ;;
        false) bad_count=$((bad_count + 1)) ;;
        *) unknown_count=$((unknown_count + 1)) ;;
      esac
      
      if [[ $first -eq 0 ]]; then
        echo ","
      fi
      first=0
      
      cat <<EOF
  {
    "file": "$filename",
    "duration": $duration,
    "segment_time": $segment_time,
    "end_time": $end_time,
    "quality_estimation": $quality_estimation,
    "is_ok": $is_ok
  }
EOF
    done
    
    echo "]"
  } > "$JSON_FILE.tmp" 2>/dev/null
  
  # Atomic write
  mv "$JSON_FILE.tmp" "$JSON_FILE" 2>/dev/null || true
  
  log "Updated footage_info.json ($(wc -l < "$JSON_FILE" 2>/dev/null || echo 0) lines) | ok: $ok_count | bad: $bad_count | unknown: $unknown_count"
  sleep "$SLEEP_TIME"
done
