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

export default class Game {
    constructor() {
        this.debugger = new Debugger();
        this.debugger.log('Game starting...');

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.player = new Player(this.scene);
        this.camera = new Camera();
        
        // ✨ ADDED: State management for the procedural rock
        this.rock = null;
        this.rockConfig = {
            radius: 1.5,
            detail: 4,
            roughness: 0.7,
            noiseScale: 0.8,
            seed: Math.random(),
            color: 0x888888,
            materialRoughness: 1,
            metalness: 0,
            flatShading: true,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
        };
        
        this.setupRenderer();
        this.setupInitialScene(); // Must be before controllers to create landscape

        // ✨ ADDED: Instantiate the DeveloperBar UI
        this.devBar = new DeveloperBar(this.rockConfig, this.updateRock.bind(this));

        this.cameraController = new CameraController(this.renderer.domElement, this.camera);
        this.playerController = new PlayerController(this.renderer.domElement, this.camera, this.landscape, this.player);

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

        // ✨ CHANGED: Use the new update/rebuild function
        this.updateRock(this.rockConfig, true);
    }

    // ✨ ADDED: A comprehensive function to update or fully rebuild the rock
    updateRock(newConfig, forceRebuild = false) {
        const oldConfig = this.rockConfig;
        this.rockConfig = newConfig;

        // Determine if geometry needs to be rebuilt
        const needsRebuild = forceRebuild ||
            oldConfig.radius !== newConfig.radius ||
            oldConfig.detail !== newConfig.detail ||
            oldConfig.roughness !== newConfig.roughness ||
            oldConfig.noiseScale !== newConfig.noiseScale ||
            oldConfig.seed !== newConfig.seed;

        if (needsRebuild) {
            // Remove old rock and dispose of its assets to prevent memory leaks
            if (this.rock) {
                this.scene.remove(this.rock);
                this.rock.geometry.dispose();
                this.rock.material.dispose();
            }
            this.rock = createProceduralRock(this.rockConfig);
            this.rock.position.set(3, 0, 2);
            this.scene.add(this.rock);
        }

        // Update properties that don't require a full rebuild
        if (this.rock) {
            this.rock.material.color.set(this.rockConfig.color);
            this.rock.material.roughness = this.rockConfig.materialRoughness;
            this.rock.material.metalness = this.rockConfig.metalness;
            
            // Re-assigning flatShading requires a material update
            if (this.rock.material.flatShading !== this.rockConfig.flatShading) {
                 this.rock.material.flatShading = this.rockConfig.flatShading;
                 this.rock.material.needsUpdate = true;
            }

            this.rock.scale.set(this.rockConfig.scaleX, this.rockConfig.scaleY, this.rockConfig.scaleZ);
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
        this.player.update(deltaTime);
        
        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
