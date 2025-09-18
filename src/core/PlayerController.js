// File: src/core/PlayerController.js
import * as THREE from 'three';

export default class PlayerController {
    constructor(domElement, camera, landscape, player, game) { // ✨ ADDED: game instance
        this.domElement = domElement;
        this.camera = camera;
        this.landscape = landscape;
        this.player = player;
        this.game = game; // ✨ ADDED: Store reference to the game
        this.raycaster = new THREE.Raycaster();

        this.touchState = {
            isDragging: false,
            startPos: new THREE.Vector2(),
        };

        this.addEventListeners();
    }

    addEventListeners() {
        // ... (no changes here)
    }
    onTouchStart(event) {
        // ... (no changes here)
    }
    onTouchMove(event) {
        // ... (no changes here)
    }
    onTouchEnd(event) {
        // ... (no changes here)
    }

    handleTap(touch) {
        const tapPosition = new THREE.Vector2(
            (touch.clientX / window.innerWidth) * 2 - 1,
            -(touch.clientY / window.innerHeight) * 2 + 1
        );

        this.raycaster.setFromCamera(tapPosition, this.camera.threeCamera);
        const intersects = this.raycaster.intersectObject(this.landscape.mesh);

        if (intersects.length > 0) {
            // ✨ CHANGED: Check for build mode before acting
            if (this.game.buildMode.active) {
                this.game.placeRock(intersects[0].point);
            } else {
                this.player.moveTo(intersects[0].point);
            }
        }
    }
}
