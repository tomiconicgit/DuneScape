import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';
import * as THREE from 'three';

export function startGameEngine(scene, domElement, renderer) {
    Debug.init();

    // Enable shadows in renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create grid (dev purposes, no shadows)
    const plane = createEnvironmentGrid(scene);

    // Create character
    const character = createCharacter(scene);
    character.castShadow = true;

    // Sun directional light
    const sun = new THREE.DirectionalLight(0xfff6e5, 1.5); // slightly warm sunlight
    sun.position.set(40, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 4096;
    sun.shadow.mapSize.height = 4096;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.radius = 4;  // softer shadow edges
    scene.add(sun);

    // Ambient light for soft fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    // Visual map (tiles)
    VisualMap.init(scene);

    // Make tiles cast/receive shadows
    VisualMap.tiles.forEach(tile => {
        tile.castShadow = true;
        tile.receiveShadow = true;
    });

    // Initialize camera
    RTSCamera.init(character, domElement);

    // Initialize movement
    Movement.init(character, scene, RTSCamera, plane);

    // Developer UI
    DeveloperUI.init(Movement);
}