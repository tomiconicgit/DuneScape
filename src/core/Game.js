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

// MODIFIED: Re-instated the 10-minute day, 5-minute night cycle
const DAY_DURATION_SECONDS = 600; // 10 minutes
const NIGHT_DURATION_SECONDS = 300; // 5 minutes
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

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

        // MODIFIED: Logic for the 10/5 minute day/night cycle
        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        let angle;
        let timeOfDay; // A 0.0 to 1.0 value representing 24 hours

        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            // Day part of the cycle (10 minutes)
            const dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = dayProgress * Math.PI; // Sun moves 180 degrees
            timeOfDay = 0.25 + (dayProgress * 0.5); // Maps to 6am -> 6pm
        } else {
            // Night part of the cycle (5 minutes)
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = Math.PI + (nightProgress * Math.PI); // Sun moves the other 180 degrees
            timeOfDay = (0.75 + (nightProgress * 0.5)) % 1.0; // Maps to 6pm -> 6am
        }
        
        this.sunPosition.set(Math.cos(angle) * 8000, Math.sin(angle) * 6000, Math.sin(angle * 0.5) * 2000);
        
        this.sunLight.position.copy(this.sunPosition);
        this.sunLight.target.position.set(0, 0, 0); 
        this.sunLight.target.updateMatrixWorld();
        this.movement.update(delta);
        this.camera.update();
        
        // Pass the calculated time of day to the atmosphere shader
        this.atmosphere.update(this.sunPosition, timeOfDay);

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
