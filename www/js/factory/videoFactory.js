export function createStoredVideo(videoSource, videoType = 'video/mp4; codecs="hev1"') {
    // Create video element
    const video = document.createElement('video');
    video.muted = true;  // Set to true if autoplay is needed

    // Disable default controls to implement custom ones
    video.controls = false;

    // Set the video source
    const source = document.createElement('source');
    source.src = videoSource;
    source.type = videoType;
    video.appendChild(source);

    // Create custom controls container
    const controls = document.createElement('div');
    controls.classList.add('controls-container');
    
    // Create progress bar wrapper
    const progressBarWrapper = document.createElement('div');
    progressBarWrapper.className = 'progress-wrapper';

    // Create progress bar container
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-container';

    // Create progress bar (the red bar)
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = '0%';  // Initial width (starts empty)
    progressBarContainer.appendChild(progressBar);
    // Create a circle to highlight the current position
    const currentPositionCircle = document.createElement('div');
    currentPositionCircle.classList.add('position-circle');
    progressBar.appendChild(currentPositionCircle);

    progressBarWrapper.appendChild(progressBarContainer)

    // Append the progress bar to the controls
    controls.appendChild(progressBarWrapper);

    // Create a timestamp display
    const timestampContainer = document.createElement('div');
    timestampContainer.classList.add('video-timestamp-container');
    const timestampHeader = document.createElement('div');
    timestampHeader.classList.add('video-timestamp-header');
    timestampHeader.textContent = "Přehráno: "
    const timestampDisplay = document.createElement('div');
    timestampDisplay.classList.add('video-timestamp-content');

    // Add event listener to update the progress bar, circle position, and timestamp as the video plays
    video.addEventListener('timeupdate', function () {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = percent + '%';
        
        // Update the timestamp display
        const currentTime = formatTime(video.currentTime);
        const totalDuration = formatTime(video.duration);
        timestampDisplay.textContent = `${currentTime} / ${totalDuration}`;
    });

    // Add event listener to handle clicks on the progress bar
    progressBarContainer.addEventListener('click', function (event) {
        const rect = progressBarContainer.getBoundingClientRect(); // Get size and position of the bar
        const offsetX = event.clientX - rect.left; // Calculate click position relative to the container
        const newTime = (offsetX / rect.width) * video.duration; // Calculate corresponding time in the video
        video.currentTime = newTime; // Seek the video to the new time
    });

    // Create STOP and RESUME buttons
    const stopButton = document.createElement('button');
    stopButton.textContent = 'ZASTAVIT';
    stopButton.classList.add("button-stop");
    stopButton.addEventListener('click', function () {
        video.pause(); // Pauses the video
    });

    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'POKRAČOVAT';
    resumeButton.classList.add("button-resume");
    resumeButton.addEventListener('click', function () {
        video.play(); // Resumes the video
    });

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'ULOŽIT DO POČÍTAČE';
    downloadButton.classList.add("button-download");
    // Add an event listener to handle the download
    downloadButton.addEventListener('click', function () {
        const videoUrl = videoSource;  // Replace with your video URL
        downloadVideo(videoUrl);
    });

    const flexSpacer = document.createElement("div");
    flexSpacer.classList.add("flex-spacer");
    
    // Append the button to the body or another container
    document.body.appendChild(downloadButton);

    // Create a button container and append STOP and RESUME buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add("resume-stop-time-container");
    buttonContainer.appendChild(stopButton);
    buttonContainer.appendChild(resumeButton);
    timestampContainer.appendChild(timestampHeader);
    timestampContainer.appendChild(timestampDisplay); // Append to controls
    buttonContainer.appendChild(timestampContainer);
    buttonContainer.appendChild(flexSpacer);
    buttonContainer.appendChild(downloadButton);
    controls.appendChild(buttonContainer);
    

    // Optional: Play video when metadata is loaded
    video.addEventListener('loadedmetadata', function () {
        video.play();
    });

    // Wrap everything in a container
    const videoContainer = document.createElement('div');
    videoContainer.classList.add("video-container");
    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add("video-wrapper");
    videoWrapper.appendChild(video);
    videoContainer.appendChild(videoWrapper);
    videoContainer.appendChild(controls);

    // Return the container, which includes the video, custom controls, and buttons
    return videoContainer;
}

// Download video function
function downloadVideo(videoUrl) {
    // Create an anchor element
    const a = document.createElement('a');
    
    // Set the href to the video URL
    a.href = videoUrl;

    // Set the download attribute without specifying a custom filename
    a.download = '';  // Empty string will use the file's original name

    // Append the anchor to the body
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);
}


// Function to format time in HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function createStreamedVideo(videoSource, controls = true, videoType = 'application/vnd.apple.mpegurl') {
    const video = document.createElement('video');
    video.controls = controls;  // Enable browser default controls
    video.muted = true;

    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add("video-wrapper");
    videoWrapper.appendChild(video);

    // Check if HLS is supported by the browser via Hls.js
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSource);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play(); // Start video after manifest is parsed
        });
    } else if (video.canPlayType(videoType)) {
        // If HLS is natively supported (e.g., Safari)
        video.src = videoSource;
        video.addEventListener('loadedmetadata', function () {
            video.play();  // Start video after metadata is loaded
        });
    } else {
        console.error('HLS is not supported in this browser.');
    }

    return videoWrapper;
}