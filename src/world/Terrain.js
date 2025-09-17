import * as THREE from 'three';

export default class Terrain {
    constructor(scene) {
        const size = 200;

        // A simple, flat plane geometry
        const geometry = new THREE.PlaneGeometry(size, size);
        
        const material = new THREE.MeshLambertMaterial({
            color: 0xdbb480 // A neutral sand color
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
