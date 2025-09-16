import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import { setupLighting } from '../world/Lighting.js';
import Ground from '../world/Ground.js';
import Sky from '../world/Sky.js';

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        // 1. SETUP LIGHTING
        // This is the most important step. The hemiLight provides the base colors.
        const { hemiLight, dirLight } = setupLighting(this.scene);

        // 2. SETUP THE REST OF THE SCENE
        // We use the hemiLight's colors to keep everything consistent.
        this.scene.background = hemiLight.color;
        this.scene.fog = new THREE.Fog(hemiLight.groundColor, 1, 5000);
        
        this.renderer = this._createRenderer();
        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.character.mesh.castShadow = true; // Make the character cast shadows

        // 3. CREATE THE WORLD using colors from the lighting setup
        new Ground(this.scene, hemiLight.groundColor);
        new Sky(this.scene, hemiLight.color, hemiLight.groundColor);

        // Movement requires an object to click on. We'll use the ground for this.
        // NOTE: Ground.js doesn't return the mesh, so we find it in the scene.
        const groundMesh = this.scene.children.find(c => c.geometry.type === 'PlaneGeometry');
        
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, groundMesh);
        this.devUI = new DeveloperUI();

        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true; // Enable shadows in the renderer
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // This will no longer work as there's no grid system, but we keep the hook.
        // To make movement work, we'd need to update the pathfinding logic.
        this.input.onTap = (worldPos) => {
            // Pathfinding logic would need to be updated for a non-grid world.
            // For now, we can just log the click position.
            console.log("Clicked at:", worldPos);
        };
        
        this.devUI.onSettingChange = (change) => {};
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this.renderer.setAnimationLoop(() => this.animate());
    }

    animate() {
        const delta = this.clock.getDelta();
        this.movement.update(delta); // Movement won't do anything until pathfinding is updated
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
