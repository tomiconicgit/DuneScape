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
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;

        // NEW: Pause state and custom elapsed time
        this.isPaused = false;
        this.elapsedTime = 0;

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
        
        this._setupEvents();
    }

    _createRenderer() {
        // ... (this method is unchanged)
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
            this._handleSettingChange(change);
        };
        // NEW: Connect the pause button
        this.devUI.onPauseToggle = () => {
            this.isPaused = !this.isPaused;
        };
    }

    // MODIFIED: Expanded to handle all the new sliders
    _handleSettingChange(change) {
        switch (change.setting) {
            // Renderer
            case 'exposure': this.renderer.toneMappingExposure = change.value; break;
            // Sky
            case 'turbidity': this.sky.uniforms['turbidity'].value = change.value; break;
            case 'rayleigh': this.sky.uniforms['rayleigh'].value = change.value; break;
            case 'mieCoefficient': this.sky.uniforms['mieCoefficient'].value = change.value; break;
            case 'mieDirectionalG': this.sky.uniforms['mieDirectionalG'].value = change.value; break;
            // Lights
            case 'sunIntensity': this.sunLight.intensity = change.value; break;
            case 'hemiIntensity': this.hemiLight.intensity = change.value; break;
        }
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());

        const delta = this.clock.getDelta();
        // MODIFIED: Only advance time if not paused
        if (!this.isPaused) {
            this.elapsedTime += delta;
        }
        
        const elapsedWithOffset = this.elapsedTime + this.timeOffset;
        const cycleProgress = (elapsedWithOffset % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        
        // --- Time Display Logic ---
        let dayProgress = 0;
        let timeOfDayHours = 0;
        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            timeOfDayHours = 6 + dayProgress * 12; // Day is 6am to 6pm
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            timeOfDayHours = 18 + nightProgress * 12; // Night is 6pm to 6am
            if (timeOfDayHours >= 24) timeOfDayHours -= 24;
        }
        const hours = Math.floor(timeOfDayHours);
        const minutes = Math.floor((timeOfDayHours - hours) * 60);
        this.devUI.updateTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);

        // --- Sky and Light Update Logic (only if not paused) ---
        if (!this.isPaused) {
            let elevation = 0;
            if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
                elevation = Math.sin(dayProgress * Math.PI) * 90;
            } else {
                const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
                elevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90;
            }
            const azimuth = 180 - (dayProgress * 360);
            this.sky.setParameters({ elevation, azimuth });
            this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);
        }

        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
