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

export default class Game {
    constructor() {
        this.debugger = new Debugger();
        this.debugger.log('Game starting...');

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.player = new Player(this.scene);
        this.camera = new Camera();
        
        // ✨ ADDED: State management for build mode
        this.buildMode = {
            active: false,
            selectedRockConfig: null,
        };
        this.placedRocks = [];
        this.previewRock = null;
        this.pointer = new THREE.Vector2(); // For preview raycasting
        this.raycaster = new THREE.Raycaster(); // For preview raycasting
        
        this.setupRenderer();
        this.setupInitialScene(); 
        
        // ✨ CHANGED: DeveloperBar is now a BuildBar
        this.devBar = new DeveloperBar(this.handleBuildModeToggle.bind(this));
        
        this.cameraController = new CameraController(this.renderer.domElement, this.camera);
        // ✨ CHANGED: Pass 'this' (the game instance) to the player controller
        this.playerController = new PlayerController(this.renderer.domElement, this.camera, this.landscape, this.player, this);
        
        this.camera.setTarget(this.player.mesh);
        window.addEventListener('resize', this.handleResize.bind(this));
        // Add listener for preview rock movement
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
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
        this.lighting = new Lighting(this.scene);
        this.sky = new Sky(this.scene, this.lighting);
        this.landscape = new Landscape(this.scene, this.lighting);
        this.scene.add(this.landscape.mesh);
        
        // Remove the single default rock
    }
    
    // ✨ ADDED: Handler for pointer movement to update the preview rock
    onPointerMove(event) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    // ✨ ADDED: Central logic for enabling/disabling build mode
    handleBuildModeToggle(mode, rockName = null) {
        if (mode === 'enter' && rockName) {
            this.buildMode.active = true;
            this.buildMode.selectedRockConfig = rockPresets[rockName];
            
            // Create or update the preview rock
            if (this.previewRock) this.scene.remove(this.previewRock);
            this.previewRock = createProceduralRock(this.buildMode.selectedRockConfig);
            this.previewRock.material.transparent = true;
            this.previewRock.material.opacity = 0.6;
            this.previewRock.scale.set(
                this.buildMode.selectedRockConfig.scaleX,
                this.buildMode.selectedRockConfig.scaleY,
                this.buildMode.selectedRockConfig.scaleZ
            );
            this.scene.add(this.previewRock);

        } else if (mode === 'exit') {
            this.buildMode.active = false;
            this.buildMode.selectedRockConfig = null;
            if (this.previewRock) {
                this.scene.remove(this.previewRock);
                this.previewRock = null;
            }
        }
    }
    
    // ✨ ADDED: Logic to place a new rock in the world
    placeRock(position) {
        if (!this.buildMode.active) return;
        
        const newRock = createProceduralRock(this.buildMode.selectedRockConfig);
        
        // Snap to grid
        const gridX = Math.round(position.x);
        const gridZ = Math.round(position.z);
        
        newRock.position.set(gridX, 0, gridZ);
        newRock.scale.set(
            this.buildMode.selectedRockConfig.scaleX,
            this.buildMode.selectedRockConfig.scaleY,
            this.buildMode.selectedRockConfig.scaleZ
        );

        this.scene.add(newRock);
        this.placedRocks.push(newRock);
    }
    
    // ✨ ADDED: Logic to update the preview rock's position
    updatePreviewRock() {
        if (!this.buildMode.active || !this.previewRock) return;

        this.raycaster.setFromCamera(this.pointer, this.camera.threeCamera);
        const intersects = this.raycaster.intersectObject(this.landscape.mesh);

        if (intersects.length > 0) {
            this.previewRock.visible = true;
            const pos = intersects[0].point;
            this.previewRock.position.set(Math.round(pos.x), 0, Math.round(pos.z));
        } else {
            this.previewRock.visible = false;
        }
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
        const deltaTime = this.clock.getDelta();
        this.camera.update();

        // If in build mode, pause player and update preview rock
        if (this.buildMode.active) {
            this.updatePreviewRock();
        } else {
            this.player.update(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
