// File: src/core/CameraController.js
import * as THREE from 'three';

export default class CameraController {
    constructor(domElement, camera) {
        this.domElement = domElement;
        this.camera = camera;

        this.touchState = {
            isDragging: false,
            lastDragX: 0,
            startPos: new THREE.Vector2(),
        };

        this.addEventListeners();
    }

    addEventListeners() {
        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.touchState.isDragging = false;
            this.touchState.startPos.set(event.touches[0].clientX, event.touches[0].clientY);
            this.touchState.lastDragX = event.touches[0].clientX;
        }
    }

    onTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length !== 1) return;

        // Determine if a single touch has moved enough to be considered a drag
        const currentPos = new THREE.Vector2(event.touches[0].clientX, event.touches[0].clientY);
        if (this.touchState.startPos.distanceTo(currentPos) > 10) { // Drag threshold
            this.touchState.isDragging = true;
        }

        // Handle Drag to Orbit
        if (this.touchState.isDragging) {
             const deltaX = event.touches[0].clientX - this.touchState.lastDragX;
             this.camera.orbitAngle -= deltaX * 0.01;
             this.touchState.lastDragX = event.touches[0].clientX;
        }
    }
    
    onTouchEnd(event) {
        this.touchState.isDragging = false;
    }
}
