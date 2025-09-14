import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js'; // Added
import MapTexture from './environment/map/maptexture.js'; // Added

/**
 * The main game engine director.
 * @param {THREE.Scene} scene The main scene object.
 * @param {HTMLElement} domElement The canvas element.
 */
export function startGameEngine(scene, domElement) {
    Debug.init();
    console.log("Game Engine: Initializing game world...");

    const plane = createEnvironmentGrid(scene);
    
    // Create character and get a reference to it
    const character = createCharacter(scene);
    
    // Initialize the camera and give it the character to follow
    RTSCamera.init(character, domElement);

    // Initialize movement
    Movement.init(character, scene, RTSCamera, plane);

    // Initialize map textures
    MapTexture.init(scene);

    // Initialize developer UI (temp disabled for test)
    // DeveloperUI.init(Movement);

    console.log("Game Engine: World setup complete.");
}