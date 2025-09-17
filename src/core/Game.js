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

const DAY_DURATION_SECONDS = 900, NIGHT_DURATION_SECONDS = 900;
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
        
        // --- FIX: Create the renderer BEFORE anything that needs it ---
        this.renderer = this._createRenderer();
        
        this.clock = new THREE.Clock();
        this.buildMode = { enabled: false, rockType: null };
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;
        this.elapsedTime = 0;
        this.currentElevation = 0;
        this.currentAzimuth = 0;

        // Now it's safe to create the camera and other components
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

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        this.gamepad.update();
        this.elapsedTime += delta;

        const cycleProgress = (this.elapsedTime + this.timeOffset) % TOTAL_CYCLE_SECONDS / TOTAL_CYCLE_SECONDS;
        let dayProgress = 0, currentElevation = 0, currentAzimuth = 0;
        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            currentElevation = Math.sin(dayProgress * Math.PI) * 90;
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            currentElevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90;
            dayProgress = 1.0;
        }
        currentAzimuth = 180 - (dayProgress * 360);

        this.sky.setParameters({ elevation: currentElevation, azimuth: currentAzimuth });
        this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);

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

        const sunHeightFactor = Math.max(0, currentElevation) / 90;
        const sunsetFactor = smoothstep(0.4, 0.0, sunHeightFactor);
        const nightFactor = smoothstep(0.0, -0.2, currentElevation / 90.0);

        this.sunLight.intensity = (1.0 - nightFactor) * 3.0;
        this.sunLight.color.lerpColors(SUN_COLOR_NOON, SUN_COLOR_SUNSET, sunsetFactor);

        this.hemiLight.intensity = (0.2 + sunHeightFactor * 2.0) * (1.0 - nightFactor * 0.5);
        const daySkyHemi = HEMI_SKY_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);
        const dayGroundHemi = HEMI_GROUND_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);
        this.hemiLight.color.lerpColors(daySkyHemi, HEMI_SKY_COLOR_NIGHT, nightFactor);
        this.hemiLight.groundColor.lerpColors(dayGroundHemi, HEMI_GROUND_COLOR_NIGHT, nightFactor);

        if (this.scene.fog) { this.scene.fog.color.copy(this.hemiLight.groundColor); this.renderer.setClearColor(this.scene.fog.color); }

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
