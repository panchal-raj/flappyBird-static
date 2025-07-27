// file: flappyWeb/static/js/calibration.js

import { gameState } from './gameState.js';
import { drawWebcamBackground, initWebcam, isWebcamReady } from './webcam.js';
import { updateBirdPhysics, drawBird, drawGround } from './utils/rendering.js';
import { checkCollisions } from './utils/collisions.js';
// UPDATE IMPORTS: Remove unused functions and add detectSmile
import { loadModels as loadFaceModels, faceApiLoaded, getSmileValue, detectSmile, setSmileThreshold } from './smileDetector.js';
import { jump } from './utils/input.js';

let requestNextFrameCallback = null;
let scoreElement = null;
let livesElement = null;

// UPDATE THRESHOLD: Change to a ratio-based value suitable for MediaPipe
// const SMILE_JUMP_THRESHOLD = 1.8;

// ADD these variables to manage the calibration state
let calibrationState = 'AWAITING_START'; // States: AWAITING_START, CALIBRATING_NEUTRAL, CALIBRATING_SMILE, COMPLETE
let neutralReadings = [];
let smileReadings = [];
let stateStartTime = 0;
const CALIBRATION_DURATION = 5000; // 5 seconds for each step

// ADD ASYNC: Make the loop asynchronous to use await
export async function calibrationLoop(ctx, canvas) {
    if (document.hidden) {
        if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
            requestNextFrameCallback(calibrationLoop);
        }
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWebcamBackground(ctx, canvas);

    if (gameState.running && gameState.calibrationMode) {
        await detectSmile();
        const currentSmileValue = getSmileValue();
        const instructionsElement = document.getElementById('calibration-instructions');
        document.getElementById('smile-intensity-value').textContent = currentSmileValue.toFixed(2);

        const elapsedTime = Date.now() - stateStartTime;
        const remainingTime = Math.max(0, (CALIBRATION_DURATION - elapsedTime) / 1000).toFixed(1);

        switch (calibrationState) {
            case 'AWAITING_START':
                instructionsElement.innerText = `Get Ready...\nCalibration will begin shortly.`;
                if (elapsedTime >= CALIBRATION_DURATION) {
                    calibrationState = 'CALIBRATING_NEUTRAL';
                    stateStartTime = Date.now();
                    neutralReadings = [];
                }
                break;

            case 'CALIBRATING_NEUTRAL':
                instructionsElement.innerText = `Keep a neutral face...\n${remainingTime}s`;
                if (currentSmileValue > 0) neutralReadings.push(currentSmileValue);
                if (elapsedTime >= CALIBRATION_DURATION) {
                    const avgNeutral = neutralReadings.length > 0 ? neutralReadings.reduce((a, b) => a + b, 0) / neutralReadings.length : 1.5;
                    window.avgNeutralScore = avgNeutral;
                    calibrationState = 'CALIBRATING_SMILE';
                    stateStartTime = Date.now();
                    smileReadings = [];
                }
                break;

            case 'CALIBRATING_SMILE':
                instructionsElement.innerText = `Now, smile widely!\n${remainingTime}s`;
                if (currentSmileValue > 0) smileReadings.push(currentSmileValue);
                if (elapsedTime >= CALIBRATION_DURATION) {
                    const avgSmile = smileReadings.length > 0 ? smileReadings.reduce((a, b) => a + b, 0) / smileReadings.length : (window.avgNeutralScore * 2);
                    const neutralScore = window.avgNeutralScore || 1.5;
                    const newThreshold = neutralScore + (avgSmile - neutralScore) * 0.4;
                    setSmileThreshold(newThreshold);
                    calibrationState = 'COMPLETE';
                    stateStartTime = Date.now();
                }
                break;

            case 'COMPLETE':
                instructionsElement.innerText = `Calibration Complete! Testing...\nRestarting cycle shortly.`;
                // After 5 seconds in the "COMPLETE" state, loop back to the beginning.
                if (elapsedTime >= CALIBRATION_DURATION) {
                    calibrationState = 'AWAITING_START';
                    stateStartTime = Date.now();
                }
                break;
        }

        // ... (Rendering logic from lines 62-70 remains the same)
        updateBirdPhysics();
        const hoverEffect = Math.sin(Date.now() / 200) * 0.5;
        gameState.bird.y += hoverEffect;
        checkCollisions(() => {});
        drawBird(ctx);
        gameState.groundPos = (gameState.groundPos - (gameState.speed || 0.5)) % 24;
        drawGround(ctx, canvas);
    }

    if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
        requestNextFrameCallback(calibrationLoop);
    }
}


export async function startCalibrationScreen(ctx, canvas, startLoopFunc, requestFrameFunc) {
    console.log("Starting calibration screen (with smile jump and ground hover)...");

    if (!scoreElement) scoreElement = document.getElementById('score-display');
    if (!livesElement) livesElement = document.getElementById('lives-display');
    if (scoreElement) scoreElement.style.display = 'none';
    if (livesElement) livesElement.style.display = 'none';

    if (!isWebcamReady()) {
        console.log("Webcam not ready, attempting to initialize for calibration...");
        await initWebcam();
        if (!isWebcamReady()) {
            alert("Webcam could not be started. Calibration screen will show fallback background.");
        }
    }

    if (typeof loadFaceModels === 'function' && !faceApiLoaded) {
        try {
            await loadFaceModels();
            console.log("Face models loaded for calibration.");
        } catch (error) {
            console.error("Failed to load face models for calibration:", error);
            alert("Could not load smile detection models. Calibration might not work as expected.");
        }
    }
    
    // Set the initial state for the continuous calibration cycle
    calibrationState = 'AWAITING_START';
    stateStartTime = Date.now();
    neutralReadings = [];
    smileReadings = [];

    requestNextFrameCallback = requestFrameFunc;

    gameState.running = true;
    gameState.calibrationMode = true;
    gameState.pipes = [];
    gameState.stars = [];
    gameState.bird.x = canvas.width * 0.25;
    gameState.bird.y = canvas.height / 2;
    gameState.bird.velocity = 0;

    startLoopFunc(calibrationLoop);
}


// export async function calibrationLoop(ctx, canvas) {
//     if (document.hidden) {
//         if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
//             requestNextFrameCallback(calibrationLoop);
//         }
//         return;
//     }
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     drawWebcamBackground(ctx, canvas);

//     if (gameState.running && gameState.calibrationMode) {
//         // ADD THIS LINE: Actively run detection on each frame for live feedback
//         await detectSmile();

//         updateBirdPhysics();

//         const currentSmileValue = getSmileValue();
//         // ADD THIS LINE: Update the UI with the live smile score
//         document.getElementById('smile-intensity-value').textContent = currentSmileValue.toFixed(2);

//         if (currentSmileValue > SMILE_JUMP_THRESHOLD) {
//             jump();
//         }

//         const hoverEffect = Math.sin(Date.now() / 200) * 0.5;
//         gameState.bird.y += hoverEffect;

//         checkCollisions(() => {});

//         drawBird(ctx);

//         gameState.groundPos = (gameState.groundPos - (gameState.speed || 0.5)) % 24;
//         drawGround(ctx, canvas);
//     }

//     if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
//         requestNextFrameCallback(calibrationLoop);
//     }
// }

// export async function startCalibrationScreen(ctx, canvas, startLoopFunc, requestFrameFunc) {
//     console.log("Starting calibration screen (with smile jump and ground hover)...");

//     if (!scoreElement) scoreElement = document.getElementById('score-display');
//     if (!livesElement) livesElement = document.getElementById('lives-display');
//     if (scoreElement) scoreElement.style.display = 'none';
//     if (livesElement) livesElement.style.display = 'none';

//     if (!isWebcamReady()) {
//         console.log("Webcam not ready, attempting to initialize for calibration...");
//         await initWebcam();
//         if (!isWebcamReady()) {
//             alert("Webcam could not be started. Calibration screen will show fallback background.");
//         }
//     }

//     if (typeof loadFaceModels === 'function' && !faceApiLoaded) {
//         try {
//             await loadFaceModels();
//             console.log("Face models loaded for calibration.");
//         } catch (error) {
//             console.error("Failed to load face models for calibration:", error);
//             alert("Could not load smile detection models. Calibration might not work as expected.");
//         }
//     }
//     requestNextFrameCallback = requestFrameFunc;

//     gameState.running = true;
//     gameState.calibrationMode = true;
//     gameState.pipes = [];
//     gameState.stars = [];
//     gameState.bird.x = canvas.width * 0.25;
//     gameState.bird.y = canvas.height / 2;
//     gameState.bird.velocity = 0;

//     startLoopFunc(calibrationLoop);
// }

export function stopCalibration() {
    gameState.calibrationMode = false;
    requestNextFrameCallback = null;
    console.log("Calibration stopped, cleaning up resources.");

    if (scoreElement) scoreElement.style.display = 'block';
    if (livesElement) livesElement.style.display = 'block';

    const inputMethod = localStorage.getItem('flappyInputMethod') || 'space';
    if (inputMethod !== 'smile' && inputMethod !== 'altitude') {
        setTimeout(() => {
            if (typeof cleanupWebcamResources === 'function') {
                cleanupWebcamResources(false);
            }
        }, 100);
    }
}