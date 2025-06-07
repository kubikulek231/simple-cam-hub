import { handleStreamContainers } from "./streamContainerHandling.js";
import { loadCameraConf } from "./loaders/camConfLoader.js";
import { handleStreamOverlay } from "./overlay/streamOverlayHandling.js";
import { handleBrowserOverlay } from "./overlay/browserOverlayHandling.js";

// Call everything when DOM content is loaded
document.addEventListener('DOMContentLoaded', async () => {

    // Wait for loading the camera configuration
    if (await loadCameraConf()) {
        handleStreamContainers();
        handleStreamOverlay();
        handleBrowserOverlay();
    }

    // Do some fancy background effect based on mouse movement
    document.addEventListener('mousemove', function(e) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        const angle = 100 + x * 40;
        const posX = 40 + x * 20;
        const posY = 40 + y * 20;
        // Apply to html element for full viewport coverage
        document.documentElement.style.background = 
            `linear-gradient(${angle}deg, #004a4a 0%, #005f5f 50%, #003333 100%)`;
        document.documentElement.style.backgroundSize = "300% 300%";
        document.documentElement.style.backgroundPosition = `${posX}% ${posY}%`;
    });
});
