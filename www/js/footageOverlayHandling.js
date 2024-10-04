import { loadedCameraConfList } from "./json-loaders/camConfLoader.js"


export function hideFootageOverlay() {
    const footageOverlayElements = document.getElementsByClassName("footage-overlay");

    Array.from(footageOverlayElements).forEach(element => {
        element.setAttribute('hidden', 'true'); // Hide the element
    });
    // const videoContainerElement = document.getElementById("streamOverlayVideoContainer");
    // const videoElement = videoContainerElement.getElementsByTagName("video")[0];
    // videoElement.remove();

}

export function showFootageOverlay(cameraConf) {
    const footageOverlayElements = document.getElementsByClassName("footage-overlay");

    Array.from(footageOverlayElements).forEach(element => {
        element.removeAttribute('hidden'); // Show the element
    });
}

export function handleFootageOverlay() {
    const footageOverlayButtons = document.querySelectorAll('.button-open-footage-overlay');
    footageOverlayButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const cameraID = event.target.parentNode.parentNode.getAttribute("camera-id");
            showFootageOverlay(loadedCameraConfList[cameraID]);
        });
    });

    const exitOverlayButtonElement = document.getElementById("exitFootageOverlayButton");
    exitOverlayButtonElement.addEventListener('click', (event) => {
        hideFootageOverlay();
    });
}
