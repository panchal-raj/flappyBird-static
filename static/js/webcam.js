// flappyWeb/static/js/webcam.js

let videoStream = null;
let videoElement = null; // Will hold the reference to the <video id="webcam">
let webcamContainer = null; // Will hold the reference to <div id="webcam-container">

/**
 * Initializes the webcam.
 * Gets user media and assigns it to the video element from index.html.
 * Does NOT show the webcam-container by default.
 * @returns {Promise<MediaStream|null>} A promise that resolves with the MediaStream if successful, or null otherwise.
 */
export async function initWebcam() {
    // Get the video element and its container from the DOM if not already set
    if (!videoElement) {
        videoElement = document.getElementById('webcam');
    }
    if (!webcamContainer) {
        webcamContainer = document.getElementById('webcam-container');
    }

    if (!videoElement) {
        console.error("Webcam video element (#webcam) not found in the DOM.");
        return null;
    }
    // webcamContainer is optional for init, but needed for show/hide helpers
    if (!webcamContainer) {
        console.warn("Webcam container element (#webcam-container) not found. Visibility cannot be controlled.");
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported in this browser.");
        alert("Sorry, your browser doesn't support webcam access.");
        return null;
    }

    // If a stream already exists and is active, return it to prevent re-initialization
    if (videoStream && videoStream.active) {
        console.log("Webcam stream already active.");
        return videoStream;
    }

    try {
        console.log("Attempting to get user media for webcam...");
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 240 },
                height: { ideal: 180 },
                frameRate: { ideal: 10 }
            },
            audio: false
        });

        if (videoStream) {
            console.log("Webcam stream obtained.");
            videoElement.srcObject = videoStream;
            // Ensure video plays (needed for some browsers, autoplay might not be enough)
            await new Promise((resolve, reject) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        console.log(`Webcam initialized and playing: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                        resolve();
                    }).catch(e => {
                        console.error("Error auto-playing video:", e);
                        reject(e);
                    });
                };
                videoElement.onerror = (e) => {
                    console.error("Error loading video metadata:", e);
                    reject(e);
                }
            });
            // DO NOT show the webcam container here by default.
            // It will be shown explicitly when needed (e.g., for calibration).
            return videoStream;
        }
    } catch (err) {
        console.error("Error accessing webcam:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            alert("Webcam access was denied. Please allow access in your browser settings and refresh.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            alert("No webcam was found. Please ensure a webcam is connected and enabled.");
        } else {
            alert("Could not access the webcam. Error: " + err.message);
        }
        videoStream = null; // Ensure stream is null on error
        return null;
    }
    return null;
}

/**
 * Stops the webcam stream and hides the webcam container.
 */
export function stopWebcam() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        console.log("Webcam stream stopped.");
    }
    videoStream = null; // Clear the stream reference
    if (videoElement) {
        videoElement.srcObject = null; // Remove stream from video element
    }
    hideWebcamElement(); // Always hide the container when stopping
}

/**
 * Shows the webcam container element.
 */
export function showWebcamElement() {
    if (!webcamContainer) webcamContainer = document.getElementById('webcam-container');
    if (webcamContainer) {
        webcamContainer.style.display = 'block';
        console.log("Webcam container shown.");
    } else {
        console.warn("Webcam container not found, cannot show it.");
    }
}

/**
 * Hides the webcam container element.
 * Note: This does not stop the video stream, only hides the element.
 */
export function hideWebcamElement() {
    if (!webcamContainer) webcamContainer = document.getElementById('webcam-container');
    if (webcamContainer) {
        // --- EDIT START ---
        // Only hide and log if it's not already hidden
        if (webcamContainer.style.display === 'none') {
            return; 
        }
        webcamContainer.style.display = 'none';
        console.log("Webcam container hidden.");
        // --- EDIT END ---
    } else {
        console.warn("Webcam container not found, cannot hide it.");
    }
}


/**
 * Draws the current webcam frame onto the canvas.
 * This is intended for use on the calibration screen.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The game canvas element.
 */
export function drawWebcamBackground(ctx, canvas) {
    if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && videoElement.videoWidth > 0) {
        // Simple draw, adjust as needed for mirroring or aspect ratio
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback display if webcam isn't ready
        ctx.fillStyle = 'rgb(50, 50, 50)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = "18px Arial";
        ctx.fillText("Webcam loading or not available...", canvas.width / 2, canvas.height / 2);
    }
}

/**
 * Checks if the webcam is initialized, the stream is active, and the video is playing.
 * @returns {boolean} True if the webcam is ready, false otherwise.
 */
export function isWebcamReady() {
    return !!(videoElement && videoStream && videoStream.active && videoElement.readyState >= videoElement.HAVE_METADATA && !videoElement.paused);
}

/**
 * Gets the HTMLVideoElement used for the webcam feed.
 * @returns {HTMLVideoElement|null} The video element, or null if not initialized.
 */
export function getVideoElement() {
    if (!videoElement) { // Fallback if not initialized via initWebcam yet
        videoElement = document.getElementById('webcam');
    }
    return videoElement;
}