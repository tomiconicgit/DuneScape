// File: src/entities/Player.js
import * as THREE from 'three';

export default class Player {
    constructor(scene, landscape) {
        this.landscape = landscape;
        this.raycaster = new THREE.Raycaster();

        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 12);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // ✨ CHANGED: Player now starts just outside the 100x100 mine area.
        this.mesh.position.set(50, 1.0, 102); 
        
        this.mesh.castShadow = true;
        scene.add(this.mesh);

        // ... (rest of the file is unchanged)
    }

    // ... (rest of the file is unchanged)
}
