#!/bin/bash
# === SETUP: Deploy unified camera capture ===
# This script converts old per-camera scripts to the new unified system

set -e

cd "$(dirname "$0")"

echo "=== Unified Camera Capture Setup ==="

# 1. Backup old scripts
echo "[1/5] Backing up old scripts..."
[[ ! -f cc_cam1.sh.bak ]] && cp cc_cam1.sh cc_cam1.sh.bak 2>/dev/null || true
[[ ! -f cc_cam2.sh.bak ]] && cp cc_cam2.sh cc_cam2.sh.bak 2>/dev/null || true
[[ ! -f cc_cam3.sh.bak ]] && cp cc_cam3.sh cc_cam3.sh.bak 2>/dev/null || true

# 2. Make new scripts executable
echo "[2/5] Making scripts executable..."
chmod +x cc_capture.sh cc_monitor.sh cc_analyze.sh

# 3. Setup systemd services (template-based)
echo "[3/5] Installing systemd services..."
for i in 1 2 3; do
  sudo cp cc_capture@.service "/etc/systemd/system/cc_capture@${i}.service"
done
sudo systemctl daemon-reload

# 4. Create directories
echo "[4/5] Creating log/footage directories..."
for i in 1 2 3; do
  sudo mkdir -p "/var/log/cam${i}_capture" "/home/raspberrypi5/footage/cam${i}" "/var/www/html/cam${i}"
  sudo chmod 755 "/var/log/cam${i}_capture"
done

# 5. Start services
echo "[5/5] Starting capture services..."
for i in 1 2 3; do
  sudo systemctl enable --now "cc_capture@${i}.service"
  echo "  CAM$i: enabled and started"
done

echo ""
echo "=== Setup complete ==="
echo ""
echo "View status:"
echo "  systemctl status cc_capture@{1,2,3}.service"
echo ""
echo "View logs:"
echo "  journalctl -u cc_capture@1.service -f"
echo "  tail -f /var/log/cam1_capture/main.log"
echo ""
echo "Analyze segments:"
echo "  ./cc_analyze.sh /home/raspberrypi5/footage/cam1"
echo ""
