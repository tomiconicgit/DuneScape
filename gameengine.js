import * as THREE from 'three';
import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';

/**
 * The main game engine director.
 * @param {THREE.Scene} scene The main scene object.
 * @param {HTMLElement} domElement The canvas element.
 */
export function startGameEngine(scene, domElement) {
    Debug.init();
    console.log("Game Engine: Initializing game world...");

    // 1. Add lights (needed for MeshLambertMaterial)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambLight);

    // 2. Create the grid/plane
    const plane = createEnvironmentGrid(scene);

    // 3. Create character
    const character = createCharacter(scene);

    // 4. Initialize camera
    RTSCamera.init(character, domElement);

    // 5. Initialize movement
    Movement.init(character, scene, RTSCamera, plane);

    // 6. Initialize visual map painter
    VisualMap.init(scene);

    // 7. Initialize developer UI
    DeveloperUI.init(Movement);

    console.log("Game Engine: World setup complete.");
}