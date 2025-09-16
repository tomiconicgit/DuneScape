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
import { setupLighting } from '../world/Lighting.js';

// NEW: A simpler time model. Total seconds for one 24-hour cycle.
const SECONDS_IN_A_DAY = 900; // 15 minutes for a full 24h cycle

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
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.grid.plane);
        this.devUI = new DeveloperUI();
        this.sunPosition = new THREE.Vector3();

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
            case 'exposure': this.atmosphere.uniforms.uExposure.value = change.value; break;
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

        // MODIFIED: Simplified time calculation
        // timeOfDay goes from 0.0 (midnight) to 1.0 (next midnight)
        const timeOfDay = (elapsed / SECONDS_IN_A_DAY) % 1.0;

        // Sun moves in a circle based on a 24-hour day (sunrise at 6am, noon at 12pm)
        // 0.25 represents 6 AM.
        const angle = (timeOfDay - 0.25) * 2.0 * Math.PI;
        
        this.sunPosition.set(Math.cos(angle) * 8000, Math.sin(angle) * 6000, Math.sin(angle * 0.5) * 2000);
        
        this.sunLight.position.copy(this.sunPosition);
        this.sunLight.target.position.set(0, 0, 0); 
        this.sunLight.target.updateMatrixWorld();
        this.movement.update(delta);
        this.camera.update();
        
        // Pass the time of day to the atmosphere so it knows which colors to use
        this.atmosphere.update(this.sunPosition, timeOfDay);

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
