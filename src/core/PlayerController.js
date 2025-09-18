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

        // ... (rest of constructor is unchanged)
    }

    // ... (event listeners are unchanged)

    handleTap(touch) {
        const tapPosition = new THREE.Vector2(
            (touch.clientX / window.innerWidth) * 2 - 1,
            -(touch.clientY / window.innerHeight) * 2 + 1
        );

        this.raycaster.setFromCamera(tapPosition, this.camera.threeCamera);
        
        // ✨ FIX: Cleaned up the list of targets to ensure rocks are detected correctly.
        const landscapeMeshes = this.landscape.mesh.children;
        const targets = [...landscapeMeshes, ...this.game.mineableRocks];
        const intersects = this.raycaster.intersectObjects(targets, false); // recursive is false

        if (intersects.length > 0) {
            const firstHit = intersects[0];
            const hitObject = firstHit.object;

            if (this.game.buildMode.active) {
                this.game.placeRock(firstHit.point);
            } else {
                if (hitObject.userData && hitObject.userData.isMineable) {
                    this.player.startMining(hitObject);
                } else {
                    this.player.moveTo(firstHit.point);
                }
            }
        }
    }
}
