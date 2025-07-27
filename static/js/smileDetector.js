// // file: flappyWeb/static/js/smileDetector.js

// import { handleSmileJump } from './utils/input.js';
// import { getVideoElement } from './webcam.js';

// let faceMesh;
// let lastSmileScore = 0;
// // This threshold can be adjusted during a calibration step.
// let smileThreshold = 4.5; 

// let faceApiLoaded = false;

// // Function to load the MediaPipe model
// export async function loadModels() {
//     if (faceApiLoaded) return;
//     faceMesh = new FaceMesh({locateFile: (file) => {
//       return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
//     }});
//     faceMesh.setOptions({
//       maxNumFaces: 1,
//       refineLandmarks: true,
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5
//     });
//     faceMesh.onResults(onResults);
//     faceApiLoaded = true;
//     console.log("MediaPipe FaceMesh model loaded.");
// }

// // Callback function to process detection results
// function onResults(results) {
//     if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
//         const landmarks = results.multiFaceLandmarks[0];
        
//         const p1 = landmarks[61];  // Left mouth corner
//         const p2 = landmarks[291]; // Right mouth corner
//         const p3 = landmarks[0];   // Top lip
//         const p4 = landmarks[17];  // Bottom lip

//         const mouthWidth = Math.hypot(p1.x - p2.x, p1.y - p2.y);
//         const mouthHeight = Math.hypot(p3.x - p4.x, p3.y - p4.y);

//         if (mouthHeight > 0.01) { // Avoid division by zero
//            lastSmileScore = mouthWidth / mouthHeight;
//         }

//         // Trigger a jump if the smile score exceeds the threshold
//         if (lastSmileScore > smileThreshold) {
//             handleSmileJump();
//         }
//     } else {
//         lastSmileScore = 0;
//     }
// }

// // Function to send the current video frame to the model for processing
// export async function detectSmile() {
//     const videoElement = getVideoElement();
//     if (faceMesh && videoElement && videoElement.readyState >= 4) {
//         await faceMesh.send({image: videoElement});
//     }
// }

// // Export a function to get the current score for calibration UI
// export function getSmileValue() {
//     return lastSmileScore;
// }

// export function setSmileThreshold(newThreshold) {
//     console.log(`Setting new smile threshold to: ${newThreshold}`);
//     smileThreshold = newThreshold;
// }

// export { faceApiLoaded };

// // Functions no longer needed with this approach but exported to avoid breaking imports elsewhere.
// // You can clean these up later.
// export function startSmileUpdates() {}
// export function stopSmileUpdates() {}
// export function setSmileCalibrated() {}




// file: flappyWeb/static/js/smileDetector.js

import { handleSmileJump } from './utils/input.js';
import { getVideoElement } from './webcam.js';

// The MediaPipe FaceMesh instance.
let faceMesh;
// Stores the smoothed smile score from the last frame to ensure stable detection.
let lastSmileScore = 0;
// The score a user must exceed to trigger a jump. This is set during calibration.
let smileThreshold = 4.5;
// A constant that controls the "heaviness" of the smoothing filter.
// A higher value makes the score more stable but less responsive.
const SMOOTHING_FACTOR = 0.7;
// A flag to track if the MediaPipe models have been loaded.
let faceApiLoaded = false;

/**
 * Loads and configures the MediaPipe FaceMesh model.
 */
export async function loadModels() {
    if (faceApiLoaded) return;
    faceMesh = new FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });
    faceMesh.setOptions({
        maxNumFaces: 1, // Detect only one face for performance.
        refineLandmarks: true, // Get more detailed landmarks (like pupils).
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    // Set the callback function to run when results are available.
    faceMesh.onResults(onResults);
    faceApiLoaded = true;
    console.log("MediaPipe FaceMesh model loaded.");
}

/**
 * Helper function to calculate the Euclidean distance between two 2D points.
 * @param {object} p1 - The first landmark with x and y properties.
 * @param {object} p2 - The second landmark with x and y properties.
 * @returns {number} The distance between the two points.
 */
function getDistance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * The primary callback function that processes face landmarks.
 * This runs every time the model processes a video frame.
 * @param {object} results - The output from the MediaPipe FaceMesh model.
 */
function onResults(results) {
    // Start with a base score of 0 for the current frame.
    let newSmileScore = 0;

    // Check if any faces were detected.
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // --- Robust Smile Calculation ---

        // 1. Define key landmarks for a more robust calculation.
        const leftEye = landmarks[33];   // Left eye outer corner.
        const rightEye = landmarks[263]; // Right eye outer corner.
        const leftMouthCorner = landmarks[61];
        const rightMouthCorner = landmarks[291];
        const upperLip = landmarks[0];   // Top of the mouth.
        const lowerLip = landmarks[17];  // Bottom of the mouth.

        // 2. Calculate a normalization factor (the distance between the eyes).
        // This makes the detection robust to changes in the user's distance from the camera.
        const eyeDistance = getDistance(leftEye, rightEye);

        // 3. Proceed only if the face is detected clearly and is of a reasonable size.
        if (eyeDistance > 0.05) {
            // 4. Calculate the normalized width of the mouth.
            const mouthWidth = getDistance(leftMouthCorner, rightMouthCorner);
            const normalizedMouthWidth = mouthWidth / eyeDistance;

            // 5. Calculate the smile "uplift". This is the key metric for a true smile.
            // It measures how much the mouth corners are pulled upwards relative to the mouth's vertical center.
            const mouthCenterY = (upperLip.y + lowerLip.y) / 2;
            const cornerUplift = (mouthCenterY - leftMouthCorner.y) + (mouthCenterY - rightMouthCorner.y);
            const normalizedUplift = cornerUplift / eyeDistance;

            // 6. Combine metrics into a final score.
            // We only consider positive uplift (a smile, not a frown) and heavily weight it.
            const upliftScore = Math.max(0, normalizedUplift);
            newSmileScore = (normalizedMouthWidth * 0.5) + (upliftScore * 2.5);
        }
    }

    // --- Score Smoothing ---

    // 7. Apply an exponential moving average to smooth the score.
    // This prevents erratic jumps from detection flickers and stabilizes the output.
    // If no face is detected, newSmileScore is 0, which will smoothly pull the score down.
    if (lastSmileScore === 0) {
        // For immediate responsiveness when a smile starts, jump directly to the new score.
        lastSmileScore = newSmileScore;
    } else {
        // Otherwise, smoothly transition from the old score to the new one.
        lastSmileScore = (lastSmileScore * SMOOTHING_FACTOR) + (newSmileScore * (1 - SMOOTHING_FACTOR));
    }

    // --- Action ---

    // 8. Trigger a jump if the final, smoothed score exceeds the calibrated threshold.
    if (lastSmileScore > smileThreshold) {
        handleSmileJump();
    }
}

/**
 * Sends the current video frame to the FaceMesh model for processing.
 * This is called repeatedly during calibration and gameplay.
 */
export async function detectSmile() {
    const videoElement = getVideoElement();
    if (faceMesh && videoElement && videoElement.readyState >= 4) {
        await faceMesh.send({ image: videoElement });
    }
}

/**
 * Returns the latest smile score. Used by the calibration UI to provide feedback.
 * @returns {number} The current smoothed smile score.
 */
export function getSmileValue() {
    return lastSmileScore;
}

/**
 * Sets the smile threshold. Called by the calibration process.
 * @param {number} newThreshold - The new threshold value.
 */
export function setSmileThreshold(newThreshold) {
    console.log(`Setting new smile threshold to: ${newThreshold}`);
    smileThreshold = newThreshold;
}

// Export the loaded flag for other modules to check.
export { faceApiLoaded };

// These functions are no longer needed with the new onResults logic,
// but are kept as empty exports to avoid breaking imports in other files.
export function startSmileUpdates() {}
export function stopSmileUpdates() {}
export function setSmileCalibrated() {}