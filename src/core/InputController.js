// File: src/core/InputController.js
import * as THREE from 'three';

export default class InputController {
    constructor(domElement, camera, landscape, player) {
        this.domElement = domElement;
        this.camera = camera;
        this.landscape = landscape;
        this.player = player;
        this.raycaster = new THREE.Raycaster();

        // This state now handles tap, drag, and pinch
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
            this.touchState.lastDragX = event.touches[0].clientX;
        } else if (event.touches.length === 2) {
            this.touchState.isPinching = true;
            this.touchState.initialPinchDist = this.getPinchDistance(event.touches);
        }
    }

    onTouchMove(event) {
        event.preventDefault();

        // Check if the primary touch has moved enough to be a drag
        const currentPos = new THREE.Vector2(event.touches[0].clientX, event.touches[0].clientY);
        if (this.touchState.startPos.distanceTo(currentPos) > 10) {
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
        // If it wasn't a drag and was a single touch, it's a tap for movement
        if (!this.touchState.isDragging && event.changedTouches.length === 1) {
            this.handleTap(event.changedTouches[0]);
        }

        // Reset states
        this.touchState.isDragging = false;
        this.touchState.isPinching = false;
    }

    handleTap(touch) {
        const tapPosition = new THREE.Vector2(
            (touch.clientX / window.innerWidth) * 2 - 1,
            -(touch.clientY / window.innerHeight) * 2 + 1
        );

        this.raycaster.setFromCamera(tapPosition, this.camera.threeCamera);
        const intersects = this.raycaster.intersectObject(this.landscape.mesh);

        if (intersects.length > 0) {
            this.player.moveTo(intersects[0].point);
        }
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
