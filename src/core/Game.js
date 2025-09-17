import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import { setupLighting } from '../world/Lighting.js';
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';
import Rocks from '../world/objects/Rocks.js';
import GamepadController from './GamepadController.js';
import Navbar from '../ui/Navbar.js';
import { MINE_AREA } from '../world/WorldData.js';

const DAY_DURATION_SECONDS = 60, NIGHT_DURATION_SECONDS = 60;
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
        this.buildMode = { enabled: false, rockType: null };
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;
        this.elapsedTime = 0;

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.rocks = new Rocks(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh, this.renderer.domElement);
        this.navbar = new Navbar(
            (type) => this.handleRockSelect(type),
            () => this.handleCopyRockData(),
            () => this.rocks.clearAllRocks()
        );
        
        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;
        this.gamepad = new GamepadController();
        this._setupEvents();
    }

    handleRockSelect(rockType) {
        this.buildMode.enabled = rockType !== null;
        this.buildMode.rockType = rockType;
        this.input.setMode(this.buildMode.enabled ? 'BUILD' : 'MOVEMENT');
    }

    handleCopyRockData() {
        const data = this.rocks.getRockDataForExport();
        navigator.clipboard.writeText(data).then(() => {
            alert('Rock data copied to clipboard!');
        });
    }

    _createRenderer() { /* ... unchanged ... */ }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.input.onTap = (worldPos) => {
            if (!this.buildMode.enabled) {
                this.movement.calculatePathOnTerrain(worldPos, this.terrain.mesh);
            }
        };

        this.input.onBuildTap = (worldPos) => {
            if (this.buildMode.enabled) {
                const mineRect = new THREE.Box2(
                    new THREE.Vector2(MINE_AREA.x - MINE_AREA.width / 2, MINE_AREA.y - MINE_AREA.depth / 2),
                    new THREE.Vector2(MINE_AREA.x + MINE_AREA.width / 2, MINE_AREA.y + MINE_AREA.depth / 2)
                );
                if (mineRect.containsPoint(new THREE.Vector2(worldPos.x, worldPos.z))) {
                    this.rocks.addRock(this.buildMode.rockType, worldPos);
                } else {
                    alert("You can only place rocks inside the mine area.");
                }
            }
        };
        
        this.gamepad.onRB = () => this.navbar.cycleTab(1);
        this.gamepad.onLB = () => this.navbar.cycleTab(-1);
        this.gamepad.onB = () => this.navbar.closePanel();
    }

    start() { /* ... unchanged ... */ }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        this.gamepad.update();
        this.elapsedTime += delta;

        // --- Day/Night Cycle Logic ---
        const cycleProgress = (this.elapsedTime + this.timeOffset) % TOTAL_CYCLE_SECONDS / TOTAL_CYCLE_SECONDS;
        // ... (day/night math remains the same)
        this.sky.setParameters({ elevation: this.currentElevation, azimuth: this.currentAzimuth });
        this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);
        // ... (light color/intensity lerping remains the same)

        // --- Feed dynamic lighting data to all rock shaders ---
        this.scene.traverse(child => {
            if (child.isMesh && child.material.uniforms) {
                if (child.material.uniforms.lightDir) {
                    child.material.uniforms.lightDir.value.copy(this.sunLight.position);
                }
                if (child.material.uniforms.sunColor) {
                    const sun = this.sunLight.color.clone().multiplyScalar(this.sunLight.intensity);
                    child.material.uniforms.sunColor.value.copy(sun);
                }
                if (child.material.uniforms.hemiSkyColor) {
                    const hemiSky = this.hemiLight.color.clone().multiplyScalar(this.hemiLight.intensity);
                    child.material.uniforms.hemiSkyColor.value.copy(hemiSky);
                }
                if (child.material.uniforms.hemiGroundColor) {
                    const hemiGround = this.hemiLight.groundColor.clone().multiplyScalar(this.hemiLight.intensity);
                    child.material.uniforms.hemiGroundColor.value.copy(hemiGround);
                }
            }
        });

        if (this.scene.fog) { /* ... */ }

        // --- Gamepad Movement Logic ---
        // ... (remains the same)

        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
