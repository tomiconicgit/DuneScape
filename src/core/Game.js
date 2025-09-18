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
        
        // ✨ CHANGED: Updated with the new default design and added color parameters
        this.rock = null;
        this.rockConfig = {
            detail: 9,
            displacement: 0.35,
            aoParam: new THREE.Vector2(1.0, 1.4),
            cornerParam: new THREE.Vector2(0.35, 40.0),
            metalness: 0.3,
            scaleX: 1.1,
            scaleY: 1.0,
            scaleZ: 1.4,
            radius: 1.5,
            seed: Math.random(),
            // ✨ ADDED: New color hints for different ore types (default is Iron Ore)
            colorDark: 0x3d2b1f,   // Dark brown
            colorBase: 0xb7410e,   // Rusty red
            colorHighlight: 0xd2a679, // Light tan
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
        this.updateRock(this.rockConfig, true);
    }

    updateRock(newConfig, forceRebuild = false) {
        const oldConfig = this.rockConfig;
        this.rockConfig = newConfig;

        const needsRebuild = forceRebuild ||
            oldConfig.detail !== newConfig.detail ||
            oldConfig.displacement !== newConfig.displacement ||
            oldConfig.seed !== newConfig.seed;

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
        
        if (this.rock) {
            const uniforms = this.rock.material.userData.uniforms;
            uniforms.uAoParam.value.copy(this.rockConfig.aoParam);
            uniforms.uCornerParam.value.copy(this.rockConfig.cornerParam);
            
            // ✨ ADDED: Update color uniforms on the fly
            uniforms.uColorDark.value.set(this.rockConfig.colorDark);
            uniforms.uColorBase.value.set(this.rockConfig.colorBase);
            uniforms.uColorHighlight.value.set(this.rockConfig.colorHighlight);
            
            this.rock.material.metalness = this.rockConfig.metalness;
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
