import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';
import * as THREE from 'three';

export function startGameEngine(scene, rendererDom) {
    Debug.init();

    // Renderer & Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Create Grid
    const plane = createEnvironmentGrid(scene);

    // Create Character
    const character = createCharacter(scene);

    // Camera
    RTSCamera.init(character, renderer.domElement);

    // Movement
    Movement.init(character, scene, RTSCamera, plane);

    // VisualMap
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

    window.addEventListener('resize', () => {
        RTSCamera.handleResize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}