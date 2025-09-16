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
import GodRaysEffect from '../effects/GodRays.js';

const DAY_DURATION_SECONDS = 30; 
const NIGHT_DURATION_SECONDS = 30;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        Debug.init();
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;
        this.isPaused = false;
        this.elapsedTime = 0;
        this.currentElevation = 0;
        this.currentAzimuth = 0;

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh);
        this.devUI = new DeveloperUI();

        const { dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.character.mesh.castShadow = true;

        // NEW: Initialize the God Rays effect
        this.godRays = new GodRaysEffect(this.renderer, this.scene, this.camera.threeCamera);
        
        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5;
        // The god rays effect handles clearing the renderer itself
        renderer.autoClear = false;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => { 
            this.camera.handleResize(); 
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            // NEW: Make sure the effect resizes as well
            this.godRays.onWindowResize();
        });
        this.input.onTap = (worldPos) => { this.movement.calculatePathOnTerrain(worldPos, this.terrain.mesh); };
        this.devUI.onSettingChange = (change) => { this._handleSettingChange(change); };
        this.devUI.onPauseToggle = () => { this.isPaused = !this.isPaused; };
        this.devUI.onCopyRequest = () => { this._copySkySettings(); };
    }

    _handleSettingChange(change) {
        switch (change.setting) {
            case 'exposure': this.renderer.toneMappingExposure = change.value; break;
            case 'turbidity': this.sky.uniforms['turbidity'].value = change.value; break;
            case 'rayleigh': this.sky.uniforms['rayleigh'].value = change.value; break;
            case 'mieCoefficient': this.sky.uniforms['mieCoefficient'].value = change.value; break;
            case 'mieDirectionalG': this.sky.uniforms['mieDirectionalG'].value = change.value; break;
            case 'sunIntensity': this.sunLight.intensity = change.value; break;
            // NEW: Control god ray intensity
            case 'godRayIntensity': this.godRays.postprocessing.godrayCombineUniforms.fGodRayIntensity.value = change.value; break;
        }
    }

    _copySkySettings() {
        // ... (this method is unchanged)
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        if (!this.isPaused) { this.elapsedTime += delta; }
        
        // ... (time calculation and UI update is unchanged)

        if (!this.isPaused) {
            const elapsedWithOffset = this.elapsedTime + this.timeOffset;
            const cycleProgress = (elapsedWithOffset % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
            let dayProgress = 0;
            if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
                dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
                this.currentElevation = Math.sin(dayProgress * Math.PI) * 90;
            } else {
                const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
                this.currentElevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90;
                dayProgress = 1.0;
            }
            this.currentAzimuth = 180 - (dayProgress * 360);
            this.sky.setParameters({ elevation: this.currentElevation, azimuth: this.currentAzimuth });
            this.sunLight.position.copy(this.sky.sun);
        }
        
        this.movement.update(delta);
        this.camera.update();

        // MODIFIED: Use the GodRays render method
        this.godRays.render(this.sunLight.position);
    }
}
