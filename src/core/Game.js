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
import { permanentRocks } from '../world/assets/rockLayout.js'; // ✨ ADDED: Import the permanent layout

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

        // ✨ ADDED: Functions to place all permanent rocks
        this.populatePermanentRocks();
        this.scatterRimRocks();
    }
    
    // ✨ ADDED: New function to place the pre-designed layout
    populatePermanentRocks() {
        for (const rock of permanentRocks) {
            const preset = rockPresets[rock.type];
            if (!preset) {
                console.warn(`Rock type "${rock.type}" not found in presets.`);
                continue;
            }
            
            const config = { ...preset, seed: Math.random() };
            const newRock = createProceduralRock(config);

            // Use position from the layout data
            newRock.position.set(rock.position.x, rock.position.y, rock.position.z);
            newRock.scale.set(config.scaleX, config.scaleY, config.scaleZ);
            newRock.rotation.y = Math.random() * Math.PI * 2; // Add random rotation

            this.scene.add(newRock);
        }
    }

    // ✨ ADDED: New function to scatter small decorative rocks
    scatterRimRocks() {
        const rimRocks = {
            count: 50,
            types: ['Stone 1', 'Stone 2', 'Stone 3', 'Stone 4'],
            bounds: { minX: 25, maxX: 75, minZ: 20, maxZ: 80 },
            jitter: 3.0 // How far from the rim line rocks can spawn
        };
        const raycaster = new THREE.Raycaster();
        const down = new THREE.Vector3(0, -1, 0);

        for (let i = 0; i < rimRocks.count; i++) {
            let x, z;
            const side = Math.floor(Math.random() * 4);
            
            // Pick a random point on one of the four edges of the quarry rim
            if (side === 0) { // Left edge
                x = rimRocks.bounds.minX + (Math.random() - 0.5) * rimRocks.jitter;
                z = THREE.MathUtils.lerp(rimRocks.bounds.minZ, rimRocks.bounds.maxZ, Math.random());
            } else if (side === 1) { // Right edge
                x = rimRocks.bounds.maxX + (Math.random() - 0.5) * rimRocks.jitter;
                z = THREE.MathUtils.lerp(rimRocks.bounds.minZ, rimRocks.bounds.maxZ, Math.random());
            } else if (side === 2) { // "Top" edge (minZ)
                x = THREE.MathUtils.lerp(rimRocks.bounds.minX, rimRocks.bounds.maxX, Math.random());
                z = rimRocks.bounds.minZ + (Math.random() - 0.5) * rimRocks.jitter;
            } else { // "Bottom" edge (maxZ)
                x = THREE.MathUtils.lerp(rimRocks.bounds.minX, rimRocks.bounds.maxX, Math.random());
                z = rimRocks.bounds.maxZ + (Math.random() - 0.5) * rimRocks.jitter;
            }

            // Raycast down to find the exact ground height at that point
            raycaster.set(new THREE.Vector3(x, 50, z), down);
            const intersects = raycaster.intersectObject(this.landscape.mesh);
            if (intersects.length === 0 || intersects[0].point.y < -1) continue; // Skip if rock is on the quarry floor
            
            const y = intersects[0].point.y;
            
            const type = rimRocks.types[Math.floor(Math.random() * rimRocks.types.length)];
            const preset = rockPresets[type];
            const scaleFactor = THREE.MathUtils.randFloat(0.25, 0.45); // Make them very small
            
            const config = {
                ...preset,
                seed: Math.random(),
                scaleX: preset.scaleX * scaleFactor,
                scaleY: preset.scaleY * scaleFactor,
                scaleZ: preset.scaleZ * scaleFactor,
            };

            const newRock = createProceduralRock(config);
            newRock.position.set(x, y, z);
            newRock.scale.set(config.scaleX, config.scaleY, config.scaleZ);
            newRock.rotation.y = Math.random() * Math.PI * 2;
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
        if (this.placedRocks.length === 0) {
            this.debugger.log('No rocks have been placed to copy.');
            return;
        }

        const layoutData = this.placedRocks.map(rockData => {
            const pos = rockData.mesh.position;
            return {
                type: rockData.type,
                position: { x: pos.x, y: pos.y, z: pos.z }
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
