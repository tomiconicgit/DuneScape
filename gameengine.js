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

    // 1. Environment grid
    const plane = createEnvironmentGrid(scene);

    // 2. Character
    const character = createCharacter(scene);

    // 3. Camera
    RTSCamera.init(character, domElement);

    // 4. Movement
    Movement.init(character, scene, RTSCamera, plane);

    // 5. Visual map (tiles + sky)
    VisualMap.init(scene);

    // 6. Developer UI
    DeveloperUI.init(Movement);

    // 7. Lights
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    scene.add(sun);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // 8. Ground plane receives shadows
    plane.receiveShadow = true;

    console.log("Game Engine: World setup complete.");
}