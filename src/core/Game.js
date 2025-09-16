import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import { setupLighting } from '../world/Lighting.js';
import Ground from '../world/Ground.js';
import Sky from '../world/Sky.js';

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        const { hemiLight, dirLight } = setupLighting(this.scene);

        this.scene.background = hemiLight.color;
        this.scene.fog = new THREE.Fog(hemiLight.groundColor, 1, 5000);
        
        this.renderer = this._createRenderer();
        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.character.mesh.castShadow = true;

        // MODIFIED: Create an instance of the Ground and get the mesh directly
        const ground = new Ground(this.scene, hemiLight.groundColor);
        new Sky(this.scene, hemiLight.color, hemiLight.groundColor);

        // MODIFIED: Pass the direct mesh reference to the input controller
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, ground.mesh); 
        this.devUI = new DeveloperUI();

        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        this.input.onTap = (worldPos) => {
            console.log("Clicked at:", worldPos);
        };
        
        this.devUI.onSettingChange = (change) => {};
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this.renderer.setAnimationLoop(() => this.animate());
    }

    animate() {
        const delta = this.clock.getDelta();
        this.movement.update(delta);
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
