// game.js - Main game file (core mechanics, initialization)

// Import core game state and settings
import { gameState, gameSettings, screens, updateScore, updateLivesDisplay } from './gameState.js';
// Import asset handling
import { assets, loadAssets, checkAssets, resizeCanvas } from './assets.js';
// Import game mode specifics (example: pipes)
import { handlePipesMode, applyPipesDifficulty } from './modes/pipes.js';
import { handleStarsMode, applyStarsDifficulty } from './modes/stars.js';
import { handlePipesAndStarsMode, applyPipesAndStarsDifficulty } from './modes/pipeStars.js';
// Import utility functions
import { checkCollisions } from './utils/collisions.js';
import { drawBackground, drawGround, drawBird, updateBirdPhysics } from './utils/rendering.js';
import { setupInputListeners } from './utils/input.js';
// Import webcam functions (ensure path is correct)
// drawWebcamBackground is primarily used by calibration.js
import { initWebcam, isWebcamReady, stopWebcam, showWebcamElement, hideWebcamElement, drawWebcamBackground } from './webcam.js';
// Import calibration functions (ensure path is correct)
import { startCalibrationScreen, stopCalibration} from './calibration.js';
// import { loadModels, faceApiLoaded, stopSmileUpdates } from './smileDetector.js';
import { loadModels, faceApiLoaded } from './smileDetector.js'; 
import { startSmileDetectionIfSelected, stopSmileDetection } from './utils/input.js';

// Add at the top of the file
const isLowEndDevice = navigator.deviceMemory < 4 || 
                      navigator.hardwareConcurrency < 4 ||
                      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Reduce visual effects on low-end devices
if (isLowEndDevice) {
  // Reduce animation frames for bird
  assets.bird = [assets.bird[0]]; // Just use one frame
  
  // Simplify background
  gameState.useSimpleBackground = true;
  
  // Reduce draw distance
  gameState.drawDistance = 300; // Only render objects within 300px
}

// Make game functions globally available (optional, useful for debugging)
window.gameLoaded = true;
window.startGame = startGame; // Expose startGame for HTML button
window.showScreen = showScreen; // Expose showScreen

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Animation frame ID for cancellation
let animationFrameId = null;

// --- Animation Loop Helper Functions ---

/**
 * Requests the next animation frame for a given loop function.
 * @param {Function} loopFunction - The function to call in the next frame.
 */
// function requestNextFrame(loopFunction) {
//     if (!ctx || !canvas) {
//         console.error("Canvas context or element is missing for requestNextFrame.");
//         stopLoop();
//         return;
//     }
//     animationFrameId = requestAnimationFrame(() => loopFunction(ctx, canvas));
// }

function requestNextFrame(callback) {
    animationFrameId = requestAnimationFrame(() => callback(ctx, canvas));
}

/**
 * Stops the current animation loop and starts a new one.
 * @param {Function} loopFunction - The loop function to start.
 */
function startLoop(loopFunction) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    console.log(`Starting loop: ${loopFunction.name}`);
    requestNextFrame(loopFunction);
}


function cleanupSmileResources() {
    // Stop any active smile detection
    if (typeof stopSmileUpdates === 'function') {
        stopSmileUpdates();
    }
    
    // Clear any smile-related timers or intervals
    if (window.smileUpdateInterval) {
        clearInterval(window.smileUpdateInterval);
        window.smileUpdateInterval = null;
    }
    
    // Reset any smile-related state
    if (gameState.smileIntensity) {
        gameState.smileIntensity = 0;
    }
}

/**
 * Stops the current animation loop.
 */
function stopLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("Animation loop stopped.");
    }
    
    // Only cleanup smile resources if we were using smile input
    if (gameSettings.inputMethod === 'smile' || gameSettings.inputMethod === 'altitude') {
        cleanupSmileResources();
    }
    
    if (gameState.calibrationMode) {
        stopCalibration();
    }
}

// --- Game Initialization ---

/**
 * Initializes the game: sets up screens, loads assets, sets up listeners.
 */
function initGame() {
    // The check for whether the game has run is now handled
    // by the DOMContentLoaded listener, so we remove it from here.

    console.log("Initializing game..."); // Keep this log

    screens.mainMenu = document.getElementById('main-menu');
    screens.game = document.getElementById('game-screen');
    screens.calibration = document.getElementById('calibration-screen');
    screens.gameOver = document.getElementById('game-over-screen');
    screens.pauseScreen = document.getElementById('pause-screen');

    loadAssets(() => {
        if (checkAssets()) {
            console.log("Assets verified successfully!");
            resizeCanvas(canvas, gameState);
            window.addEventListener('resize', () => resizeCanvas(canvas, gameState));
            setupInputListeners(canvas, showScreen, startGame, resumeGame); 
            initializeButtons(); // This will now be called correctly
            showScreen('mainMenu');
        } else {
            console.error("Failed to initialize game: Assets not loaded properly");
        }
    });
}

function resumeCalibration() {
    console.log("Resuming calibration.");
    gameState.running = true; // Allow calibration loop to run

    // Ensure the webcam video HTML element is visible if it was hidden
    if (isWebcamReady()) { // Check if webcam was initialized
         showWebcamElement(); // Make sure to import/have access to showWebcamElement from webcam.js
    }

    showScreen('game'); // Show the game screen again (where the canvas and calibration UI are)
                        // This should also make the #calibration-screen UI overlay visible if gameState.calibrationMode is true.

    // resumeCalibrationLoop (from calibration.js) is responsible for restarting
    // the animation loop that draws the webcam feed onto the canvas.
    resumeCalibrationLoop(startLoop);
}

/**
 * Sets up event listeners for UI buttons.
 */
function initializeButtons() {
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        // This startGame is the async function defined in this file
        startGame().catch(err => console.error("Error starting game:", err));
    });
    document.getElementById('play-again-btn')?.addEventListener('click', () => {
        startGame().catch(err => console.error("Error restarting game:", err));
    });

    // document.getElementById('pause-btn')?.addEventListener('click', () => {
    //     console.log("Pause button clicked.");
    //     // Pause the game loop
    //     gameState.running = false;
    //     // Show the pause screen
    //     showScreen('pauseScreen');
    // });
    document.getElementById('pause-btn')?.addEventListener('click', () => {
        console.log("Pause button clicked from game screen.");
        // If in calibration mode, this button should ideally be hidden or do nothing.
        // The hiding/showing is handled in showScreen.
        // If it's somehow clicked during calibration, it should not interfere.

        if (!gameState.calibrationMode) { // Only act if NOT in calibration mode
            if (gameState.running) { // If game is running, pause it
                console.log("Game paused.");
                gameState.running = false;
                showScreen('pauseScreen'); // Show the regular game pause screen
            } else { 
                // If game is not running (i.e., already paused), show pause screen again or resume.
                // Current logic: show pauseScreen again. This is fine.
                // If you have a resume mechanism on the pause screen, that will handle unpausing.
                console.log("Game is already paused. Showing pause screen.");
                showScreen('pauseScreen');
            }
        }
    });

    document.getElementById('back-to-menu-btn')?.addEventListener('click', () => {
        stopLoop();
        gameState.running = false;
        gameState.calibrationMode = false; // Ensure calibration mode is off
        showScreen('mainMenu'); // This will also handle stopping webcam
    });

    document.getElementById('pause-main-menu-btn')?.addEventListener('click', () => {
        stopLoop(); // Or appropriate pause logic
        gameState.running = false; // If exiting to menu
        gameState.calibrationMode = false; // Ensure calibration mode is off
        showScreen('mainMenu'); // This will also handle stopping webcam
    });



    // Calibration button logic
    document.getElementById('calibrate-btn')?.addEventListener('click', async function() { // Made async
        console.log("Calibrate button clicked.");
        try {
            // Ensure face models are loaded (smileDetector.js should export loadModels and faceApiLoaded)
            if (!faceApiLoaded) { // faceApiLoaded should be imported from smileDetector.js
                console.log("Models not loaded, attempting to load now...");
                await loadModels(); // This loadModels should be from smileDetector.js
            }

            if (!faceApiLoaded) {
                alert("Smile detection models could not be loaded. Calibration cannot start.");
                return;
            }

            // Attempt to initialize webcam. initWebcam is async.
            await initWebcam(); // Ensure initWebcam is awaited

            if (isWebcamReady()) {
                console.log("Webcam ready, starting calibration.");
                showWebcamElement();
                gameState.calibrationMode = true;
                showScreen('game');
                document.getElementById('calibration-screen').style.display = 'flex'; // Changed to flex as per CSS
                // startCalibrationScreen from calibration.js will use drawWebcamBackground on the canvas
                // It will also call startSmileUpdates
                startCalibrationScreen(ctx, canvas, startLoop, requestNextFrame);
            } else {
                console.warn("Webcam not ready for calibration. Check permissions or if a webcam is connected.");
                alert("Webcam could not be started. Please check browser permissions or ensure a webcam is connected.");
                stopWebcam();
                gameState.calibrationMode = false;
                showScreen('mainMenu');
            }
        } catch (err) {
            console.error("Error during calibration setup:", err);
            alert("An error occurred setting up calibration: " + err.message);
            stopWebcam();
            gameState.calibrationMode = false;
            showScreen('mainMenu');
        }
    });

    document.getElementById('exit-calibration-btn')?.addEventListener('click', () => {
        console.log("Calibration screen's dedicated exit button clicked.");
        // Ensure we are actually in calibration mode before acting
        if (gameState.calibrationMode) {
            stopLoop(); // Stop any active animation loop (e.g., webcam feed on canvas)
            gameState.running = false; // Set game state to not running
            gameState.calibrationMode = false; // Exit calibration mode
            
            if (isWebcamReady()) { // Check if webcam is active
                stopWebcam(); // Stop the webcam stream
            }
            hideWebcamElement(); // Ensure the webcam video element is hidden
            
            // Explicitly hide the calibration screen overlay itself
            if (screens.calibration) { // screens.calibration is document.getElementById('calibration-screen')
                screens.calibration.style.display = 'none';
            }
            
            showScreen('mainMenu'); // Go back to the main menu
        }
    });

    // Mode, difficulty, input selection buttons (existing logic)
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gameSettings.mode = btn.dataset.mode;
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gameSettings.difficulty = btn.dataset.difficulty;
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    document.querySelectorAll('.input-btn').forEach(btn => {
        // Exclude calibrate-btn from this general input selection logic if it also has 'input-btn' class
        if (btn.id === 'calibrate-btn') return;
        btn.addEventListener('click', () => {
            gameSettings.inputMethod = btn.dataset.input;
            document.querySelectorAll('.input-btn:not(#calibrate-btn)').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

                // ADD THIS LOGIC:
            // If the new input method is NOT smile, ensure smile updates are stopped.
            if (gameSettings.inputMethod !== 'smile') {
                if (typeof stopSmileUpdates === 'function') stopSmileUpdates();
                // Optionally, also call stopWebcam() if webcam should only be active for smile/altitude modes
                // However, calibration might also use the webcam, so be cautious here.
                stopWebcam(); // Consider the implications for calibration flow
        }
        });
    });
    // selectDefaultButtons();
}

/**
 * Adds the 'selected' class to buttons corresponding to the current game settings.
 */
// function selectDefaultButtons() {
//     document.querySelector(`.mode-btn[data-mode="${gameSettings.mode}"]`)?.classList.add('selected');
//     document.querySelector(`.difficulty-btn[data-difficulty="${gameSettings.difficulty}"]`)?.classList.add('selected');
//     // Ensure calibrate button doesn't get 'selected' by this if it shares 'input-btn'
//     document.querySelector(`.input-btn[data-input="${gameSettings.inputMethod}"]:not(#calibrate-btn)`)?.classList.add('selected');
// }

/**
 * Shows the specified screen and hides others. Manages webcam visibility.
 * @param {string} screenName - The key ('mainMenu', 'game', 'gameOver', etc.) of the screen to show.
 */

// Replace the entire old showScreen function with this new one

function showScreen(screenName) {
    console.log(`Showing screen: ${screenName}`);

    // Hide all primary screen containers first
    Object.values(screens).forEach(screen => {
        if (screen) screen.style.display = 'none';
    });

    // Get the main screen to show
    const screenToShow = screens[screenName];
    if (screenToShow) {
        screenToShow.style.display = 'block'; // Or 'flex' if needed
    } else {
        console.error(`Screen '${screenName}' not found!`);
        return; // Exit if screen doesn't exist
    }

    const pauseButton = document.getElementById('pause-btn');

    // Now, handle the specific logic for each screen cleanly
    switch (screenName) {
        case 'mainMenu':
            // On the main menu, stop all webcam activity completely.
            if (typeof stopSmileUpdates === 'function') stopSmileUpdates();
            stopWebcam(); // This will hide the webcam element.
            gameState.calibrationMode = false;
            if (pauseButton) pauseButton.style.display = 'none';
            break;

        case 'game':
            // The 'game' screen hosts the canvas for gameplay AND calibration
            if (gameState.calibrationMode) {
                // CALIBRATION MODE: Show webcam, show calibration UI, hide pause button
                if (isWebcamReady()) showWebcamElement();
                if (screens.calibration) screens.calibration.style.display = 'flex';
                if (pauseButton) pauseButton.style.display = 'none';
            } else {
                // NORMAL GAMEPLAY: Hide webcam element, hide calibration UI, show pause button
                hideWebcamElement();
                if (screens.calibration) screens.calibration.style.display = 'none';
                if (pauseButton) pauseButton.style.display = 'block';
            }
            break;

        case 'gameOver':
        case 'pauseScreen':
            // On game over or pause, stop smile detection and hide the webcam element.
            // We don't call stopWebcam() entirely in case user wants to resume a smile-based game.
            if (typeof stopSmileUpdates === 'function') stopSmileUpdates();
            hideWebcamElement();
            if (pauseButton) pauseButton.style.display = 'none';
            if (screens.calibration) screens.calibration.style.display = 'none';
            stopSmileDetection(); 
            break;

        default:
            // For any other screen, ensure webcam is hidden and pause button is not shown
            hideWebcamElement();
            if (pauseButton) pauseButton.style.display = 'none';
            break;
    }
}

// function showScreen(screenName) {
//     console.log(`Showing screen: ${screenName}`);
//     // Hide all primary screen containers
//     Object.keys(screens).forEach(key => {
//         if (screens[key] && key !== 'calibration') { // Don't hide calibration screen div yet
//              screens[key].style.display = 'none';
//         }
//     });
//      // Specifically hide calibration UI unless we are in calibration mode on 'game' screen
//     if (screens.calibration) {
//         screens.calibration.style.display = 'none';
//     }


//     // Show the requested primary screen
//     const screenToShow = screens[screenName];
//     if (screenToShow) {
//         screenToShow.style.display = 'block'; // Or 'flex', 'grid' depending on CSS
//     } else {
//         console.error(`Screen '${screenName}' not found in screens object!`);
//     }

//     // --- Webcam and specific screen logic ---
//     if (screenName === 'mainMenu') {
//         stopWebcam(); // Stop webcam stream AND hide its container
//         gameState.calibrationMode = false; // Ensure calibration mode is off
//         if (typeof stopSmileUpdates === 'function') stopSmileUpdates();
//     } else if (screenName === 'game') {
//         // The 'game' screen hosts the canvas for both gameplay and calibration.
//         if (gameState.calibrationMode) {
//             // If in calibration mode, webcam container should be visible (handled by calibrate-btn click)
//             // and calibration UI elements should be visible.
//             if(screens.calibration) screens.calibration.style.display = 'block'; // Show calibration text, timer etc.
//         } else {
//             // If NOT in calibration mode (i.e., actual gameplay):
//             // Hide the webcam container. The stream might be active for smile detection,
//             // but the <video> element itself is not shown.
//             hideWebcamElement();
//             if(screens.calibration) screens.calibration.style.display = 'none'; // Hide calibration text
//         }
//     } else if (screenName === 'gameOver' || screenName === 'pauseScreen') {
//         // For game over or pause, hide webcam container.
//         // Stop stream if not using smile input, as it might be restarted.
//         if (gameSettings.inputMethod !== 'smile' && gameSettings.inputMethod !== 'altitude') {
//             stopWebcam();
//         } else {
//             hideWebcamElement(); // Keep stream for face-api if smile input, but hide element
//         }
//         if(screens.calibration) screens.calibration.style.display = 'none';
//         if (typeof stopSmileUpdates === 'function') stopSmileUpdates();
//     }

//     // Ensure the game canvas container is visible if showing 'game' screen (for canvas operations)
//     // The 'game' screen div itself should handle this, but being explicit for the canvas parent:
//     const pauseButton = document.getElementById('pause-btn'); 

//     if (screenName === 'game') {
//         if (gameState.calibrationMode) {
//             // CALIBRATION MODE on game screen
//             if (isWebcamReady()) {
//                 showWebcamElement(); // Webcam video element might be visible for calibration
//             }
//             if (screens.calibration) {
//                 // Use 'flex' to enable centering of #calibration-ui-elements
//                 screens.calibration.style.display = 'flex'; 
//             }
//             if (pauseButton) {
//                 pauseButton.style.display = 'none'; // HIDE the main pause button
//             }
//         } else {
//             // REGULAR GAMEPLAY on game screen
//             hideWebcamElement(); // Hide webcam video element during actual gameplay
//             if (screens.calibration) {
//                 screens.calibration.style.display = 'none'; // Hide calibration UI overlay
//             }
//             if (pauseButton) {
//                 pauseButton.style.display = 'block'; // SHOW the main pause button
//                 pauseButton.textContent = '⏸️';     // Ensure it's the pause icon
//             }
//         }
//     } else {
//         // For any other screen (mainMenu, gameOver, pauseScreen, etc.)
//         if (pauseButton) {
//             pauseButton.style.display = 'none'; // Hide pause button if not on game screen
//         }
//         // Ensure calibration overlay is also hidden if not on game screen in calibration mode
//         if (screens.calibration) {
//              screens.calibration.style.display = 'none';
//         }
//         // Specific webcam logic for other screens (mainMenu stops it, others might hide element)
//         if (screenName === 'mainMenu') {
//             stopWebcam(); 
//             gameState.calibrationMode = false; 
//         } else if (screenName === 'gameOver' || screenName === 'pauseScreen') {
//             if (gameSettings.inputMethod !== 'smile' && gameSettings.inputMethod !== 'altitude') {
//                 stopWebcam();
//             } else {
//                 hideWebcamElement(); 
//             }
//         }
//     }
// }

// --- Game State Control ---

/**
 * Starts a new game session. Handles webcam state based on input.
 */
async function startGame() {
    console.log("Attempting to start game session...");
    // If game was in calibration mode, stop the calibration loop and reset related state.
    if (gameState.calibrationMode) {
        stopLoop(); // This will also call stopCalibration()
    }
    gameState.calibrationMode = false; // Explicitly ensure calibration mode is off

    // Apply selected difficulty settings
    if (gameSettings.mode === 'pipes') {
        applyPipesDifficulty();
    } else if (gameSettings.mode === 'stars') {
        applyStarsDifficulty(); // NEW
    } else if (gameSettings.mode === 'pipes-and-stars') {
        applyPipesAndStarsDifficulty(); // NEW
    }
    // Add logic for other modes here...

    // Reset core game state variables
    gameState.running = true;
    gameState.score = 0;
    gameState.lives = 15;
    gameState.invulnerable = false;
    gameState.invulnerabilityTimer = 0;
    gameState.pipes = [];
    gameState.stars = [];
    gameState.bird.x = 150;
    gameState.bird.y = canvas.height / 3;
    gameState.bird.velocity = 0;
    gameState.groundPos = 0;

    // // --- Webcam logic for game start ---
    // if (gameSettings.inputMethod === 'smile' || gameSettings.inputMethod === 'altitude') {
    //     // Smile input is active. Webcam STREAM needs to be ON for face-api.js.
    //     // However, the webcam video ELEMENT (webcam-container) should be HIDDEN during gameplay.
    //     if (!isWebcamReady()) {
    //         console.log("Webcam not ready for smile input game, attempting to initialize...");
    //         try {
    //             await initWebcam(); // Initialize if not already (e.g., user selected smile then start)
    //             if (!isWebcamReady()) {
    //                 // If still not ready after attempt, alert and fallback.
    //                 alert("Webcam is required for smile input but could not be started. Please calibrate or check permissions. Reverting to Space input.");
    //                 // Simulate click on space button to update UI and settings
    //                 const spaceButton = document.querySelector('.input-btn[data-input="space"]');
    //                 if (spaceButton) spaceButton.click(); else gameSettings.inputMethod = 'space';
    //                 stopWebcam(); // Ensure it's fully off if falling back
    //             }
    //             // If it became ready, proceed to hide its element.
    //         } catch (error) {
    //             console.error("Error initializing webcam for smile input game:", error);
    //             alert("Webcam could not be initialized for smile input. Reverting to Space input.");
    //             const spaceButton = document.querySelector('.input-btn[data-input="space"]');
    //             if (spaceButton) spaceButton.click(); else gameSettings.inputMethod = 'space';
    //             stopWebcam();
    //         }
    //     }
    //     // If webcam is ready (either initially or after init attempt for smile mode)
    //     // AND input method is still smile/altitude (didn't fallback)
    //     if (isWebcamReady() && (gameSettings.inputMethod === 'smile' || gameSettings.inputMethod === 'altitude')) {
    //          hideWebcamElement(); // Hide container, but keep stream active for detection.
    //     }

    // } else {
    //     // If NOT using smile/altitude input, stop webcam completely (stream and container).
    //     stopWebcam();
    //     if (typeof stopSmileUpdates === 'function') stopSmileUpdates(); // Ensures smile detection interval is cleared
    // }
        // REPLACE the entire webcam logic block (approx. lines 608-634) with this:
    if (gameSettings.inputMethod === 'smile' || gameSettings.inputMethod === 'altitude') {
        if (!isWebcamReady()) {
            await initWebcam(); // Ensure webcam is on
        }
        if (isWebcamReady()) {
            hideWebcamElement();
            startSmileDetectionIfSelected(); // Start the new detection loop
        } else {
             alert("Webcam is required for smile input. Reverting to Space input.");
             // Fallback logic here...
        }
    } else {
        stopWebcam();
        stopSmileDetection(); // Ensure detection is off for other modes
    }

    updateScore(0);
    updateLivesDisplay();
    showScreen('game'); // Show the game screen. Canvas background uses original.
                       // showScreen will also call hideWebcamElement if not in calibration.
    startLoop(gameLoop); // gameLoop uses drawBackground for the canvas
    console.log("Game session started!");
}

function resumeGame() {
    if (!gameState.running) { // If it was truly paused
        gameState.running = true;
        showScreen('game'); // Ensure game screen is shown
        startSmileDetectionIfSelected();
        startLoop(gameLoop); // Use the existing startLoop with the main gameLoop
        console.log("Game resumed from pause.");
    }
}

/**
 * Handles the game over sequence.
 */
function gameOver() {
    console.log("Game Over triggered.");
    stopSmileDetection();
    stopLoop();
    gameState.running = false;

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        // localStorage.setItem('flappyHighScore', gameState.highScore);
    }

    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('high-score').textContent = gameState.highScore;
    showScreen('gameOver'); // This will handle webcam visibility as per showScreen logic
}

// --- Main Game Loop ---

/**
 * The main game loop, called repeatedly via requestAnimationFrame.
 * Draws the ORIGINAL game background, not the webcam feed.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The game canvas element.
 */

let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

function gameLoop(ctx, canvas) {
    if (!gameState.running || gameState.calibrationMode) {
        stopLoop();
        return;
    }

    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    
    // Limit frame rate
    if (deltaTime < FRAME_TIME) {
        requestAnimationFrame(() => gameLoop(ctx, canvas));
        return;
    }
    
    lastFrameTime = now - (deltaTime % FRAME_TIME);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground(ctx, canvas);
    
    updateBirdPhysics();
    
    // Handle game mode logic
    if (gameSettings.mode === 'pipes') {
        handlePipesMode(ctx, canvas);
    } else if (gameSettings.mode === 'stars') {
        handleStarsMode(ctx, canvas);
    } else if (gameSettings.mode === 'pipes-and-stars') {
        handlePipesAndStarsMode(ctx, canvas);
    }
    
    checkCollisions(gameOver);
    drawBird(ctx);
    
    gameState.groundPos = (gameState.groundPos - gameState.speed) % (assets.ground?.width || 24);
    drawGround(ctx, canvas);
    
    requestAnimationFrame(() => gameLoop(ctx, canvas));
}

// function gameLoop(ctx, canvas) {
//     if (!gameState.running || gameState.calibrationMode) { // Do not run if game stopped or in calibration
//         stopLoop();
//         return;
//     }

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // --- Draw background ---
//     // ALWAYS draw the standard game background during the main game loop.
//     drawBackground(ctx, canvas);

//     updateBirdPhysics();

//     // Handle game mode logic
//     if (gameSettings.mode === 'pipes') {
//         handlePipesMode(ctx, canvas);
//     } else if (gameSettings.mode === 'stars') {
//         handleStarsMode(ctx, canvas); // NEW
//     } else if (gameSettings.mode === 'pipes-and-stars') {
//         handlePipesAndStarsMode(ctx, canvas); // NEW
//     }
//     // Add logic for other game modes here...

//     checkCollisions(gameOver);
//     drawBird(ctx);

//     gameState.groundPos = (gameState.groundPos - gameState.speed) % (assets.ground?.width || 24);
//     drawGround(ctx, canvas);

//     requestNextFrame(gameLoop);
// }


// --- Initialization Trigger ---
// document.addEventListener('DOMContentLoaded', function() {
//     console.log("DOM Content Loaded - initializing game");
//     // gameState.highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');
//     initGame();
// });

document.addEventListener('DOMContentLoaded', function() {
    if (window.initGameHasRun) {
        console.log("DOM Content Loaded: initGame has already run. Skipping.");
        return;
    }
    console.log("DOM Content Loaded - initializing game for the first time");
    window.initGameHasRun = true; // Set the flag immediately
    initGame();
});

// document.addEventListener('DOMContentLoaded', function() {
//     let initGameHasRun = false; // Declare here

//     function initGame() { // Define or ensure initGame is accessible here
//         if (initGameHasRun) {
//             console.log("initGame: Already run. Skipping.");
//             return;
//         }
//         initGameHasRun = true;
//         console.log("initGame: Running for the first time.");

//         console.log("Initializing game...");
//         // ... rest of initGame
//     }

//     console.log("DOM Content Loaded - initializing game"); // Existing line
//     initGame(); // Call the scoped initGame
// });

// Export functions that might be needed by other modules or for debugging
export {
    startGame,
    gameOver,
    showScreen,
    // gameLoop // Not typically exported unless for specific needs
};