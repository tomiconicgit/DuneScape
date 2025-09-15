import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import Grid from '../world/Grid.js';
import TileMap from '../world/TileMap.js';
import Atmosphere from '../world/Atmosphere.js';
import VolumetricClouds from '../world/VolumetricClouds.js';
import { setupLighting } from '../world/Lighting.js';

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        // Core Three.js components
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();

        // Game components
        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.grid = new Grid(this.scene);
        this.tileMap = new TileMap(this.scene);
        
        // NEW: Replace Sky with Atmosphere and Clouds
        this.atmosphere = new Atmosphere(this.scene);
        this.clouds = new VolumetricClouds(this.scene);

        this.movement = new Movement(this.character.mesh);

        // Input and UI
        this.input = new InputController(this.camera.threeCamera, this.grid.plane);
        this.devUI = new DeveloperUI();

        // A Vector3 to control the sun's position
        this.sunPosition = new THREE.Vector3();

        this._setupEvents();
        setupLighting(this.scene);

        // Add character shadow
        this.character.mesh.castShadow = true;
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        // Handle window resizing
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Connect InputController taps to game logic
        this.input.onTap = (worldPos, gridPos, buildMode) => {
            if (buildMode) {
                this.tileMap.paintTile(gridPos, buildMode);
            } else {
                this.movement.calculatePath(worldPos, gridPos);
            }
        };

        // Connect DeveloperUI build mode to InputController
        this.devUI.onBuildModeChange = (mode) => {
            this.input.setBuildMode(mode);
        };
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // Animate the sun in a circle for a day/night cycle
        const angle = elapsed * 0.1;
        this.sunPosition.set(
            Math.cos(angle) * 8000,
            Math.sin(angle) * 4000 - 1000, // Move up and down
            0
        );

        // Update all components
        this.movement.update(delta);
        this.camera.update();
        
        // Update atmosphere and clouds with the sun's position
        this.atmosphere.update(this.sunPosition);
        this.clouds.update(this.sunPosition, delta);

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
