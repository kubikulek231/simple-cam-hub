#!/bin/bash

# Sleep time between checks (in seconds)
SLEEP_TIME=300

# Array of directories where video files are stored for each camera
DIRECTORIES=(
    "/home/raspberrypi5/footage/cam1/"
    "/home/raspberrypi5/footage/cam2/"
    "/home/raspberrypi5/footage/cam3/"
)

# Maximum size allowed (in GB) before deleting old files
MAX_SIZE=200

# Function to log messages with timestamp (stdout only)
log() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message"
}

# Infinite loop to run cleanup every SLEEP_TIME seconds
while true; do
    for DIRECTORY in "${DIRECTORIES[@]}"; do
        # Check if directory exists and is readable
        if [ ! -d "$DIRECTORY" ] || [ ! -r "$DIRECTORY" ]; then
            log "WARNING: Directory $DIRECTORY does not exist or is not readable."
            continue
        fi

        # Get the folder size in KB, then convert to GB
        CURRENT_SIZE_KB=$(du -sk "$DIRECTORY" | awk '{print $1}')
        CURRENT_SIZE_GB=$((CURRENT_SIZE_KB / 1024 / 1024))

        log "Dir $DIRECTORY is approx. $CURRENT_SIZE_GB GB"

        # If the folder size exceeds the threshold, delete the oldest file
        if [ "$CURRENT_SIZE_GB" -gt "$MAX_SIZE" ]; then
            OLDEST_FILE=$(find "$DIRECTORY" -type f -printf '%T@ %p\n' | sort -n | head -n 1 | cut -d' ' -f2-)
            if [ -n "$OLDEST_FILE" ]; then
                log "Deleting the oldest file: $OLDEST_FILE"
                rm -f "$OLDEST_FILE"
                if [ $? -eq 0 ]; then
                    log "Deleted successfully."
                else
                    log "ERROR deleting file $OLDEST_FILE."
                fi
            else
                log "No files found to delete in $DIRECTORY."
            fi
        fi
    done

    # Sleep before next check
    sleep "$SLEEP_TIME"
done
