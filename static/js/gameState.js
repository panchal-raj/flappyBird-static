// gameState.js - Manages game state and configuration

// Game settings
// Game settings
const gameSettings = {
    mode: 'pipes',          // Default game mode: 'pipes', 'stars', 'pipes-and-stars'
    difficulty: 'normal',   // Default difficulty: 'easy', 'normal', 'hard', 'arcade'
    inputMethod: 'space'    // Default input method: 'space', 'smile'
};

// Game state object
const gameState = {
    calibrationMode: false,
    running: false,
    score: 0,
    highScore: localStorage.getItem('flappyHighScore') || 0,
    gravity: 0.09,
    bird: {
        x: 50,
        y: 150,
        width: 34,
        height: 24,
        velocity: 0,
        jumpStrength: -3.5
    },
    pipes: [],
    pipeGap: 180,       // Default value, will be overridden by difficulty
    pipeWidth: 52,
    pipeDistance: 350,  // Default value, will be overridden by difficulty
    pipeSpeed: 2,       // Default value, will be overridden by difficulty
    nextPipeTime: 0,
    ground: {
        y: 0,
        height: 112
    },
    lives: 15,
    invulnerable: false,
    // REMOVED: `difficulty: 'normal',` was here.
    arcadeMode: {
        active: false,
        speedIncrease: 0.5,
        gapDecrease: 1,
        scoreThreshold: 5
    },
    // Star-related properties
    stars: [],
    starSpawnInterval: 2000,
    lastStarTime: 0,
    bigStarChance: 0.05,

    lastFrameTime: 0,
    deltaTime: 1,

    // Optimize memory usage with object pooling
    objectPool: {
        stars: [],
        pipes: []
    },

    // Cache frequently accessed DOM elements
    domElements: {
        score: document.getElementById('score'),
        lives: document.getElementById('lives-count'),
        finalScore: document.getElementById('final-score'),
        highScore: document.getElementById('high-score')
    }
};

// Audio assets
const sounds = {
    score: new Audio('/static/assets/audio/point.ogg'),
    hit: new Audio('/static/assets/audio/hit.ogg'),
    wing: new Audio('/static/assets/audio/wing.ogg'),
    bigStar: new Audio('/static/assets/audio/point.ogg')
};

// Screen references (will be initialized in game.js)
const screens = {
    mainMenu: null,
    game: null,
    calibration: null,
    gameOver: null,
    pauseScreen: null
};

gameState.lastFrameTime = 0;
gameState.deltaTime = 1;

// Update score with side effects
// function updateScore(score) {
//     // Update center score display
//     document.getElementById('score').textContent = score;
    
//     // Update high score if needed
//     if (score > gameState.highScore) {
//         gameState.highScore = score;
//         localStorage.setItem('flappyHighScore', score);
//     }
    
//     // Handle arcade mode difficulty progression with time-based scaling
//     if (gameState.difficulty === 'arcade' && score > 0 && score % gameState.arcadeMode.scoreThreshold === 0) {
//         gameState.pipeSpeed += gameState.arcadeMode.speedIncrease * gameState.deltaTime;
//         gameState.pipeGap = Math.max(90, gameState.pipeGap - gameState.arcadeMode.gapDecrease);
//     }
// }
function updateScore(score) {
  // Direct DOM manipulation instead of querySelector on each update
  gameState.domElements.score.textContent = score;
  
  // Update high score if needed
  if (score > gameState.highScore) {
    gameState.highScore = score;
    localStorage.setItem('flappyHighScore', score);
  }
  
  // Handle arcade mode progression with frame-rate independent scaling
  if (gameState.difficulty === 'arcade' && score > 0 && score % gameState.arcadeMode.scoreThreshold === 0) {
    gameState.pipeSpeed += gameState.arcadeMode.speedIncrease * gameState.deltaTime;
    gameState.pipeGap = Math.max(90, gameState.pipeGap - gameState.arcadeMode.gapDecrease);
  }
}

// Update lives display
function updateLivesDisplay() {
    gameState.domElements.lives.textContent = `${gameState.lives}/15`;
}

// Export gameState and functions
export { 
    gameState, 
    gameSettings, 
    screens, 
    sounds, 
    updateScore, 
    updateLivesDisplay
};