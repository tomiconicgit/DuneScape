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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'; // New import for blur effect
import { MINE_AREA, TOWN_AREA, OASIS_AREA, trailNetwork } from '../world/WorldData.js';

// ... (Constants and smoothstep function) ...

export default class Game {
    constructor() {
        Debug.init();
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.buildMode = { enabled: false, rockType: null };
        this.timeOffset = 120 * 0.1;

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.rocks = new Rocks(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh, this.renderer.domElement);
        
        // --- FIX: Restore the rock editor callbacks to fix the crash ---
        this.navbar = new Navbar(
            (type) => this.handleRockSelect(type),
            () => this.handleCopyRockData(),
            () => this.rocks.clearAllRocks(),
            (location) => this.handleNavigation(location)
        );

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

        // --- NEW: Using BokehPass for a depth-of-field blur effect ---
        this.bokehPass = new BokehPass(this.scene, this.camera.threeCamera, {
            focus: 10.0,
            aperture: 0.0005, // Controls the intensity of the blur
            maxblur: 0.01, // Puts a cap on the maximum blurriness
        });
        this.composer.addPass(this.bokehPass);
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

    // ... (handleNavigation, _createRenderer are unchanged) ...

    _setupEvents() {
        window.addEventListener('resize', () => { /* ... */ });

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
    }

    // ... (start method is unchanged) ...
    
    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        
        // ... (Day/Night cycle and Lighting updates are unchanged) ...

        // --- NEW: Update the mirage/blur effect every frame ---
        // This keeps the character in focus as the camera moves
        const distance = this.camera.threeCamera.position.distanceTo(this.character.mesh.position);
        this.bokehPass.uniforms['focus'].value = distance;
        
        this.movement.update(delta);
        this.camera.update();
        
        // Use the composer to render the scene with the blur effect
        this.composer.render();
    }
}
