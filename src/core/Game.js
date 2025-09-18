// File: src/core/Game.js
import * as THREE from 'three';
import Landscape from '../world/Landscape.js';

export default class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.setupRenderer();
        this.setupCamera();
        this.setupInitialScene();

        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupInitialScene() {
        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);

        // Create the landscape
        this.landscape = new Landscape();
        this.scene.add(this.landscape.mesh);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // In the future, game logic updates will go here.
        
        this.renderer.render(this.scene, this.camera);
    }
}
