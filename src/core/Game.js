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
// ✨ REMOVED: No longer importing a static layout
// import { permanentRocks } from '../world/assets/rockLayout.js';

export default class Game {
    constructor() {
        this.debugger = new Debugger();
        this.debugger.log('Game starting...');

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.setupInitialScene(); 
        
        this.player = new Player(this.scene);
        this.camera = new Camera();
        
        this.buildMode = {
            active: false,
            selectedRockConfig: null,
            selectedRockName: null,
        };
        this.placedRocks = [];
        this.mineableRocks = []; // ✨ ADDED: Array to hold interactive rocks
        
        this.setupRenderer();
        
        this.devBar = new DeveloperBar(
            this.handleBuildModeToggle.bind(this),
            this.copyLayout.bind(this)
        );
        
        this.cameraController = new CameraController(this.renderer.domElement, this.camera);
        this.playerController = new PlayerController(this.renderer.domElement, this, this.camera, this.player, this.landscape);
        
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
        this.lighting = new Lighting(this.scene);
        this.sky = new Sky(this.scene, this.lighting);
        this.landscape = new Landscape(this.scene, this.lighting);
        this.scene.add(this.landscape.mesh);

        // ✨ CHANGED: Call the new procedural placement function
        this.procedurallyPlaceRocks();
    }
    
    // ✨ ADDED: New function to procedurally generate the mine layout
    procedurallyPlaceRocks() {
        const zones = {
            'Iron Ore': { bounds: { minX: 80, maxX: 95, minZ: 20, maxZ: 70 }, count: 10 },
            'Gold Ore': { bounds: { minX: 5, maxX: 15, minZ: 5, maxZ: 15 }, count: 5 },
            'Limestone': { bounds: { minX: 30, maxX: 70, minZ: 60, maxZ: 90 }, count: 10 },
            'Carbon Ore': { bounds: { minX: 5, maxX: 20, minZ: 70, maxZ: 95 }, count: 10 },
            'Sandstone': { bounds: { minX: -5, maxX: 105, minZ: -5, maxZ: 105 }, count: 15, onEdge: true },
            'Stone 1': { bounds: { minX: 0, maxX: 100, minZ: 0, maxZ: 100 }, count: 10 },
            'Stone 2': { bounds: { minX: 0, maxX: 100, minZ: 0, maxZ: 100 }, count: 10 },
        };

        for (const [rockType, properties] of Object.entries(zones)) {
            const preset = rockPresets[rockType];
            if (!preset) continue;

            for (let i = 0; i < properties.count; i++) {
                let x, z;
                if (properties.onEdge) {
                    // Place sandstone around the outside border
                    const side = Math.floor(Math.random() * 4);
                    if (side === 0) { x = -5; z = Math.random() * 110 - 5; } // Left
                    else if (side === 1) { x = 105; z = Math.random() * 110 - 5; } // Right
                    else if (side === 2) { z = -5; x = Math.random() * 110 - 5; } // Top
                    else { z = 105; x = Math.random() * 110 - 5; } // Bottom
                } else {
                    // Place ore inside its zone
                    x = THREE.MathUtils.randFloat(properties.bounds.minX, properties.bounds.maxX);
                    z = THREE.MathUtils.randFloat(properties.bounds.minZ, properties.bounds.maxZ);
                }

                const config = { ...preset, seed: Math.random() };
                const newRock = createProceduralRock(config);
                newRock.position.set(x, 0, z); // Y position is 0 for flat mine
                newRock.scale.set(config.scaleX, config.scaleY, config.scaleZ);
                newRock.rotation.y = Math.random() * Math.PI * 2;
                
                // Add metadata for interaction
                newRock.userData.isMineable = true;
                newRock.userData.onMined = () => this.handleRockMined(newRock);
                
                this.scene.add(newRock);
                this.mineableRocks.push(newRock);
            }
        }
    }
    
    // ✨ ADDED: Manages the rock's state after being mined.
    handleRockMined(rockMesh) {
        rockMesh.visible = false;
        
        setTimeout(() => {
            rockMesh.visible = true;
        }, 15000); // Respawn after 15 seconds
    }
    
    handleBuildModeToggle(mode, rockName = null) {
        if (mode === 'enter' && rockName) {
            this.buildMode.active = true;
            this.buildMode.selectedRockConfig = rockPresets[rockName];
            this.buildMode.selectedRockName = rockName;
        } else if (mode === 'exit') {
            this.buildMode.active = false;
            this.buildMode.selectedRockConfig = null;
            this.buildMode.selectedRockName = null;
        }
    }
    
    placeRock(position) {
        if (!this.buildMode.active) return;
        
        const config = { ...this.buildMode.selectedRockConfig, seed: Math.random() };
        const newRock = createProceduralRock(config);
        
        const gridX = Math.round(position.x);
        const gridZ = Math.round(position.z);
        
        newRock.position.set(gridX, position.y, gridZ);
        newRock.scale.set(config.scaleX, config.scaleY, config.scaleZ);

        this.scene.add(newRock);
        this.placedRocks.push({ type: this.buildMode.selectedRockName, mesh: newRock });
    }

    copyLayout() {
        // ... (this function remains the same)
    }
    
    handleResize() {
        this.camera.handleResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => { loadingScreen.remove(); }, 1000);
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
