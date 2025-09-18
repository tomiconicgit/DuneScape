// File: src/core/Game.js
import * as THREE from 'three';
import Landscape from '../world/Landscape.js';
import Player from '../entities/Player.js';
import Camera from '../entities/Camera.js';
import InputController from './InputController.js';
import Debugger from '../ui/Debugger.js';
import Sky from '../world/Sky.js'; // ✨ ADDED: Import the new Sky class

export default class Game {
    constructor() {
        this.debugger = new Debugger();
        this.debugger.log('Game starting...');

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.player = new Player(this.scene);
        this.camera = new Camera();
        this.input = new InputController(this.renderer.domElement, this.camera);
        
        // ✨ MOVED: Sky is now created in setupInitialScene
        
        this.setupRenderer();
        this.setupInitialScene();

        this.camera.setTarget(this.player.mesh);

        window.addEventListener('resize', this.handleResize.bind(this));
        this.debugger.log('Game initialized successfully.');
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupInitialScene() {
        // ✨ REPLACED: The old background, fog, and lights are gone.
        // The new Sky class now handles all of it.
        this.sky = new Sky(this.scene);

        // We still need to configure the main sun from the sky system to cast shadows
        if (this.sky.sun) {
            const sun = this.sky.sun;
            sun.castShadow = true;
            sun.shadow.mapSize.width = 2048;
            sun.shadow.mapSize.height = 2048;
            sun.shadow.camera.left = -250;
            sun.shadow.camera.right = 250;
            sun.shadow.camera.top = 250;
            sun.shadow.camera.bottom = -250;
        }

        this.landscape = new Landscape();
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

        const elapsedTime = this.clock.getElapsedTime();

        this.camera.update();
        this.landscape.update(elapsedTime);
        
        // ✨ ADDED: This line updates the day/night cycle and cloud animation
        this.sky.update(elapsedTime);
        
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
