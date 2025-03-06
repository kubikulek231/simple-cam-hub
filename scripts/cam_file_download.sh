#!/bin/bash

# Array of camera feed URLs
CAMERA_FEEDS=(
    "rtsp://admin:admin@192.168.88.247:554/11"  # Camera 1
	"rtsp://admin:Hovnokleslo123.@192.168.88.244:554"
	"rtsp://admin:Hovnokleslo123.@192.168.88.243:554"
)

# Corresponding directories for each camera
SAVE_DIRECTORIES=(
    "/home/raspberrypi5/footage/cam1/"
    "/home/raspberrypi5/footage/cam2/"
    "/home/raspberrypi5/footage/cam3/"
)

# Get the name of the script
SCRIPT_NAME=$(basename "$0")

# Chunk time in seconds for each segment
RETRY_INTERVAL_SHORT=10   # Retry every 10 seconds if failed (for first 5 attempts)
RETRY_INTERVAL_LONG=300   # Retry every 5 minutes indefinitely after 5 attempts
MAX_RETRIES=5
LOG_FILE="/home/raspberrypi5/$SCRIPT_NAME.log"  # Log file
CHUNK_TIME=1800

# Track the last retry attempt timestamps for each camera
declare -A last_retry_time
declare -A retry_attempts

# Log message with timestamp (echo to terminal and write to log file)
log() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

log "$SCRIPT_NAME executed!"

# Start ffmpeg for a specific camera in a new screen session
start_ffmpeg() {
    local camera_feed=$1
    local save_directory=$2
    local camera_id=$3
    local screen_name="cam${camera_id}_ffmpeg"

    log "Starting ffmpeg for Camera $camera_id in screen session '$screen_name'..."
    
    # Start ffmpeg in a new screen session
    screen -dmS "$screen_name" bash -c "ffmpeg -i \"$camera_feed\" -c:v copy -c:a aac -pix_fmt yuv420p -f segment -segment_time \"$CHUNK_TIME\" -reset_timestamps 1 -g 50 -strftime 1 \"$save_directory%Y-%m-%d_%H-%M-%S.mkv\" >> \"$LOG_FILE\" 2>&1"
}

# Check if a specific ffmpeg process is running by camera feed URL
is_ffmpeg_running() {
    local camera_feed=$1
    pgrep -f "ffmpeg.*$camera_feed" > /dev/null 2>&1
}

# Manage retries
manage_retries() {
    local camera_feed=$1
    local save_directory=$2
    local camera_id=$3
    local current_time=$(date +%s)

    # Get the last retry time and number of attempts for the current camera
    local last_time=${last_retry_time[$camera_id]:-0}
    local attempts=${retry_attempts[$camera_id]:-0}

    # Determine which interval to use (short or long) based on number of attempts
    local retry_interval=$((attempts <= MAX_RETRIES ? RETRY_INTERVAL_SHORT : RETRY_INTERVAL_LONG))

    # Only attempt a retry if the appropriate amount of time has passed
    if (( current_time - last_time >= retry_interval )); then
        if (( attempts < MAX_RETRIES )); then
            log "ffmpeg for Camera $camera_id is not running. Attempt $((attempts + 1)) of $MAX_RETRIES..."
            start_ffmpeg "$camera_feed" "$save_directory" "$camera_id"
            retry_attempts[$camera_id]=$((attempts + 1))
        else
            log "ffmpeg for Camera $camera_id failed to start after $MAX_RETRIES attempts. Retrying every $((RETRY_INTERVAL_LONG / 60)) minutes..."
        fi

        # Update the last retry time
        last_retry_time[$camera_id]=$current_time
    fi
}

# Initial start of ffmpeg for all cameras
for i in "${!CAMERA_FEEDS[@]}"; do
    start_ffmpeg "${CAMERA_FEEDS[$i]}" "${SAVE_DIRECTORIES[$i]}" "$((i+1))"
    retry_attempts[$((i+1))]=0  # Initialize retry attempts to 0 for each camera
    last_retry_time[$((i+1))]=$(date +%s)  # Set the initial last retry time to now
done

# Continuous monitoring loop for all cameras
while true; do
    for i in "${!CAMERA_FEEDS[@]}"; do
        camera_id=$((i+1))

        if is_ffmpeg_running "${CAMERA_FEEDS[$i]}"; then
            log "ffmpeg for Camera $camera_id is running..."
            retry_attempts[$camera_id]=0  # Reset retry attempts if it's running
        else
            log "ffmpeg for Camera $camera_id is down!"
            manage_retries "${CAMERA_FEEDS[$i]}" "${SAVE_DIRECTORIES[$i]}" "$camera_id"
        fi
    done
    sleep 10  # Sleep for 10 seconds before checking again
done
