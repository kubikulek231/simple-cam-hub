export function createFlexSpacer() {
    const flexSpacer = document.createElement('div');
    flexSpacer.classList.add('flex-spacer');
    return flexSpacer;
}

export function pauseAllStreams() {
    const videoContainer = document.getElementById("videoContainer");
    const videoElements = videoContainer.getElementsByTagName("video");

    // Convert HTMLCollection to an array and pause each video
    Array.from(videoElements).forEach(videoElement => {
        videoElement.pause();  // Use pause() to stop video playback
    });
}

export function resumeAllStreams() {
    const videoContainer = document.getElementById("videoContainer");
    const videoElements = videoContainer.getElementsByTagName("video");

    // Convert HTMLCollection to an array and play each video
    Array.from(videoElements).forEach(videoElement => {
        videoElement.play();  // Use play() to resume video playback
    });
}
