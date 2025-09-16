import * as THREE from 'three';

export default class Ground {
    constructor(scene, groundColor) {
        const groundGeo = new THREE.PlaneGeometry(10000, 10000);
        const groundMat = new THREE.MeshLambertMaterial({ color: groundColor });
        
        // MODIFIED: Store the mesh as a public property
        this.mesh = new THREE.Mesh(groundGeo, groundMat);
        
        this.mesh.position.y = -33;
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
