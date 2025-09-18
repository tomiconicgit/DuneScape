import * as THREE from 'three';
import Debug from '../ui/Debug.js';
import Character from '../components/Character.js';
import Camera from './Camera.js';
import InputController from './InputController.js';
import Movement from '../mechanics/Movement.js';
import { setupLighting } from '../world/Lighting.js';
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';
import Rocks from '../world/objects/Rocks.js';
import GamepadController from './GamepadController.js';
import Navbar from '../ui/Navbar.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA, trailNetwork } from '../world/WorldData.js';

const DAY_DURATION_SECONDS = 120;
const NIGHT_DURATION_SECONDS = 120;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;
const SUN_COLOR_NOON = new THREE.Color().setHSL(0.1, 1, 0.95);
const SUN_COLOR_SUNSET = new THREE.Color().setHSL(0.05, 1, 0.7);
const HEMI_SKY_COLOR_NOON = new THREE.Color().setHSL(0.6, 1, 0.6);
const HEMI_GROUND_COLOR_NOON = new THREE.Color().setHSL(0.095, 1, 0.75);
const HEMI_COLOR_SUNSET = new THREE.Color().setHSL(0.05, 0.5, 0.7);
const HEMI_SKY_COLOR_NIGHT = new THREE.Color().setHSL(0.6, 0.1, 0.05);
const HEMI_GROUND_COLOR_NIGHT = new THREE.Color().setHSL(0.6, 0.1, 0.05);

function smoothstep(min, max, value) { const x = Math.max(0, Math.min(1, (value - min) / (max - min))); return x * x * (3 - 2 * x); }

export default class Game {
    constructor() {
        Debug.init();
        this.scene = new THREE.Scene();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.buildMode = { enabled: false, rockType: null };
        this.timeOffset = DAY_DURATION_SECONDS * 0.1;

        this.camera = new Camera(this.renderer.domElement);
        this.character = new Character(this.scene);
        this.sky = new GameSky(this.scene);
        this.terrain = new Terrain(this.scene);
        this.rocks = new Rocks(this.scene);
        this.movement = new Movement(this.character.mesh);
        this.input = new InputController(this.camera.threeCamera, this.terrain.mesh, this.renderer.domElement);
        
        this.navbar = new Navbar(
            (type) => this.handleRockSelect(type),
            () => this.handleCopyRockData(),
            () => this.rocks.clearAllRocks(),
            (location) => this.handleNavigation(location)
        );

        const { hemiLight, dirLight } = setupLighting(this.scene);
        this.sunLight = dirLight;
        this.hemiLight = hemiLight;
        this.character.mesh.castShadow = true;
        this.gamepad = new GamepadController();
        this._setupPostProcessing();
        this._setupEvents();
    }
    
    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera.threeCamera);
        this.composer.addPass(renderPass);
        this.bokehPass = new BokehPass(this.scene, this.camera.threeCamera, {
            focus: 10.0,
            aperture: 0.0005,
            maxblur: 0.01,
        });
        this.composer.addPass(this.bokehPass);
    }

    handleRockSelect(rockType) {
        this.buildMode.enabled = rockType !== null;
        this.buildMode.rockType = rockType;
        this.input.setMode(this.buildMode.enabled ? 'BUILD' : 'MOVEMENT');
    }

    handleCopyRockData() {
        const data = this.rocks.getRockDataForExport();
        navigator.clipboard.writeText(data).then(() => {
            alert('Rock data copied to clipboard!');
        });
    }

    handleNavigation(location) {
        const playerPos = this.character.mesh.position;
        const locations = {
            town: new THREE.Vector3(TOWN_AREA.x, 0, TOWN_AREA.y),
            mine: new THREE.Vector3(MINE_AREA.x, 0, MINE_AREA.y),
            oasis: new THREE.Vector3(OASIS_AREA.x, 0, OASIS_AREA.y)
        };
        const destinationPos = locations[location];
        if (!destinationPos) return;

        let startLocation = 'town';
        let minDistance = playerPos.distanceTo(locations.town);
        if (playerPos.distanceTo(locations.mine) < minDistance) { startLocation = 'mine'; }
        if (playerPos.distanceTo(locations.oasis) < minDistance) { startLocation = 'oasis'; }
        if (startLocation === location) return;

        let trailCurve;
        if ((startLocation === 'town' && location === 'mine') || (startLocation === 'mine' && location === 'town')) { trailCurve = trailNetwork.townToMine; }
        else if ((startLocation === 'town' && location === 'oasis') || (startLocation === 'oasis' && location === 'town')) { trailCurve = trailNetwork.townToOasis; }
        else if ((startLocation === 'mine' && location === 'oasis') || (startLocation === 'oasis' && location === 'mine')) { trailCurve = trailNetwork.mineToOasis; }
        else { this.movement.calculatePathOnTerrain(destinationPos, this.terrain.mesh); return; }

        const trailPoints = trailCurve.getPoints(100);
        if (playerPos.distanceTo(trailPoints[0]) > playerPos.distanceTo(trailPoints[trailPoints.length - 1])) {
            trailPoints.reverse();
        }
        
        const pathToTrail = this.movement._findPath(playerPos, trailPoints[0]);
        const fullPath = pathToTrail.map(p => new THREE.Vector3(p.x, 0, p.z)).concat(trailPoints);

        this.movement.followTrail(fullPath, this.terrain.mesh);
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.handleResize();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });

        this.input.onTap = (worldPos) => {
            if (!this.buildMode.enabled) {
                this.movement.calculatePathOnTerrain(worldPos, this.terrain.mesh);
            }
        };

        this.input.onBuildTap = (worldPos) => {
            if (this.buildMode.enabled) {
                const mineRect = new THREE.Box2(
                    new THREE.Vector2(MINE_AREA.x - MINE_AREA.width / 2, MINE_AREA.y - MINE_AREA.depth / 2),
                    new THREE.Vector2(MINE_AREA.x + MINE_AREA.width / 2, MINE_AREA.y + MINE_AREA.depth / 2)
                );
                if (mineRect.containsPoint(new THREE.Vector2(worldPos.x, worldPos.z))) {
                    this.rocks.addRock(this.buildMode.rockType, worldPos);
                } else {
                    alert("You can only place rocks inside the mine area.");
                }
            }
        };
    }

    start() {
        console.log("Game Engine: World setup complete.");
        this.camera.setTarget(this.character.mesh);
        this._animate();
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime() + this.timeOffset;

        const cycleProgress = (elapsedTime % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        let dayProgress = 0, currentElevation = 0, currentAzimuth = 0;
        if(cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)){ dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS); currentElevation = Math.sin(dayProgress * Math.PI) * 90; } else { const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS); currentElevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90; dayProgress = 1.0; }
        currentAzimuth = 180 - (dayProgress * 360);
        this.sky.setParameters({ elevation: currentElevation, azimuth: currentAzimuth });
        this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);

        const sunHeightFactor = Math.max(0, currentElevation) / 90;
        const sunsetFactor = smoothstep(0.4, 0.0, sunHeightFactor);
        const nightFactor = smoothstep(0.0, -0.2, currentElevation / 90.0);
        this.sunLight.intensity = (1.0 - nightFactor) * 3.0;
        this.sunLight.color.lerpColors(SUN_COLOR_NOON, SUN_COLOR_SUNSET, sunsetFactor);
        this.hemiLight.intensity = (0.2 + sunHeightFactor * 2.0) * (1.0 - nightFactor * 0.5);
        const daySkyHemi = HEMI_SKY_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);
        const dayGroundHemi = HEMI_GROUND_COLOR_NOON.clone().lerp(HEMI_COLOR_SUNSET, sunsetFactor);
        this.hemiLight.color.lerpColors(daySkyHemi, HEMI_SKY_COLOR_NIGHT, nightFactor);
        this.hemiLight.groundColor.lerpColors(dayGroundHemi, HEMI_GROUND_COLOR_NIGHT, nightFactor);

        const distance = this.camera.threeCamera.position.distanceTo(this.character.mesh.position);
        this.bokehPass.uniforms['focus'].value = distance;
        
        this.movement.update(delta);
        this.camera.update();
        this.composer.render();
    }
}
