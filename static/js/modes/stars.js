// static/js/modes/stars.js - Stars game mode implementation
import { gameState, gameSettings, sounds, updateScore } from '../gameState.js';
import { assets } from '../assets.js';
import { checkStarCollisions, createStar, drawStars } from './starUtils.js'; // We'll create this utility file

// Handle stars game mode logic
function handleStarsMode(ctx, canvas) {
    // Create new stars at intervals
    const currentTime = Date.now();
    if (gameState.stars.length < 10 && currentTime - gameState.lastStarTime > gameState.starSpawnInterval) { // Limit number of stars on screen
        gameState.stars.push(createStar(canvas, false)); // false indicates not to check for pipe overlap
        gameState.lastStarTime = currentTime;
    }

    // Update and draw each star
    drawStars(ctx);

    // Check star collisions
    checkStarCollisions(); // This function will be in starUtils.js and handle scoring
}

// Apply difficulty settings for stars mode
function applyStarsDifficulty() {
    // NOTE: Bird physics (gravity, jumpStrength) are no longer set here
    // to ensure they are consistent with other game modes.

    switch (gameSettings.difficulty) {
        case 'easy':
            gameState.pipeSpeed = 1.5; // Star movement speed
            gameState.starSpawnInterval = 2000; // Slower star spawn
            gameState.bigStarChance = 0.10; // Higher chance of big stars
            break;
        case 'normal':
            gameState.pipeSpeed = 2;
            gameState.starSpawnInterval = 1800;
            gameState.bigStarChance = 0.07;
            break;
        case 'hard':
            gameState.pipeSpeed = 2.8;
            gameState.starSpawnInterval = 1500; // Faster star spawn
            gameState.bigStarChance = 0.05; // Lower chance of big stars
            break;
        case 'arcade':
            // Arcade mode for stars might involve increasing speed and spawn rate over time/score
            gameState.pipeSpeed = 2.2;
            gameState.starSpawnInterval = 1700;
            gameState.bigStarChance = 0.06;
            gameState.arcadeMode.initialSpeed = 2.2;
            gameState.arcadeMode.initialStarSpawn = 1700;
            gameState.arcadeMode.speedIncrease = 0.1; // Increase star speed
            gameState.arcadeMode.spawnRateDecrease = 50; // Decrease spawn interval
            gameState.arcadeMode.scoreThreshold = 3; // Increase difficulty every 3 stars in arcade
            break;
    }
}

export {
    handleStarsMode,
    applyStarsDifficulty
};