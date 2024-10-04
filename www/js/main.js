import { handleStreamContainers } from "./streamContainerHandling.js";
import { loadCameraConf } from "./json-loaders/camConfLoader.js";
import { handleStreamOverlay } from "./streamOverlayHandling.js";
import { handleFootageOverlay } from "./footageOverlayHandling.js";

// Call everything when DOM content is loaded
document.addEventListener('DOMContentLoaded', async () => {

    // Wait for loading the camera configuration
    if (await loadCameraConf()) {
        handleStreamContainers();
        handleStreamOverlay();
        handleFootageOverlay();
    }
});
