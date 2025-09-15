import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GodRaysCombineShader, GodRaysGenerateShader } from 'three/addons/shaders/GodRaysShader.js';

import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import DeveloperUI from '../ui/DeveloperUI.js';
import Grid from '../world/Grid.js';
import TileMap from '../world/TileMap.js';
import Atmosphere from '../world/Atmosphere.js';
import VolumetricClouds from '../world/VolumetricClouds.js';
import { setupLighting } from '../world/Lighting.js';

// Constants for day/night cycle
const DAY_DURATION_SECONDS = 600; // 10 minutes
const NIGHT_DURATION_SECONDS = 240; // 4 minutes
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        Debug.init();
        console.log("Game Engine: Initializing...");

        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.grid = new Grid(this.scene);
        this.tileMap = new TileMap(this.scene);
        this.atmosphere = new Atmosphere(this.scene);
        this.atmosphere.uniforms.uHorizonOffset.value = -0.1;
        this.clouds = new VolumetricClouds(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.grid.plane);
        this.devUI = new DeveloperUI();
        this.sunPosition = new THREE.Vector3();

        const { sun } = setupLighting(this.scene);
        this.sunLight = sun;
        this.character.mesh.castShadow = true;

        this._setupPostProcessing();
        this._setupEvents();
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupPostProcessing() {
        // Create a fake sun mesh for the god rays effect
        const sunGeometry = new THREE.SphereGeometry(200, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sunMesh.layers.set(1); // Put it on a separate layer
        this.scene.add(this.sunMesh);

        // Main composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera.threeCamera));

        // God Rays setup
        this.godRaysRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.godraysPass = new ShaderPass(GodRaysGenerateShader);
        this.combinePass = new ShaderPass(GodRaysCombineShader);
        this.combinePass.uniforms['fGodRayIntensity'].value = 0.6;
        this.combinePass.uniforms['tGodRays'].value = this.godRaysRenderTarget.texture;
        
        this.composer.addPass(this.combinePass);
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.handleResize();
            this.renderer.setSize(width, height);
            this.composer.setSize(width, height);
            this.godRaysRenderTarget.setSize(width, height);
        });

        // ... other event listeners are unchanged ...
        this.input.onTap = (worldPos, gridPos, buildMode) => {
            if (buildMode) {
                this.tileMap.paintTile(gridPos, buildMode);
            } else {
                this.movement.calculatePath(worldPos, gridPos);
            }
        };
        this.devUI.onBuildModeChange = (mode) => {
            this.input.setBuildMode(mode);
        };
        this.devUI.onSettingChange = (change) => {
            this._handleSettingChange(change);
        };
    }

    _handleSettingChange(change) {
        // ... this method is unchanged ...
        switch (change.setting) {
            case 'exposure': this.atmosphere.uniforms.uExposure.value = change.value; break;
            case 'rayleigh': this.atmosphere.uniforms.uRayleigh.value = change.value; break;
            case 'mie': this.atmosphere.uniforms.uMie.value = change.value; break;
            case 'horizonOffset': this.atmosphere.uniforms.uHorizonOffset.value = change.value; break;
            case 'cloudCover': this.clouds.uniforms.uCloudCover.value = change.value; break;
            case 'cloudSharpness': this.clouds.uniforms.uCloudSharpness.value = change.value; break;
        }
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // Day/night cycle logic
        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        let angle;
        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            const dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = dayProgress * Math.PI;
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = Math.PI + (nightProgress * Math.PI);
        }
        this.sunPosition.set(Math.cos(angle) * 8000, Math.sin(angle) * 6000, Math.sin(angle * 0.5) * 2000);
        
        // Update game objects
        this.sunLight.position.copy(this.sunPosition);
        this.sunLight.target.position.set(0, 0, 0); 
        this.sunLight.target.updateMatrixWorld();
        this.movement.update(delta);
        this.camera.update();
        this.atmosphere.update(this.sunPosition);
        this.clouds.update(this.sunPosition, delta);

        // --- God Rays Rendering Pipeline ---
        // 1. Update sun position for shader
        this.sunMesh.position.copy(this.sunPosition);
        const screenSpaceSun = this.sunPosition.clone().project(this.camera.threeCamera);
        this.godraysPass.uniforms['vSunPositionScreen'].value.set((screenSpaceSun.x + 1) / 2, (screenSpaceSun.y + 1) / 2, screenSpaceSun.z);

        // 2. Render a mask of the sun to our special render target
        const oldLayer = this.camera.threeCamera.layers.mask;
        this.renderer.setRenderTarget(this.godRaysRenderTarget);
        this.renderer.clear();
        this.camera.threeCamera.layers.set(1); // See only the sun
        this.renderer.render(this.scene, this.camera.threeCamera);
        this.camera.threeCamera.layers.set(oldLayer); // Restore layers
        this.renderer.setRenderTarget(null);

        // 3. Render the god rays effect itself
        this.godraysPass.render(this.renderer, this.godRaysRenderTarget, this.godRaysRenderTarget);

        // 4. Render the final combined scene to the screen
        this.composer.render(delta);
    }
}
