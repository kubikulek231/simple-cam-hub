import { createStreamContainer } from "./factory/streamContainerFactory.js";
import { loadedCameraConfList } from "./loaders/camConfLoader.js";

function createStreamContainersFromConf() {
    const videoContainer = document.getElementById("videoContainer");

    loadedCameraConfList.forEach(cameraConfItem => {
        const streamContainerElement = createStreamContainer(cameraConfItem, true);
        videoContainer.appendChild(streamContainerElement);
    });
}

export function handleStreamContainers() {
    if (loadedCameraConfList != null && loadedCameraConfList != []) {
        createStreamContainersFromConf();
    }
}