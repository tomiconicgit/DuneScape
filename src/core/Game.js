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
import Boundary from '../world/Boundary.js'; // NEW: Import the Boundary

// ... (Constants are the same)
const DAY_DURATION_SECONDS = 600;
const NIGHT_DURATION_SECONDS = 240;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        
        // NEW: Add global scene fog
        const fogColor = new THREE.Color('#030A14');
        this.scene.fog = new THREE.Fog(fogColor, 60, 120);

        this.renderer = this._createRenderer();
        // Set the renderer's clear color to match the fog for a seamless blend
        this.renderer.setClearColor(fogColor);

        this.clock = new THREE.Clock();
        
        // ... (timeOffset is the same)
        const startHourOffset = 1;
        const hoursInDay = 12;
        this.timeOffset = (startHourOffset / hoursInDay) * DAY_DURATION_SECONDS;

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

        const { sun } = setupLighting(this.scene);
        this.sunLight = sun;
        this.character.mesh.castShadow = true;

        new Boundary(this.scene); // NEW: Create the boundary hills

        this._setupEvents();
    }

    // ... (All other methods remain the same)
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
            case 'cloudCover': this.clouds.uniforms.uCloudCover.value = change.value; break;
            case 'cloudSharpness': this.clouds.uniforms.uCloudSharpness.value = change.value; break;
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
        const elapsed = this.clock.getElapsedTime() + this.timeOffset;

        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        let angle;
        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            const dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = dayProgress * Math.PI;
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = Math.PI + (nightProgress * Math.PI);
        }
        this.sunPosition.set(Math.cos(angle) * 8000, Math.sin(angle) * 6000, Math.sin(angle * 0.5) * 2000);
        
        this.sunLight.position.copy(this.sunPosition);
        this.sunLight.target.position.set(0, 0, 0); 
        this.sunLight.target.updateMatrixWorld();
        this.movement.update(delta);
        this.camera.update();
        this.atmosphere.update(this.sunPosition);
        this.clouds.update(this.sunPosition, delta);

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
