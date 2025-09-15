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

        // MODIFIED: Store the returned sun light object
        const { sun } = setupLighting(this.scene);
        this.sunLight = sun;

        this._setupEvents();
        this.character.mesh.castShadow = true;
    }

    // ... (_createRenderer, _setupEvents, _handleSettingChange, start methods are unchanged)
    _createRenderer() {
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
        this.devUI.onSettingChange = (change) => {
            this._handleSettingChange(change);
        };
    }
    _handleSettingChange(change) {
        switch (change.setting) {
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
            case 'cloudCover':
                this.clouds.uniforms.uCloudCover.value = change.value;
                break;
            case 'cloudSharpness':
                this.clouds.uniforms.uCloudSharpness.value = change.value;
                break;
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
        const elapsed = this.clock.getElapsedTime();

        const angle = elapsed * 0.1;
        this.sunPosition.set(
            Math.cos(angle) * 8000,
            Math.sin(angle) * 4000 - 1000,
            Math.sin(angle * 0.5) * 2000 // Added some Z movement for more interesting shadows
        );

        // MODIFIED: Update the actual light source to match the visual sun
        this.sunLight.position.copy(this.sunPosition);
        // Point the light at the center of the world
        this.sunLight.target.position.set(0, 0, 0); 
        this.sunLight.target.updateMatrixWorld();

        this.movement.update(delta);
        this.camera.update();
        
        this.atmosphere.update(this.sunPosition);
        this.clouds.update(this.sunPosition, delta);

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
