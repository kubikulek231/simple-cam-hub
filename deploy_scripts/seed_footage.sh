#!/bin/bash

# This script seeds the footage directory with sample video files for testing purposes.
CCTV_FOOTAGE_DIR=~/footage
CCTV_FOOTAGE_CAMS=("cam1" "cam2" "cam3")
CCTV_FOOTAGE_DOWNLOAD_URL="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h265/1080/Big_Buck_Bunny_1080_10s_10MB.mp4"
CCTV_FOOTAGE_FILE_NUMBER=20  # Number of sample files to create per camera
CCTV_FOOTAGE_FILE_EXT="mp4"  # File extension for the sample footage
CCTV_GENERATE_FILENAME_SCRIPT=~/simple-cctv-hub/deploy_scripts/generate_filename.sh

# Create camera directories and footage if they don't exist
if [ ! -d "$CCTV_FOOTAGE_DIR/${CCTV_FOOTAGE_CAMS[0]}" ]; then
    echo "Creating camera directories ..."
    for cam in "${CCTV_FOOTAGE_CAMS[@]}"; do
        mkdir -p "$CCTV_FOOTAGE_DIR/$cam"
    done
    # Download and create sample footage if it doesn't exist
    echo "Downloading sample footage for cameras ..."
    mkdir -p ~/temp/cctv_footage
    wget "$CCTV_FOOTAGE_DOWNLOAD_URL" -O ~/temp/cctv_footage/sample.mp4
    for cam in "${CCTV_FOOTAGE_CAMS[@]}"; do
        for i in $(seq 1 $CCTV_FOOTAGE_FILE_NUMBER); do
            # Generate a timestamped filename and copy the sample footage
            FILENAME=$("$CCTV_GENERATE_FILENAME_SCRIPT" "$CCTV_FOOTAGE_FILE_EXT")
            cp ~/temp/cctv_footage/sample.mp4 "$CCTV_FOOTAGE_DIR/$cam/$FILENAME"
        done
    done
    echo "Seeding complete."
    exit 0
else
    echo "Camera directories already exist, skipping creation."
    exit 2
fi
