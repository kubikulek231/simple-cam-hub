#!/bin/bash
# This script generates a timestamped filename with a specified extension.
# Usage: ./generate_filename mkv

EXT="${1:-mkv}"  # Default to mkv if not specified

# Generate a random timestamp within the last 30 days
RAND_SEC=$((RANDOM % (30*24*60*60)))
FILE_DATE=$(date -d "-$RAND_SEC seconds" +"%Y-%m-%d_%H-%M-%S")

echo "${FILE_DATE}.${EXT}"