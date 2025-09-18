// File: src/entities/Player.js
import * as THREE from 'three';

export default class Player {
    constructor(scene) {
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 12);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Lift the capsule so its bottom is at y=0
        this.mesh.position.set(0, 1, 0); 
        this.mesh.castShadow = true;

        scene.add(this.mesh);
    }

    // We will add update logic for movement later
    update(deltaTime) {
        // Player movement logic will go here
    }
}
