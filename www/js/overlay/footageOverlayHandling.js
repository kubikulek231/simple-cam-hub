import { loadedCameraConfList } from "../json-loaders/camConfLoader.js";
import { createStoredVideo } from "../factory/videoFactory.js";
import { getVideoList, splitVideoFilename, getDayAndMonthNames } from "../footageLoading.js";

export function hideFootageOverlay() {
    const footageOverlayElements = document.getElementsByClassName("footage-overlay");

    Array.from(footageOverlayElements).forEach(element => {
        element.setAttribute('hidden', 'true'); // Hide the element
    });
    const videoContainerElement = document.getElementById("footageOverlayVideoContainer");
    const videoElement = videoContainerElement.getElementsByTagName("video")[0];
    videoElement.remove();
}

export function showFootageOverlay(cameraConfItem, videoPath) {
    const footageOverlayElements = document.getElementsByClassName("footage-overlay");

    const splitVideoName = splitVideoFilename(videoPath);
    const dayMonthNames = getDayAndMonthNames(splitVideoName.day, 
                                                splitVideoName.month,
                                                splitVideoName.year);
    var year = splitVideoName.year;
    var dayName = dayMonthNames[0];
    var day = splitVideoName.day;
    var monthName = dayMonthNames[1];
    var time = String(splitVideoName.hour) + ":" + String(splitVideoName.minute);

    const camDescriptionTitle = document.getElementById("footageOverlayDescriptorTitle");
    const camDescriptionDate = document.getElementById("footageOverlayDescriptorDate");
    const camDescriptionTime = document.getElementById("footageOverlayDescriptorTime");
    
    camDescriptionTitle.textContent = "Záznam z kamery: " + String(cameraConfItem.title);
    camDescriptionDate.textContent = "Datum: " + dayName + " " + day + ". " + monthName + " " + year;
    camDescriptionTime.textContent =  "Čas: " + time;
    
    Array.from(footageOverlayElements).forEach(element => {
        element.removeAttribute('hidden'); // Show the element
    });
    const targetVideoPath = cameraConfItem.footageDirectory + "/" + videoPath;
    const videoElement = createStoredVideo(targetVideoPath, "video/webm");
    const videoContainer = document.getElementById("footageOverlayVideoContainer");
    videoContainer.appendChild(videoElement);
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
