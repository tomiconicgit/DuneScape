import * as THREE from 'three';

export default class Terrain {
    constructor(scene) {
        const size = 200;

        const geometry = new THREE.PlaneGeometry(size, size);
        
        // MODIFIED: Give the terrain its own, independent base color
        const material = new THREE.MeshLambertMaterial({
            color: 0xdbb480 // A neutral sand color
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
