import * as THREE from 'three';

export default class Character {
    constructor(scene) {
        const width = 0.4, height = 1.2, depth = 0.4;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0.5, height / 2, 0.5);
        
        scene.add(this.mesh);
    }
}
