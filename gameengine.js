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

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    scene.add(sun);

    // Grid & plane
    const plane = createEnvironmentGrid(scene);

    // Character
    const character = createCharacter(scene);

    // Camera
    RTSCamera.init(character, renderer.domElement);

    // Movement
    Movement.init(character, scene, RTSCamera, plane);

    // VisualMap
    VisualMap.init(scene);

    // Developer UI
    DeveloperUI.init(Movement);
}