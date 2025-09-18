import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from '../ui/InputController.js';
import Movement from '../mechanics/Movement.js';
import { setupLighting } from '../world/Lighting.js';
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';
import Trails from '../world/Trails.js'; // Import the new Trails class
import Rocks from '../world/objects/Rocks.js';
import GamepadController from './GamepadController.js';
import Navbar from '../ui/Navbar.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA, trailNetwork } from '../world/WorldData.js';

export default class Game {
    constructor() {
        Debug.init();
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.teleportTarget = null; // For handling teleports

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.trails = new Trails(this.scene, this.terrain.mesh); // Create the trails
        this.rocks = new Rocks(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh, this.renderer.domElement);
        this.navbar = new Navbar(null, null, null, (location) => this.handleNavigation(location));
        
        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;
        this.gamepad = new GamepadController();
        this._setupPostProcessing();
        this._setupEvents();
    }
    
    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.6; // Reduced brightness
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    handleNavigation(location) {
        const locations = {
            town: new THREE.Vector3(TOWN_AREA.x, 0, TOWN_AREA.y),
            mine: new THREE.Vector3(MINE_AREA.x, 0, MINE_AREA.y),
            oasis: new THREE.Vector3(OASIS_AREA.x, 0, OASIS_AREA.y)
        };
        const destinationPos = locations[location];
        if (destinationPos) {
            this.teleportTarget = destinationPos; // Set target for teleport
        }
    }

    // ... (_setupPostProcessing and other methods are mostly unchanged)

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();

        // --- PAUSE TIME AT MIDDAY ---
        const currentElevation = 90;
        const currentAzimuth = 180;
        this.sky.setParameters({ elevation: currentElevation, azimuth: currentAzimuth });
        this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);
        this.sunLight.intensity = 3.0;
        this.sunLight.color.setHSL(0.1, 1, 0.95);
        this.hemiLight.intensity = 2.2;
        
        // --- Move shadow camera with player ---
        this.sunLight.target.position.copy(this.character.mesh.position);
        this.sunLight.position.copy(this.character.mesh.position).add(new THREE.Vector3(-50, 80, 50));
        this.sunLight.target.updateMatrixWorld();

        // --- Handle Teleporting ---
        if (this.teleportTarget) {
            const raycaster = new THREE.Raycaster();
            raycaster.set(new THREE.Vector3(this.teleportTarget.x, 50, this.teleportTarget.z), new THREE.Vector3(0, -1, 0));
            const intersects = raycaster.intersectObject(this.terrain.mesh);
            if (intersects.length > 0) {
                const groundHeight = intersects[0].point.y;
                this.character.mesh.position.set(this.teleportTarget.x, groundHeight + this.character.mesh.geometry.parameters.height / 2, this.teleportTarget.z);
            }
            this.teleportTarget = null; // Clear the flag
        }

        // ... (rest of animate loop: blur effect, movement, camera, composer.render)
    }
}
