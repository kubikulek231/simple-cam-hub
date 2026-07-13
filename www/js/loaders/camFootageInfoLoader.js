import { loadedCameraConfList } from "./camConfLoader.js";

export var loadedCameraFootageInfoStatus = false; 
export var loadedCameraFootageInfo = [];

// For each camera conf item in the loadedCameraConfList,
// fetch the footage info from the URL provided in the camera conf
// and store it in the loadedCameraFootageInfo array.
export async function fetchAndStoreFootageInfo() {
    loadedCameraFootageInfo = []; // Reset the footage info array
    loadedCameraFootageInfoStatus = false; // Reset status

    try {
        // Fetch all footage info in parallel, keeping order
        const footageInfoResults = await Promise.all(
            loadedCameraConfList.map(async (cameraConf) => {
                if (cameraConf.footageInfoPath) {
                    return await fetchFootageInfo(cameraConf.footageInfoPath);
                } else {
                    return []; // Return empty list if path is not defined
                }
            })
        );

        // Store results as array of arrays (each corresponding to a camera)
        loadedCameraFootageInfo = footageInfoResults;

        loadedCameraFootageInfoStatus = true;
        console.log('All footage info fetched and stored successfully.');
    } catch (error) {
        loadedCameraFootageInfoStatus = false;
        console.error('Error fetching footage info:', error);
    }
}

export async function fetchFootageInfo(jsonUrl) {
    try {
        // Add cache-buster query parameter (timestamp) to force fresh fetch
        const separator = jsonUrl.includes('?') ? '&' : '?';
        const cacheUrl = jsonUrl + separator + 't=' + Date.now();
        
        const response = await fetch(cacheUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        loadedCameraFootageInfo = Array.isArray(data) ? data : [];
        return loadedCameraFootageInfo;
    } catch (error) {
        console.error('Error fetching footage info:', error);
        loadedCameraFootageInfo = [];
        return loadedCameraFootageInfo;
    }
}

