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
import GamepadController from './GamepadController.js';

const DAY_DURATION_SECONDS = 600; 
const NIGHT_DURATION_SECONDS = 300;
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
        this.navbar = new DeveloperUI(); // Renamed from devUI for clarity

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
        
        this.navbar.onSettingChange = (change) => { 
            this._handleSettingChange(change); 
        };
        this.navbar.onPauseToggle = () => { 
            this.isPaused = !this.isPaused; 
        };
        this.navbar.onCopyRequest = () => { 
            this._copySkySettings(); 
        };
        
        // Gamepad event wiring
        this.gamepad.onRB = () => this.navbar.cycleTab(1);
        this.gamepad.onLB = () => this.navbar.cycleTab(-1);
        this.gamepad.onB = () => this.navbar.closePanel();
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
        navigator.clipboard.writeText(settingsString).then(() => { this.navbar.showCopiedFeedback(); });
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();

        // Update gamepad state first
        this.gamepad.update();

        if (!this.isPaused) { 
            this.elapsedTime += delta; 
        }
        
        // Time Display and Sky calculation
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

        // Gamepad Controls
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
        
        // Update game objects
        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
