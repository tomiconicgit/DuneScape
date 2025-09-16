import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import { setupLighting } from '../world/Lighting.js';
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';

// Constants for day/night cycle
const DAY_DURATION_SECONDS = 20; 
const NIGHT_DURATION_SECONDS = 20;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

// Color constants for dynamic lighting
const SUN_COLOR_NOON = new THREE.Color().setHSL(0.1, 1, 0.95);
const SUN_COLOR_SUNSET = new THREE.Color().setHSL(0.05, 1, 0.7);
const HEMI_SKY_COLOR_NOON = new THREE.Color().setHSL(0.6, 1, 0.6);
const HEMI_GROUND_COLOR_NOON = new THREE.Color().setHSL(0.095, 1, 0.75);
const HEMI_COLOR_SUNSET = new THREE.Color().setHSL(0.05, 0.5, 0.7);
const HEMI_SKY_COLOR_NIGHT = new THREE.Color().setHSL(0.6, 0.1, 0.05);
const HEMI_GROUND_COLOR_NIGHT = new THREE.Color().setHSL(0.6, 0.1, 0.05);

// JS implementation of GLSL's smoothstep
function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);

        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh);
        this.devUI = new DeveloperUI();

        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;

        this.scene.fog = new THREE.Fog(this.hemiLight.groundColor, 200, 1000);

        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        this.input.onTap = (worldPos) => {
            this.movement.calculatePathOnTerrain(worldPos, this.terrain.mesh);
        };
        this.devUI.onSettingChange = (change) => {
            if (change.setting === 'exposure') { this.renderer.toneMappingExposure = change.value; }
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
        this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);
        
        // --- MODIFIED: More artistic and synchronized lighting logic ---
        const sunHeightFactor = Math.max(0, elevation) / 90;

        // Create a "sunset" factor that only kicks in when the sun is low (40% height and below)
        const sunsetFactor = smoothstep(0.4, 0.0, sunHeightFactor);

        // Create a "night" factor that only kicks in when the sun is below the horizon
        const nightFactor = smoothstep(0.0, -0.2, elevation / 90.0);

        // Update directional light (sun)
        this.sunLight.intensity = (1.0 - nightFactor) * 3.0;
        this.sunLight.color.lerpColors(SUN_COLOR_NOON, SUN_COLOR_SUNSET, sunsetFactor);

        // Update hemisphere light (ambient)
        this.hemiLight.intensity = (0.2 + sunHeightFactor * 2.0) * (1.0 - nightFactor * 0.5);
        
        // Blend from day colors to sunset colors using the new sunsetFactor
        const daySkyHemi = HEMI_SKY_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);
        const dayGroundHemi = HEMI_GROUND_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);

        // Then blend the result into night colors using the new nightFactor
        this.hemiLight.color.lerpColors(daySkyHemi, HEMI_SKY_COLOR_NIGHT, nightFactor);
        this.hemiLight.groundColor.lerpColors(dayGroundHemi, HEMI_GROUND_COLOR_NIGHT, nightFactor);
        
        // Update fog color to match the ground
        if (this.scene.fog) {
            this.scene.fog.color.copy(this.hemiLight.groundColor);
            this.renderer.setClearColor(this.scene.fog.color);
        }
        
        this.movement.update(delta);
        this.camera.update();

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
