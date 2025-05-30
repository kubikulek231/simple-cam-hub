import { createStreamContainer } from "../factory/streamContainerFactory.js";
import { loadedCameraConfList } from "../loaders/camConfLoader.js";
import { resumeAllStreams, pauseAllStreams } from "../utils.js";

// Create and show the overlay
export function createStreamOverlay(cameraConf) {

    // Create overlay container
    const overlayContainer = document.createElement("div");
    overlayContainer.id = "streamOverlay";
    overlayContainer.className = "stream-overlay";
    overlayContainer.classList.add("overlay-window");

    // Overlay main box
    const overlay = document.createElement("div");
    overlay.id = "streamOverlayContainer";
    overlay.classList.add("stream-overlay");

    // Header
    const header = document.createElement("div");
    header.id = "streamOverlayHeader";

    const playerTitle = document.createElement("div");
    playerTitle.id = "streamOverlayPlayerTitle";
    playerTitle.textContent = `Živý přenos`;
    header.appendChild(playerTitle);

    // Flex spacer
    const flexSpacer = document.createElement('div');
    flexSpacer.classList.add('flex-spacer');
    header.appendChild(flexSpacer);

    // Close button
    const closeButton = document.createElement("button");
    closeButton.id = "exitStreamOverlayButton";
    closeButton.className = "button-close";
    closeButton.textContent = "✖ ZAVŘÍT";
    closeButton.addEventListener("click", () => {
        overlayContainer.remove();
        document.body.classList.remove('overlay-open'); // Re-enable scroll
        resumeAllStreams();
    });
    header.appendChild(closeButton);

    // Descriptor
    const descriptor = document.createElement("div");
    descriptor.id = "streamOverlayDescriptor";
    descriptor.textContent = `Přehrávání živého videa z kamery: "${cameraConf.title}"`;

    // Video container
    const videoContainer = document.createElement("div");
    videoContainer.id = "streamOverlayVideoContainer";
    videoContainer.appendChild(createStreamContainer(cameraConf, false));

    // Compose overlay
    overlay.appendChild(header);
    overlay.appendChild(descriptor);
    overlay.appendChild(videoContainer);

    overlayContainer.appendChild(overlay);

    // Append overlay to the document body
    document.body.appendChild(overlayContainer);
    document.body.classList.add('overlay-open'); // Prevent background scroll
    pauseAllStreams();
}

// Attach event listeners to open overlay
export function handleStreamOverlay() {
    const overlayButtons = document.querySelectorAll('.button-open-stream-overlay');
    overlayButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const cameraID = event.target.parentNode.parentNode.getAttribute("camera-id");
            createStreamOverlay(loadedCameraConfList[cameraID]);
        });
    });
}
