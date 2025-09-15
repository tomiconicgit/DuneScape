import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';
import * as THREE from 'three';

/**
 * Main game engine initialization.
 * @param {THREE.Scene} scene
 * @param {HTMLElement} domElement
 */
export function startGameEngine(scene, domElement) {
    Debug.init();
    console.log("Game Engine: Initializing world...");

    // --- 1. Lighting Setup ---
    scene.background = new THREE.Color(0x000000);

    // Directional sunlight
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(30, 50, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    // --- 2. Grid / plane ---
    const plane = createEnvironmentGrid(scene);

    // --- 3. Character ---
    const character = createCharacter(scene);
    character.castShadow = true;
    character.receiveShadow = true;

    // --- 4. Tiles ---
    VisualMap.init(scene);

    // Enable shadows for tiles
    VisualMap.tiles.forEach(tile => tile.receiveShadow = true);

    // --- 5. Camera ---
    RTSCamera.init(character, domElement);

    // --- 6. Movement ---
    Movement.init(character, scene, RTSCamera, plane);

    // --- 7. Developer UI ---
    DeveloperUI.init(Movement);

    console.log("Game Engine: World setup complete.");
}