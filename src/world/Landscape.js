// File: src/world/Landscape.js
import * as THREE from 'three';

export default class Landscape {
    constructor(scene, lighting) {
        const groundGeo = new THREE.PlaneGeometry(800, 800);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        // Link the ground color to the hemisphere light's ground color
        groundMat.color.copy(lighting.hemiLight.groundColor);

        this.mesh = new THREE.Mesh(groundGeo, groundMat);
        this.mesh.position.y = 0; // Set ground at the origin
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
    }

    // This landscape is static, so the update function is empty
    update(time) {
        // No animation in this version
    }
}
