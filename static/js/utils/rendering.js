// rendering.js - Handles rendering operations
import { gameState } from '../gameState.js';
import { assets } from '../assets.js';

function isOnScreen(x, y, width, height, canvas) {
    return (
        x + width > 0 &&
        x < canvas.width &&
        y + height > 0 &&
        y < canvas.height
    );
}

// Draw the game background
function drawBackground(ctx, canvas) {
    ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
}

// Draw the ground
function drawGround(ctx, canvas) {
    ctx.drawImage(
        assets.ground, 
        0, 
        gameState.ground.y, 
        canvas.width, 
        assets.ground.height
    );
}

// // Draw the bird with animation and rotation
// function drawBird(ctx) {
//     // Select appropriate animation frame based on velocity
//     // let birdFrame = 1; // Default to middle frame
//     // if (gameState.bird.velocity < -2) {
//     //     birdFrame = 0; // Up flap when rising quickly
//     // } else if (gameState.bird.velocity > 2) {
//     //     birdFrame = 2; // Down flap when falling quickly
//     // }
//     // With this time-based animation code:
//     const animationSpeed = 150; // Milliseconds per frame
//     const frameIndex = Math.floor(Date.now() / animationSpeed) % 3;
//     const birdFrame = frameIndex;
//     // Apply rotation based on velocity
//     ctx.save();
//     ctx.translate(
//         gameState.bird.x + gameState.bird.width / 2, 
//         gameState.bird.y + gameState.bird.height / 2
//     );

//     // Calculate rotation angle
//     const angle = Math.min(
//         Math.max(gameState.bird.velocity * 2, -25), 
//         70
//     ) * Math.PI / 180;

//     ctx.rotate(angle);

//     // Add flashing effect during invulnerability
//     if (gameState.invulnerable && Math.floor(Date.now() / 150) % 2 === 0) {
//         // Skip drawing the bird every other frame for flashing effect
//     } else {
//         ctx.drawImage(
//             assets.bird[birdFrame], 
//             -gameState.bird.width / 2, 
//             -gameState.bird.height / 2, 
//             gameState.bird.width, 
//             gameState.bird.height
//         );
//     }
//     ctx.restore();
// }

function drawBird(ctx) {
    const bird = gameState.bird;
    const canvas = ctx.canvas;
    
    // Skip drawing if bird is off screen
    if (!isOnScreen(bird.x, bird.y, bird.width, bird.height, canvas)) {
        return;
    }
    
    // Determine animation frame based on time
    const frameIndex = Math.floor(Date.now() / 200) % assets.bird.length;
    const birdFrame = frameIndex;
    
    // Apply rotation based on velocity
    ctx.save();
    ctx.translate(
        bird.x + bird.width / 2, 
        bird.y + bird.height / 2
    );
    
    // Calculate rotation angle
    const angle = Math.min(
        Math.max(gameState.bird.velocity * 2, -25), 
        70
    ) * Math.PI / 180;
    
    ctx.rotate(angle);
    
    // Add flashing effect during invulnerability
    if (gameState.invulnerable && Math.floor(Date.now() / 150) % 2 === 0) {
        // Skip drawing the bird every other frame for flashing effect
    } else {
        ctx.drawImage(
            assets.bird[birdFrame], 
            -bird.width / 2, 
            -bird.height / 2, 
            bird.width, 
            bird.height
        );
    }
    ctx.restore();
}


// // Update bird position based on physics
// let lastFrameTime = performance.now();
// function updateBirdPhysics() {
//     const now = performance.now();
//     const deltaTime = (now - lastFrameTime) / 16.667; // Normalize to 60fps
//     gameState.bird.velocity += gameState.gravity * deltaTime;
//     gameState.bird.y += gameState.bird.velocity * deltaTime;
//     lastFrameTime = now; // Add this line
// }

// Line 75-85: Update updateBirdPhysics for consistent frame rate
let lastPhysicsUpdate = performance.now();
function updateBirdPhysics() {
    const now = performance.now();
    const deltaTime = (now - lastPhysicsUpdate) / 16.667; // Normalize to 60fps
    lastPhysicsUpdate = now;
    
    // Apply deltaTime to make physics consistent regardless of frame rate
    gameState.bird.velocity += gameState.gravity * deltaTime;
    gameState.bird.y += gameState.bird.velocity * deltaTime;
}

export {
    drawBackground,
    drawGround,
    drawBird,
    updateBirdPhysics
};