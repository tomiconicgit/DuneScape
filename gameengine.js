import * as THREE from 'three';
import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';

export function startGameEngine(scene, renderer) {
    Debug.init();

    console.log("Game Engine: Initializing game world...");

    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    scene.add(sun);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // Grid & plane
    const plane = createEnvironmentGrid(scene); // plane is dev grid

    // Character
    const character = createCharacter(scene);

    // Camera
    RTSCamera.init(character, renderer.domElement);

    // Movement
    Movement.init(character, scene, RTSCamera, plane);

    // Visual Map (tiles + sky)
    VisualMap.init(scene);

    // Developer UI
    DeveloperUI.init(Movement);

    console.log("Game Engine: World setup complete.");
}