// Create the video element and its wrapper (like createVideoElement + wrapper in videoFactory.js)
function createLiveVideoElement(cameraConf, controls = true) {
    const videoSource = cameraConf.source;

    if (cameraConf.liveMode === 'go2rtc-webrtc') {
        return createGo2RtcWebRtcElement(cameraConf);
    }

    const video = document.createElement('video');
    video.controls = controls;
    video.muted = true;
    video.autoplay = true;

    if (videoSource.endsWith('.m3u8') && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSource);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS.js error:', data);
        });
    } else {
        video.src = videoSource;
    }

    video.addEventListener('error', (event) => {
        console.error('Error loading video:', event);
    });

    const streamWrapper = document.createElement('div');
    streamWrapper.classList.add("stream-wrapper");
    streamWrapper.appendChild(video);

    return streamWrapper;
}

function createGo2RtcWebRtcElement(cameraConf) {
    const streamName = cameraConf.go2rtcStream || '';
    const basePath = cameraConf.go2rtcBasePath || '/go2rtc';
    const viewerPage = cameraConf.go2rtcViewerPage || 'stream.html';
    const mode = cameraConf.go2rtcMode || 'webrtc,webrtc/tcp';

    const iframe = document.createElement('iframe');
    iframe.classList.add('stream-iframe');
    iframe.allow = 'autoplay; fullscreen; microphone; camera';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');

    if (!streamName) {
        iframe.srcdoc = '<!doctype html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100%;background:#000;color:#fff;font-family:sans-serif;">Missing go2rtcStream in cams.json</body></html>';
    } else {
        const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
        const params = new URLSearchParams();
        params.set('src', streamName);

        if (viewerPage === 'stream.html') {
            params.set('mode', mode);
        } else if (viewerPage === 'webrtc.html') {
            params.set('media', 'video+audio');
        }

        iframe.src = `${normalizedBase}/${viewerPage}?${params.toString()}`;
    }

    const streamWrapper = document.createElement('div');
    streamWrapper.classList.add('stream-wrapper');
    streamWrapper.appendChild(iframe);

    return streamWrapper;
}

// Create controls container (like createCustomControls in videoFactory.js)
function createStreamControls() {
    const controls = document.createElement('div');
    controls.classList.add('stream-controls-container');

    const enlargeButton = document.createElement('button');
    enlargeButton.classList.add('button', 'button-open-stream-overlay');
    enlargeButton.textContent = 'ZVĚTŠIT🔎';

    const browseButton = document.createElement('button');
    browseButton.classList.add('button', 'button-open-browser-overlay');
    browseButton.textContent = 'PROJÍT ZÁZNAMY📁';

    // Optional: add a flex spacer for layout consistency
    const flexSpacer = document.createElement("div");
    flexSpacer.classList.add("flex-spacer");

    controls.appendChild(enlargeButton);
    controls.appendChild(browseButton);

    return controls;
}

// Main function to create the stream container (like createStoredVideo in videoFactory.js)
export function createStreamContainer(cameraConf, showControls = true, showTitle = true, roundCorners = false) {
    // Create the main container for the stream
    const streamContainer = document.createElement('div');
    streamContainer.classList.add("stream-container");
    streamContainer.setAttribute("camera-id", cameraConf.id);

    // Video wrapper
    const streamWrapper = document.createElement('div');
    streamWrapper.classList.add("stream-wrapper-outer");

    // Apply rounded corners if specified
    if (roundCorners) {
        streamWrapper.classList.add("rounded-corners");
    }

    const liveVideo = createLiveVideoElement(cameraConf, false);

    // Compose the structure
    streamWrapper.appendChild(liveVideo);
    if (showTitle) {
        const streamTitle = document.createElement('div');
        streamTitle.classList.add("stream-title");
        streamTitle.textContent = cameraConf.title;
        streamContainer.appendChild(streamTitle);
    }
    streamContainer.appendChild(streamWrapper);

    const flexSpacer = document.createElement('div');
    flexSpacer.classList.add('flex-spacer');
    streamContainer.appendChild(flexSpacer);
    
    // Controls
    if (showControls) {
        const streamControls = createStreamControls();
        streamContainer.appendChild(streamControls);
    }
    

    return streamContainer;
}