# go2rtc Migration (No Transcode)

This setup keeps camera recording logic unchanged and adds go2rtc only for live viewing.

## Why this is lightweight on Raspberry Pi 5

- No transcoding configured.
- go2rtc only republishes incoming RTSP streams.
- CPU load stays low compared to ffmpeg transcoding pipelines.

## 1) Generate config from existing camera credentials

Run:

```bash
./deploy_scripts/generate_go2rtc_yaml.sh
```

This creates:

- `/home/raspberrypi5/simple-cctv-hub/go2rtc/go2rtc.yaml`

Generated streams:

- `cam1_main`
- `cam2_main`
- `cam3_main`

## 2) Install go2rtc binary

- Download the correct ARM build from the official releases.
- Place binary at:
  - `/home/raspberrypi5/go2rtc/go2rtc`
- Make it executable:

```bash
chmod +x /home/raspberrypi5/go2rtc/go2rtc
```

## 3) Place config where service expects it

```bash
mkdir -p /home/raspberrypi5/go2rtc
cp /home/raspberrypi5/simple-cctv-hub/go2rtc/go2rtc.yaml /home/raspberrypi5/go2rtc/go2rtc.yaml
```

## 4) Install systemd unit

```bash
sudo cp /home/raspberrypi5/simple-cctv-hub/go2rtc/systemd/go2rtc.service /etc/systemd/system/go2rtc.service
sudo systemctl daemon-reload
sudo systemctl enable --now go2rtc
sudo systemctl status go2rtc
```

## 5) Nginx reverse proxy

`nginx.conf.template` includes a `/go2rtc/` proxy to local `127.0.0.1:1984`.
After normal deploy/reload, your frontend can load go2rtc viewer pages via:

- `/go2rtc/stream.html?...`
- `/go2rtc/webrtc.html?...`

## 6) Opt-in per camera in frontend

The live player now supports an optional mode in `www/json/cams.json`.

Example camera entry:

```json
{
  "id": 0,
  "title": "Stodola",
  "source": "/cam1/index.m3u8",
  "footageInfoPath": "/footage/cam1/footage_info.json",
  "footageDirectory": "/footage/cam1",
  "liveMode": "go2rtc-webrtc",
  "go2rtcBasePath": "/go2rtc",
  "go2rtcViewerPage": "stream.html",
  "go2rtcMode": "webrtc,webrtc/tcp",
  "go2rtcStream": "cam1_main"
}
```

If `liveMode` is omitted, it stays on current HLS behavior.

## 7) Recommended rollout

1. Enable `go2rtc-webrtc` for only one camera first.
2. Watch CPU with `top` and service stability for 24h.
3. If stable, switch other cameras.
4. Keep recording (`cam_capture`) unchanged during the trial.

## Notes

- For LAN use, this is usually enough.
- For remote WebRTC access, ICE/STUN/TURN tuning may be needed.
- No-transcode means browser codec support still matters.
