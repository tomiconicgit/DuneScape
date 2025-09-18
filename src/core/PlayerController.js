// File: src/core/PlayerController.js
import * as THREE from 'three';

export default class PlayerController {
    constructor(domElement, camera, landscape, player) {
        this.domElement = domElement;
        this.camera = camera;
        this.landscape = landscape;
        this.player = player;
        this.raycaster = new THREE.Raycaster();

        // State to distinguish a tap from a drag for player movement
        this.touchState = {
            isDragging: false,
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
        // Listen only for single touches to initiate a potential tap
        if (event.touches.length === 1) {
            this.touchState.isDragging = false;
            this.touchState.startPos.set(event.touches[0].clientX, event.touches[0].clientY);
        }
    }

    onTouchMove(event) {
        // If a single touch moves beyond a threshold, it's a drag, not a tap
        if (event.touches.length === 1) {
            const currentPos = new THREE.Vector2(event.touches[0].clientX, event.touches[0].clientY);
            if (this.touchState.startPos.distanceTo(currentPos) > 10) { // Drag threshold
                this.touchState.isDragging = true;
            }
        }
    }
    
    onTouchEnd(event) {
        // A tap is a single touch that ends without having been dragged
        if (!this.touchState.isDragging && event.changedTouches.length === 1 && event.touches.length === 0) {
            this.handleTap(event.changedTouches[0]);
        }
        
        // Reset state for the next touch
        this.touchState.isDragging = false;
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
}
