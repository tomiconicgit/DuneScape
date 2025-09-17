import * as THREE from 'three';
import Debug from '../ui/Debug.js'; // Restored
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import { setupLighting } from '../world/Lighting.js';
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';
import GamepadController from './GamepadController.js';

// Constants for day/night cycle
const DAY_DURATION_SECONDS = 60;
const NIGHT_DURATION_SECONDS = 60;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

// Color constants for dynamic lighting
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
        Debug.init(); // Restored
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
        // this.navbar = new DeveloperUI(); // Stays removed

        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;

        this.gamepad = new GamepadController();

        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

        this.gamepad.update();

        if (!this.isPaused) {
            this.elapsedTime += delta;
        }

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
        }

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

        if (this.scene.fog) {
            this.scene.fog.color.copy(this.hemiLight.groundColor);
            this.renderer.setClearColor(this.scene.fog.color);
        }

        const { x: orbit } = this.gamepad.getRightStick();
        this.camera.orbitAngle -= orbit * 0.02;
        const { lt, rt } = this.gamepad.getTriggers();
        this.camera.zoomLevel += (lt - rt) * 0.02;
        this.camera.zoomLevel = Math.max(0, Math.min(1, this.camera.zoomLevel));
        const { x: stickX, y: stickY } = this.gamepad.getLeftStick();
        if (Math.abs(stickX) > 0 || Math.abs(stickY) > 0) {
            const cameraForward = new THREE.Vector3();
            this.camera.threeCamera.getWorldDirection(cameraForward);
            cameraForward.y = 0;
            cameraForward.normalize();
            const cameraRight = new THREE.Vector3().crossVectors(this.camera.threeCamera.up, cameraForward);
            const moveDirection = cameraForward.multiplyScalar(-stickY).add(cameraRight.multiplyScalar(stickX));
            this.movement.moveCharacter(moveDirection, delta);
        }

        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
