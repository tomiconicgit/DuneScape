// File: src/world/Landscape.js
import * as THREE from 'three';

export default class Landscape {
    constructor(scene, lighting) {
        // The landscape is now a group to hold multiple terrain pieces
        this.mesh = new THREE.Group();

        // 1. Create the main desert ground plane
        const groundGeo = new THREE.PlaneGeometry(800, 800);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        groundMat.color.copy(lighting.hemiLight.groundColor);

        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.mesh.add(groundMesh);
        
        // ✨ ADDED: Create the new mine area
        const mineWidth = 50;
        const mineHeight = 60;

        const mineGeo = new THREE.PlaneGeometry(mineWidth, mineHeight);
        
        // Create a new material that is a darker shade of the main ground
        const mineColor = groundMat.color.clone().multiplyScalar(0.8);
        const mineMat = new THREE.MeshLambertMaterial({ color: mineColor });
        
        const mineMesh = new THREE.Mesh(mineGeo, mineMat);
        mineMesh.rotation.x = -Math.PI / 2;
        mineMesh.receiveShadow = true;
        
        // Position the mine area and lift it slightly to prevent graphical glitches
        mineMesh.position.set(50, 0.01, 50); 
        this.mesh.add(mineMesh);
    }

    // This landscape is static, so the update function is empty
    update(time) {
        // No animation in this version
    }
}
