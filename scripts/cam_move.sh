#!/bin/bash

# Example:
# ./cam_move.sh 1 stop 45

# Username and password for the camera (replace these with actual credentials)
USERNAME="admin"
PASSWORD="admin"

# Base URL of the camera control CGI script with username and password
BASE_URL="http://$USERNAME:$PASSWORD@192.168.1.106/web/cgi-bin/hi3510/ptzctrl.cgi"

# Read input parameters from the command line
STEP=$1   # First argument: STEP (number of iterations)
ACT=$2    # Second argument: ACT (e.g., "left", "right", "up", "down", "stop")
SPEED=$3  # Third argument: SPEED (e.g., 45)

# Check if all three parameters are provided
if [[ -z "$STEP" || -z "$ACT" || -z "$SPEED" ]]; then
    echo "Usage: $0 STEP ACT SPEED"
    echo "Example: $0 3 left 45"
    exit 1
fi

# Function to execute the GET request with STEP=1
send_request() {
    local full_url="$BASE_URL?-step=1&-act=$ACT&-speed=$SPEED"

    # Send the GET request and capture the response
    RESPONSE=$(curl -s "$full_url")

    # Success message to check
    SUCCESS_MESSAGE="[Succeed]set ok."

    # Check if the response contains the success message
    if [[ "$RESPONSE" == *"$SUCCESS_MESSAGE"* ]]; then
        echo "Success! Response: $RESPONSE"
    else
        echo "Failed. Response: $RESPONSE"
    fi
}

# Check if STEP is greater than 1, if so, repeat the action STEP times but always send step=1
if [[ "$STEP" -gt 1 ]]; then
    for (( i=1; i<=STEP; i++ )); do
        echo "Executing step $i of $STEP with step=1 in the URL..."
        send_request  # Send the request with STEP=1 for each iteration
        sleep 1       # Sleep for a second between steps (adjust as needed)
    done
else
    # If STEP is 1 or less, just send the request once with step=1
    echo "Executing single step with step=1..."
    send_request  # Always send step=1
fi
