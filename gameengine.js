import Debug from './debug.js';
import RTSCamera from './utility/camera.js'; // <-- ADDED
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';

/**
 * The main game engine director.
 * @param {THREE.Scene} scene The main scene object.
 * @param {HTMLElement} domElement The canvas element.
 */
export function startGameEngine(scene, domElement) { // <-- ADDED domElement
    Debug.init();
    console.log("Game Engine: Initializing game world...");

    createEnvironmentGrid(scene);
    
    // Create character and get a reference to it
    const character = createCharacter(scene); // <-- GET CHARACTER REFERENCE
    
    // Initialize the camera and give it the character to follow
    RTSCamera.init(character, domElement); // <-- INITIALIZE CAMERA

    console.log("Game Engine: World setup complete.");
}
