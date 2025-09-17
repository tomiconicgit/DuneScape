import * as THREE from 'three';

export default class Character {
    constructor(scene) {
        const width = 0.4;
        const height = 1.2;
        const depth = 0.4;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        
        this.mesh = new THREE.Mesh(geometry, material);

        // Set the starting position to be inside the mine area (centered at 75, 75)
        // The Y position is slightly above the ground to prevent falling through.
        this.mesh.position.set(75, height, 75);
        
        scene.add(this.mesh);
    }
}
