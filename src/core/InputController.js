// File: src/core/InputController.js
import * as THREE from 'three';

export default class InputController {
    constructor(domElement, camera, landscape, player) {
        this.domElement = domElement;
        this.camera = camera;
        this.landscape = landscape;
        this.player = player;
        this.raycaster = new THREE.Raycaster();

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
        this.touchState.isDragging = false;
        // Store the starting position of the primary touch
        this.touchState.startPos.set(event.touches[0].clientX, event.touches[0].clientY);
    }

    onTouchMove(event) {
        event.preventDefault();
        // If the finger moves more than a small threshold, consider it a drag for the camera
        const currentPos = new THREE.Vector2(event.touches[0].clientX, event.touches[0].clientY);
        if (this.touchState.startPos.distanceTo(currentPos) > 10) {
            this.touchState.isDragging = true;
        }

        // Use the existing camera controls if dragging or pinching
        if (this.touchState.isDragging || event.touches.length > 1) {
            this.camera.handleTouchMove(event); // We'll move camera logic here later
        }
    }
    
    onTouchEnd(event) {
        // If it wasn't a drag and was a single touch, it's a tap
        if (!this.touchState.isDragging && event.changedTouches.length === 1) {
            this.handleTap(event.changedTouches[0]);
        }
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
            // We have an intersection point, tell the player to move there
            const intersectionPoint = intersects[0].point;
            this.player.moveTo(intersectionPoint);
        }
    }
}
