import { handleStreamContainers } from "./streamContainerHandling.js";
import { loadCameraConf } from "./loaders/camConfLoader.js";
import { handleStreamOverlay } from "./overlay/streamOverlayHandling.js";
import { handleFootageOverlay } from "./overlay/footageOverlayHandling.js";
import { handleBrowserOverlay } from "./overlay/browserOverlayHandling.js";

// Call everything when DOM content is loaded
document.addEventListener('DOMContentLoaded', async () => {

    // Wait for loading the camera configuration
    if (await loadCameraConf()) {
        handleStreamContainers();
        handleStreamOverlay();
        handleFootageOverlay();
        handleBrowserOverlay();
    }
});
