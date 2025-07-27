// static/js/modes/starUtils.js - Utility functions for star handling
import { gameState, gameSettings, sounds, updateScore } from '../gameState.js';
import { assets } from '../assets.js';

/**
 * Creates a star object with simplified and more efficient placement logic for pipes mode.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 * @param {boolean} checkPipeOverlap - If true, places stars intelligently around pipes. If false, places them randomly.
 * @returns {object|null} The star object or null if placement is not possible.
 */
function createStar(canvas, checkPipeOverlap) {
    const isBigStar = Math.random() < gameState.bigStarChance;
    const starWidth = isBigStar ? 40 : 25;
    const starHeight = isBigStar ? 40 : 25;
    let x, y;

    if (checkPipeOverlap) {
        // --- NEW LOGIC to ensure stars spawn off-screen ---
        if (gameState.pipes.length === 0) {
            return null; // Cannot place a star if there are no pipes to reference
        }

        const lastPipe = gameState.pipes[gameState.pipes.length - 1];

        // Define a spawn area safely off-screen, ahead of the last pipe.
        // This ensures stars always scroll into the frame smoothly.
        const spawnZoneStartX = lastPipe.x + lastPipe.width + 50; // Add an initial offset
        // Increase the offset for spawnZoneEndX to push stars further right
        const spawnZoneEndX = lastPipe.x + gameState.pipeDistance + 100 - starWidth; // Increased offset

        if (spawnZoneStartX >= spawnZoneEndX) {
            return null; // Not enough space between pipes, skip creating a star this time
        }

        // Pick an X within this safe, off-screen zone.
        x = spawnZoneStartX + Math.random() * (spawnZoneEndX - spawnZoneStartX);

        // Now, decide on the Y coordinate.
        // Randomly decide to either align it with the last pipe's gap or place it freely.
        const placeInGap = Math.random() > 0.5;

        if (placeInGap) {
            // Place it in the vertical zone of the last pipe's gap.
            const gapTop = lastPipe.topHeight;
            const gapBottom = lastPipe.bottomY;

            // Add a buffer so the star isn't touching the pipe edge.
            const safeGapTop = gapTop + starHeight / 2;
            const safeGapBottom = gapBottom - starHeight;

            if (safeGapTop >= safeGapBottom) {
                 // Gap is too small for a safe placement, so place it randomly.
                 const minY = 50;
                 const maxY = canvas.height - gameState.ground.height - 50;
                 y = minY + Math.random() * (maxY - minY);
            } else {
                y = safeGapTop + Math.random() * (safeGapBottom - safeGapTop);
            }
        } else {
            // Place it at a random height on the screen.
            const minY = 50;
            const maxY = canvas.height - gameState.ground.height - 50;
            y = minY + Math.random() * (maxY - minY);
        }

    } else {
        // --- Original logic for 'Stars' only mode (no pipes to consider) ---
        const minY = 50;
        const maxY = canvas.height - gameState.ground.height - 50;
        x = canvas.width + Math.random() * 150; // Start off-screen
        y = minY + Math.random() * (maxY - minY);
    }

    // Ensure star is not placed below ground level
    y = Math.min(y, canvas.height - gameState.ground.height - starHeight);


    return {
        x: x,
        y: y,
        width: starWidth,
        height: starHeight,
        collected: false,
        speed: gameState.pipeSpeed,
        isBigStar: isBigStar,
        points: isBigStar ? 5 : 1
    };
}


/**
 * Draws all active stars onto the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
function drawStars(ctx) {
    gameState.stars = gameState.stars.filter(star => star.x + star.width > 0 && !star.collected);

    for (const star of gameState.stars) {
        star.x -= star.speed; // Move star based on its own speed or game speed

        if (!star.collected) {
            ctx.save();
            const pulse = 1 + 0.08 * Math.sin(Date.now() / 180); // Slower, subtler pulse
            ctx.translate(star.x + star.width / 2, star.y + star.height / 2);
            ctx.scale(pulse, pulse);

            const starAsset = star.isBigStar ? assets.bigStar : assets.star;
            if (starAsset && starAsset.complete) {
                ctx.drawImage(starAsset, -star.width / 2, -star.height / 2, star.width, star.height);

                if (star.isBigStar) { // Optional glow for big stars
                    const gradient = ctx.createRadialGradient(0, 0, star.width / 5, 0, 0, star.width * 0.7);
                    gradient.addColorStop(0, 'rgba(255, 255, 100, 0.25)');
                    gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, star.width * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    }
}

/**
 * Checks for collisions between the bird and stars.
 * Handles scoring and sound effects for star collection.
 */
function checkStarCollisions() {
    const bird = gameState.bird;
    let starCollectedThisFrame = false;

    for (const star of gameState.stars) {
        if (!star.collected &&
            bird.x < star.x + star.width &&
            bird.x + bird.width > star.x &&
            bird.y < star.y + star.height &&
            bird.y + bird.height > star.y) {

            star.collected = true;
            gameState.score += star.points;
            updateScore(gameState.score); // Update main score display
            starCollectedThisFrame = true;

            const soundToPlay = star.isBigStar ? sounds.bigStar : sounds.score;
            if (soundToPlay) {
                soundToPlay.currentTime = 0;
                soundToPlay.play().catch(e => console.warn("Star sound play failed:", e));
            }

            // Arcade mode progression for star collection
            if (gameSettings.difficulty === 'arcade' && (gameSettings.mode === 'stars' || gameSettings.mode === 'pipes-and-stars')) {
                 if (gameState.score > 0 && gameState.score % gameState.arcadeMode.scoreThreshold === 0) {
                    if (gameSettings.mode === 'stars') {
                        gameState.pipeSpeed = Math.min(gameState.pipeSpeed + gameState.arcadeMode.speedIncrease, 5); // Max speed 5
                        gameState.starSpawnInterval = Math.max(gameState.starSpawnInterval - gameState.arcadeMode.spawnRateDecrease, 800); // Min interval 800ms
                    } else if (gameSettings.mode === 'pipes-and-stars') {
                        gameState.starSpawnInterval = Math.max(gameState.starSpawnInterval - gameState.arcadeMode.spawnRateDecreasePipes, 1000);
                    }
                }
            }
        }
    }
    return starCollectedThisFrame;
}


export {
    createStar,
    drawStars,
    checkStarCollisions
};

