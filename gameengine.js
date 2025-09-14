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
    console.log("Grid created");

    const character = createCharacter(scene);
    console.log("Character created");

    RTSCamera.init(character, domElement);
    console.log("Camera init done");

    Movement.init(character, scene, RTSCamera, plane);
    console.log("Movement init done");

    MapTexture.init(scene);
    console.log("MapTexture init done");

    DeveloperUI.init(Movement);
    console.log("DeveloperUI init done");

    console.log("Game Engine: World setup complete.");
}