// input.js - Manages game input methods (keyboard, touch, smile)
import { gameState, sounds, gameSettings } from '../gameState.js';
import { detectSmile } from '../smileDetector.js';
let smileController = null;
let controlMode = 'keyboard'; // Default control mode
let smileDetectionLoopId = null;

// Handle jump action
function jump() {
    if (gameState.running || gameState.calibrationMode) {
        gameState.bird.velocity = gameState.bird.jumpStrength;
        
        // Play wing flap sound
        if (sounds.wing) {
            sounds.wing.currentTime = 0;
            sounds.wing.play().catch(e => console.log("Audio play failed:", e));
        }
    }
}

// // Initialize smile control
function initializeSmileControl(startGameCallback, gameOverCallback) {
  // Return null as the controller isn't available or needed
  console.log("Smile controller is disabled");
  return null;
}

// Start calibration process
function startCalibration(showScreenCallback) {
    // Check if we're actually using the smile controller
    // if (window.SmileGameController) {
    //     // Initialize controller if needed
    //     if (!smileController) {
    //         smileController = initializeSmileControl();
    //     }
        
    //     if (smileController) {
    //         smileController.startCalibration();
    //     }
    // }
    
    // Always show calibration screen, even if smile controller isn't available
    if (window.startCalibrationScreen) {
        window.startCalibrationScreen();
    } else if (showScreenCallback) {
        showScreenCallback('calibration');
    }
}

// Handle calibration completion
function handleCalibrationComplete(showScreenCallback) {
    controlMode = 'smile';
    // Reset calibration mode
    if (window.gameState) {
        window.gameState.calibrationMode = false;
    }
    
    if (showScreenCallback) {
        showScreenCallback('mainMenu');
    }
    
    // Cancel any ongoing calibration animation
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
    }
    
    // Update input selection UI to show smile control as selected
    const inputButtons = document.querySelectorAll('.input-btn');
    inputButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.input === gameSettings.inputMethod) {
            btn.classList.add('selected');
        }
    });
}

// Set up input event listeners
function setupInputListeners(canvas, showScreenCallback, startGameCallback, resumeGameCallback) {
    // Keyboard input
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && gameSettings.inputMethod === 'space') {
            event.preventDefault(); // Prevent page scrolling on space
            jump();
        }
    });
    
    // Touch support for mobile
    canvas.addEventListener('touchstart', function(event) {
        event.preventDefault();
        if (gameSettings.inputMethod === 'space') {
            jump();
        }
    });
    
    // Pause button functionality
    // document.getElementById('pause-btn')?.addEventListener('click', () => togglePause(showScreenCallback, resumeGameCallback)); 
    document.getElementById('continue-btn')?.addEventListener('click', () => togglePause(showScreenCallback, resumeGameCallback)); 
    document.getElementById('pause-main-menu-btn')?.addEventListener('click', function() {
        if (gameState.running) togglePause(showScreenCallback); // Ensure game is paused before going to menu
        showScreenCallback('mainMenu');
    });

    // Calibrate smile control button
    document.getElementById('calibrate-btn')?.addEventListener('click', function() {
        startCalibration(showScreenCallback);
    });

    // Setting buttons event listeners
    setupSettingsButtons(startGameCallback);
}

// Toggle pause state
function togglePause(showScreenCallback, resumeGameCallback) { // NEW
    if (gameState.running) { // Game is running, so PAUSE it
        gameState.running = false;
        // To properly stop the loop, game.js's stopLoop() should be called.
        // For now, just setting gameState.running = false will make the loop exit on its next check.
        // Consider calling a dedicated pause function from game.js if more complex pause logic is needed.
        console.log("Game paused.");
        showScreenCallback('pauseScreen');
    } else { // Game is paused, so RESUME it
        // gameState.running = true; // resumeGameCallback will set this
        // showScreenCallback('game'); // resumeGameCallback will handle this
        if (resumeGameCallback) {
            resumeGameCallback();
        } else {
            // Fallback if resumeGameCallback wasn't passed, though it should be.
            // This indicates a setup issue.
            console.error("resumeGameCallback not provided to togglePause!");
            gameState.running = true;
            showScreenCallback('game');
            // The original problematic line: requestAnimationFrame(() => window.gameLoop());
            // This would still fail. The proper fix is using resumeGameCallback.
        }
    }
}

// function togglePause(showScreenCallback) { // Removed resumeGameCallback here, will handle resume via buttons
//     // Only pause if the game is running OR calibration is active
//     if (gameState.running || gameState.calibrationMode) {
//         console.log("Attempting to pause.");
//         gameState.running = false; // This stops the main game loop and should pause calibration loop as it checks gameState.running

//         if (gameState.calibrationMode) {
//             console.log("Calibration paused.");
//             showScreenCallback('calibrationPauseScreen'); // Show the specific calibration pause screen
//         } else {
//             console.log("Game paused.");
//             showScreenCallback('pauseScreen'); // Show the regular game pause screen
//         }
//     } else {
//         console.log("Game is already paused or not active.");
//         // If the user clicks pause while paused, we could optionally hide the pause screen
//         // and resume, but the dedicated 'Continue' buttons are better for this.
//         // So, if it's already paused, do nothing when pause button is clicked again.
//     }
// }


// Setup game settings buttons (mode, difficulty, input)
function setupSettingsButtons(startGameCallback) {
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modeButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            gameSettings.mode = this.dataset.mode;
        });
    });
    
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            gameSettings.difficulty = this.dataset.difficulty;
        });
    });
    
    const inputButtons = document.querySelectorAll('.input-btn');
    inputButtons.forEach(button => {
        button.addEventListener('click', function() {
            inputButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            
            const newInputMethod = this.dataset.input;
            gameSettings.inputMethod = newInputMethod;
            
            // Stop any active smile detection
            if (smileController && (gameSettings.inputMethod === 'space')) {
                smileController.stopSmileDetection();
            }
            
            // Initialize smile controller if needed for smile or altitude modes
            if (gameSettings.inputMethod === 'smile' || gameSettings.inputMethod === 'altitude') {
                if (!smileController) {
                    console.log("Smile controller is disabled, falling back to keyboard");
                    // Fall back to keyboard control
                    gameSettings.inputMethod = 'space';
                    // Re-select the keyboard button
                    inputButtons.forEach(btn => {
                    btn.classList.remove('selected');
                    if (btn.dataset.input === 'space') {
                        btn.classList.add('selected');
                    }
                    });
                    
                    // Show a notification to the user
                    const notificationMsg = document.createElement('div');
                    notificationMsg.className = 'notification';
                    notificationMsg.textContent = 'Smile controller is disabled, using keyboard instead';
                    notificationMsg.style.position = 'absolute';
                    notificationMsg.style.bottom = '10px';
                    notificationMsg.style.left = '50%';
                    notificationMsg.style.transform = 'translateX(-50%)';
                    notificationMsg.style.backgroundColor = 'rgba(0,0,0,0.7)';
                    notificationMsg.style.color = 'white';
                    notificationMsg.style.padding = '10px';
                    notificationMsg.style.borderRadius = '5px';
                    
                    document.getElementById('game-container').appendChild(notificationMsg);
                    
                    // Remove after 3 seconds
                    setTimeout(() => {
                    if (document.getElementById('game-container').contains(notificationMsg)) {
                        document.getElementById('game-container').removeChild(notificationMsg);
                    }
                    }, 3000);
                }
                }   
        });
    });
}

// Start smile detection if it's the selected input method
function startSmileDetectionIfSelected() {
    if ((gameSettings.inputMethod === 'smile' || gameSettings.inputMethod === 'altitude') && !smileDetectionLoopId) {
        console.log("Starting smile detection loop.");
        const runDetection = async () => {
            if (gameState.running) { // Only detect if the game is actively running
                await detectSmile();
            }
            smileDetectionLoopId = requestAnimationFrame(runDetection);
        };
        runDetection();
    }
}

// Stop smile detection
function stopSmileDetection() {
    if (smileDetectionLoopId) {
        cancelAnimationFrame(smileDetectionLoopId);
        smileDetectionLoopId = null;
        console.log("Stopped smile detection loop.");
    }
}

export function handleSmileJump() {
    if (gameState.running) {
        jump();
    }
}

export {
    
    jump,
    initializeSmileControl,
    handleCalibrationComplete,
    setupInputListeners,
    togglePause,
    startCalibration,
    startSmileDetectionIfSelected,
    stopSmileDetection
};