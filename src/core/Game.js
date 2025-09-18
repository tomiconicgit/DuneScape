// File: src/core/Game.js
import * as THREE from 'three';
import Landscape from '../world/Landscape.js';
import Player from '../entities/Player.js';
import Camera from '../entities/Camera.js';
import InputController from './InputController.js';
import Debugger from '../ui/Debugger.js';
import Sky from '../world/Sky.js';
import Lighting from '../world/Lighting.js'; // ✨ ADDED: Import the new Lighting class

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
        // ✨ REPLACED: The entire scene setup is now modular.
        
        // 1. Set up the lighting system
        this.lighting = new Lighting(this.scene);

        // 2. Set up the sky, which uses the lighting info
        this.sky = new Sky(this.scene, this.lighting);

        // 3. Set up the landscape, which also uses lighting info
        this.landscape = new Landscape(this.scene, this.lighting);
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
        
        // ✨ UPDATED: Removed update calls for static landscape and sky
        this.camera.update();
        
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
