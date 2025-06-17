#!/bin/bash

RECORD_DIR="/home/raspberrypi5/footage/cam3"
RECORD_EXT=".mp4"
SLEEP_TIME=311  # Sleep time between checks (in seconds)

JSON_FILE="$RECORD_DIR/footage_info.json"

echo "[INFO] Starting fetching script for $JRECORD_DIR to fetch info about video files with $RECORD_EXT and their .ok files..."

while true; do
    # Start JSON array
    echo "[" > "$JSON_FILE"

    FIRST=1
    for VIDEO in $(ls -t "$RECORD_DIR"/*"$RECORD_EXT"); do
    [ -e "$VIDEO" ] || continue  # Skip if no files
    OK_FILE="${VIDEO}.ok"
    FILENAME=$(basename "$VIDEO")
    if [[ -f "$OK_FILE" ]]; then
        # Extract duration, segment_time, and end_time from .ok file
        DURATION=$(grep '^duration=' "$OK_FILE" | cut -d= -f2)
        SEGMENT_TIME=$(grep '^segment_time=' "$OK_FILE" | cut -d= -f2)
        END_TIME=$(grep '^end_time=' "$OK_FILE" | cut -d= -f2)
        [[ -z "$DURATION" ]] && DURATION="null"
        [[ -z "$SEGMENT_TIME" ]] && SEGMENT_TIME="null"
        [[ -z "$END_TIME" ]] && END_TIME="null"
    else
        DURATION="null"
        SEGMENT_TIME="null"
        END_TIME="null"
    fi
    if [[ $FIRST -eq 0 ]]; then
        echo "," >> "$JSON_FILE"
    fi
    
    # Add file information to JSON
    # Reset FIRST to 0 after the first entry
    FIRST=0
    echo "  {" >> "$JSON_FILE"
    echo "    \"file\": \"$FILENAME\"," >> "$JSON_FILE"
    echo "    \"duration\": $DURATION," >> "$JSON_FILE"
    echo "    \"segment_time\": $SEGMENT_TIME," >> "$JSON_FILE"
    echo "    \"end_time\": $END_TIME" >> "$JSON_FILE"
    echo "  }" >> "$JSON_FILE"
    done

    # End JSON array
    echo "]" >> "$JSON_FILE"

    sleep $SLEEP_TIME 
done