// File: src/core/InputController.js

export default class InputController {
    constructor(domElement, camera) {
        this.domElement = domElement;
        this.camera = camera;

        this.touchState = {
            isPinching: false,
            initialPinchDist: 0,
            lastDragX: 0,
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
            this.touchState.lastDragX = event.touches[0].clientX;
        } else if (event.touches.length === 2) {
            this.touchState.isPinching = true;
            this.touchState.initialPinchDist = this.getPinchDistance(event.touches);
        }
    }

    onTouchMove(event) {
        event.preventDefault();

        // Handle Pinch to Zoom
        if (this.touchState.isPinching && event.touches.length === 2) {
            const currentPinchDist = this.getPinchDistance(event.touches);
            const delta = this.touchState.initialPinchDist - currentPinchDist;
            
            // Update camera zoom level
            this.camera.zoomLevel += delta * 0.002;
            this.camera.zoomLevel = Math.max(0, Math.min(1, this.camera.zoomLevel)); // Clamp between 0 and 1
            
            this.touchState.initialPinchDist = currentPinchDist;

        // Handle Drag to Orbit
        } else if (!this.touchState.isPinching && event.touches.length === 1) {
             const deltaX = event.touches[0].clientX - this.touchState.lastDragX;

             // Update camera orbit angle
             this.camera.orbitAngle -= deltaX * 0.01;

             this.touchState.lastDragX = event.touches[0].clientX;
        }
    }
    
    onTouchEnd() {
        this.touchState.isPinching = false;
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
