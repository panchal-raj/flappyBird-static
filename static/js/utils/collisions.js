// collisions.js - Handles collision detection
import { gameState, sounds, gameSettings, updateLivesDisplay } from '../gameState.js';

// Reset bird position after collision
function resetBirdPosition() {
    // Reset bird position but keep the game running
    // gameState.bird.y = window.innerHeight / 3;
    gameState.bird.velocity = 0;
    
    // Give player a brief invulnerability period
    gameState.invulnerable = true;
    setTimeout(() => {
        gameState.invulnerable = false;
    }, 1500); // 1.5 seconds of invulnerability
}


// Handle life loss
function loseLife(gameOverCallback) {
    gameState.lives--;
    updateLivesDisplay();
    
    // Play hit sound
    if (sounds.hit) {
        sounds.hit.currentTime = 0;
        sounds.hit.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Check if no more lives
    if (gameState.lives <= 0) {
        gameOverCallback();
    } else {
        resetBirdPosition();
    }
}

// Check for collisions
function checkCollisions(gameOverCallback) {
    const bird = gameState.bird;
    
    // Ground collision - prevent bird from going below ground
    if (bird.y + bird.height >= gameState.ground.y) {
        bird.y = gameState.ground.y - bird.height;
        bird.velocity = 0;
    }
    
    // Ceiling collision
    if (bird.y <= 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Skip OBSTACLE collision check during invulnerability
    if (gameState.invulnerable) {
        return;
    }

    // Only check pipe collisions in pipe-related game modes
    if (gameSettings.mode === 'pipes' || gameSettings.mode === 'pipes-and-stars') { //
        // Pipe collisions
        for (const pipe of gameState.pipes) {
            // Check collision only if pipes are in range of bird
            if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width) {
                // Check collision with top pipe
                if (bird.y < pipe.topHeight) {
                    loseLife(gameOverCallback);
                    return;
                }
                
                // Check collision with bottom pipe
                if (bird.y + bird.height > pipe.bottomY) {
                    loseLife(gameOverCallback);
                    return;
                }
            }
        }
    }
}

export { 
    checkCollisions, 
    loseLife, 
    resetBirdPosition 
};