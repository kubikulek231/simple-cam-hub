import { createFlexSpacer } from "../utils.js";

export function createStoredVideo(videoSource, videoType = 'video/mp4') {
    const video = createVideoElement(videoSource, videoType);
    const controls = createCustomControls(video, videoSource);
  
    const videoContainer = document.createElement('div');
    videoContainer.classList.add("video-container");
  
    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add("video-wrapper");
    videoWrapper.appendChild(video);
    const videoFinishedOverlay = document.createElement('div');
    const videoFinishedHeader = document.createElement('div');
    videoFinishedHeader.classList.add("video-finished-header");
    videoFinishedOverlay.classList.add("video-finished-overlay");
    videoFinishedHeader.textContent = "Záznam přehrán!";
    videoFinishedOverlay.style.display = "none";

    video.addEventListener('ended', () => {
        videoFinishedOverlay.style.display = "flex";
      });
    
      video.addEventListener('play', () => {
        videoFinishedOverlay.style.display = "none";
      });

    videoFinishedOverlay.appendChild(createFlexSpacer());
    videoFinishedOverlay.appendChild(videoFinishedHeader);
    videoFinishedOverlay.appendChild(createFlexSpacer());
    videoWrapper.appendChild(videoFinishedOverlay);
    videoContainer.appendChild(videoWrapper);
    videoContainer.appendChild(controls);
  
    return videoContainer;
  }
  
  function createVideoElement(videoSource, videoType) {
    const video = document.createElement('video');
    video.controls = false;
    video.muted = true;
    video.src = videoSource;
    video.type = videoType;
    video.autoplay = true; // Ensure autoplay is set
  
    video.addEventListener('error', (event) => {
      console.error('Error loading video:', event);
    });
    // Start playback automatically
    video.play();
    return video;
  }
  
  function createCustomControls(video, videoSource) {
    const controls = document.createElement('div');
    controls.classList.add('controls-container');
  
    const progressBarWrapper = document.createElement('div');
    progressBarWrapper.className = 'progress-wrapper';
  
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-container';
  
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = '0%';
    progressBarContainer.appendChild(progressBar);

    const positionCircle = document.createElement('div');
    positionCircle.classList.add('position-circle'); 
    progressBar.appendChild(positionCircle);

    progressBarWrapper.appendChild(progressBarContainer);
    controls.appendChild(progressBarWrapper);
  
    // Add click-to-seek functionality on the progress bar container
    progressBarContainer.addEventListener('click', (event) => {
      const rect = progressBarContainer.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const percentage = offsetX / rect.width;
      const newTime = percentage * video.duration;
      video.currentTime = newTime;
      video.play(); // Resume playback from the new time
    });
  
    const timestampContainer = document.createElement('div');
    timestampContainer.classList.add('video-timestamp-container');
    const timestampHeader = document.createElement('div');
    timestampHeader.classList.add('video-timestamp-header');
    timestampHeader.textContent = "Přehráno: ";
    const timestampDisplay = document.createElement('div');
    timestampDisplay.classList.add('video-timestamp-content');
    timestampContainer.appendChild(timestampHeader);
    timestampContainer.appendChild(timestampDisplay);
  
    const stopButton = document.createElement('button');
    stopButton.textContent = '◼ ZASTAVIT';
    stopButton.classList.add("button-stop");
    stopButton.addEventListener('click', function () {
      video.pause();
      stopButton.disabled = true;
      resumeButton.disabled = false;
    });
  
    const resumeButton = document.createElement('button');
    resumeButton.textContent = '▶ POKRAČOVAT';
    resumeButton.classList.add("button-resume");
    resumeButton.disabled = true;
    resumeButton.addEventListener('click', function () {
      // If video ended, reset to the start
      if (video.ended) {
        video.currentTime = 0;
      }
      video.play();
      resumeButton.disabled = true;
      stopButton.disabled = false;
    });

    // Speed button
    const speedButton = document.createElement("button");
    speedButton.classList.add("button", "button-speed");
    speedButton.textContent = "1x";

    let currentSpeed = 1;

    speedButton.addEventListener("click", function() {
        // Use the video element passed to the function
        if (!video) return;

        // Cycle through speeds: 1x, 2x, 5x, 10x
        if (currentSpeed === 1) currentSpeed = 2;
        else if (currentSpeed === 2) currentSpeed = 5;
        else if (currentSpeed === 5) currentSpeed = 10;
        else if (currentSpeed === 10) currentSpeed = 20;
        else currentSpeed = 1;

        video.playbackRate = currentSpeed;
        speedButton.textContent = `${currentSpeed}x`;
    });

    const downloadButton = document.createElement('button');
    downloadButton.textContent = '💾 ULOŽIT DO POČÍTAČE';
    downloadButton.classList.add("button-download");
    downloadButton.addEventListener('click', function () {
      downloadVideo(videoSource);
    });
  
    video.addEventListener('timeupdate', function () {
      const percent = (video.currentTime / video.duration) * 100;
      progressBar.style.width = percent + '%';
  
      const currentTime = formatTime(video.currentTime);
      const totalDuration = formatTime(video.duration);
      timestampDisplay.textContent = `${currentTime} / ${totalDuration}`;
    });
  
    video.addEventListener('ended', () => {
      stopButton.disabled = true;
      resumeButton.disabled = false;
      resumeButton.textContent = '▶ PŘEHRÁT ZNOVU';
      positionCircle.style.display = "none";
    });
  
    video.addEventListener('play', () => {
      stopButton.disabled = false;
      resumeButton.disabled = true;
      // Reset the resume button text in case it was changed after video ended
      resumeButton.textContent = '▶ POKRAČOVAT';
      positionCircle.style.display = "block";
    });
  
    video.addEventListener('pause', () => {
      if (!video.ended) {
        stopButton.disabled = true;
        resumeButton.disabled = false;
      }
    });
  
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add("resume-stop-time-container");
    buttonContainer.appendChild(stopButton);
    buttonContainer.appendChild(resumeButton);
    buttonContainer.appendChild(speedButton);
    buttonContainer.appendChild(timestampContainer);

    buttonContainer.appendChild(createFlexSpacer());
    buttonContainer.appendChild(downloadButton);
  
    controls.appendChild(buttonContainer);
  
    return controls;
  }
  
  // Download video function
  function downloadVideo(videoUrl) {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = ''; // Use the file's original name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  // Function to format time in HH:MM:SS
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }