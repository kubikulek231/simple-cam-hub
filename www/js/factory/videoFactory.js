export function createStoredVideo(videoSource, videoType = 'video/mp4; codecs="hev1"') {
    const video = document.createElement('video');
    video.controls = true;  // Enable browser default controls
    video.muted = true;    // Set to true if autoplay is needed
    video.style.width = '100%';

    // Set the video source to the local server's video file
    const source = document.createElement('source');
    source.src = videoSource;
    source.type = videoType;

    video.appendChild(source);

    // Optional: Automatically play the video when metadata is loaded
    video.addEventListener('loadedmetadata', function () {
        video.play();
    });

    return video;
}

export function createStreamedVideo(videoSource, controls = true, videoType = 'application/vnd.apple.mpegurl') {
    const video = document.createElement('video');
    video.controls = controls;  // Enable browser default controls
    video.muted = true;

    // Check if HLS is supported by the browser via Hls.js
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSource);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play(); // Start video after manifest is parsed
        });
    } else if (video.canPlayType(videoType)) {
        // If HLS is natively supported (e.g., Safari)
        video.src = videoSource;
        video.addEventListener('loadedmetadata', function () {
            video.play();  // Start video after metadata is loaded
        });
    } else {
        console.error('HLS is not supported in this browser.');
    }

    return video;
}