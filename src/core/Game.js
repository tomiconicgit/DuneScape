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
        // ... (constructor setup is the same until _setupEvents) ...
        Debug.init();
        console.log("Game Engine: Initializing...");
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.grid = new Grid(this.scene);
        this.tileMap = new TileMap(this.scene);
        this.atmosphere = new Atmosphere(this.scene);
        this.clouds = new VolumetricClouds(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.grid.plane);
        this.devUI = new DeveloperUI();
        this.sunPosition = new THREE.Vector3();
        this._setupEvents();
        setupLighting(this.scene);
        this.character.mesh.castShadow = true;
    }

    _createRenderer() {
        // ... (this method is unchanged) ...
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.input.onTap = (worldPos, gridPos, buildMode) => {
            if (buildMode) {
                this.tileMap.paintTile(gridPos, buildMode);
            } else {
                this.movement.calculatePath(worldPos, gridPos);
            }
        };

        this.devUI.onBuildModeChange = (mode) => {
            this.input.setBuildMode(mode);
        };
        
        // MODIFIED: Add listener for new advanced settings
        this.devUI.onSettingChange = (change) => {
            this._handleSettingChange(change);
        };
    }
    
    // NEW: Method to handle changes from the sliders
    _handleSettingChange(change) {
        switch (change.setting) {
            // Atmosphere controls
            case 'exposure':
                this.atmosphere.uniforms.uExposure.value = change.value;
                break;
            case 'rayleigh':
                this.atmosphere.uniforms.uRayleigh.value = change.value;
                break;
            case 'mie':
                this.atmosphere.uniforms.uMie.value = change.value;
                break;
            case 'horizonOffset':
                this.atmosphere.uniforms.uHorizonOffset.value = change.value;
                break;
            // Cloud controls
            case 'cloudCover':
                this.clouds.uniforms.uCloudCover.value = change.value;
                break;
            case 'cloudSharpness':
                this.clouds.uniforms.uCloudSharpness.value = change.value;
                break;
        }
    }

    start() {
        // ... (this method is unchanged) ...
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        // ... (this method is unchanged) ...
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();
        const angle = elapsed * 0.1;
        this.sunPosition.set(
            Math.cos(angle) * 8000,
            Math.sin(angle) * 4000 - 1000,
            0
        );
        this.movement.update(delta);
        this.camera.update();
        this.atmosphere.update(this.sunPosition);
        this.clouds.update(this.sunPosition, delta);
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
