import { createStreamedVideo } from "../factory/videoFactory.js";
import { loadedCameraConfList } from "../loaders/camConfLoader.js"
import { resumeAllStreams, pauseAllStreams } from "../streamContainerHandling.js";


export function hideStreamOverlay() {
    const streamOverlayElements = document.getElementsByClassName("stream-overlay");

    Array.from(streamOverlayElements).forEach(element => {
        element.setAttribute('hidden', 'true'); // Hide the element
    });
    const videoContainerElement = document.getElementById("streamOverlayVideoContainer");
    const videoElement = videoContainerElement.getElementsByTagName("video")[0];
    videoElement.remove();
}

export function showStreamOverlay(cameraConf) {
    const streamOverlayElements = document.getElementsByClassName("stream-overlay");
    const descriptorElement = document.getElementById("streamOverlayDescriptor");
    Array.from(streamOverlayElements).forEach(element => {
        element.removeAttribute('hidden'); // Show the element
    });
    const videoContainerElement = document.getElementById("streamOverlayVideoContainer");
    while (videoContainerElement.firstChild) {
        videoContainerElement.removeChild(videoContainerElement.firstChild);
    }
    descriptorElement.textContent = 'Přehrávání živého videa z kamery: "' + cameraConf.title + '"';
    videoContainerElement.appendChild(createStreamedVideo(cameraConf.source, false));
}

export function handleStreamOverlay() {
    const overlayButtons = document.querySelectorAll('.button-open-stream-overlay');
    overlayButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const cameraID = event.target.parentNode.parentNode.getAttribute("camera-id");
            showStreamOverlay(loadedCameraConfList[cameraID]);
            pauseAllStreams();
        });
    });

    const exitOverlayButtonElement = document.getElementById("exitStreamOverlayButton");
    exitOverlayButtonElement.addEventListener('click', (event) => {
        hideStreamOverlay();
        resumeAllStreams();
    });
}
