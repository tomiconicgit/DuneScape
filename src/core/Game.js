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
        
        this.setupInitialScene(); 
        
        this.player = new Player(this.scene, this.landscape);
        this.camera = new Camera();
        
        this.buildMode = {
            active: false,
            selectedRockConfig: null,
            selectedRockName: null, // ✨ ADDED: Track the name of the selected rock
        };
        this.placedRocks = []; // ✨ CHANGED: Will now store { type, mesh }
        
        this.setupRenderer();
        
        // ✨ CHANGED: Pass the new copyLayout function to the developer bar
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
    }
    
    handleBuildModeToggle(mode, rockName = null) {
        if (mode === 'enter' && rockName) {
            this.buildMode.active = true;
            this.buildMode.selectedRockConfig = rockPresets[rockName];
            this.buildMode.selectedRockName = rockName; // ✨ ADDED: Store the selected rock name
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
        
        // ✨ CHANGED: Store the rock's type along with its mesh object
        this.placedRocks.push({
            type: this.buildMode.selectedRockName,
            mesh: newRock
        });
    }

    // ✨ ADDED: New function to generate and copy the layout data
    copyLayout() {
        if (this.placedRocks.length === 0) {
            this.debugger.log('No rocks to copy.');
            return;
        }

        const layoutData = this.placedRocks.map(rockData => {
            return {
                type: rockData.type,
                position: {
                    x: rockData.mesh.position.x,
                    y: rockData.mesh.position.y,
                    z: rockData.mesh.position.z,
                }
            };
        });

        const layoutString = `const permanentRocks = ${JSON.stringify(layoutData, null, 4)};`;
        navigator.clipboard.writeText(layoutString).then(() => {
            this.debugger.log('Rock layout copied to clipboard!');
        }).catch(err => {
            this.debugger.error('Failed to copy layout.');
            console.error(err);
        });
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
