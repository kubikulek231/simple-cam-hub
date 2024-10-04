import { createStreamedVideo } from "./factory/videoFactory.js";
import { loadedCameraConfList } from "./json-loaders/camConfLoader.js"


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

    Array.from(streamOverlayElements).forEach(element => {
        element.removeAttribute('hidden'); // Show the element
    });
    const videoContainerElement = document.getElementById("streamOverlayVideoContainer");
    videoContainerElement.appendChild(createStreamedVideo(cameraConf.source));
}

export function handleStreamOverlay() {
    const overlayButtons = document.querySelectorAll('.button-open-stream-overlay');
    overlayButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const cameraID = event.target.parentNode.parentNode.getAttribute("camera-id");
            showStreamOverlay(loadedCameraConfList[cameraID]);
        });
    });

    const exitOverlayButtonElement = document.getElementById("exitStreamOverlayButton");
    exitOverlayButtonElement.addEventListener('click', (event) => {
        hideStreamOverlay();
    });
}
