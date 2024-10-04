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

export function createStreamedVideo(videoSource, controls = true, videoType = 'video/mp4; codecs="hev1"') {
    const video = document.createElement('video');
    video.controls = controls;  // Enable browser default controls
    video.muted = true;

    // Set the video source to the local server's video file
    const source = document.createElement('source');
    source.src = videoSource;
    source.type = videoType;

    video.appendChild(source);

    // Check if HLS is supported
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSource);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.load();
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // If HLS is supported natively (e.g., Safari)
        video.src = videoSource;
        video.addEventListener('loadedmetadata', function () {
            video.load();
            video.play();
        });
    }
    return video;
}