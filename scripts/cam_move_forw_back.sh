#!/bin/bash

SCRIPT_PATH="/home/raspberrypi5/scripts/cam_move.sh"
STEPS=9
SPEED=1
SLEEP_MINUTES=5

# Get the name of the script
SCRIPT_NAME=$(basename "$0")

LOG_FILE="/home/raspberrypi5/$SCRIPT_NAME.log"  # Log file

# Log message with timestamp (echo to terminal and write to log file)
log() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

log "$SCRIPT_NAME executed!"

# Directions
DIRECTIONS=("right" "left")

# First move: Rotate in the left direction
$SCRIPT_PATH $STEPS ${DIRECTIONS[0]} $SPEED 2>&1 | tee -a "$LOG_FILE"

# Convert sleep time from minutes to seconds
SLEEP_SECS=$((SLEEP_MINUTES * 60))

# Wait for the specified sleep time
echo "Waiting for $SLEEP_MINUTES minutes..."
sleep $SLEEP_SECS
 
# Second move: Rotate in the right direction
$SCRIPT_PATH $STEPS ${DIRECTIONS[1]} $SPEED 2>&1 | tee -a "$LOG_FILE"

