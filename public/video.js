// Select DOM elements
const video = document.getElementById("video");
const playPauseBtn = document.getElementById("play-pause");
const progressBar = document.getElementById("progress-bar");
const currentTimeElem = document.getElementById("current-time");
const durationElem = document.getElementById("duration");
const muteBtn = document.getElementById("mute");
const volumeSlider = document.getElementById("volume");
const loadingElem = document.getElementById("loading");
const fullscreenBtn = document.getElementById("fullscreen");
const rewindBtn = document.getElementById("rewind");
const forwardBtn = document.getElementById("forward");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const soundIcon = document.getElementById("sound-icon");
const muteIcon = document.getElementById("mute-icon");
const videoPlayer = document.getElementById("video-player");

const socket = io(); // Initialize socket.io connection

// Prompt for the user's name if not already stored
let userName = localStorage.getItem("userName");
if (!userName) {
  userName = prompt("Enter your name:");
  if (userName) {
    localStorage.setItem("userName", userName);
    socket.emit("setName", userName); // Send the name to the server
  }
} else {
  socket.emit("setName", userName); // Send the stored name to the server
}

// Handle synchronization actions from the server
socket.on("make", (data) => {
  controls.style.display = "none";
  loadingElem.style.display = "block"; // Show loading for all users
  video.pause();
  video.currentTime = data.time;
  socket.emit("ok", data); // Acknowledge the action
});

// Handle synchronization completion
socket.on("allOk", (data) => {
  loadingElem.style.display = "none"; // Hide loading for all users
  controls.style.display = "flex";
  if (data.action === "play") {
    video.play(); // Resume playback
    playIcon.style.opacity = "0";
    pauseIcon.style.opacity = "1";
  } else {
    video.pause(); // Pause the video
    playIcon.style.opacity = "1";
    pauseIcon.style.opacity = "0";
  }
});

// Display notifications (e.g., user connected/disconnected)
function showNotification(message, color) {
  const notificationContainer = document.getElementById("notification-container");
  if (!notificationContainer) {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "1000";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }

  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.backgroundColor = color;
  notification.style.color = "white";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "5px";
  notification.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  notification.style.animation = "fadeOut 3s forwards";
  document.getElementById("notification-container").appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add fade-out animation for notifications
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeOut {
    0% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);

// Listen for notifications from the server
socket.on("notification", (data) => {
  showNotification(data.message, data.color);
});

// Format time in minutes:seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// Get the current video state (play/pause and time)
function getVideoData() {
  return {
    action: video.paused ? "pause" : "play",
    time: video.currentTime,
  };
}

// Rewind the video by 10 seconds
rewindBtn.addEventListener("click", () => {
  video.currentTime = Math.max(0, video.currentTime - 10);
  socket.emit("action", getVideoData());
});

// Fast forward the video by 10 seconds
forwardBtn.addEventListener("click", () => {
  video.currentTime = Math.min(video.duration, video.currentTime + 10);
  socket.emit("action", getVideoData());
});

// Toggle play/pause
playPauseBtn.addEventListener("click", () => {
  if (video.paused) {
    video.play();
    socket.emit("action", getVideoData());
    playIcon.style.opacity = "0";
    pauseIcon.style.opacity = "1";
  } else {
    video.pause();
    socket.emit("action", getVideoData());
    playIcon.style.opacity = "1";
    pauseIcon.style.opacity = "0";
  }
});

// Toggle play/pause by clicking on the video
video.addEventListener("click", () => {
  playPauseBtn.click();
});

// Add keyboard shortcut for play/pause
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault(); // Prevent scrolling
    playPauseBtn.click();
  }
});

// Update progress bar and current time display
let isDragging = false;

video.addEventListener("timeupdate", () => {
  if (!isDragging) {
    progressBar.value = (video.currentTime / video.duration) * 100;
    currentTimeElem.textContent = formatTime(video.currentTime);
  }
});

// Update video time while dragging the progress bar
progressBar.addEventListener("input", () => {
  isDragging = true;
  currentTimeElem.textContent = formatTime(
    (progressBar.value / 100) * video.duration
  );
});

// Seek to a specific time when progress bar is released
progressBar.addEventListener("change", () => {
  video.currentTime = (progressBar.value / 100) * video.duration;
  isDragging = false;
  socket.emit("action", getVideoData());
});

// Initialize video duration display
video.addEventListener("loadedmetadata", () => {
  durationElem.textContent = formatTime(video.duration);
  progressBar.value = 0;
  currentTimeElem.textContent = "0:00";
});

// Reset progress bar when loading a new video
video.addEventListener("loadstart", () => {
  progressBar.value = 0;
  currentTimeElem.textContent = "0:00";
});

// Restore saved volume settings
const savedVolume = localStorage.getItem("videoVolume");
if (savedVolume !== null) {
  video.volume = savedVolume;
  volumeSlider.value = savedVolume * 100;
}

// Adjust volume and save the setting
volumeSlider.addEventListener("input", () => {
  const newVolume = volumeSlider.value / 100;
  video.volume = newVolume;
  localStorage.setItem("videoVolume", newVolume);
});

// Toggle mute/unmute
muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  if (video.muted) {
    soundIcon.style.display = "none";
    muteIcon.style.display = "block";
    localStorage.setItem("videoMuted", "true");
  } else {
    soundIcon.style.display = "block";
    muteIcon.style.display = "none";
    localStorage.setItem("videoMuted", "false");
  }
});

// Restore mute state on page load
const savedMuted = localStorage.getItem("videoMuted");
if (savedMuted === "true") {
  video.muted = true;
  soundIcon.style.display = "none";
  muteIcon.style.display = "block";
}

// Show/hide controls on hover
let hideControlsTimeout;

function showControls() {
  controls.style.opacity = "1";
  controls.style.visibility = "visible";
  if (hideControlsTimeout) {
    clearTimeout(hideControlsTimeout);
  }
  hideControlsTimeout = setTimeout(hideControls, 3000);
}

function hideControls() {
  controls.style.opacity = "0";
  controls.style.visibility = "hidden";
}

videoPlayer.addEventListener("mousemove", showControls);
videoPlayer.addEventListener("mouseleave", hideControls);

// Handle fullscreen mode
let isFullscreen = false;

function enterFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function handleFullscreenChange() {
  isFullscreen =
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement;

  if (isFullscreen) {
    videoPlayer.classList.add("fullscreen");
  } else {
    videoPlayer.classList.remove("fullscreen");
  }
}

// Listen for fullscreen changes
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);

// Exit fullscreen on Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isFullscreen) {
    exitFullscreen();
  }
});

// Toggle fullscreen mode
fullscreenBtn.addEventListener("click", () => {
  if (!isFullscreen) {
    enterFullscreen(videoPlayer);
  } else {
    exitFullscreen();
  }
});
