import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import { setupLighting } from '../world/Lighting.js';
import { DesertTerrain } from '../world/DesertTerrain.js';
import GameSky from '../world/Sky.js'; // MODIFIED: Import the new sky

// Constants for day/night cycle
const DAY_DURATION_SECONDS = 600; 
const NIGHT_DURATION_SECONDS = 300;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        
        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);

        const desert = new DesertTerrain(this.scene);
        const terrainMesh = desert.generate();

        // MODIFIED: Create an instance of the new sky
        this.sky = new GameSky(this.scene);

        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, terrainMesh);
        this.devUI = new DeveloperUI();

        const { sun } = setupLighting(this.scene);
        this.sunLight = sun;
        this.character.mesh.castShadow = true;

        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // MODIFIED: Added Tone Mapping for realistic lighting
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5;

        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.input.onTap = (worldPos) => {
            const targetGrid = { x: Math.round(worldPos.x), z: Math.round(worldPos.z) };
            this.movement.calculatePathOnTerrain(targetGrid, this.input.raycaster, this.scene);
        };
        
        this.devUI.onSettingChange = (change) => {
            this.renderer.toneMappingExposure = change.value;
        };
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this.renderer.setAnimationLoop(() => this.animate());
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        
        // Convert the cycle progress into elevation and azimuth for the sky
        let elevation = 0;
        let azimuth = 180;

        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            const dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(dayProgress * Math.PI) * 90; // 0 -> 90 -> 0
            azimuth = 180 - (dayProgress * 360); // East to West
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90; // Below horizon
            azimuth = -180 + (nightProgress * 360); // West to East
        }

        // Update the sky using the new parameters
        this.sky.setParameters({ elevation, azimuth });
        
        // Sync the main directional light with the sky's sun position
        this.sunLight.position.copy(this.sky.sun);
        
        this.movement.update(delta);
        this.camera.update();

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
