// pipes.js - Pipe game mode implementation
import { gameState, sounds, gameSettings, updateScore } from '../gameState.js';
import { assets } from '../assets.js';

// Create a new pipe
function createPipe(canvas) {
    const pipeGap = gameState.pipeGap;
    const minHeight = 50; // Minimum pipe height
    const maxHeight = canvas.height - pipeGap - gameState.ground.height - minHeight;
    
    // Random height for top pipe
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    // Calculate bottom pipe height
    const bottomY = topHeight + pipeGap;
    
    return {
        x: canvas.width,
        topHeight: topHeight,
        bottomY: bottomY,
        width: gameState.pipeWidth,
        passed: false
    };
}

// Handle pipe game mode logic
function handlePipesMode(ctx, canvas) {
    // Create new pipes
    if (gameState.pipes.length === 0 || 
        gameState.pipes[gameState.pipes.length - 1].x < 
        canvas.width - gameState.pipeDistance - gameState.pipeWidth) {
        gameState.pipes.push(createPipe(canvas));
    }
    
    // Update and draw pipes
    gameState.pipes = gameState.pipes.filter(pipe => pipe.x + pipe.width > 0);
    
    for (const pipe of gameState.pipes) {
        // Move pipe
        pipe.x -= gameState.pipeSpeed;
        
        // Check if pipe was passed
        if (gameSettings.mode === 'pipes' && !pipe.passed && gameState.bird.x > pipe.x + pipe.width) {
        // if (!pipe.passed && gameState.bird.x > pipe.x + pipe.width) {
            pipe.passed = true;
            gameState.score++;
            updateScore(gameState.score);
            
            // Play score sound
            if (sounds.score) {
                sounds.score.currentTime = 0;
                sounds.score.play().catch(e => console.log("Audio play failed:", e));
            }
        }
        
        // Draw top pipe (flipped)
        ctx.save();
        ctx.scale(1, -1);
        ctx.drawImage(
            assets.pipe.top, 
            pipe.x, 
            -pipe.topHeight, 
            pipe.width, 
            pipe.topHeight
        );
        ctx.restore();
        
        // Draw bottom pipe
        ctx.drawImage(
            assets.pipe.bottom, 
            pipe.x, 
            pipe.bottomY, 
            pipe.width, 
            canvas.height - pipe.bottomY - gameState.ground.height
        );
    }
}

// Apply difficulty settings for pipes mode
function applyPipesDifficulty() {
    // We now use gameSettings.difficulty instead of gameState.difficulty
    switch (gameSettings.difficulty) {
        case 'easy':
            gameState.pipeGap = 300;      // Wider gap
            gameState.pipeSpeed = 2.0;      // Slower pipes
            gameState.pipeDistance = 450;   // More space between pipes
            break;
        case 'normal':
            gameState.pipeGap = 250;      // Standard gap
            gameState.pipeSpeed = 2.5;      // Standard speed
            gameState.pipeDistance = 400;   // Standard distance
            break;
        case 'hard':
            gameState.pipeGap = 200;      // Narrower gap
            gameState.pipeSpeed = 3.2;      // Faster pipes
            gameState.pipeDistance = 350;   // Less space between pipes
            break;
        case 'arcade':
            // Starts similar to normal and gets harder
            gameState.pipeGap = 250;
            gameState.pipeSpeed = 2.8;
            gameState.pipeDistance = 400;
            // Arcade progression settings
            gameState.arcadeMode.active = true;
            gameState.arcadeMode.speedIncrease = 0.1; // Speed increases slower
            gameState.arcadeMode.gapDecrease = 2;     // Gap shrinks more noticeably
            gameState.arcadeMode.scoreThreshold = 5;  // Every 5 points
            break;
    }
}

export { 
    handlePipesMode, 
    applyPipesDifficulty 
};