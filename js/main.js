// js/main.js
import { initializeScene, animate } from './modules/sceneSetup.js';
import { initUI, simulateGameProgress } from './modules/uiManager.js';

// Main game initialization function
function init() {
    console.log("DuneScape initializing...");
    
    // 1. Set up all UI event listeners and initial state
    initUI();
    
    // 2. Set up the 3D scene, camera, renderer, physics, and models
    initializeScene();
    
    // 3. Start the animation/render loop
    animate();
    
    // 4. Start the demo simulation for health changes and events
    simulateGameProgress();
    
    console.log("Initialization complete. Game running.");
}

// Wait for the DOM to be fully loaded before starting the game
document.addEventListener('DOMContentLoaded', init);

