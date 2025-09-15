import Debug from './debug.js';
import RTSCamera from './utility/camera.js';
import { createEnvironmentGrid } from './environment/gridmap.js';
import { createCharacter } from './character/character.js';
import Movement from './character/movement.js';
import DeveloperUI from './developer/developerui.js';
import VisualMap from './environment/visualmap.js';

export function startGameEngine(scene, domElement) {
    Debug.init();
    console.log("Game Engine: Initializing game world...");

    // 1. Create grid and invisible plane
    const plane = createEnvironmentGrid(scene);

    // 2. Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(30, 50, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 200;
    scene.add(sunLight);

    // 3. Create character
    const character = createCharacter(scene);
    character.castShadow = true;

    // 4. Initialize camera
    RTSCamera.init(character, domElement);

    // 5. Initialize movement
    Movement.init(character, scene, RTSCamera, plane);

    // 6. Initialize visual map (tiles + sky)
    VisualMap.init(scene);

    // 7. Initialize developer UI
    DeveloperUI.init(Movement);

    console.log("Game Engine: World setup complete.");
}