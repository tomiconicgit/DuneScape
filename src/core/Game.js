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

const SUN_COLOR_NOON = new THREE.Color().setHSL(0.1, 1, 0.95);
const SUN_COLOR_SUNSET = new THREE.Color().setHSL(0.05, 1, 0.7);
const HEMI_SKY_COLOR_NOON = new THREE.Color().setHSL(0.6, 1, 0.6);
const HEMI_GROUND_COLOR_NOON = new THREE.Color().setHSL(0.095, 1, 0.75);
const HEMI_COLOR_SUNSET = new THREE.Color().setHSL(0.05, 0.5, 0.7);
const HEMI_SKY_COLOR_NIGHT = new THREE.Color().setHSL(0.6, 0.1, 0.05);
const HEMI_GROUND_COLOR_NIGHT = new THREE.Color().setHSL(0.6, 0.1, 0.05);

function smoothstep(min, max, value) { const x = Math.max(0, Math.min(1, (value - min) / (max - min))); return x * x * (3 - 2 * x); }

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

        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;
        
        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5; // Start with a balanced exposure
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => { this.camera.handleResize(); this.renderer.setSize(window.innerWidth, window.innerHeight); });
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
            case 'hemiIntensity': this.hemiLight.intensity = change.value; break;
        }
    }

    _copySkySettings() {
        const settings = {
            turbidity: this.sky.uniforms['turbidity'].value, rayleigh: this.sky.uniforms['rayleigh'].value,
            mieCoefficient: this.sky.uniforms['mieCoefficient'].value, mieDirectionalG: this.sky.uniforms['mieDirectionalG'].value,
            elevation: this.currentElevation, azimuth: this.currentAzimuth,
            sunIntensity: this.sunLight.intensity, hemiIntensity: this.hemiLight.intensity,
            exposure: this.renderer.toneMappingExposure
        };
        const settingsString = `const timeSettings = ${JSON.stringify(settings, null, 2)};`;
        navigator.clipboard.writeText(settingsString).then(() => { this.devUI.showCopiedFeedback(); });
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
        
        if (!this.isPaused) {
            this.sky.setParameters({ elevation: this.currentElevation, azimuth: this.currentAzimuth });
            this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);

            const sunHeightFactor = Math.max(0, this.currentElevation) / 90;
            const sunsetFactor = smoothstep(0.4, 0.0, sunHeightFactor);
            const nightFactor = smoothstep(0.0, -0.2, this.currentElevation / 90.0);

            this.sunLight.intensity = (1.0 - nightFactor) * 3.0;
            this.sunLight.color.lerpColors(SUN_COLOR_NOON, SUN_COLOR_SUNSET, sunsetFactor);

            this.hemiLight.intensity = (0.2 + sunHeightFactor * 2.0) * (1.0 - nightFactor * 0.5);
            const daySkyHemi = HEMI_SKY_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);
            const dayGroundHemi = HEMI_GROUND_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);
            this.hemiLight.color.lerpColors(daySkyHemi, HEMI_SKY_COLOR_NIGHT, nightFactor);
            this.hemiLight.groundColor.lerpColors(dayGroundHemi, HEMI_GROUND_COLOR_NIGHT, nightFactor);
        }
        
        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
