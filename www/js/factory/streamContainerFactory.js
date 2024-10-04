import { createStreamedVideo } from "./videoFactory.js";

// Function to create controls and append to video wrapper
function createStreamContainerControls() {
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'stream-controls-container';

    const button1 = document.createElement('button'); // Create a button element
    button1.classList = 'button button-open-stream-overlay'; // Set class names
    button1.textContent = 'ZVĚTŠIT'; // Set text content

    const button2 = document.createElement('button'); // Create another button element
    button2.classList = 'button button-open-footage-overlay'; // Set class names
    button2.textContent = 'PROJÍT ZÁZNAM'; // Set text content

    // Append buttons to the controls container
    controlsContainer.appendChild(button1);
    controlsContainer.appendChild(button2);
    return controlsContainer;
}

// Function to create controls and append to video wrapper
export function createStreamContainer(cameraConf) {
    // Create stream container
    const streamContainer = document.createElement('div');
    streamContainer.classList = "stream-container";
    streamContainer.setAttribute("camera-id", cameraConf.id);

    // Create stream cam title
    const streamContainerTitle = document.createElement('div');
    streamContainerTitle.classList = "stream-title";
    streamContainerTitle.textContent = cameraConf.title;

    // Create video wrapper
    const streamedVideoWrapper = document.createElement('div');
    streamedVideoWrapper.classList = "stream-container-video-wrapper";

    // Create streamed video element
    const streamedVideo = createStreamedVideo(cameraConf.source, false);

    // Create stream container controls
    const streamContainerControls = createStreamContainerControls();

    // Append all to streamContainer
    streamContainer.appendChild(streamContainerTitle);
    streamedVideoWrapper.appendChild(streamedVideo);
    streamContainer.appendChild(streamedVideoWrapper);
    streamContainer.appendChild(streamContainerControls);

    return streamContainer;
}