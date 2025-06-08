import { createStoredVideo } from "../factory/videoFactory.js";
import { splitVideoFilename, getDayAndMonthNames } from "../loaders/camFootageLoading.js";
import { getCurrentDateTimeInWords } from "../utils.js";

export function createFootageOverlay(cameraConfItem, videoPath) {
    // Remove existing overlay if it exists
    const existingOverlay = document.getElementById("footageOverlay");
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Parse video filename details
    const splitVideoName = splitVideoFilename(videoPath);
    const dayMonthNames = getDayAndMonthNames(
        splitVideoName.day, 
        splitVideoName.month,
        splitVideoName.year
    );
    
    const year = splitVideoName.year;
    const dayName = dayMonthNames[0];
    const day = splitVideoName.day;
    const monthName = dayMonthNames[1];
    const minutes = splitVideoName.minute.toString().padStart(2, '0'); 
    const time = `${splitVideoName.hour}:${minutes}`;

    const newFootageOverlayContainer = document.createElement("div");
    newFootageOverlayContainer.id = "footageOverlay";
    newFootageOverlayContainer.classList.add("overlay-window");

    const topSpacer = document.createElement("div");
    topSpacer.classList.add("overlay-vertical-spacer");
    const botSpacer = document.createElement("div");
    botSpacer.classList.add("overlay-vertical-spacer");

    const header = document.createElement("div");
    header.id = "footageOverlayHeader";
    header.classList.add("overlay-item");

    const playerTitle = document.createElement("div");
    playerTitle.id = "footageOverlayPlayerTitle";
    playerTitle.textContent = `Přehrávač`;
    header.appendChild(playerTitle);

    // Create the flex-spacer div
    const flexSpacer = document.createElement('div');
    flexSpacer.classList.add('flex-spacer');
    header.appendChild(flexSpacer);

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.id = "closeFootageOverlay";
    closeButton.className = "button-close";
    closeButton.textContent = "✖ ZAVŘÍT";
    closeButton.addEventListener("click", () => {
        newFootageOverlayContainer.remove();
        document.body.classList.remove('overlay-open');
    });
    header.appendChild(closeButton);

    // Create descriptor
    const descriptor = document.createElement("div");
    descriptor.id = "footageOverlayDescriptor";
    descriptor.classList.add("overlay-item");

    const title = document.createElement("div");
    title.id = "footageOverlayDescriptorTitle";
    title.textContent = `Název kamery: "${cameraConfItem.title}"`;
    
    const date = document.createElement("div");
    date.id = "footageOverlayDescriptorDate";
    date.textContent = `Datum: ${dayName} ${day}. ${monthName} ${year}`;

    const timeElement = document.createElement("div");
    timeElement.id = "footageOverlayDescriptorTime";
    timeElement.textContent = `Čas: ${time}`;

    const flexSpacer2 = document.createElement('div');
    flexSpacer2.classList.add('flex-spacer');

    descriptor.appendChild(title);
    descriptor.appendChild(flexSpacer2);
    descriptor.appendChild(date);
    descriptor.appendChild(timeElement);

    // Create video container
    const videoContainer = document.createElement("div");
    videoContainer.id = "footageOverlayVideoContainer";

    // Create and append video element
    const targetVideoPath = `${cameraConfItem.footageDirectory}/${videoPath}`;
    const videoElement = createStoredVideo(targetVideoPath, "video/webm");
    videoContainer.appendChild(videoElement);

    // Append elements to overlay
    newFootageOverlayContainer.appendChild(topSpacer);
    newFootageOverlayContainer.appendChild(header);
    newFootageOverlayContainer.appendChild(descriptor);
    newFootageOverlayContainer.appendChild(videoContainer);

    const footerSpacer = document.createElement("div");
    footerSpacer.classList.add("flex-spacer");
    newFootageOverlayContainer.appendChild(footerSpacer);

    // Append overlay to the document body
    document.body.appendChild(newFootageOverlayContainer);
    document.body.classList.add('overlay-open');
}