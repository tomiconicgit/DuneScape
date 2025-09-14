import Debug from './debug.js'; // <-- ADDED IMPORT
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';

/**
 * The main game engine director.
 * It initializes all game objects and sets up the world.
 * @param {THREE.Scene} scene The main scene object.
 */
export function startGameEngine(scene) {
    // Initialize the debug engine first to catch any startup errors.
    Debug.init(); // <-- INITIALIZE DEBUGGER

    // This is the central point to build your game world.
    console.log("Game Engine: Initializing game world...");

    createEnvironmentGrid(scene);
    createCharacter(scene);
    
    // --- FOR DEMONSTRATION: This will throw an error after 2 seconds ---
    // You can remove this block once you've seen it work.
    setTimeout(() => {
        console.error("This is a test of console.error capture.");
        // This line will cause an uncaught error.
        nonExistentFunction(); 
    }, 2000);
    // -----------------------------------------------------------------

    console.log("Game Engine: World setup complete.");
}
