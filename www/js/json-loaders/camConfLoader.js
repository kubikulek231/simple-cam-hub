const CAM_JSON_CONF = "json/cams.json";

export var loadedCameraConfList = [];

// Function to fetch and return camera settings from the JSON configuration
function parseCameraConf() {
    return fetch(CAM_JSON_CONF)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse JSON
        })
        .then(data => {
            return data.cameras; // Return the list of cameras
        })
        .catch(error => {
            console.error('Error fetching the cameras configuration:', error);
            return null; // Return null in case of an error
        });
}

export function loadCameraConf() {
    return parseCameraConf()
        .then(cameras => {
            if (cameras) {
                loadedCameraConfList = cameras; // Assign the fetched camera configurations to loadedCameraConfList
                console.log('Camera configuration successfully loaded.');
                return true; // Return true on success
            } else {
                console.error('Error while loading camera configuration:', error);
                return false; // Return false if there was an error parsing the configuration
            }
        })
        .catch(error => {
            console.error('Error while loading camera configuration:', error);
            return false; // Return false if there was an error
        });
}
