import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from '../core/InputController.js';
import Movement from '../mechanics/Movement.js';
import { setupLighting } from '../world/Lighting.js';
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';
import Rocks from '../world/objects/Rocks.js';
import GamepadController from './GamepadController.js';
import Navbar from '../ui/Navbar.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from '../world/WorldData.js';

export default class Game {
    constructor() {
        Debug.init();
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.teleportTarget = null;
        this.buildMode = { enabled: false, rockType: null };

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        // Rocks are now disabled by default to allow editor placement
        // this.rocks = new Rocks(this.scene); 
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh, this.renderer.domElement);
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
        this._setupEvents();
    }
    
    handleNavigation(location) {
        const locations = {
            town: new THREE.Vector3(TOWN_AREA.x, 5, TOWN_AREA.y),
            mine: new THREE.Vector3(MINE_AREA.x, 5, MINE_AREA.y),
            oasis: new THREE.Vector3(OASIS_AREA.x, 5, OASIS_AREA.y)
        };
        const destinationPos = locations[location];
        if (destinationPos) {
            this.teleportTarget = destinationPos;
        }
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;
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
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();

        // --- TIME PAUSED AT MIDDAY ---
        this.sky.setParameters({ elevation: 90, azimuth: 180 });
        this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);
        this.sunLight.intensity = 3.0;
        this.sunLight.color.setHSL(0.1, 1, 0.95);
        this.hemiLight.intensity = 1.0;
        
        this.sunLight.target.position.copy(this.character.mesh.position);
        this.sunLight.position.copy(this.character.mesh.position).add(new THREE.Vector3(-50, 80, 50));
        this.sunLight.target.updateMatrixWorld();

        if (this.teleportTarget) {
            const raycaster = new THREE.Raycaster();
            raycaster.set(new THREE.Vector3(this.teleportTarget.x, 50, this.teleportTarget.z), new THREE.Vector3(0, -1, 0));
            const intersects = raycaster.intersectObject(this.terrain.mesh);
            if (intersects.length > 0) {
                const groundHeight = intersects[0].point.y;
                this.character.mesh.position.set(this.teleportTarget.x, groundHeight + this.character.mesh.geometry.parameters.height / 2, this.teleportTarget.z);
            }
            this.teleportTarget = null;
        }

        this.gamepad.update();
        const { x: stickX, y: stickY } = this.gamepad.getLeftStick();
        if (Math.abs(stickX) > 0 || Math.abs(stickY) > 0) {
            const cameraForward = new THREE.Vector3(); this.camera.threeCamera.getWorldDirection(cameraForward);
            cameraForward.y = 0; cameraForward.normalize();
            const cameraRight = new THREE.Vector3().crossVectors(this.camera.threeCamera.up, cameraForward);
            const moveDirection = cameraForward.multiplyScalar(-stickY).add(cameraRight.multiplyScalar(stickX));
            this.movement.moveCharacter(moveDirection, delta);
        }
        
        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
