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

const DAY_DURATION_SECONDS = 3000; // Longer cycle for bigger map
const NIGHT_DURATION_SECONDS = 3000;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

// ... (Color constants remain the same) ...

function smoothstep(min, max, value) { const x = Math.max(0, Math.min(1, (value - min) / (max - min))); return x * x * (3 - 2 * x); }

export default class Game {
    constructor() {
        Debug.init();
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.rocks = new Rocks(this.scene); // Rocks are now empty, waiting for placement
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh, this.renderer.domElement);
        this.navbar = new Navbar(); // Navbar is currently a placeholder

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

        // UnrealBloomPass creates a nice glow/haze that we can use for the mirage
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0.2; // Adjust what gets bloomed
        this.bloomPass.strength = 0.0; // Start with no bloom
        this.bloomPass.radius = 0.5;
        this.composer.addPass(this.bloomPass);
    }

    _createRenderer() { /* ... unchanged ... */ }
    _setupEvents() { /* ... unchanged ... */ }
    start() { /* ... unchanged ... */ }

    _updateMirageEffect() {
        const playerPos = this.character.mesh.position;
        const quadrantSize = 400;
        const halfQuadrant = quadrantSize / 2;

        // Determine distance to nearest vertical (X) and horizontal (Z) center line
        const distX = Math.abs(playerPos.x % quadrantSize - halfQuadrant);
        const distZ = Math.abs(playerPos.z % quadrantSize - halfQuadrant);

        // Find the closest distance to any edge of the current quadrant
        const distToEdge = Math.min(halfQuadrant - distX, halfQuadrant - distZ);

        // The mirage is strongest at the center of a quadrant (far from edges) and weakest at the edges
        const mirageStrength = smoothstep(0, halfQuadrant, distToEdge);
        
        // We want the opposite: strong when far from edge, weak when near.
        const finalMirageStrength = 1.0 - mirageStrength;

        // Apply the effect to the bloom pass
        this.bloomPass.strength = finalMirageStrength * 0.4; // Max strength of 0.4
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();

        // ... (gamepad, day/night cycle logic remains the same) ...
        
        this.movement.update(delta);
        this.camera.update();
        
        // Update the mirage effect based on player position
        this._updateMirageEffect();

        // Instead of renderer.render, we now call composer.render
        this.composer.render();
    }
}
