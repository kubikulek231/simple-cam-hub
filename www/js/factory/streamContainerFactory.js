// Create the video element and its wrapper (like createVideoElement + wrapper in videoFactory.js)
function createLiveVideoElement(videoSource, controls = true) {
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
export function createStreamContainer(cameraConf, showControls = true) {
    const streamContainer = document.createElement('div');
    streamContainer.classList.add("stream-container");
    streamContainer.setAttribute("camera-id", cameraConf.id);

    // Title (like video title/header)
    const streamTitle = document.createElement('div');
    streamTitle.classList.add("stream-title");
    streamTitle.textContent = cameraConf.title;

    // Video wrapper (like videoWrapper in videoFactory.js)
    const streamWrapper = document.createElement('div');
    streamWrapper.classList.add("stream-wrapper-outer");

    // Video element (like createVideoElement)
    const liveVideo = createLiveVideoElement(cameraConf.source, false);

    // Compose the structure
    streamWrapper.appendChild(liveVideo);
    streamContainer.appendChild(streamTitle);
    streamContainer.appendChild(streamWrapper);
    
    // Controls
    if (showControls) {
        const streamControls = createStreamControls();
        streamContainer.appendChild(streamControls);
    }
    

    return streamContainer;
}