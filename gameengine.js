import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';
import * as THREE from 'three';

export function startGameEngine(scene, domElement) {
    Debug.init();
    console.log("Game Engine: Initializing game world...");

    // Set realistic scene background
    scene.background = new THREE.Color(0x87ceeb); // fallback sky blue

    // Enable shadows in the renderer
    const renderer = domElement.renderer;
    if (renderer) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Directional "sun" light
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 500;
    scene.add(sun);

    // Ambient fill light
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // Create the grid/plane
    const plane = createEnvironmentGrid(scene);

    // Create character
    const character = createCharacter(scene);

    // Initialize camera
    RTSCamera.init(character, domElement);

    // Initialize movement
    Movement.init(character, scene, RTSCamera, plane);

    // Initialize visual map painter with procedural sky
    VisualMap.init(scene);

    // Initialize developer UI
    DeveloperUI.init(Movement);

    console.log("Game Engine: World setup complete.");
}