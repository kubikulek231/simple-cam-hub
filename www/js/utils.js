export function createFlexSpacer() {
    const flexSpacer = document.createElement('div');
    flexSpacer.classList.add('flex-spacer');
    return flexSpacer;
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

export function getCurrentDateTimeInWords() {
    const now = new Date();

    // Use Intl.DateTimeFormat with default browser locale
    const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now); // e.g., "Monday"
    const monthName = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now); // e.g., "October"
    const day = now.getDate(); // e.g., 6
    const year = now.getFullYear(); // e.g., 2024

    // Get time components and format them
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0'); 
    
    // Construct the final string in words
    const dateInWords = `${dayName} ${day}. ${monthName} ${year}`;

    return dateInWords + ", " + hours + ":" + minutes;
}