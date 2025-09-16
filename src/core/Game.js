import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import { setupLighting } from '../world/Lighting.js';
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';
import Navbar from '../ui/Navbar.js'; // MODIFIED

// ... (Constants are the same)
const DAY_DURATION_SECONDS = 30;
const NIGHT_DURATION_SECONDS = 30;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        
        // MODIFIED: Create a dedicated container for the canvas
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'canvas-container';
        document.body.appendChild(canvasContainer);
        
        this.renderer = this._createRenderer(canvasContainer);
        this.clock = new THREE.Clock();
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh);
        
        // MODIFIED: Replace DeveloperUI with the new Navbar
        this.navbar = new Navbar();

        const { dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.character.mesh.castShadow = true;
        
        this._setupEvents();
    }

    _createRenderer(container) { // MODIFIED
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight); // MODIFIED
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5;
        container.appendChild(renderer.domElement); // MODIFIED
        return renderer;
    }

    _setupEvents() {
        // MODIFIED: Resize now needs to look at the container's size
        const canvasContainer = document.getElementById('canvas-container');
        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            this.camera.threeCamera.aspect = width / height;
            this.camera.threeCamera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
        resizeObserver.observe(canvasContainer);

        this.input.onTap = (worldPos) => {
            this.movement.calculatePathOnTerrain(worldPos, this.terrain.mesh);
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
        const elapsed = this.clock.getElapsedTime() + this.timeOffset;
        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        
        let elevation = 0;
        let dayProgress = 0;

        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(dayProgress * Math.PI) * 90;
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90;
        }
        
        const azimuth = 180 - (dayProgress * 360);
        this.sky.setParameters({ elevation, azimuth });
        this.sunLight.position.copy(this.sky.sun);
        
        this.movement.update(delta);
        this.camera.update();

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
