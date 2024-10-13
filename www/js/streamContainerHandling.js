import { createStreamContainer } from "./factory/streamContainerFactory.js";
import { loadedCameraConfList } from "./loaders/camConfLoader.js";


function createStreamContainersFromConf() {
    const videoContainer = document.getElementById("videoContainer");

    loadedCameraConfList.forEach(cameraConfItem => {
        const streamContainerElement = createStreamContainer(cameraConfItem);
        videoContainer.appendChild(streamContainerElement);
    });
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

export function handleStreamContainers() {
    if (loadedCameraConfList != null && loadedCameraConfList != []) {
        createStreamContainersFromConf();
    }
}