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
        
        // ✨ CHANGED: Raycast against both landscape and mineable rocks
        const targets = [this.landscape.mesh, ...this.game.mineableRocks];
        const intersects = this.raycaster.intersectObjects(targets, true); // true for recursive

        if (intersects.length > 0) {
            const firstHit = intersects[0];
            const hitObject = firstHit.object;

            if (this.game.buildMode.active) {
                this.game.placeRock(firstHit.point);
            } else {
                // Check if the hit object is a mineable rock
                if (hitObject.userData.isMineable) {
                    this.player.startMining(hitObject);
                } else {
                    // Otherwise, it must be the landscape
                    this.player.moveTo(firstHit.point);
                }
            }
        }
    }
}
