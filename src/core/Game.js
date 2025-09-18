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
        
        // ✨ CHANGED: New config to match the default "Wet stone" shader parameters
        this.rock = null;
        this.rockConfig = {
            radius: 1.5,
            detail: 7,
            displacement: 0.4,
            seed: Math.random(),
            aoParam: new THREE.Vector2(1.2, 3.5),
            cornerParam: new THREE.Vector2(0.25, 40.0),
            lightIntensity: 0.25,
            metalness: 0.1,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
        };
        
        this.setupRenderer();
        this.setupInitialScene(); 
        this.devBar = new DeveloperBar(this.rockConfig, this.updateRock.bind(this));
        this.cameraController = new CameraController(this.renderer.domElement, this.camera);
        this.playerController = new PlayerController(this.renderer.domElement, this.camera, this.landscape, this.player);
        this.camera.setTarget(this.player.mesh);
        window.addEventListener('resize', this.handleResize.bind(this));
        this.debugger.log('Game initialized successfully.');
    }

    setupRenderer() {
        // ... (function remains the same)
    }
    
    setupInitialScene() {
        // ... (function remains the same)
    }

    updateRock(newConfig, forceRebuild = false) {
        const oldConfig = this.rockConfig;
        this.rockConfig = newConfig;

        // ✨ CHANGED: Rebuild is now triggered by geometry-defining parameters
        const needsRebuild = forceRebuild ||
            oldConfig.detail !== newConfig.detail ||
            oldConfig.displacement !== newConfig.displacement;

        if (needsRebuild) {
            if (this.rock) {
                this.scene.remove(this.rock);
                this.rock.geometry.dispose();
                this.rock.material.dispose();
            }
            this.rock = createProceduralRock(this.rockConfig);
            this.rock.position.set(3, 0, 2);
            this.scene.add(this.rock);
        }

        // ✨ CHANGED: Update shader uniforms and material properties efficiently
        if (this.rock) {
            const uniforms = this.rock.material.userData.uniforms;
            uniforms.uAoParam.value.copy(this.rockConfig.aoParam);
            uniforms.uCornerParam.value.copy(this.rockConfig.cornerParam);
            uniforms.uLightIntensity.value = this.rockConfig.lightIntensity;
            
            this.rock.material.metalness = this.rockConfig.metalness;
            this.rock.scale.set(this.rockConfig.scaleX, this.rockConfig.scaleY, this.rockConfig.scaleZ);
        }
    }
    
    handleResize() {
        // ... (function remains the same)
    }

    start() {
        // ... (function remains the same)
    }

    animate() {
        // ... (function remains the same)
    }
}
