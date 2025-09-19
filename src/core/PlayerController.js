// File: src/core/PlayerController.js
import * as THREE from 'three';

export default class PlayerController {
    constructor(domElement, game, camera, player, landscape) {
        this.domElement = domElement;
        this.game = game;
        this.camera = camera;
        this.player = player;
        this.landscape = landscape;
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
        if (event.touches.length === 1) {
            this.touchState.isDragging = false;
            this.touchState.startPos.set(event.touches[0].clientX, event.touches[0].clientY);
        }
    }

    onTouchMove(event) {
        if (event.touches.length === 1) {
            const currentPos = new THREE.Vector2(event.touches[0].clientX, event.touches[0].clientY);
            if (this.touchState.startPos.distanceTo(currentPos) > 10) {
                this.touchState.isDragging = true;
            }
        }
    }
    
    onTouchEnd(event) {
        if (!this.touchState.isDragging && event.changedTouches.length === 1 && event.touches.length === 0) {
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
        
        const intersects = this.raycaster.intersectObjects(this.game.scene.children, true);

        let landscapeIntersection = null;

        for (const intersect of intersects) {
            // If we hit a mineable rock, that takes priority.
            if (intersect.object.userData.isMineable) {
                this.player.startMining(intersect.object);
                return; // Action taken, stop processing
            }
            // If we hit the landscape, store it but keep looking for rocks closer to the camera.
            if (this.landscape.mesh.children.includes(intersect.object)) {
                if (!landscapeIntersection) {
                    landscapeIntersection = intersect;
                }
            }
        }

        // If we found a landscape intersection and no rocks were clicked, handle movement.
        if (landscapeIntersection) {
            this.player.cancelActions();
            this.player.moveTo(landscapeIntersection.point);
        }
    }
}
