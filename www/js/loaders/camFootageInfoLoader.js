import { loadedCameraConfList } from "./camConfLoader.js";

export var loadedCameraFootageInfoStatus = false; 
export var loadedCameraFootageInfo = [];

// For each camera conf item in the loadedCameraConfList,
// fetch the footage info from the URL provided in the camera conf
// and store it in the loadedCameraFootageInfo array.
export async function fetchAndStoreFootageInfo() {
    loadedCameraFootageInfo = []; // Reset the footage info array
    loadedCameraFootageInfoStatus = false; // Reset status

    const footageInfoPromises = loadedCameraConfList.map(async cameraConf => {
        if (cameraConf.footageInfoPath) {
            const info = await fetchFootageInfo(cameraConf.footageInfoPath);
            loadedCameraFootageInfo.push(info);
        } else {
            loadedCameraFootageInfo.push([]);
            return Promise.resolve();
        }
    });

    try {
        await Promise.all(footageInfoPromises);
        loadedCameraFootageInfoStatus = true;
        console.log('All footage info fetched and stored successfully.');
        console.log(loadedCameraFootageInfo)
    } catch (error) {
        loadedCameraFootageInfoStatus = false;
        console.error('Error fetching footage info:', error);
    }
}

export async function fetchFootageInfo(jsonUrl) {
    try {
        const response = await fetch(jsonUrl);
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
