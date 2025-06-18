import { loadCameraConf } from "./loaders/camConfLoader.js";
import { fetchAndStoreFootageInfo } from "./loaders/camFootageInfoLoader.js";
import { handleStreamContainers } from "./streamContainerHandling.js";
import { handleStreamOverlay } from "./overlay/streamOverlayHandling.js";
import { handleBrowserOverlay } from "./overlay/browserOverlayHandling.js";

// Call everything when DOM content is loaded
document.addEventListener('DOMContentLoaded', async () => {

    // Wait for loading the camera configuration
    if (await loadCameraConf()) {
        fetchAndStoreFootageInfo();
        handleStreamContainers();
        handleStreamOverlay();
        handleBrowserOverlay();
    }
});
