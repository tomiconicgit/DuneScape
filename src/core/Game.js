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

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);

        // MODIFIED: Create the terrain, which is now the one and only ground object
        this.terrain = new Terrain(this.scene);

        this.movement = new Movement(this.character.mesh);
        // MODIFIED: InputController now correctly targets the 3D terrain mesh
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh);
        this.devUI = new DeveloperUI();

        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;

        // MODIFIED: The scene fog is now correctly linked to the dynamic ground color
        this.scene.fog = new THREE.Fog(this.hemiLight.groundColor, 200, 1000);

        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.7;
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
            if (change.setting === 'exposure') { this.renderer.toneMappingExposure = change.value; }
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
        const elapsed = this.clock.getElapsedTime() + this.timeOffset;

        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        let elevation = 0; let dayProgress = 0;
        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(dayProgress * Math.PI) * 90;
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            elevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90;
        }
        const azimuth = 180 - (dayProgress * 360);
        this.sky.setParameters({ elevation, azimuth });
        this.sunLight.position.copy(this.sky.sun);
        
        const sunHeightFactor = Math.max(0, elevation) / 90;
        this.sunLight.color.lerpColors(new THREE.Color().setHSL(0.05, 1, 0.6), new THREE.Color().setHSL(0.1, 1, 0.95), sunHeightFactor);
        this.sunLight.intensity = 0.5 + sunHeightFactor * 2.5;
        this.hemiLight.color.lerpColors(new THREE.Color().setHSL(0.05, 0.5, 0.6), new THREE.Color().setHSL(0.6, 1, 0.6), sunHeightFactor);
        this.hemiLight.groundColor.lerpColors(new THREE.Color().setHSL(0.05, 0.5, 0.6), new THREE.Color().setHSL(0.095, 1, 0.75), sunHeightFactor);
        this.hemiLight.intensity = 1.5 + sunHeightFactor * 3.5;
        
        this.scene.fog.color.copy(this.hemiLight.groundColor);
        this.renderer.setClearColor(this.scene.fog.color);
        
        this.movement.update(delta);
        this.camera.update();

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
