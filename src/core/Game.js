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
    this.grid = null;

    this.setupInitialScene();

    this.player = new Player(this.scene, this);
    this.camera = new Camera();
    // Render layer 1 (player)
    this.camera.threeCamera.layers.enable(1);

    window.loader.updateStatus('Entities created...', 80);

    this.setupRenderer();

    // Developer panel (top) with many sliders/toggles, non-blocking
    this.devBar = new DeveloperBar(this.player);

    this.cameraController = new CameraController(this.renderer.domElement, this.camera);
    this.playerController = new PlayerController(
      this.renderer.domElement,
      this,
      this.camera,
      this.player,
      this.landscape
    );
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

    window.loader.updateStatus('Building pathfinding grid...', 75);
    this.createPathfindingGrid();
  }

  procedurallyPlaceRocks() {
    const zones = {
      'Iron Ore':   { bounds: { minX: 80, maxX: 95, minZ: 20, maxZ: 70 }, count: 10 },
      'Gold Ore':   { bounds: { minX: 5,  maxX: 15, minZ: 5,  maxZ: 15 }, count: 5 },
      'Limestone':  { bounds: { minX: 30, maxX: 70, minZ: 60, maxZ: 90 }, count: 10 },
      'Carbon Ore': { bounds: { minX: 5,  maxX: 20, minZ: 70, maxZ: 95 }, count: 10 },
      'Sandstone':  { bounds: { minX: -5, maxX: 105, minZ: -5, maxZ: 105 }, count: 15, onEdge: true },
      'Stone 1':    { bounds: { minX: 0,  maxX: 100, minZ: 0,  maxZ: 100 }, count: 10 },
      'Stone 2':    { bounds: { minX: 0,  maxX: 100, minZ: 0,  maxZ: 100 }, count: 10 },
    };

    const totalRocks = Object.values(zones).reduce((acc, val) => acc + val.count, 0);
    let placedCount = 0;

    for (const [rockType, properties] of Object.entries(zones)) {
      const preset = rockPresets[rockType];
      if (!preset) continue;

      for (let i = 0; i < properties.count; i++) {
        let x, z;
        if (properties.onEdge) {
          const side = Math.floor(Math.random() * 4);
          if (side === 0) { x = THREE.MathUtils.randFloat(-5, 0);   z = THREE.MathUtils.randFloat(-5, 105); }
          else if (side === 1){ x = THREE.MathUtils.randFloat(100, 105); z = THREE.MathUtils.randFloat(-5, 105); }
          else if (side === 2){ z = THREE.MathUtils.randFloat(-5, 0);   x = THREE.MathUtils.randFloat(-5, 105); }
          else { z = THREE.MathUtils.randFloat(100, 105); x = THREE.MathUtils.randFloat(-5, 105); }
        } else {
          x = THREE.MathUtils.randFloat(properties.bounds.minX, properties.bounds.maxX);
          z = THREE.MathUtils.randFloat(properties.bounds.minZ, properties.bounds.maxZ);
        }

        const config = { ...preset, seed: Math.random() };
        const newRock = createProceduralRock(config);
        newRock.position.set(x, 0, z);
        newRock.scale.set(config.scaleX, config.scaleY, config.scaleZ);
        newRock.rotation.y = Math.random() * Math.PI * 2;

        newRock.userData.isMineable = true;
        newRock.userData.onMined = () => this.handleRockMined(newRock);

        this.scene.add(newRock);
        this.mineableRocks.push(newRock);

        placedCount++;
        const progress = 40 + (placedCount / totalRocks) * 35;
        window.loader.updateStatus(`Placing ore... (${placedCount}/${totalRocks})`, progress);
      }
    }
  }

  createPathfindingGrid() {
    const gridSize = 105;
    this.grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    const allRocks = [...this.mineableRocks, ...this.placedRocks.map(r => r.mesh)];

    for (const rock of allRocks) {
      const centerX = Math.round(rock.position.x);
      const centerZ = Math.round(rock.position.z);
      const radius = Math.ceil(Math.max(rock.scale.x, rock.scale.z) / 2);

      for (let x = centerX - radius; x <= centerX + radius; x++) {
        for (let z = centerZ - radius; z <= centerZ + radius; z++) {
          if (x >= 0 && x < gridSize && z >= 0 && z < gridSize) {
            this.grid[x][z] = 1;
          }
        }
      }
    }
  }

  handleRockMined(rockMesh) {
    rockMesh.visible = false;
    setTimeout(() => { rockMesh.visible = true; }, 15000);
  }

  handleResize() {
    this.camera.handleResize();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    if (window.loader) window.loader.finish();
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