import { createStreamContainer } from "./factory/streamContainerFactory.js";
import { loadedCameraConfList } from "./json-loaders/camConfLoader.js";

export function handleStreamContainers() {
    if (loadedCameraConfList != null && loadedCameraConfList != []) {
        const videoContainer = document.getElementById("videoContainer");
        loadedCameraConfList.forEach(cameraConfItem => {
            const streamContainerElement = createStreamContainer(cameraConfItem);
            videoContainer.appendChild(streamContainerElement);
        });
    }
}