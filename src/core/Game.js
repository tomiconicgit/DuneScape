// File: src/core/Game.js
import * as THREE from 'three';
import Landscape from '../world/Landscape.js';
import Player from '../entities/Player.js';
import Camera from '../entities/Camera.js';
import CameraController from './CameraController.js';
import PlayerController from './PlayerController.js';
import Debugger from '../ui/Debugger.js';
import Sky from '../world/Sky.js';
import Lighting from '../world/Lighting.js';
import { createProceduralRock } from '../world/assets/rock.js';
import DeveloperBar from '../ui/DeveloperBar.js';
import { rockPresets } from '../world/assets/rockPresets.js';
import { permanentRocks } from '../world/assets/rockLayout.js';

export default class Game {
    constructor() {
        // The old debugger is now secondary to the new loader for startup errors
        this.debugger = new Debugger();
        window.loader.updateStatus('Debugger attached...', 5);
        
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        window.loader.updateStatus('Engine initialized...', 10);
        
        this.setupInitialScene(); 
        
        this.player = new Player(this.scene);
        this.camera = new Camera();
        window.loader.updateStatus('Entities created...', 80);
        
        this.buildMode = { active: false, selectedRockConfig: null, selectedRockName: null };
        this.placedRocks = [];
        this.mineableRocks = [];
        
        this.setupRenderer();
        
        this.devBar = new DeveloperBar(this.handleBuildModeToggle.bind(this), this.copyLayout.bind(this));
        
        this.cameraController = new CameraController(this.renderer.domElement, this.camera);
        this.playerController = new PlayerController(this.renderer.domElement, this, this.camera, this.player, this.landscape);
        window.loader.updateStatus('Controllers attached...', 90);
        
        this.camera.setTarget(this.player.mesh);
        window.addEventListener('resize', this.handleResize.bind(this));
        
        this.debugger.log('Game initialized successfully.');
        window.loader.updateStatus('Initialization complete!', 100);
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupInitialScene() {
        window.loader.updateStatus('Creating lighting and sky...', 15);
        this.lighting = new Lighting(this.scene);
        this.sky = new Sky(this.scene, this.lighting);
        
        window.loader.updateStatus('Generating landscape...', 25);
        this.landscape = new Landscape(this.scene, this.lighting);
        this.scene.add(this.landscape.mesh);

        window.loader.updateStatus('Placing ore veins...', 40);
        this.procedurallyPlaceRocks();
    }
    
    procedurallyPlaceRocks() {
        // ... (this function remains the same, but now errors will be caught)
    }
    
    handleRockMined(rockMesh) {
        // ... (this function remains the same)
    }
    
    handleBuildModeToggle(mode, rockName = null) {
        // ... (this function remains the same)
    }
    
    placeRock(position) {
        // ... (this function remains the same)
    }

    copyLayout() {
        // ... (this function remains the same)
    }
    
    handleResize() {
        this.camera.handleResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        // ✨ CHANGED: The start method now tells the loader to finish.
        if (window.loader) {
            window.loader.finish();
        }
        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();
        this.camera.update();

        if (!this.buildMode.active) {
            this.player.update(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
