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
    const mode = cameraConf.go2rtcMode || 'mse';

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

    configureGo2RtcMinimalControls(iframe);

    return streamWrapper;
}

function configureGo2RtcMinimalControls(iframe) {
    iframe.addEventListener('load', () => {
        let doc;

        try {
            doc = iframe.contentDocument || iframe.contentWindow?.document;
        } catch (error) {
            console.warn('Unable to access go2rtc iframe document:', error);
            return;
        }

        if (!doc) return;

        const applyVideoSettings = () => {
            const videos = doc.querySelectorAll('video');
            videos.forEach(video => {
                video.controls = false;
                video.muted = true;
                video.playsInline = true;
            });
        };

        applyVideoSettings();

        if (doc.body) {
            const observer = new MutationObserver(() => applyVideoSettings());
            observer.observe(doc.body, { childList: true, subtree: true });
        }
    });
}

function getIframeVideos(iframe) {
    try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return [];
        return Array.from(doc.querySelectorAll('video'));
    } catch (error) {
        console.warn('Unable to access go2rtc iframe videos:', error);
        return [];
    }
}

function videoHasAudio(video) {
    if (!video) return false;

    const stream = video.srcObject;
    if (stream && typeof stream.getAudioTracks === 'function') {
        return stream.getAudioTracks().length > 0;
    }

    if (video.audioTracks && typeof video.audioTracks.length === 'number') {
        return video.audioTracks.length > 0;
    }

    return false;
}

function createLiveAudioToggle(iframe) {
    const button = document.createElement('button');
    button.classList.add('button', 'button-live-audio');

    const updateButton = () => {
        const videos = getIframeVideos(iframe);
        const audioVideos = videos.filter(videoHasAudio);
        const anyUnmuted = audioVideos.some(video => !video.muted);

        button.style.display = audioVideos.length > 0 ? 'inline-flex' : 'none';
        button.textContent = anyUnmuted ? '🔇' : '🔊';
        button.title = anyUnmuted ? 'Ztlumit' : 'Zapnout zvuk';
        button.disabled = audioVideos.length === 0;
    };

    button.addEventListener('click', () => {
        const videos = getIframeVideos(iframe).filter(videoHasAudio);
        if (videos.length === 0) {
            updateButton();
            return;
        }

        const anyUnmuted = videos.some(video => !video.muted);
        const nextMutedState = anyUnmuted;

        videos.forEach(video => {
            video.muted = nextMutedState;
            if (!nextMutedState && typeof video.play === 'function') {
                video.play().catch(() => {});
            }
        });

        updateButton();
    });

    updateButton();

    iframe.addEventListener('load', () => {
        setTimeout(updateButton, 300);
        setTimeout(updateButton, 1000);
    });

    return button;
}

// Create controls container (like createCustomControls in videoFactory.js)
function createStreamControls(cameraConf, liveVideo) {
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

    if (cameraConf.liveMode === 'go2rtc-webrtc') {
        const iframe = liveVideo.querySelector('.stream-iframe');
        if (iframe) {
            const audioToggle = createLiveAudioToggle(iframe);
            controls.appendChild(audioToggle);
        }
    }

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
        const streamControls = createStreamControls(cameraConf, liveVideo);
        streamContainer.appendChild(streamControls);
    }
    

    return streamContainer;
}