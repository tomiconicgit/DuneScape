// File: src/entities/Camera.js
import * as THREE from 'three';

export default class Camera {
    constructor() {
        this.target = null;
        
        this.threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

        // State (controlled by an input controller, for example)
        this.orbitAngle = Math.PI / 4; // Starting angle

        // Config
        this.orbitDistance = 4; // Fixed distance from the target
        this.cameraHeight = 3;   // Fixed height relative to the target
    }

    setTarget(target) {
        this.target = target;
        this.update(); // Set initial position
    }

    update() {
        if (!this.target) return;

        const targetPosition = this.target.position;
        const idealPosition = new THREE.Vector3();

        // Calculate the ideal camera position on the orbit circle
        idealPosition.x = targetPosition.x + this.orbitDistance * Math.sin(this.orbitAngle);
        idealPosition.z = targetPosition.z + this.orbitDistance * Math.cos(this.orbitAngle);
        idealPosition.y = targetPosition.y + this.cameraHeight;

        // --- FIX ---
        // Instantly move the camera to the ideal position without smoothing.
        this.threeCamera.position.copy(idealPosition);
        
        // Always look at a point slightly above the target's base
        const lookAtPosition = new THREE.Vector3(targetPosition.x, targetPosition.y + 1, targetPosition.z);
        this.threeCamera.lookAt(lookAtPosition);
    }

    handleResize() {
        this.threeCamera.aspect = window.innerWidth / window.innerHeight;
        this.threeCamera.updateProjectionMatrix();
    }
}
