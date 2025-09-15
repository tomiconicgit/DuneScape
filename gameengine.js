import * as THREE from 'three';
import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';

/**
 * Main game engine initializer
 * @param {THREE.Scene} scene
 * @param {HTMLElement} domElement
 */
export function startGameEngine(scene, domElement) {
    Debug.init();
    console.log("Game Engine: Initializing world...");

    // Renderer (needed for shadows)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Grid + invisible plane
    const plane = createEnvironmentGrid(scene);

    // Character
    const character = createCharacter(scene);
    character.castShadow = true;

    // Camera
    RTSCamera.init(character, renderer.domElement);

    // Movement
    Movement.init(character, scene, RTSCamera, plane);

    // Visual Map
    VisualMap.init(scene);

    // Developer UI
    DeveloperUI.init(Movement);

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        RTSCamera.update();
        Movement.update(delta);
        VisualMap.update();

        renderer.render(scene, RTSCamera.camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        RTSCamera.handleResize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    console.log("Game Engine: World setup complete.");
}