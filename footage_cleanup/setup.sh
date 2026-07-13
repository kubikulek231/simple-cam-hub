#!/bin/bash
# === FOOTAGE CLEANUP SETUP ===
# Deploys the footage cleanup service

set -e

cd "$(dirname "$0")"

echo "[INFO] Setting up footage cleanup service..."

SCRIPT="./f_cleanup.sh"
SERVICE="./f_cleanup.service"
SYS_SCRIPT="/usr/local/bin/f_cleanup.sh"
SYS_SERVICE="/etc/systemd/system/f_cleanup.service"

[[ -f "$SCRIPT" ]] || { echo "[ERROR] $SCRIPT not found"; exit 1; }
[[ -f "$SERVICE" ]] || { echo "[ERROR] $SERVICE not found"; exit 1; }

sudo mkdir -p /var/log/f_cleanup
sudo chmod 755 /var/log/f_cleanup

echo "[INFO] Installing script..."
sudo cp "$SCRIPT" "$SYS_SCRIPT"
sudo chmod +x "$SYS_SCRIPT"
sudo dos2unix "$SYS_SCRIPT" 2>/dev/null || true

echo "[INFO] Installing service..."
sudo cp "$SERVICE" "$SYS_SERVICE"
sudo dos2unix "$SYS_SERVICE" 2>/dev/null || true

echo "[INFO] Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable f_cleanup.service
sudo systemctl restart f_cleanup.service

echo "[OK] Footage cleanup deployed"
