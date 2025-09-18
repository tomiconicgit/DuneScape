// File: src/core/Game.js
import * as THREE from 'three';
import Landscape from '../world/Landscape.js'; // This now handles everything
import Player from '../entities/Player.js';
import Camera from '../entities/Camera.js';
import InputController from './InputController.js';
import Debugger from '../ui/Debugger.js';

export default class Game {
    constructor() {
        this.debugger = new Debugger();
        this.debugger.log('Game starting...');

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.player = new Player(this.scene);
        this.camera = new Camera();
        this.input = new InputController(this.renderer.domElement, this.camera);
        
        this.setupRenderer();
        this.setupInitialScene();

        this.camera.setTarget(this.player.mesh);

        window.addEventListener('resize', this.handleResize.bind(this));
        this.debugger.log('Game initialized successfully.');
    }

    // ... all other methods (setupRenderer, setupInitialScene, etc.) remain exactly the same as before ...
    // The only change is that `new Landscape()` now does all the work internally.
    setupInitialScene() {
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 400);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(-100, 150, -50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -250;
        directionalLight.shadow.camera.right = 250;
        directionalLight.shadow.camera.top = 250;
        directionalLight.shadow.camera.bottom = -250;
        this.scene.add(directionalLight);

        this.landscape = new Landscape(); // This one line now does everything
        this.scene.add(this.landscape.mesh);
    }
    
    handleResize() {
        this.camera.handleResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.camera.update();
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
