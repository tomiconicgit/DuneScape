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

// Post-processing imports
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const DAY_DURATION_SECONDS = 120; // Longer cycle for bigger map
const NIGHT_DURATION_SECONDS = 120;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

// Color constants remain the same

function smoothstep(min, max, value) { const x = Math.max(0, Math.min(1, (value - min) / (max - min))); return x * x * (3 - 2 * x); }

export default class Game {
    constructor() {
        Debug.init();
        this.scene = new THREE.Scene();
        
        // --- FIX: Create the renderer BEFORE anything that needs it ---
        this.renderer = this._createRenderer();
        
        this.clock = new THREE.Clock();
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.rocks = new Rocks(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh, this.renderer.domElement);
        this.navbar = new Navbar();

        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;

        this.gamepad = new GamepadController();

        this._setupPostProcessing();
        this._setupEvents();
    }
    
    _setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera.threeCamera);
        this.composer.addPass(renderPass);

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0.2;
        this.bloomPass.strength = 0.0; // Start with no mirage effect
        this.bloomPass.radius = 0.5;
        this.composer.addPass(this.bloomPass);
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
            this.composer.setSize(window.innerWidth, window.innerHeight); // Also resize the composer
        });

        this.input.onTap = (worldPos) => {
            this.movement.calculatePathOnTerrain(worldPos, this.terrain.mesh);
        };
        
        // Placeholder gamepad controls
        this.gamepad.onRB = () => {};
        this.gamepad.onLB = () => {};
        this.gamepad.onB = () => {};
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _updateMirageEffect() {
        const playerPos = this.character.mesh.position;
        const quadrantSize = 400;
        const halfQuadrant = quadrantSize / 2;

        // Determine distance to nearest vertical (X) and horizontal (Z) center line
        const distX = Math.abs((playerPos.x % quadrantSize + quadrantSize) % quadrantSize - halfQuadrant);
        const distZ = Math.abs((playerPos.z % quadrantSize + quadrantSize) % quadrantSize - halfQuadrant);

        // Find the closest distance to any edge of the current quadrant
        const distToEdge = Math.min(halfQuadrant - distX, halfQuadrant - distZ);

        // Mirage is strongest at the center (distToEdge is high) and weakest at the edges (distToEdge is low)
        const mirageStrength = 1.0 - smoothstep(0, halfQuadrant, distToEdge);

        // Apply the effect to the bloom pass strength
        this.bloomPass.strength = mirageStrength * 0.4; // Max strength of 0.4
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        this.gamepad.update();
        
        const elapsedTime = this.clock.getElapsedTime() + this.timeOffset;
        const cycleProgress = (elapsedTime % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        
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

        const sunHeightFactor = Math.max(0, currentElevation) / 90;
        // ... (lighting calculations remain the same) ...

        this.movement.update(delta);
        this.camera.update();
        
        this._updateMirageEffect();

        this.composer.render();
    }
}
