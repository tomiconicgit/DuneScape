// File: src/core/CameraController.js
import * as THREE from 'three';

export default class CameraController {
    constructor(domElement, camera) {
        this.domElement = domElement;
        this.camera = camera;

        // State for camera-specific touch gestures
        this.touchState = {
            isDragging: false,
            isPinching: false,
            lastDragX: 0,
            initialPinchDist: 0,
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
        this.touchState.isDragging = false;
        this.touchState.startPos.set(event.touches[0].clientX, event.touches[0].clientY);

        if (event.touches.length === 1) {
            // Setup for a potential drag-to-orbit
            this.touchState.lastDragX = event.touches[0].clientX;
        } else if (event.touches.length === 2) {
            // Setup for pinch-to-zoom
            this.touchState.isPinching = true;
            this.touchState.initialPinchDist = this.getPinchDistance(event.touches);
        }
    }

    onTouchMove(event) {
        event.preventDefault();

        // Determine if a single touch has moved enough to be considered a drag
        const currentPos = new THREE.Vector2(event.touches[0].clientX, event.touches[0].clientY);
        if (this.touchState.startPos.distanceTo(currentPos) > 10) { // Drag threshold
            this.touchState.isDragging = true;
        }

        // Handle Pinch to Zoom
        if (event.touches.length === 2) {
            this.touchState.isPinching = true;
            const currentPinchDist = this.getPinchDistance(event.touches);
            const delta = this.touchState.initialPinchDist - currentPinchDist;
            
            this.camera.zoomLevel += delta * 0.002;
            this.camera.zoomLevel = Math.max(0, Math.min(1, this.camera.zoomLevel));
            
            this.touchState.initialPinchDist = currentPinchDist;

        // Handle Drag to Orbit (only if not pinching)
        } else if (this.touchState.isDragging && event.touches.length === 1) {
             const deltaX = event.touches[0].clientX - this.touchState.lastDragX;
             this.camera.orbitAngle -= deltaX * 0.01;
             this.touchState.lastDragX = event.touches[0].clientX;
        }
    }
    
    onTouchEnd(event) {
        // Reset camera-specific states
        this.touchState.isDragging = false;
        this.touchState.isPinching = false;
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
