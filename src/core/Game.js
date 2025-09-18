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
        window.loader.updateStatus('Debugger attached...', 5);
        
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        window.loader.updateStatus('Engine initialized...', 10);
        
        this.buildMode = { active: false, selectedRockConfig: null, selectedRockName: null };
        this.placedRocks = [];
        this.mineableRocks = [];
        this.grid = null; // ✨ ADDED: Property to hold the pathfinding grid
        
        this.setupInitialScene(); 
        
        // ✨ CHANGED: Pass 'this' (the game instance) to the Player
        this.player = new Player(this.scene, this); 
        this.camera = new Camera();
        window.loader.updateStatus('Entities created...', 80);
        
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
        // ... (no changes in this function)
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
        
        // ✨ ADDED: Create the grid after all rocks are placed
        window.loader.updateStatus('Building pathfinding grid...', 75);
        this.createPathfindingGrid();
    }
    
    procedurallyPlaceRocks() {
        // ... (no changes in this function)
    }

    // ✨ ADDED: Creates a 2D grid representing walkable and blocked tiles
    createPathfindingGrid() {
        const gridSize = 105; // Slightly larger than the 100x100 mine to be safe
        this.grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

        for (const rock of this.mineableRocks) {
            const x = Math.round(rock.position.x);
            const z = Math.round(rock.position.z);
            if (x >= 0 && x < gridSize && z >= 0 && z < gridSize) {
                this.grid[x][z] = 1; // Mark the tile as blocked
            }
        }
    }
    
    handleRockMined(rockMesh) {
        // ... (no changes in this function)
    }
    
    handleBuildModeToggle(mode, rockName = null) {
        // ... (no changes in this function)
    }
    
    placeRock(position) {
        // ... (no changes in this function)
    }

    copyLayout() {
        // ... (no changes in this function)
    }
    
    handleResize() {
        this.camera.handleResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        // ... (no changes in this function)
    }

    animate() {
        // ... (no changes in this function)
    }
}
