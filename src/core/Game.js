import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import { setupLighting } from '../world/Lighting.js';
import { DesertTerrain } from '../world/DesertTerrain.js';
import GameSky from '../world/Sky.js';

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
        
        // MODIFIED: Add a time offset to start the day slightly after sunrise
        this.timeOffset = DAY_DURATION_SECONDS * 0.1; // Start 10% into the day

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);

        const desert = new DesertTerrain(this.scene);
        const terrainMesh = desert.generate();

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

        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // MODIFIED: Lowered the default exposure to prevent white screen
        renderer.toneMappingExposure = 0.4;

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
            // Pathfinding logic for terrain needs to be more advanced
            // For now, let's keep movement simple
            this.movement.calculatePath(worldPos, targetGrid);
        };
        
        // Allow the UI to control the exposure
        this.devUI.onSettingChange = (change) => {
            if (change.setting === 'exposure') {
                this.renderer.toneMappingExposure = change.value;
            }
        };
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        // MODIFIED: Removed the direct setAnimationLoop to use requestAnimationFrame
        this._animate();
    }

    // MODIFIED: Switched back to requestAnimationFrame for clarity
    _animate() {
        requestAnimationFrame(() => this._animate());

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime() + this.timeOffset;

        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        
        let elevation = 0;
        let azimuth = 180;

        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            const dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(dayProgress * Math.PI) * 90;
            azimuth = 180 - (dayProgress * 360);
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90;
            azimuth = -180 + (nightProgress * 360);
        }

        this.sky.setParameters({ elevation, azimuth });
        this.sunLight.position.copy(this.sky.sun);
        
        this.movement.update(delta);
        this.camera.update();

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
