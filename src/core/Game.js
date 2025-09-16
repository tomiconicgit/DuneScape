import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import { setupLighting } from '../world/Lighting.js';
import Grid from '../world/Grid.js';
import Sky from '../world/Sky.js';

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        // 1. SETUP LIGHTING
        const { hemiLight, dirLight } = setupLighting(this.scene);

        // 2. SETUP SCENE FOG
        // The fog color is linked to the ground color from the light for a seamless blend
        this.scene.fog = new THREE.Fog(hemiLight.groundColor, 100, 400);
        
        this.renderer = this._createRenderer();
        // The renderer background is also linked to the fog color
        this.renderer.setClearColor(this.scene.fog.color);

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.character.mesh.castShadow = true;

        // 3. CREATE THE WORLD
        const grid = new Grid(this.scene); // Creates the visual grid and invisible shadow plane
        new Sky(this.scene, hemiLight.color, this.scene.fog.color); // Creates the sky

        this.movement = new Movement(this.character.mesh);
        // The input controller now targets the invisible shadow plane
        this.input = new InputController(this.camera.threeCamera, grid.mesh);
        this.devUI = new DeveloperUI();

        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        this.input.onTap = (worldPos) => {
            // Simplified movement for now, pathfinding would need updating for a non-tile world
            const targetGrid = { x: Math.round(worldPos.x), z: Math.round(worldPos.z) };
            this.movement.calculatePath(worldPos, targetGrid);
        };
        
        // DeveloperUI is kept for debugging, but has no active controls for this scene
        this.devUI.onSettingChange = (change) => {};
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this.renderer.setAnimationLoop(() => this.animate());
    }

    animate() {
        const delta = this.clock.getDelta();
        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
