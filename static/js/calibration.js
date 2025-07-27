// file: flappyWeb/static/js/calibration.js

import { gameState } from './gameState.js';
import { drawWebcamBackground, initWebcam, isWebcamReady } from './webcam.js';
import { updateBirdPhysics, drawBird, drawGround } from './utils/rendering.js';
import { checkCollisions } from './utils/collisions.js';
import { loadModels as loadFaceModels, faceApiLoaded, getSmileValue, detectSmile, setSmileThreshold } from './smileDetector.js';
import { jump } from './utils/input.js';

let requestNextFrameCallback = null;
let scoreElement = null;
let livesElement = null;

let calibrationState = 'AWAITING_START'; // States: AWAITING_START, CALIBRATING_NEUTRAL, CALIBRATING_SMILE, COMPLETE
let neutralReadings = [];
let smileReadings = [];
let stateStartTime = 0;
const CALIBRATION_DURATION = 5000; // 5 seconds for each step
const COMPLETION_SCREEN_DURATION = 20000; // 20 seconds for the final test screen

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
                    const neutralScore = window.avgNeutralScore || 1.5;
                    const avgSmile = smileReadings.length > 0
                        ? smileReadings.reduce((a, b) => a + b, 0) / smileReadings.length
                        : 0; // Default to 0 if no smile was detected

                    // **FIXED LOGIC**: If the smile wasn't strong enough, set a very high threshold.
                    if (avgSmile < neutralScore * 1.5) {
                        console.warn("Smile intensity was too low. Setting a very high threshold to prevent accidental jumps.");
                        setSmileThreshold(5); // Set a practically very high threshold
                    } else {
                        // Otherwise, calculate the threshold normally.
                        const newThreshold = neutralScore + (avgSmile - neutralScore) * 0.4;
                        const finalThreshold = Math.max(newThreshold, 0.4);
                        setSmileThreshold(finalThreshold);
                    }

                    calibrationState = 'COMPLETE';
                    stateStartTime = Date.now();
                }
                break;

            case 'COMPLETE':
                const completionRemainingTime = Math.max(0, (COMPLETION_SCREEN_DURATION - elapsedTime) / 1000).toFixed(1);

                // **FIXED LOGIC**: Use the correct 'completionRemainingTime' variable for the countdown.
                instructionsElement.innerText = `Calibration Complete!\nTest your smile control now.\n\nIf you're happy with it, click 'Exit'.\nRestarting cycle in ${completionRemainingTime}s.`;

                if (elapsedTime >= COMPLETION_SCREEN_DURATION) {
                    calibrationState = 'AWAITING_START';
                    stateStartTime = Date.now();
                }
                break;
        }

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