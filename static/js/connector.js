// // connector.js - Connects smile detection and calibration with the game

// class SmileGameController {
//     constructor(game) {
//         this.game = game;
//         this.smileDetector = null;
//         this.calibration = null;
//         this.isInitialized = false;
//         this.isCalibrated = false;
//         this.smileControlActive = false;
        
//         // Create UI elements for control options
//         this._createControlUI();
//     }
    
//     // Initialize the smile detection system
//     async initialize() {
//         try {
//             // Create and initialize the smile detector
//             this.smileDetector = new SmileDetector({
//                 webcamId: 'webcam',
//                 webcamContainerId: 'webcam-container',
//                 modelsPath: './static/models'
//             });
            
//             const initialized = await this.smileDetector.init();
//             if (!initialized) {
//                 throw new Error('Failed to initialize smile detector');
//             }
            
//             // Create the calibration system
//             this.calibration = new SmileCalibration({
//                 containerId: 'game-container',
//                 webcamId: 'webcam',
//                 smileDetector: this.smileDetector
//             });
            
//             this.isInitialized = true;
//             console.log('Smile game controller initialized');
            
//             // Add ESC key handler for quitting calibration
//             document.addEventListener('keydown', (e) => {
//                 if (e.key === 'Escape' && this.calibration) {
//                     this.calibration.stop();
//                 }
//             });
            
//             return true;
//         } catch (error) {
//             console.error('Error initializing smile game controller:', error);
//             return false;
//         }
//     }
    
//     // Create UI elements for control options
//     _createControlUI() {
//         // Create the smile control button
//         const controlsDiv = document.createElement('div');
//         controlsDiv.style.position = 'absolute';
//         controlsDiv.style.bottom = '10px';
//         controlsDiv.style.left = '10px';
//         controlsDiv.style.zIndex = '100';
        
//         const smileButton = document.createElement('button');
//         smileButton.textContent = 'Play with Smile';
//         smileButton.style.padding = '8px 16px';
//         smileButton.style.fontSize = '16px';
//         smileButton.style.cursor = 'pointer';
//         smileButton.style.marginRight = '10px';
        
//         smileButton.addEventListener('click', () => this.startSmileControl());
        
//         const regularButton = document.createElement('button');
//         regularButton.textContent = 'Play with Keyboard';
//         regularButton.style.padding = '8px 16px';
//         regularButton.style.fontSize = '16px';
//         regularButton.style.cursor = 'pointer';
        
//         regularButton.addEventListener('click', () => {
//             // Stop smile detection if it's running
//             if (this.smileDetector) {
//                 this.smileDetector.stop();
//             }
            
//             // Start the game with regular controls
//             if (this.game && typeof this.game.start === 'function') {
//                 this.game.start();
//             }
//         });
        
//         controlsDiv.appendChild(smileButton);
//         controlsDiv.appendChild(regularButton);
        
//         // Add to the body or a specific container
//         const container = document.getElementById('game-container') || document.body;
//         container.appendChild(controlsDiv);
//     }
    
//     // Start the smile control mode
//     async startSmileControl() {
//         if (!this.isInitialized) {
//             const initialized = await this.initialize();
//             if (!initialized) {
//                 console.error('Failed to initialize smile controller');
//                 return;
//             }
//         }
        
//         // Show full screen webcam during calibration
//         const videoElement = document.getElementById('webcam');
//         if (videoElement) {
//             videoElement.classList.add('webcam-calibration');
//         }
        
//         // Create a temporary bird element for calibration
//         const tempBird = document.createElement('div');
//         tempBird.className = 'flappy-calibration';
//         tempBird.style.position = 'absolute';
//         tempBird.style.left = '50%';
//         tempBird.style.top = '50%';
//         tempBird.style.transform = 'translate(-50%, -50%)';
//         tempBird.style.width = '34px';
//         tempBird.style.height = '24px';
//         tempBird.style.backgroundImage = 'url("static/assets/bird.png")';
//         tempBird.style.backgroundSize = 'contain';
//         tempBird.style.backgroundRepeat = 'no-repeat';
        
//         // Add bird jump method for calibration
//         tempBird.jump = function() {
//             // Apply a simple animation for the jump
//             tempBird.style.transition = 'transform 0.2s ease-out';
//             tempBird.style.transform = 'translate(-50%, -80%)';
            
//             setTimeout(() => {
//                 tempBird.style.transition = 'transform 0.3s ease-in';
//                 tempBird.style.transform = 'translate(-50%, -50%)';
//             }, 200);
//         };
        
//         document.getElementById('game-container').appendChild(tempBird);
        
//         // Start calibration
//         try {
//             const calibrationResult = await this.calibration.start(tempBird);
//             this.isCalibrated = true;
            
//             // Remove temporary bird
//             document.getElementById('game-container').removeChild(tempBird);
            
//             // Reset webcam size
//             if (videoElement) {
//                 videoElement.classList.remove('webcam-calibration');
//             }
            
//             console.log('Calibration complete:', calibrationResult);
            
//             // Start the game with smile control
//             if (this.game && typeof this.game.start === 'function') {
//                 // Start the game
//                 this.game.start();
                
//                 // Start smile detection for game control
//                 this.startSmileDetection();
//             }
//         } catch (error) {
//             console.error('Calibration failed:', error);
            
//             // Remove temporary bird
//             document.getElementById('game-container').removeChild(tempBird);
            
//             // Reset webcam size
//             if (videoElement) {
//                 videoElement.classList.remove('webcam-calibration');
//             }
//         }
//     }
    
//     // Start smile detection for game control
//     startSmileDetection() {
//         if (!this.isCalibrated || !this.smileDetector) {
//             console.error('Smile detection needs calibration first');
//             return;
//         }
        
//         this.smileControlActive = true;
        
//         // Show the webcam in corner
//         this.smileDetector.showWebcam();
        
//         // Start detection with callback for game control
//         this.smileDetector.start((smileValue) => {
//             if (this.game && typeof this.game.jump === 'function' && this.smileControlActive) {
//                 // The smile detector already handles cooldown period
//                 this.game.jump();
//             }
//         });
//     }
    
//     // Stop smile detection
//     stopSmileDetection() {
//         if (this.smileDetector) {
//             this.smileDetector.stop();
//         }
//         this.smileControlActive = false;
//     }
// }

// // Export the class
// window.SmileGameController = SmileGameController;