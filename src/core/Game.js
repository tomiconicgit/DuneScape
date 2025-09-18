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
import { permanentRocks } from '../world/assets/rockLayout.js'; // Import the permanent layout

export default class Game {
    constructor() {
        this.debugger = new Debugger();
        this.debugger.log('Game starting...');

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.setupInitialScene(); 
        
        this.player = new Player(this.scene, this.landscape);
        this.camera = new Camera();
        
        this.buildMode = {
            active: false,
            selectedRockConfig: null,
            selectedRockName: null,
        };
        this.placedRocks = [];
        
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

        // ✨ CHANGED: Call a single function to populate the world from the layout file.
        this.populatePermanentRocks();
    }
    
    // ✨ CHANGED: Simplified function to place rocks from the pre-designed layout.
    populatePermanentRocks() {
        for (const rock of permanentRocks) {
            const preset = rockPresets[rock.type];
            if (!preset) {
                console.warn(`Rock type "${rock.type}" not found in presets.`);
                continue;
            }
            
            const config = { ...preset, seed: Math.random() };
            const newRock = createProceduralRock(config);

            newRock.position.set(rock.position.x, rock.position.y, rock.position.z);
            
            // Apply scale from preset and optional override from layout
            const scale = rock.scale || 1.0;
            newRock.scale.set(
                config.scaleX * scale, 
                config.scaleY * scale, 
                config.scaleZ * scale
            );
            
            newRock.rotation.y = rock.rotationY || Math.random() * Math.PI * 2;

            this.scene.add(newRock);
        }
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
        // ... (This function remains unchanged and will work for any new rocks you place)
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

        if (!this.buildMode.active) {
            this.player.update(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
