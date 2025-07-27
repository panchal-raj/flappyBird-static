// document.addEventListener('DOMContentLoaded', function() {
//     // DOM elements
//     const screens = {
//         mainMenu: document.getElementById('main-menu'),
//         game: document.getElementById('game-screen'),
//         calibration: document.getElementById('calibration-screen'),
//         gameOver: document.getElementById('game-over-screen'),
//         pauseScreen: document.getElementById('pause-screen'),
//     };
    
//     // Canvas setup
//     const canvas = document.getElementById('game-canvas');
//     const ctx = canvas.getContext('2d');
    
//     // Game assets
//     const assets = {
//         bird: [],
//         background: null,
//         pipe: {
//             top: null,
//             bottom: null
//         },
//         ground: null
//     };
    
//     // Add these variable declarations
//     let smileController = null;  // Initialize the smileController variable
//     let controlMode = 'keyboard'; // Default control mode

//     //-------------------------------------------------------
//     // 4.1 IMPLEMENT SCORING SYSTEM - Audio assets for scoring
//     //-------------------------------------------------------
//     const sounds = {
//         score: new Audio('/static/assets/audio/point.ogg'),
//         hit: new Audio('/static/assets/audio/hit.ogg'),
//         wing: new Audio('/static/assets/audio/wing.ogg'),
//         bigStar: new Audio('/static/assets/audio/point.ogg') // Same sound for big star, but could be different
//     };
    
//     // Game settings
//     let gameSettings = {
//         mode: 'pipes',
//         difficulty: 'normal',
//         inputMethod: 'space'
//     };
    
//     //-------------------------------------------------------
//     // 4.3 ADD DIFFICULTY LEVELS - Enhanced gameState with difficulty settings
//     //-------------------------------------------------------
//     let gameState = {
//         running: false,
//         score: 0,
//         highScore: localStorage.getItem('flappyHighScore') || 0, // Added highScore tracking
//         gravity: 0.3,
//         bird: {
//             x: 50,
//             y: 150,
//             width: 34,
//             height: 24,
//             velocity: 0,
//             jumpStrength: -5
//         },
//         pipes: [],
//         pipeGap: 150,
//         pipeWidth: 52,
//         pipeDistance: 220,
//         pipeSpeed: 2, // Base pipe speed - now configurable by difficulty
//         nextPipeTime: 0,
//         ground: {
//             y: 0,
//             height: 112
//         },
//         difficulty: 'normal', // Current difficulty level
//         arcadeMode: {
//             active: false,
//             speedIncrease: 0.1,
//             gapDecrease: 1,
//             scoreThreshold: 5 // Points needed to increase difficulty
//         }
//     };

//     // Add the new variables here:
//     let lastFrameTime = 0;
//     const targetFPS = 60;
//     const frameDelay = 1000 / targetFPS;

//     // Load assets function
//     function loadAssets() {
//         // Load bird sprites (3 frames for animation)
//         // Using yellowbird sprites as default
//         const birdPrefixes = ['yellowbird-upflap', 'yellowbird-midflap', 'yellowbird-downflap'];
//         birdPrefixes.forEach(prefix => {
//             const img = new Image();
//             img.src = `/static/assets/sprites/${prefix}.png`;
//             img.onerror = function() {
//                 console.error(`Failed to load: ${img.src}`);
//                 // Try alternative location or bird color
//                 img.src = `/static/assets/sprites/bluebird-${prefix.split('-')[1]}.png`;
//             };
//             assets.bird.push(img);
//         });
        
//         // Load background
//         assets.background = new Image();
//         assets.background.src = '/static/assets/sprites/background-day.png';
//         assets.background.onerror = function() {
//             console.error('Failed to load background, trying alternative');
//             assets.background.src = '/static/assets/sprites/background-night.png';
//         };
        
//         // Load pipes
//         assets.pipe.top = new Image();
//         assets.pipe.top.src = '/static/assets/sprites/pipe-green.png';
//         assets.pipe.top.onerror = function() {
//             assets.pipe.top.src = '/static/assets/sprites/pipe-red.png';
//         };
        
//         assets.pipe.bottom = new Image();
//         assets.pipe.bottom.src = '/static/assets/sprites/pipe-green.png';
//         assets.pipe.bottom.onerror = function() {
//             assets.pipe.bottom.src = '/static/assets/sprites/pipe-red.png';
//         };
        
//         // Load ground
//         assets.ground = new Image();
//         assets.ground.src = '/static/assets/sprites/base.png';
        
//         // Once background is loaded, we can set ground height
//         assets.background.onload = function() {
//             // Set canvas dimensions based on background size
//             setTimeout(resizeCanvas, 100); // Add a small delay to ensure DOM is ready
            
//             // Calculate ground position
//             gameState.ground.y = canvas.height - assets.ground.height;
//             console.log("Background loaded, ground position set:", gameState.ground.y);
//         };

//         // Load heart icon
//         assets.heart = new Image();
//         assets.heart.src = '/static/assets/sprites/heart.png';
//         assets.heart.onerror = function() {
//             console.error('Failed to load heart sprite');
//         };

//         // Load star assets
//         assets.star = new Image();
//         assets.star.src = '/static/assets/sprites/star.png';
//         assets.star.onerror = function() {
//             console.error('Failed to load star sprite');
//         };
        
//         // Load big star asset
//         assets.bigStar = new Image();
//         assets.bigStar.src = '/static/assets/sprites/star.png'; // Using the same star image but will be scaled larger
//         assets.bigStar.onerror = function() {
//             console.error('Failed to load big star sprite');
//         };
//     }

//     // Add this function after loadAssets() function (around line 474)
//     function initializeSmileControl() {
//         if (window.SmileGameController) {
//             smileController = new SmileGameController({
//                 jump: jump,  // Use your existing jump function
//                 start: startGame,
//                 gameOver: gameOver
//             });
            
//             // Add button to toggle smile control in the main menu
//             const controlsContainer = document.getElementById('controls-container');
//             if (controlsContainer) {
//                 const smileControlBtn = document.createElement('button');
//                 smileControlBtn.id = 'smile-control-btn';
//                 smileControlBtn.className = 'menu-btn';
//                 smileControlBtn.textContent = 'Calibrate Smile Control';
//                 smileControlBtn.addEventListener('click', function() {
//                     smileController.startCalibration();
//                     showScreen('calibration');
//                 });
//                 controlsContainer.appendChild(smileControlBtn);
//             }
//         } else {
//             console.error("SmileGameController not found. Make sure to include smile-controller.js before game.js");
//         }
//     }
    
//     // Resize canvas
//     function resizeCanvas() {
//         // Get actual window dimensions
//         const containerWidth = window.innerWidth;
//         const containerHeight = window.innerHeight;
        
//         canvas.width = containerWidth;
//         canvas.height = containerHeight;
        
//         // Update ground position
//         if (assets.ground) {
//             gameState.ground.y = canvas.height - assets.ground.height;
//         }
        
//         // Also update bird starting position
//         gameState.bird.y = canvas.height / 2 - gameState.bird.height;
//     }
        
//     //-------------------------------------------------------
//     // 4.3 ADD DIFFERENT GAME MODES - Pipe Game Mode Functions
//     //-------------------------------------------------------
    
//     // Create a pipe
//     function createPipe() {
//         const pipeGap = gameState.pipeGap;
//         const minHeight = 50; // Minimum pipe height
//         const maxHeight = canvas.height - pipeGap - gameState.ground.height - minHeight;
        
//         // Random height for top pipe
//         const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
//         // Calculate bottom pipe height
//         const bottomY = topHeight + pipeGap;
        
//         return {
//             x: canvas.width,
//             topHeight: topHeight,
//             bottomY: bottomY,
//             width: gameState.pipeWidth,
//             passed: false
//         };
//     }
    
//     // Check if a point is within a pipe obstacle
//     function isPointInPipe(x, y) {
//         for (const pipe of gameState.pipes) {
//             if (x >= pipe.x && x <= pipe.x + pipe.width) {
//                 // Check if point is inside the top or bottom pipe
//                 if (y <= pipe.topHeight || y >= pipe.bottomY) {
//                     return true;
//                 }
//             }
//         }
//         return false;
//     }
    
//     // Handle game logic for pipes mode
//     function handlePipesMode() {
//         // Only run if in a pipe-related game mode
//         if (gameSettings.mode !== 'pipes' && gameSettings.mode !== 'pipes-and-stars') {
//             return;
//         }
        
//         // Create new pipes
//         if (gameState.pipes.length === 0 || 
//             gameState.pipes[gameState.pipes.length - 1].x < 
//             canvas.width - gameState.pipeDistance) {
//             gameState.pipes.push(createPipe());
//         }
        
//         // Update and draw pipes
//         gameState.pipes = gameState.pipes.filter(pipe => pipe.x + pipe.width > 0);
        
//         for (const pipe of gameState.pipes) {
//             // Move pipe
//             pipe.x -= gameState.pipeSpeed;
            
//             // Check if pipe was passed - only count for score in pipes-only mode
//             if (!pipe.passed && gameState.bird.x > pipe.x + pipe.width && gameSettings.mode === 'pipes') {
//                 pipe.passed = true;
//                 gameState.score++;
//                 updateScore(gameState.score);
                
//                 // Play score sound
//                 if (sounds.score) {
//                     sounds.score.currentTime = 0;
//                     sounds.score.play().catch(e => console.log("Audio play failed:", e));
//                 }
//             }
            
//             // Draw top pipe (flipped)
//             ctx.save();
//             ctx.scale(1, -1);
//             ctx.drawImage(
//                 assets.pipe.top, 
//                 pipe.x, 
//                 -pipe.topHeight, 
//                 pipe.width, 
//                 pipe.topHeight
//             );
//             ctx.restore();
            
//             // Draw bottom pipe
//             ctx.drawImage(
//                 assets.pipe.bottom, 
//                 pipe.x, 
//                 pipe.bottomY, 
//                 pipe.width, 
//                 canvas.height - pipe.bottomY - gameState.ground.height
//             );
//         }
//     }

//     //-------------------------------------------------------
//     // 4.3 ADD DIFFERENT GAME MODES - Stars Game Mode Functions
//     //-------------------------------------------------------
    
//     // Create a regular star at a random position
//     function createStar() {
//         const minY = 50;
//         const maxY = canvas.height - gameState.ground.height - 50;
//         let x = canvas.width; // Start positioning stars at the right edge of the screen
//         let y = minY + Math.random() * (maxY - minY);
        
//         // In pipes-and-stars mode, ensure star doesn't overlap with pipes
//         if (gameSettings.mode === 'pipes-and-stars') {
//             // Check if position is within a pipe, and if so, adjust
//             let attempts = 0;
//             const maxAttempts = 10;
            
//             // Find a position for the star that's not inside a pipe
//             while (attempts < maxAttempts) {
//                 // Check if current position would conflict with pipes
//                 let conflictsWithPipe = false;
                
//                 // Get the furthest pipe to properly position stars
//                 let lastPipe = null;
//                 for (const pipe of gameState.pipes) {
//                     if (!lastPipe || pipe.x > lastPipe.x) {
//                         lastPipe = pipe;
//                     }
//                 }
                
//                 if (lastPipe) {
//                     // Position star after the last pipe with some spacing
//                     const pipeEndX = lastPipe.x + lastPipe.width;
//                     const buffer = 80; // Buffer space from pipe
                    
//                     if (x < pipeEndX + buffer) {
//                         // If the default position is too close to the last pipe, position after it
//                         x = pipeEndX + buffer + Math.random() * 100; // Add some randomness
//                     }
                    
//                     // Check if this position conflicts with any pipe
//                     conflictsWithPipe = isPointInPipe(x, y);
//                 }
                
//                 if (!conflictsWithPipe) {
//                     break; // We found a good position
//                 }
                
//                 // Try a new y-position
//                 y = minY + Math.random() * (maxY - minY);
//                 attempts++;
//             }
//         }
        
//         // Occasionally create a big star (5% chance) - using the configured chance value
//         const isBigStar = Math.random() < gameState.bigStarChance;
        
//         return {
//             x: x,
//             y: y,
//             width: isBigStar ? 50 : 30, // Big stars are larger
//             height: isBigStar ? 50 : 30,
//             collected: false,
//             speed: gameState.pipeSpeed, // Stars move at the same speed as pipes
//             isBigStar: isBigStar, // Flag to identify big stars
//             points: isBigStar ? 5 : 1 // Big stars worth 5 points
//         };
//     }

//     // Update the gameState object to include stars
//     gameState.stars = [];
//     gameState.starSpawnInterval = 2000; // milliseconds
//     gameState.lastStarTime = 0;
//     gameState.bigStarChance = 0.05; // 5% chance for big star

//     // Function to check star collection
//     function checkStarCollisions() {
//         const bird = gameState.bird;
        
//         for (const star of gameState.stars) {
//             if (!star.collected &&
//                 bird.x < star.x + star.width &&
//                 bird.x + bird.width > star.x &&
//                 bird.y < star.y + star.height &&
//                 bird.y + bird.height > star.y) {
                
//                 // Star collected
//                 star.collected = true;
                
//                 // Add points based on star type
//                 if (star.isBigStar) {
//                     gameState.score += 5; // Big star worth 5 points
//                     // Play big star sound - Fixed by removing volume adjustment which was causing issues
//                     if (sounds.bigStar) {
//                         sounds.bigStar.currentTime = 0;
//                         // Remove the problematic volume adjustment
//                         sounds.bigStar.play().catch(e => console.log("Audio play failed:", e));
//                     }
//                 } else {
//                     gameState.score += 1; // Regular star worth 1 point
//                     // Play score sound
//                     if (sounds.score) {
//                         sounds.score.currentTime = 0;
//                         sounds.score.play().catch(e => console.log("Audio play failed:", e));
//                     }
//                 }
                
//                 updateScore(gameState.score);
//             }
//         }
//     }

//     // Function to update and draw stars
//     function handleStarsMode() {
//         // Only handle stars in star-related game modes
//         if (gameSettings.mode !== 'stars' && gameSettings.mode !== 'pipes-and-stars') {
//             return;
//         }
        
//         // Create new stars at intervals
//         const currentTime = Date.now();
//         if (currentTime - gameState.lastStarTime > gameState.starSpawnInterval) {
//             gameState.stars.push(createStar());
//             gameState.lastStarTime = currentTime;
//         }
        
//         // Update and draw each star
//         gameState.stars = gameState.stars.filter(star => star.x + star.width > 0 && !star.collected);
        
//         for (const star of gameState.stars) {
//             // Move star
//             star.x -= star.speed;
            
//             // Draw star
//             if (!star.collected) {
//                 ctx.save();
//                 // Add a gentle pulsing/rotating effect to make stars more appealing
//                 const pulse = 1 + 0.1 * Math.sin(Date.now() / 200);
//                 ctx.translate(star.x + star.width / 2, star.y + star.height / 2);
//                 ctx.rotate(Date.now() / 1000);
//                 ctx.scale(pulse, pulse);
                
//                 // Draw either regular or big star
//                 if (star.isBigStar) {
//                     ctx.drawImage(assets.bigStar, -star.width / 2, -star.height / 2, star.width, star.height);
                    
//                     // Add a special glow effect for big stars
//                     const gradient = ctx.createRadialGradient(0, 0, star.width/4, 0, 0, star.width);
//                     gradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
//                     gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
                    
//                     ctx.fillStyle = gradient;
//                     ctx.fillRect(-star.width, -star.width, star.width * 2, star.width * 2);
//                 } else {
//                     ctx.drawImage(assets.star, -star.width / 2, -star.height / 2, star.width, star.height);
//                 }
                
//                 ctx.restore();
//             }
//         }
        
//         // Check star collisions
//         checkStarCollisions();
//     }

//     //-------------------------------------------------------
//     // 4.3 ADD DIFFERENT GAME MODES - Balloons Game Mode Placeholder
//     //-------------------------------------------------------
    
//     // TODO: Implement Balloons game mode functions
//     /*
//     function createBalloon() {
//         // Will create balloons of different colors and sizes
//         // Balloons will float upward at different speeds
//         // Some balloons will be worth more points
//     }
    
//     function handleBalloonsMode() {
//         // Handle balloon creation, movement, and collision detection
//         // Different balloon types will have different behaviors
//         // Implement balloon popping animation and sound effects
//     }
//     */

//     //-------------------------------------------------------
//     // 4.1 IMPLEMENT SCORING SYSTEM - Enhanced jump function with sound
//     //-------------------------------------------------------
//     function jump() {
//         if (gameState.running) {
//             gameState.bird.velocity = gameState.bird.jumpStrength;
            
//             // Play wing flap sound
//             if (sounds.wing) {
//                 sounds.wing.currentTime = 0;
//                 sounds.wing.play().catch(e => console.log("Audio play failed:", e));
//             }
//         }
//     }
    
//     // Check collisions
//     function checkCollisions() {
//         const bird = gameState.bird;

//         // Skip collision check during invulnerability
//         if (gameState.invulnerable) return;
        
//         // Ground collision
//         if (bird.y + bird.height >= gameState.ground.y) {
//             loseLife();
//             return;
//         }
        
//         // Ceiling collision
//         if (bird.y <= 0) {
//             bird.y = 0;
//             bird.velocity = 0;
//         }
        
//         // Only check pipe collisions in pipe-related game modes
//         if (gameSettings.mode === 'pipes' || gameSettings.mode === 'pipes-and-stars') {
//             // Pipe collisions
//             for (const pipe of gameState.pipes) {
//                 // Check collision only if pipes are in range of bird
//                 if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width) {
//                     // Check collision with top pipe
//                     if (bird.y < pipe.topHeight) {
//                         loseLife();
//                         return;
//                     }
                    
//                     // Check collision with bottom pipe
//                     if (bird.y + bird.height > pipe.bottomY) {
//                         loseLife();
//                         return;
//                     }
//                 }
//             }
//         }
//     }

//     // Add these new functions after checkCollisions function
//     function loseLife() {
//         gameState.lives--;
//         updateLivesDisplay();
        
//         // Play hit sound
//         if (sounds.hit) {
//             sounds.hit.currentTime = 0;
//             sounds.hit.play().catch(e => console.log("Audio play failed:", e));
//         }
        
//         // Check if no more lives
//         if (gameState.lives <= 0) {
//             gameOver();
//         } else {
//             resetBirdPosition();
//         }
//     }

//     function resetBirdPosition() {
//         // Reset bird position but keep the game running
//         gameState.bird.y = canvas.height / 3;
//         gameState.bird.velocity = 0;
        
//         // Give player a brief invulnerability period
//         gameState.invulnerable = true;
//         setTimeout(() => {
//             gameState.invulnerable = false;
//         }, 1500); // 1.5 seconds of invulnerability
//     }

//     function updateLivesDisplay() {
//         document.getElementById('lives-count').textContent = `${gameState.lives}/15`;
//     }
    
//     //-------------------------------------------------------
//     // 4.1 IMPLEMENT SCORING SYSTEM - Enhanced updateScore function
//     //-------------------------------------------------------
//     function updateScore(score) {
//         // Update center score display
//         document.getElementById('score').textContent = score;
        
//         // Update high score if needed
//         if (score > gameState.highScore) {
//             gameState.highScore = score;
//             localStorage.setItem('flappyHighScore', score);
//         }
        
//         // Handle arcade mode difficulty progression
//         if (gameState.difficulty === 'arcade' && score > 0 && score % gameState.arcadeMode.scoreThreshold === 0) {
//             gameState.pipeSpeed += gameState.arcadeMode.speedIncrease;
//             gameState.pipeGap = Math.max(90, gameState.pipeGap - gameState.arcadeMode.gapDecrease);
//         }
//     }
    
//     //-------------------------------------------------------
//     // 4.1 IMPLEMENT SCORING SYSTEM - Enhanced gameOver function with sound and high score
//     //-------------------------------------------------------
//     function gameOver() {
//         gameState.running = false;
        
//         // Play hit sound
//         if (sounds.hit) {
//             sounds.hit.currentTime = 0;
//             sounds.hit.play().catch(e => console.log("Audio play failed:", e));
//         }
//         // Stop smile detection if it's active
//         if (smileController && controlMode === 'smile') {
//             smileController.stopSmileDetection();
//         }
//         document.getElementById('final-score').textContent = `Score: ${gameState.score}`;
//         document.getElementById('high-score').textContent = `High Score: ${gameState.highScore}`;
//         showScreen('gameOver');
//     }
    
//     // Modify the gameLoop function to include all game modes
//     function gameLoop(timestamp) {
//         if (!gameState.running) return;

//         // Control frame rate
//         const elapsed = timestamp - lastFrameTime;
//         if (elapsed < frameDelay) {
//             requestAnimationFrame(gameLoop);
//             return;
//         }
//         lastFrameTime = timestamp;
        
//         // Clear canvas
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
        
//         // Draw background
//         ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        
//         // Handle pipes mode
//         handlePipesMode();
        
//         // Handle stars mode
//         handleStarsMode();
        
//         // Pause button functionality
//         document.getElementById('pause-btn').addEventListener('click', togglePause);
//         document.getElementById('continue-btn').addEventListener('click', togglePause);
//         document.getElementById('pause-main-menu-btn').addEventListener('click', function() {
//             if (gameState.running) togglePause(); // Ensure game is paused before going to menu
//             showScreen('mainMenu');
//         });

//         // Toggle pause function
//         function togglePause() {
//             if (gameState.running) {
//                 gameState.running = false;
//                 showScreen('pauseScreen');
//             } else {
//                 gameState.running = true;
//                 showScreen('game');
//                 requestAnimationFrame(gameLoop);
//             }
//         }

//         // TODO: Add balloons mode handling
//         // if (gameSettings.mode === 'balloons' || gameSettings.mode === 'all') {
//         //     handleBalloonsMode();
//         // }
        
//         // Update bird position
//         gameState.bird.velocity += gameState.gravity;
//         gameState.bird.velocity = Math.max(Math.min(gameState.bird.velocity, 8), -8); // Limit velocity range
//         gameState.bird.y += gameState.bird.velocity;
        
//         // Draw bird (use animation frame based on velocity)
//         let birdFrame = 1; // Default to middle frame
//         if (gameState.bird.velocity < -2) {
//             birdFrame = 0; // Up flap when rising quickly
//         } else if (gameState.bird.velocity > 2) {
//             birdFrame = 2; // Down flap when falling quickly
//         }
        
//         // Apply rotation based on velocity
//         ctx.save();
//         ctx.translate(
//             gameState.bird.x + gameState.bird.width / 2, 
//             gameState.bird.y + gameState.bird.height / 2
//         );

//         // Calculate rotation angle
//         const angle = Math.min(
//             Math.max(gameState.bird.velocity * 2, -25), 
//             70
//         ) * Math.PI / 180;

//         ctx.rotate(angle);

//         // Add flashing effect during invulnerability
//         if (gameState.invulnerable && Math.floor(Date.now() / 150) % 2 === 0) {
//             // Skip drawing the bird every other frame for flashing effect
//         } else {
//             ctx.drawImage(
//                 assets.bird[birdFrame], 
//                 -gameState.bird.width / 2, 
//                 -gameState.bird.height / 2, 
//                 gameState.bird.width, 
//                 gameState.bird.height
//             );
//         }
//         ctx.restore();
        
//         // Draw ground
//         ctx.drawImage(
//             assets.ground, 
//             0, 
//             gameState.ground.y, 
//             canvas.width, 
//             assets.ground.height
//         );
        
//         // Check collisions
//         checkCollisions();
        
//         // Continue game loop
//         requestAnimationFrame(gameLoop);
//     }

//     // Add this function to check if assets are loaded
//     function checkAssets() {
//         console.log("Checking assets...");
        
//         // Check bird assets
//         console.log("Bird assets:", assets.bird.length, "images");
//         assets.bird.forEach((img, index) => {
//             console.log(`Bird image ${index}: ${img.complete ? "Loaded" : "Not loaded"} (width: ${img.width}, height: ${img.height})`);
//         });
        
//         // Check background
//         console.log(`Background: ${assets.background ? (assets.background.complete ? "Loaded" : "Not loaded") : "Missing"}`);
//         if (assets.background) {
//             console.log(`Background dimensions: ${assets.background.width}x${assets.background.height}`);
//         }
        
//         // Check pipes
//         console.log(`Pipe (top): ${assets.pipe.top ? (assets.pipe.top.complete ? "Loaded" : "Not loaded") : "Missing"}`);
//         console.log(`Pipe (bottom): ${assets.pipe.bottom ? (assets.pipe.bottom.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        
//         // Check ground
//         console.log(`Ground: ${assets.ground ? (assets.ground.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        
//         // Check star assets
//         console.log(`Star: ${assets.star ? (assets.star.complete ? "Loaded" : "Not loaded") : "Missing"}`);
//         console.log(`Big Star: ${assets.bigStar ? (assets.bigStar.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        
//         return assets.bird.length > 0 && 
//             assets.bird[0].complete && 
//             assets.background && 
//             assets.background.complete &&
//             assets.pipe.top &&
//             assets.pipe.top.complete &&
//             assets.ground &&
//             assets.ground.complete &&
//             assets.star &&
//             assets.star.complete;
//     }

//     // Handle smile calibration completion
//     function handleCalibrationComplete() {
//         controlMode = 'smile';
//         showScreen('mainMenu');
        
//         // Update input selection UI to show smile control as selected
//         const inputButtons = document.querySelectorAll('.input-btn');
//         inputButtons.forEach(btn => {
//             btn.classList.remove('selected');
//             if (btn.dataset.input === 'smile') {
//                 btn.classList.add('selected');
//             }
//         });
//         gameSettings.inputMethod = 'smile';
//     }

//     // Add to smile controller initialization
//     if (smileController) {
//         smileController.onCalibrationComplete = handleCalibrationComplete;
//     }


//     //-------------------------------------------------------
//     // 4.3 ADD DIFFICULTY LEVELS - Enhanced startGame function with game mode specific settings
//     //-------------------------------------------------------
//     function startGame() {
//         console.log("Starting game with mode:", gameSettings.mode);
//         console.log("Difficulty level:", gameSettings.difficulty);
        
//         // Force resize canvas before checking assets
//         resizeCanvas();
        
//         // Check if assets are loaded
//         const assetsLoaded = checkAssets();
//         console.log("All assets loaded:", assetsLoaded ? "Yes" : "No");
        
//         if (!assetsLoaded) {
//             console.log("Waiting for assets to load...");
//             // Try again in a moment
//             setTimeout(startGame, 500);
//             return;
//         }
        
//         // Reset game state
//         gameState.running = true;
//         gameState.score = 0;
//         gameState.lives = 15; // Reset lives
//         gameState.bird.y = canvas.height / 3;
//         gameState.bird.velocity = 0;
//         gameState.pipes = [];
//         gameState.stars = []; // Reset stars array
//         gameState.lastStarTime = 0; // Reset star timer
//         gameState.invulnerable = false;
        
//         // Update displays
//         updateScore(0);
//         updateLivesDisplay();
        
//         // Apply difficulty settings
//         gameState.difficulty = gameSettings.difficulty;
//         gameState.arcadeMode.active = false; // Reset arcade mode
        
//         //-------------------------------------------------------
//         // 4.3 GAME MODE SPECIFIC DIFFICULTY SETTINGS
//         //-------------------------------------------------------
        
//         // Set base difficulty parameters
//         switch (gameSettings.difficulty) {
//             case 'easy':
//                 gameState.gravity = 0.25;
//                 gameState.bird.jumpStrength = -4.5;
//                 break;
//             case 'normal':
//                 gameState.gravity = 0.3;
//                 gameState.bird.jumpStrength = -5;
//                 break;
//             case 'hard':
//                 gameState.gravity = 0.35;
//                 gameState.bird.jumpStrength = -5.5;
//                 break;
//             case 'arcade':
//                 gameState.arcadeMode.active = true;
//                 gameState.gravity = 0.3;
//                 gameState.bird.jumpStrength = -5;
//                 break;
//         }
        
//         // Apply game mode specific settings
//         if (gameSettings.mode === 'pipes') {
//             // PIPES MODE SETTINGS
//             switch (gameSettings.difficulty) {
//                 case 'easy':
//                     gameState.pipeGap = 180;
//                     gameState.pipeSpeed = 1.3;
//                     gameState.pipeDistance = 300;
//                     break;
//                 case 'normal':
//                     gameState.pipeGap = 150;
//                     gameState.pipeSpeed = 2;
//                     gameState.pipeDistance = 250;
//                     break;
//                 case 'hard':
//                     gameState.pipeGap = 120;
//                     gameState.pipeSpeed = 2.5;
//                     gameState.pipeDistance = 220;
//                     break;
//                 case 'arcade':
//                     gameState.pipeGap = 150;
//                     gameState.pipeSpeed = 2;
//                     gameState.pipeDistance = 250;
//                     gameState.arcadeMode.speedIncrease = 0.1;
//                     gameState.arcadeMode.gapDecrease = 1;
//                     gameState.arcadeMode.scoreThreshold = 5;
//                     break;
//             }
//         } 
//         else if (gameSettings.mode === 'stars') {
//             // STARS MODE SETTINGS
//             switch (gameSettings.difficulty) {
//                 case 'easy':
//                     gameState.pipeSpeed = 1.5; // Star movement speed
//                     gameState.starSpawnInterval = 2500; // Slower star spawn for easy
//                     gameState.bigStarChance = 0.08; // Higher chance of big stars in easy mode
//                     break;
//                 case 'normal':
//                     gameState.pipeSpeed = 2;
//                     gameState.starSpawnInterval = 2000;
//                     gameState.bigStarChance = 0.05;
//                     break;
//                 case 'hard':
//                     gameState.pipeSpeed = 2.8;
//                     gameState.starSpawnInterval = 1500; // Faster star spawn for hard
//                     gameState.bigStarChance = 0.03; // Lower chance of big stars in hard mode
//                     break;
//                 case 'arcade':
//                     gameState.pipeSpeed = 2;
//                     gameState.starSpawnInterval = 2000;
//                     gameState.bigStarChance = 0.05;
//                     break;
//             }
//         }
//         else if (gameSettings.mode === 'pipes-and-stars') {
//             // COMBINED MODE SETTINGS
//             switch (gameSettings.difficulty) {
//                 case 'easy':
//                     gameState.pipeGap = 180;
//                     gameState.pipeSpeed = 1.5;
//                     gameState.pipeDistance = 300;
//                     gameState.starSpawnInterval = 3000;
//                     gameState.bigStarChance = 0.08;
//                     break;
//                 case 'normal':
//                     gameState.pipeGap = 150;
//                     gameState.pipeSpeed = 2;
//                     gameState.pipeDistance = 250;
//                     gameState.starSpawnInterval = 2500;
//                     gameState.bigStarChance = 0.05;
//                     break;
//                 case 'hard':
//                     gameState.pipeGap = 120;
//                     gameState.pipeSpeed = 2.5;
//                     gameState.pipeDistance = 220;
//                     gameState.starSpawnInterval = 2000;
//                     gameState.bigStarChance = 0.03;
//                     break;
//                 case 'arcade':
//                     gameState.pipeGap = 150;
//                     gameState.pipeSpeed = 2;
//                     gameState.pipeDistance = 250;
//                     gameState.starSpawnInterval = 2500;
//                     gameState.bigStarChance = 0.05;
//                     gameState.arcadeMode.speedIncrease = 0.08;
//                     gameState.arcadeMode.gapDecrease = 1;
//                     gameState.arcadeMode.scoreThreshold = 3;
//                     break;
//             }
//         }
        
//         // Set game mode specific parameters
//         if (gameSettings.mode === 'stars') {
//             // In stars-only mode, make the game slightly more challenging
//             // by having more frequent stars that move faster
//             gameState.starSpawnInterval *= 0.7;
//         }
        
//         updateScore(0);
//         showScreen('game');
        
//         // Draw initial frame
//         console.log("Drawing initial frame...");
//         try {
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//             if (assets.background && assets.background.complete) {
//                 ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
//             }
//             if (assets.bird[0] && assets.bird[0].complete) {
//                 ctx.drawImage(assets.bird[0], gameState.bird.x, gameState.bird.y, gameState.bird.width, gameState.bird.height);
//             }
//         } catch (error) {
//             console.error("Error drawing initial frame:", error);
//         }
        
//         // Start game loop
//         console.log("Starting game loop...");
//         lastFrameTime = performance.now();
//         requestAnimationFrame(gameLoop);
//     }

//     // Function to show a specific screen
//     function showScreen(screenId) {
//         Object.values(screens).forEach(screen => {
//             screen.classList.remove('active');
//         });
//         screens[screenId].classList.add('active');
//     }
    
//     // Event listeners
//     window.addEventListener('resize', resizeCanvas);
    
//     document.addEventListener('keydown', function(event) {
//         if (event.code === 'Space' && gameSettings.inputMethod === 'space') {
//             event.preventDefault(); // Prevent page scrolling on space
//             jump();
//         }
//     });
    
//     // Touch support for mobile
//     canvas.addEventListener('touchstart', function(event) {
//         event.preventDefault();
//         if (gameSettings.inputMethod === 'space') {
//             jump();
//         }
//     });
    
//     // Button handlers
//     document.getElementById('start-game-btn').addEventListener('click', function() {
//         // Regular start game functionality
//         startGame();
        
//         // Add extra debug info
//         console.log("Canvas context exists:", !!ctx);
//         console.log("Canvas dimensions:", canvas.width, canvas.height);
//     });

    
//     document.getElementById('play-again-btn').addEventListener('click', startGame);
    
//     document.getElementById('back-to-menu-btn').addEventListener('click', function() {
//         showScreen('mainMenu');
//     });
    
//     // Setting buttons event listeners
//     const modeButtons = document.querySelectorAll('.mode-btn');
//     modeButtons.forEach(button => {
//         button.addEventListener('click', function() {
//             modeButtons.forEach(btn => btn.classList.remove('selected'));
//             this.classList.add('selected');
//             gameSettings.mode = this.dataset.mode;
//         });
//     });
    
//     const difficultyButtons = document.querySelectorAll('.difficulty-btn');
//     difficultyButtons.forEach(button => {
//         button.addEventListener('click', function() {
//             difficultyButtons.forEach(btn => btn.classList.remove('selected'));
//             this.classList.add('selected');
//             gameSettings.difficulty = this.dataset.difficulty;
//         });
//     });
    
//     const inputButtons = document.querySelectorAll('.input-btn');
//     inputButtons.forEach(button => {
//         button.addEventListener('click', function() {
//             inputButtons.forEach(btn => btn.classList.remove('selected'));
//             this.classList.add('selected');
//             gameSettings.inputMethod = this.dataset.input;
            
//             // If smile control is selected, initialize it
//             if (gameSettings.inputMethod === 'smile') {
//                 controlMode = 'smile';
//                 if (smileController) {
//                     smileController.startSmileDetection();
//                 } else {
//                     initializeSmileControl();
//                     if (smileController) smileController.startSmileDetection();
//                 }
//             } else {
//                 controlMode = 'keyboard';
//                 if (smileController) smileController.stopSmileDetection();
//             }
//         });
//     });
    
//     // Initialize
//     loadAssets();
//     initializeSmileControl(); // Add this line to initialize smile control
//     showScreen('mainMenu');
// });

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const screens = {
        mainMenu: document.getElementById('main-menu'),
        game: document.getElementById('game-screen'),
        calibration: document.getElementById('calibration-screen'),
        gameOver: document.getElementById('game-over-screen'),
        pauseScreen: document.getElementById('pause-screen'),
    };
    
    // Canvas setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Game assets
    const assets = {
        bird: [],
        background: null,
        pipe: {
            top: null,
            bottom: null
        },
        ground: null
    };
    
    // Add these variable declarations
    let smileController = null;  // Initialize the smileController variable
    let controlMode = 'keyboard'; // Default control mode

    //-------------------------------------------------------
    // 4.1 IMPLEMENT SCORING SYSTEM - Audio assets for scoring
    //-------------------------------------------------------
    const sounds = {
        score: new Audio('/static/assets/audio/point.ogg'),
        hit: new Audio('/static/assets/audio/hit.ogg'),
        wing: new Audio('/static/assets/audio/wing.ogg'),
        bigStar: new Audio('/static/assets/audio/point.ogg') // Same sound for big star, but could be different
    };
    
    // Game settings
    let gameSettings = {
        mode: 'pipes',
        difficulty: 'normal',
        inputMethod: 'space'
    };
    
    //-------------------------------------------------------
    // 4.3 ADD DIFFICULTY LEVELS - Enhanced gameState with difficulty settings
    //-------------------------------------------------------
    let gameState = {
        running: false,
        score: 0,
        highScore: localStorage.getItem('flappyHighScore') || 0, // Added highScore tracking
        gravity: 0.3,
        bird: {
            x: 50,
            y: 150,
            width: 34,
            height: 24,
            velocity: 0,
            jumpStrength: -5
        },
        pipes: [],
        pipeGap: 150,
        pipeWidth: 52,
        pipeDistance: 220,
        pipeSpeed: 2, // Base pipe speed - now configurable by difficulty
        nextPipeTime: 0,
        ground: {
            y: 0,
            height: 112
        },
        difficulty: 'normal', // Current difficulty level
        arcadeMode: {
            active: false,
            speedIncrease: 0.1,
            gapDecrease: 1,
            scoreThreshold: 5 // Points needed to increase difficulty
        }
    };

    // Add the new variables here:
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameDelay = 1000 / targetFPS;

    // Load assets function
    function loadAssets() {
        // Load bird sprites (3 frames for animation)
        // Using yellowbird sprites as default
        const birdPrefixes = ['yellowbird-upflap', 'yellowbird-midflap', 'yellowbird-downflap'];
        birdPrefixes.forEach(prefix => {
            const img = new Image();
            img.src = `/static/assets/sprites/${prefix}.png`;
            img.onerror = function() {
                console.error(`Failed to load: ${img.src}`);
                // Try alternative location or bird color
                img.src = `/static/assets/sprites/bluebird-${prefix.split('-')[1]}.png`;
            };
            assets.bird.push(img);
        });
        
        // Load background
        assets.background = new Image();
        assets.background.src = '/static/assets/sprites/background-day.png';
        assets.background.onerror = function() {
            console.error('Failed to load background, trying alternative');
            assets.background.src = '/static/assets/sprites/background-night.png';
        };
        
        // Load pipes
        assets.pipe.top = new Image();
        assets.pipe.top.src = '/static/assets/sprites/pipe-green.png';
        assets.pipe.top.onerror = function() {
            assets.pipe.top.src = '/static/assets/sprites/pipe-red.png';
        };
        
        assets.pipe.bottom = new Image();
        assets.pipe.bottom.src = '/static/assets/sprites/pipe-green.png';
        assets.pipe.bottom.onerror = function() {
            assets.pipe.bottom.src = '/static/assets/sprites/pipe-red.png';
        };
        
        // Load ground
        assets.ground = new Image();
        assets.ground.src = '/static/assets/sprites/base.png';
        
        // Once background is loaded, we can set ground height
        assets.background.onload = function() {
            // Set canvas dimensions based on background size
            setTimeout(resizeCanvas, 100); // Add a small delay to ensure DOM is ready
            
            // Calculate ground position
            gameState.ground.y = canvas.height - assets.ground.height;
            console.log("Background loaded, ground position set:", gameState.ground.y);
        };

        // Load heart icon
        assets.heart = new Image();
        assets.heart.src = '/static/assets/sprites/heart.png';
        assets.heart.onerror = function() {
            console.error('Failed to load heart sprite');
        };

        // Load star assets
        assets.star = new Image();
        assets.star.src = '/static/assets/sprites/star.png';
        assets.star.onerror = function() {
            console.error('Failed to load star sprite');
        };
        
        // Load big star asset
        assets.bigStar = new Image();
        assets.bigStar.src = '/static/assets/sprites/star.png'; // Using the same star image but will be scaled larger
        assets.bigStar.onerror = function() {
            console.error('Failed to load big star sprite');
        };
    }

    // Add this function after loadAssets() function (around line 474)
    function initializeSmileControl() {
        if (window.SmileGameController) {
            smileController = new SmileGameController({
                jump: jump,  // Use your existing jump function
                start: startGame,
                gameOver: gameOver
            });
            
            // // Add button to toggle smile control in the main menu
            // const controlsContainer = document.getElementById('controls-container');
            // if (controlsContainer) {
            //     const smileControlBtn = document.createElement('button');
            //     smileControlBtn.id = 'smile-control-btn';
            //     smileControlBtn.className = 'menu-btn';
            //     smileControlBtn.textContent = 'Calibrate Smile Control';
            //     smileControlBtn.addEventListener('click', function() {
            //         smileController.startCalibration();
            //         showScreen('calibration');
            //     });
            //     controlsContainer.appendChild(smileControlBtn);
            // }
        } else {
            console.error("SmileGameController not found. Make sure to include smile-controller.js before game.js");
        }
    }
    
    // Resize canvas
    function resizeCanvas() {
        // Get actual window dimensions
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Update ground position
        if (assets.ground) {
            gameState.ground.y = canvas.height - assets.ground.height;
        }
        
        // Also update bird starting position
        gameState.bird.y = canvas.height / 2 - gameState.bird.height;
    }
        
    //-------------------------------------------------------
    // 4.3 ADD DIFFERENT GAME MODES - Pipe Game Mode Functions
    //-------------------------------------------------------
    
    // Create a pipe
    function createPipe() {
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
    
    // Check if a point is within a pipe obstacle
    function isPointInPipe(x, y) {
        for (const pipe of gameState.pipes) {
            if (x >= pipe.x && x <= pipe.x + pipe.width) {
                // Check if point is inside the top or bottom pipe
                if (y <= pipe.topHeight || y >= pipe.bottomY) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Handle game logic for pipes mode
    function handlePipesMode() {
        // Only run if in a pipe-related game mode
        if (gameSettings.mode !== 'pipes' && gameSettings.mode !== 'pipes-and-stars') {
            return;
        }
        
        // Create new pipes
        if (gameState.pipes.length === 0 || 
            gameState.pipes[gameState.pipes.length - 1].x < 
            canvas.width - gameState.pipeDistance) {
            gameState.pipes.push(createPipe());
        }
        
        // Update and draw pipes
        gameState.pipes = gameState.pipes.filter(pipe => pipe.x + pipe.width > 0);
        
        for (const pipe of gameState.pipes) {
            // Move pipe
            pipe.x -= gameState.pipeSpeed;
            
            // Check if pipe was passed - only count for score in pipes-only mode
            if (!pipe.passed && gameState.bird.x > pipe.x + pipe.width && gameSettings.mode === 'pipes') {
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

    //-------------------------------------------------------
    // 4.3 ADD DIFFERENT GAME MODES - Stars Game Mode Functions
    //-------------------------------------------------------
    
    // Create a regular star at a random position
    function createStar() {
        const minY = 50;
        const maxY = canvas.height - gameState.ground.height - 50;
        let x = canvas.width; // Start positioning stars at the right edge of the screen
        let y = minY + Math.random() * (maxY - minY);
        
        // In pipes-and-stars mode, ensure star doesn't overlap with pipes
        if (gameSettings.mode === 'pipes-and-stars') {
            // Check if position is within a pipe, and if so, adjust
            let attempts = 0;
            const maxAttempts = 10;
            
            // Find a position for the star that's not inside a pipe
            while (attempts < maxAttempts) {
                // Check if current position would conflict with pipes
                let conflictsWithPipe = false;
                
                // Get the furthest pipe to properly position stars
                let lastPipe = null;
                for (const pipe of gameState.pipes) {
                    if (!lastPipe || pipe.x > lastPipe.x) {
                        lastPipe = pipe;
                    }
                }
                
                if (lastPipe) {
                    // Position star after the last pipe with some spacing
                    const pipeEndX = lastPipe.x + lastPipe.width;
                    const buffer = 80; // Buffer space from pipe
                    
                    if (x < pipeEndX + buffer) {
                        // If the default position is too close to the last pipe, position after it
                        x = pipeEndX + buffer + Math.random() * 100; // Add some randomness
                    }
                    
                    // Check if this position conflicts with any pipe
                    conflictsWithPipe = isPointInPipe(x, y);
                }
                
                if (!conflictsWithPipe) {
                    break; // We found a good position
                }
                
                // Try a new y-position
                y = minY + Math.random() * (maxY - minY);
                attempts++;
            }
        }
        
        // Occasionally create a big star (5% chance) - using the configured chance value
        const isBigStar = Math.random() < gameState.bigStarChance;
        
        return {
            x: x,
            y: y,
            width: isBigStar ? 50 : 30, // Big stars are larger
            height: isBigStar ? 50 : 30,
            collected: false,
            speed: gameState.pipeSpeed, // Stars move at the same speed as pipes
            isBigStar: isBigStar, // Flag to identify big stars
            points: isBigStar ? 5 : 1 // Big stars worth 5 points
        };
    }

    // Update the gameState object to include stars
    gameState.stars = [];
    gameState.starSpawnInterval = 2000; // milliseconds
    gameState.lastStarTime = 0;
    gameState.bigStarChance = 0.05; // 5% chance for big star

    // Function to check star collection
    function checkStarCollisions() {
        const bird = gameState.bird;
        
        for (const star of gameState.stars) {
            if (!star.collected &&
                bird.x < star.x + star.width &&
                bird.x + bird.width > star.x &&
                bird.y < star.y + star.height &&
                bird.y + bird.height > star.y) {
                
                // Star collected
                star.collected = true;
                
                // Add points based on star type
                if (star.isBigStar) {
                    gameState.score += 5; // Big star worth 5 points
                    // Play big star sound - Fixed by removing volume adjustment which was causing issues
                    if (sounds.bigStar) {
                        sounds.bigStar.currentTime = 0;
                        // Remove the problematic volume adjustment
                        sounds.bigStar.play().catch(e => console.log("Audio play failed:", e));
                    }
                } else {
                    gameState.score += 1; // Regular star worth 1 point
                    // Play score sound
                    if (sounds.score) {
                        sounds.score.currentTime = 0;
                        sounds.score.play().catch(e => console.log("Audio play failed:", e));
                    }
                }
                
                updateScore(gameState.score);
            }
        }
    }

    // Function to update and draw stars
    function handleStarsMode() {
        // Only handle stars in star-related game modes
        if (gameSettings.mode !== 'stars' && gameSettings.mode !== 'pipes-and-stars') {
            return;
        }
        
        // Create new stars at intervals
        const currentTime = Date.now();
        if (currentTime - gameState.lastStarTime > gameState.starSpawnInterval) {
            gameState.stars.push(createStar());
            gameState.lastStarTime = currentTime;
        }
        
        // Update and draw each star
        gameState.stars = gameState.stars.filter(star => star.x + star.width > 0 && !star.collected);
        
        for (const star of gameState.stars) {
            // Move star
            star.x -= star.speed;
            
            // Draw star
            if (!star.collected) {
                ctx.save();
                // Add a gentle pulsing/rotating effect to make stars more appealing
                const pulse = 1 + 0.1 * Math.sin(Date.now() / 200);
                ctx.translate(star.x + star.width / 2, star.y + star.height / 2);
                ctx.rotate(Date.now() / 1000);
                ctx.scale(pulse, pulse);
                
                // Draw either regular or big star
                if (star.isBigStar) {
                    ctx.drawImage(assets.bigStar, -star.width / 2, -star.height / 2, star.width, star.height);
                    
                    // Add a special glow effect for big stars
                    const gradient = ctx.createRadialGradient(0, 0, star.width/4, 0, 0, star.width);
                    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
                    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(-star.width, -star.width, star.width * 2, star.width * 2);
                } else {
                    ctx.drawImage(assets.star, -star.width / 2, -star.height / 2, star.width, star.height);
                }
                
                ctx.restore();
            }
        }
        
        // Check star collisions
        checkStarCollisions();
    }

    //-------------------------------------------------------
    // 4.3 ADD DIFFERENT GAME MODES - Balloons Game Mode Placeholder
    //-------------------------------------------------------
    
    // TODO: Implement Balloons game mode functions
    /*
    function createBalloon() {
        // Will create balloons of different colors and sizes
        // Balloons will float upward at different speeds
        // Some balloons will be worth more points
    }
    
    function handleBalloonsMode() {
        // Handle balloon creation, movement, and collision detection
        // Different balloon types will have different behaviors
        // Implement balloon popping animation and sound effects
    }
    */

    //-------------------------------------------------------
    // 4.1 IMPLEMENT SCORING SYSTEM - Enhanced jump function with sound
    //-------------------------------------------------------
    function jump() {
        if (gameState.running) {
            gameState.bird.velocity = gameState.bird.jumpStrength;
            
            // Play wing flap sound
            if (sounds.wing) {
                sounds.wing.currentTime = 0;
                sounds.wing.play().catch(e => console.log("Audio play failed:", e));
            }
        }
    }
    
    // Check collisions
    function checkCollisions() {
        const bird = gameState.bird;

        // Skip collision check during invulnerability
        if (gameState.invulnerable) return;
        
        // Ground collision
        if (bird.y + bird.height >= gameState.ground.y) {
            loseLife();
            return;
        }
        
        // Ceiling collision
        if (bird.y <= 0) {
            bird.y = 0;
            bird.velocity = 0;
        }
        
        // Only check pipe collisions in pipe-related game modes
        if (gameSettings.mode === 'pipes' || gameSettings.mode === 'pipes-and-stars') {
            // Pipe collisions
            for (const pipe of gameState.pipes) {
                // Check collision only if pipes are in range of bird
                if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width) {
                    // Check collision with top pipe
                    if (bird.y < pipe.topHeight) {
                        loseLife();
                        return;
                    }
                    
                    // Check collision with bottom pipe
                    if (bird.y + bird.height > pipe.bottomY) {
                        loseLife();
                        return;
                    }
                }
            }
        }
    }

    // Add these new functions after checkCollisions function
    function loseLife() {
        gameState.lives--;
        updateLivesDisplay();
        
        // Play hit sound
        if (sounds.hit) {
            sounds.hit.currentTime = 0;
            sounds.hit.play().catch(e => console.log("Audio play failed:", e));
        }
        
        // Check if no more lives
        if (gameState.lives <= 0) {
            gameOver();
        } else {
            resetBirdPosition();
        }
    }

    function resetBirdPosition() {
        // Reset bird position but keep the game running
        gameState.bird.y = canvas.height / 3;
        gameState.bird.velocity = 0;
        
        // Give player a brief invulnerability period
        gameState.invulnerable = true;
        setTimeout(() => {
            gameState.invulnerable = false;
        }, 1500); // 1.5 seconds of invulnerability
    }

    function updateLivesDisplay() {
        document.getElementById('lives-count').textContent = `${gameState.lives}/15`;
    }
    
    //-------------------------------------------------------
    // 4.1 IMPLEMENT SCORING SYSTEM - Enhanced updateScore function
    //-------------------------------------------------------
    function updateScore(score) {
        // Update center score display
        document.getElementById('score').textContent = score;
        
        // Update high score if needed
        if (score > gameState.highScore) {
            gameState.highScore = score;
            localStorage.setItem('flappyHighScore', score);
        }
        
        // Handle arcade mode difficulty progression
        if (gameState.difficulty === 'arcade' && score > 0 && score % gameState.arcadeMode.scoreThreshold === 0) {
            gameState.pipeSpeed += gameState.arcadeMode.speedIncrease;
            gameState.pipeGap = Math.max(90, gameState.pipeGap - gameState.arcadeMode.gapDecrease);
        }
    }
    
    //-------------------------------------------------------
    // 4.1 IMPLEMENT SCORING SYSTEM - Enhanced gameOver function with sound and high score
    //-------------------------------------------------------
    function gameOver() {
        gameState.running = false;
        
        // Play hit sound
        if (sounds.hit) {
            sounds.hit.currentTime = 0;
            sounds.hit.play().catch(e => console.log("Audio play failed:", e));
        }
        // Stop smile detection if it's active
        if (smileController && controlMode === 'smile') {
            smileController.stopSmileDetection();
        }
        document.getElementById('final-score').textContent = `Score: ${gameState.score}`;
        document.getElementById('high-score').textContent = `High Score: ${gameState.highScore}`;
        showScreen('gameOver');
    }
    
    // Modify the gameLoop function to include all game modes
    function gameLoop(timestamp) {
        if (!gameState.running) return;

        // Control frame rate
        const elapsed = timestamp - lastFrameTime;
        if (elapsed < frameDelay) {
            requestAnimationFrame(gameLoop);
            return;
        }
        lastFrameTime = timestamp;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        
        // Handle pipes mode
        handlePipesMode();
        
        // Handle stars mode
        handleStarsMode();
        
        // Pause button functionality
        document.getElementById('pause-btn').addEventListener('click', togglePause);
        document.getElementById('continue-btn').addEventListener('click', togglePause);
        document.getElementById('pause-main-menu-btn').addEventListener('click', function() {
            if (gameState.running) togglePause(); // Ensure game is paused before going to menu
            showScreen('mainMenu');
        });

        // Toggle pause function
        function togglePause() {
            if (gameState.running) {
                gameState.running = false;
                showScreen('pauseScreen');
            } else {
                gameState.running = true;
                showScreen('game');
                requestAnimationFrame(gameLoop);
            }
        }

        // TODO: Add balloons mode handling
        // if (gameSettings.mode === 'balloons' || gameSettings.mode === 'all') {
        //     handleBalloonsMode();
        // }
        
        // Update bird position
        gameState.bird.velocity += gameState.gravity;
        gameState.bird.velocity = Math.max(Math.min(gameState.bird.velocity, 8), -8); // Limit velocity range
        gameState.bird.y += gameState.bird.velocity;
        
        // Draw bird (use animation frame based on velocity)
        let birdFrame = 1; // Default to middle frame
        if (gameState.bird.velocity < -2) {
            birdFrame = 0; // Up flap when rising quickly
        } else if (gameState.bird.velocity > 2) {
            birdFrame = 2; // Down flap when falling quickly
        }
        
        // Apply rotation based on velocity
        ctx.save();
        ctx.translate(
            gameState.bird.x + gameState.bird.width / 2, 
            gameState.bird.y + gameState.bird.height / 2
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
                -gameState.bird.width / 2, 
                -gameState.bird.height / 2, 
                gameState.bird.width, 
                gameState.bird.height
            );
        }
        ctx.restore();
        
        // Draw ground
        ctx.drawImage(
            assets.ground, 
            0, 
            gameState.ground.y, 
            canvas.width, 
            assets.ground.height
        );
        
        // Check collisions
        checkCollisions();
        
        // Continue game loop
        requestAnimationFrame(gameLoop);
    }

    // Add this function to check if assets are loaded
    function checkAssets() {
        console.log("Checking assets...");
        
        // Check bird assets
        console.log("Bird assets:", assets.bird.length, "images");
        assets.bird.forEach((img, index) => {
            console.log(`Bird image ${index}: ${img.complete ? "Loaded" : "Not loaded"} (width: ${img.width}, height: ${img.height})`);
        });
        
        // Check background
        console.log(`Background: ${assets.background ? (assets.background.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        if (assets.background) {
            console.log(`Background dimensions: ${assets.background.width}x${assets.background.height}`);
        }
        
        // Check pipes
        console.log(`Pipe (top): ${assets.pipe.top ? (assets.pipe.top.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        console.log(`Pipe (bottom): ${assets.pipe.bottom ? (assets.pipe.bottom.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        
        // Check ground
        console.log(`Ground: ${assets.ground ? (assets.ground.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        
        // Check star assets
        console.log(`Star: ${assets.star ? (assets.star.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        console.log(`Big Star: ${assets.bigStar ? (assets.bigStar.complete ? "Loaded" : "Not loaded") : "Missing"}`);
        
        return assets.bird.length > 0 && 
            assets.bird[0].complete && 
            assets.background && 
            assets.background.complete &&
            assets.pipe.top &&
            assets.pipe.top.complete &&
            assets.ground &&
            assets.ground.complete &&
            assets.star &&
            assets.star.complete;
    }

    // Handle smile calibration completion
    function handleCalibrationComplete() {
        controlMode = 'smile';
        showScreen('mainMenu');
        
        // Update input selection UI to show smile control as selected
        const inputButtons = document.querySelectorAll('.input-btn');
        inputButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.input === 'smile') {
                btn.classList.add('selected');
            }
        });
        gameSettings.inputMethod = 'smile';
    }

    // Add to smile controller initialization
    if (smileController) {
        smileController.onCalibrationComplete = handleCalibrationComplete;
    }


    //-------------------------------------------------------
    // 4.3 ADD DIFFICULTY LEVELS - Enhanced startGame function with game mode specific settings
    //-------------------------------------------------------
    function startGame() {
        console.log("Starting game with mode:", gameSettings.mode);
        console.log("Difficulty level:", gameSettings.difficulty);
        
        // Force resize canvas before checking assets
        resizeCanvas();
        
        // Check if assets are loaded
        const assetsLoaded = checkAssets();
        console.log("All assets loaded:", assetsLoaded ? "Yes" : "No");
        
        if (!assetsLoaded) {
            console.log("Waiting for assets to load...");
            // Try again in a moment
            setTimeout(startGame, 500);
            return;
        }
        
        // Reset game state
        gameState.running = true;
        gameState.score = 0;
        gameState.lives = 15; // Reset lives
        gameState.bird.y = canvas.height / 3;
        gameState.bird.velocity = 0;
        gameState.pipes = [];
        gameState.stars = []; // Reset stars array
        gameState.lastStarTime = 0; // Reset star timer
        gameState.invulnerable = false;
        
        // Update displays
        updateScore(0);
        updateLivesDisplay();
        
        // Apply difficulty settings
        gameState.difficulty = gameSettings.difficulty;
        gameState.arcadeMode.active = false; // Reset arcade mode
        
        //-------------------------------------------------------
        // 4.3 GAME MODE SPECIFIC DIFFICULTY SETTINGS
        //-------------------------------------------------------
        
        // Set base difficulty parameters
        switch (gameSettings.difficulty) {
            case 'easy':
                gameState.gravity = 0.25;
                gameState.bird.jumpStrength = -4.5;
                break;
            case 'normal':
                gameState.gravity = 0.3;
                gameState.bird.jumpStrength = -5;
                break;
            case 'hard':
                gameState.gravity = 0.35;
                gameState.bird.jumpStrength = -5.5;
                break;
            case 'arcade':
                gameState.arcadeMode.active = true;
                gameState.gravity = 0.3;
                gameState.bird.jumpStrength = -5;
                break;
        }
        
        // Apply game mode specific settings
        if (gameSettings.mode === 'pipes') {
            // PIPES MODE SETTINGS
            switch (gameSettings.difficulty) {
                case 'easy':
                    gameState.pipeGap = 180;
                    gameState.pipeSpeed = 1.3;
                    gameState.pipeDistance = 300;
                    break;
                case 'normal':
                    gameState.pipeGap = 150;
                    gameState.pipeSpeed = 2;
                    gameState.pipeDistance = 250;
                    break;
                case 'hard':
                    gameState.pipeGap = 120;
                    gameState.pipeSpeed = 2.5;
                    gameState.pipeDistance = 220;
                    break;
                case 'arcade':
                    gameState.pipeGap = 150;
                    gameState.pipeSpeed = 2;
                    gameState.pipeDistance = 250;
                    gameState.arcadeMode.speedIncrease = 0.1;
                    gameState.arcadeMode.gapDecrease = 1;
                    gameState.arcadeMode.scoreThreshold = 5;
                    break;
            }
        } 
        else if (gameSettings.mode === 'stars') {
            // STARS MODE SETTINGS
            switch (gameSettings.difficulty) {
                case 'easy':
                    gameState.pipeSpeed = 1.5; // Star movement speed
                    gameState.starSpawnInterval = 2500; // Slower star spawn for easy
                    gameState.bigStarChance = 0.08; // Higher chance of big stars in easy mode
                    break;
                case 'normal':
                    gameState.pipeSpeed = 2;
                    gameState.starSpawnInterval = 2000;
                    gameState.bigStarChance = 0.05;
                    break;
                case 'hard':
                    gameState.pipeSpeed = 2.8;
                    gameState.starSpawnInterval = 1500; // Faster star spawn for hard
                    gameState.bigStarChance = 0.03; // Lower chance of big stars in hard mode
                    break;
                case 'arcade':
                    gameState.pipeSpeed = 2;
                    gameState.starSpawnInterval = 2000;
                    gameState.bigStarChance = 0.05;
                    break;
            }
        }
        else if (gameSettings.mode === 'pipes-and-stars') {
            // COMBINED MODE SETTINGS
            switch (gameSettings.difficulty) {
                case 'easy':
                    gameState.pipeGap = 180;
                    gameState.pipeSpeed = 1.5;
                    gameState.pipeDistance = 300;
                    gameState.starSpawnInterval = 3000;
                    gameState.bigStarChance = 0.08;
                    break;
                case 'normal':
                    gameState.pipeGap = 150;
                    gameState.pipeSpeed = 2;
                    gameState.pipeDistance = 250;
                    gameState.starSpawnInterval = 2500;
                    gameState.bigStarChance = 0.05;
                    break;
                case 'hard':
                    gameState.pipeGap = 120;
                    gameState.pipeSpeed = 2.5;
                    gameState.pipeDistance = 220;
                    gameState.starSpawnInterval = 2000;
                    gameState.bigStarChance = 0.03;
                    break;
                case 'arcade':
                    gameState.pipeGap = 150;
                    gameState.pipeSpeed = 2;
                    gameState.pipeDistance = 250;
                    gameState.starSpawnInterval = 2500;
                    gameState.bigStarChance = 0.05;
                    gameState.arcadeMode.speedIncrease = 0.08;
                    gameState.arcadeMode.gapDecrease = 1;
                    gameState.arcadeMode.scoreThreshold = 3;
                    break;
            }
        }
        
        // Set game mode specific parameters
        if (gameSettings.mode === 'stars') {
            // In stars-only mode, make the game slightly more challenging
            // by having more frequent stars that move faster
            gameState.starSpawnInterval *= 0.7;
        }
        
        updateScore(0);
        showScreen('game');
        
        // Draw initial frame
        console.log("Drawing initial frame...");
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (assets.background && assets.background.complete) {
                ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
            }
            if (assets.bird[0] && assets.bird[0].complete) {
                ctx.drawImage(assets.bird[0], gameState.bird.x, gameState.bird.y, gameState.bird.width, gameState.bird.height);
            }
        } catch (error) {
            console.error("Error drawing initial frame:", error);
        }
        
        // Start game loop
        console.log("Starting game loop...");
        lastFrameTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // Function to show a specific screen
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        screens[screenId].classList.add('active');
    }
    
    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    
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
    
    // Button handlers
    document.getElementById('start-game-btn').addEventListener('click', function() {
        // Regular start game functionality
        startGame();
        
        // Add extra debug info
        console.log("Canvas context exists:", !!ctx);
        console.log("Canvas dimensions:", canvas.width, canvas.height);
    });

    
    document.getElementById('play-again-btn').addEventListener('click', startGame);
    
    document.getElementById('back-to-menu-btn').addEventListener('click', function() {
        showScreen('mainMenu');
    });

    // Connect the existing Calibrate Smile button to the calibration function
    document.getElementById('calibrate-btn').addEventListener('click', function() {
        if (smileController) {
            smileController.startCalibration();
            showScreen('calibration');
        } else {
            initializeSmileControl();
            if (smileController) {
                smileController.startCalibration();
                showScreen('calibration');
            }
        }
    });
    
    // Setting buttons event listeners
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
            gameSettings.inputMethod = this.dataset.input;
            
            // If smile control is selected, initialize it
            if (gameSettings.inputMethod === 'smile') {
                controlMode = 'smile';
                if (smileController) {
                    smileController.startSmileDetection();
                } else {
                    initializeSmileControl();
                    if (smileController) smileController.startSmileDetection();
                }
            } else {
                controlMode = 'keyboard';
                if (smileController) smileController.stopSmileDetection();
            }
        });
    });
    
    // Initialize
    loadAssets();
    initializeSmileControl(); // Add this line to initialize smile control
    showScreen('mainMenu');
});