import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import Atmosphere from '../world/Atmosphere.js';
import { setupLighting } from '../world/Lighting.js';
import { DesertTerrain } from '../world/DesertTerrain.js';

// ... (Constants are unchanged)
const DAY_DURATION_SECONDS = 600; 
const NIGHT_DURATION_SECONDS = 300;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        
        // MODIFIED: Removed the global scene fog
        this.renderer = this._createRenderer();
        
        this.clock = new THREE.Clock();
        
        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);

        const desert = new DesertTerrain(this.scene, { width: 100, length: 100 });
        const terrainMesh = desert.generate();

        this.atmosphere = new Atmosphere(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, terrainMesh);
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
    
    // ... (rest of the file is unchanged)
    _setupEvents() { window.addEventListener('resize', () => { this.camera.handleResize(); this.renderer.setSize(window.innerWidth, window.innerHeight); }); this.input.onTap = (worldPos, gridPos) => { this.movement.calculatePath(worldPos, gridPos); }; this.devUI.onSettingChange = (change) => { this._handleSettingChange(change); }; }
    _handleSettingChange(change) { switch (change.setting) { case 'exposure': this.atmosphere.uniforms.uExposure.value = change.value; break; } }
    start() { console.log("Game Engine: World setup complete."); this.camera.setTarget(this.character.mesh); this._animate(); }
    _animate() { requestAnimationFrame(() => this._animate()); const delta = this.clock.getDelta(); const elapsed = this.clock.getElapsedTime(); let timeOfDay; const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS; if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) { const dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS); timeOfDay = 0.25 + (dayProgress * 0.5); } else { const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS); timeOfDay = (0.75 + (nightProgress * 0.5)) % 1.0; } const angle = (timeOfDay - 0.25) * 2.0 * Math.PI; this.sunPosition.set(Math.cos(angle) * 8000, Math.sin(angle) * 6000, Math.sin(angle * 0.5) * 2000); this.sunLight.position.copy(this.sunPosition); this.sunLight.target.position.set(0, 0, 0); this.sunLight.target.updateMatrixWorld(); this.movement.update(delta); this.camera.update(); this.atmosphere.update(this.sunPosition, timeOfDay); this.renderer.render(this.scene, this.camera.threeCamera); }
}
