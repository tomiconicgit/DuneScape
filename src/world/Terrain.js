import * as THREE from 'three';

export default class Terrain {
    constructor(scene, groundColor) {
        const size = 200;

        // A simple, flat plane for the ground
        const geometry = new THREE.PlaneGeometry(size, size);
        
        // A MeshLambertMaterial responds well to HemisphereLight, just like the example
        const material = new THREE.MeshLambertMaterial({
            color: groundColor
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
