// static/js/modes/pipeStars.js - Pipes and Stars game mode implementation
import { gameState, gameSettings, sounds, updateScore } from '../gameState.js';
import { assets } from '../assets.js';
import { handlePipesMode, applyPipesDifficulty as basePipesDifficulty } from './pipes.js'; // Import from pipes.js
import { checkStarCollisions, createStar, drawStars } from './starUtils.js'; // We'll create this utility file

// Handle combined pipes and stars game mode logic
function handlePipesAndStarsMode(ctx, canvas) {
    // Handle pipes (movement, drawing, creation)
    handlePipesMode(ctx, canvas); // Reuse the existing pipes logic

    // Handle stars
    const currentTime = Date.now();
    if (gameState.stars.length < 5 && currentTime - gameState.lastStarTime > gameState.starSpawnInterval) { // Limit stars
        // true indicates to check for pipe overlap
        const newStar = createStar(canvas, true);
        if (newStar) { // createStar might return null if no valid position is found
            gameState.stars.push(newStar);
        }
        gameState.lastStarTime = currentTime;
    }

    // Update and draw each star
    drawStars(ctx);

    // Check star collisions (handles scoring for stars)
    checkStarCollisions();
}

// Apply difficulty settings for pipes and stars mode
function applyPipesAndStarsDifficulty() {
    // Start with base pipe difficulty settings
    basePipesDifficulty();

    // NOTE: Bird physics (gravity, jumpStrength) are no longer set here
    // to ensure they are consistent with other game modes.

    // Then, adjust or add star-specific settings based on difficulty
    switch (gameSettings.difficulty) {
        case 'easy':
            gameState.starSpawnInterval = 3000;
            gameState.bigStarChance = 0.12;
            break;
        case 'normal':
            gameState.starSpawnInterval = 2500;
            gameState.bigStarChance = 0.08;
            break;
        case 'hard':
            gameState.starSpawnInterval = 2000;
            gameState.bigStarChance = 0.06;
            break;
        case 'arcade':
            // Arcade for combined mode will also use the pipes arcade progression
            // and add star progression.
            gameState.starSpawnInterval = 2200;
            gameState.bigStarChance = 0.07;
            gameState.arcadeMode.initialStarSpawnPipes = 2200;
            gameState.arcadeMode.spawnRateDecreasePipes = 60; // Different var name to avoid conflict
            break;
    }
}

export {
    handlePipesAndStarsMode,
    applyPipesAndStarsDifficulty
};