#!/bin/bash

# Array of directories where video files are stored for each camera
DIRECTORIES=(
    "/home/raspberrypi5/footage/cam1/"
    "/home/raspberrypi5/footage/cam2/"
    "/home/raspberrypi5/footage/cam3/"
)

# Get the name of the script
SCRIPT_NAME=$(basename "$0")

# Maximum size allowed (in GB) before deleting old files
MAX_SIZE=200
LOG_FILE="/home/raspberrypi5/$SCRIPT_NAME.log"  # Log file path

# Function to log messages with timestamp
log() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Loop through each directory to check size and delete old files if necessary
for DIRECTORY in "${DIRECTORIES[@]}"; do
    # Check the folder size
    CURRENT_SIZE=$(du -s "$DIRECTORY" | awk '{print $1}')
    CURRENT_SIZE=$((CURRENT_SIZE / 1024 / 1024))  # Convert to GB

    log "Dir $DIRECTORY is approx. $CURRENT_SIZE GB"

    # If the folder size exceeds the threshold, delete the oldest file
    if [ "$CURRENT_SIZE" -gt "$MAX_SIZE" ]; then
        # Find the oldest file
        OLDEST_FILE=$(find "$DIRECTORY" -type f -printf '%T+ %p\n' | sort | head -n 1 | cut -d' ' -f2-)

        # Echo and log the file that will be deleted
        log "Deleting the oldest file: $OLDEST_FILE"

        # Delete the oldest file
        rm "$OLDEST_FILE"
    fi
done
