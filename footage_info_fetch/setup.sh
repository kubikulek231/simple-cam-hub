#!/bin/bash
# === FOOTAGE INFO FETCH SETUP ===
# Deploys the footage info fetch services for all cameras

set -e

cd "$(dirname "$0")"

echo "[INFO] Setting up footage info fetch services..."

SCRIPT="./fi_fetch.sh"
SERVICE_TEMPLATE="./fi_fetch@.service"
SYS_SCRIPT="/usr/local/bin/fi_fetch.sh"

[[ -f "$SCRIPT" ]] || { echo "[ERROR] $SCRIPT not found"; exit 1; }
[[ -f "$SERVICE_TEMPLATE" ]] || { echo "[ERROR] $SERVICE_TEMPLATE not found"; exit 1; }

echo "[INFO] Installing script..."
sudo cp "$SCRIPT" "$SYS_SCRIPT"
sudo chmod +x "$SYS_SCRIPT"
sudo dos2unix "$SYS_SCRIPT" 2>/dev/null || true

echo "[INFO] Installing services..."
for cam_num in 1 2 3; do
  sudo mkdir -p "/var/log/fi_fetch_cam$cam_num"
  sudo chmod 755 "/var/log/fi_fetch_cam$cam_num"
  
  sys_service="/etc/systemd/system/fi_fetch@${cam_num}.service"
  sudo cp "$SERVICE_TEMPLATE" "$sys_service"
  sudo dos2unix "$sys_service" 2>/dev/null || true
  
  echo "[INFO] Enabling and starting fi_fetch@${cam_num}.service..."
  sudo systemctl daemon-reload
  sudo systemctl enable "fi_fetch@${cam_num}.service"
  sudo systemctl restart "fi_fetch@${cam_num}.service"
  echo "[OK] CAM$cam_num info fetch deployed"
done

echo "[OK] All footage info fetch services deployed"
