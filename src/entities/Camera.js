// File: src/entities/Camera.js
import * as THREE from 'three';

export default class Camera {
    constructor() {
        this.target = null;
        
        this.threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

        // State (controlled by InputController)
        this.orbitAngle = Math.PI / 4; // Starting angle
        this.zoomLevel = 0.5; // Starting zoom (0=in, 1=out)

        // Config
        this.minDistance = 15;
        this.maxDistance = 15;
        this.cameraHeight = 5; // ✨ ADD THIS: Set a fixed height for the camera
        this.smoothing = 0.05;
    }

    setTarget(target) {
        this.target = target;
        this.update(); // Initial position update
    }

    update() {
        if (!this.target) return;

        // Calculate the ideal camera position based on state
        const distance = this.minDistance + this.zoomLevel * (this.maxDistance - this.minDistance);
        
        // ✨ CHANGE THIS: Use the fixed cameraHeight property directly
        const height = this.cameraHeight; 

        const targetPosition = this.target.position;
        const idealPosition = new THREE.Vector3();
        idealPosition.x = targetPosition.x + distance * Math.sin(this.orbitAngle);
        idealPosition.z = targetPosition.z + distance * Math.cos(this.orbitAngle);
        idealPosition.y = targetPosition.y + height;

        // Smoothly move the camera towards the ideal position
        this.threeCamera.position.lerp(idealPosition, this.smoothing);
        
        // Always look at a point slightly above the target's base
        const lookAtPosition = new THREE.Vector3(targetPosition.x, targetPosition.y + 1, targetPosition.z);
        this.threeCamera.lookAt(lookAtPosition);
    }

    handleResize() {
        this.threeCamera.aspect = window.innerWidth / window.innerHeight;
        this.threeCamera.updateProjectionMatrix();
    }
}
