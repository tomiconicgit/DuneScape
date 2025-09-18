// File: src/world/Landscape.js
import * as THREE from 'three';

export default class Landscape {
    constructor(scene, lighting) {
        this.mesh = new THREE.Group();

        // 1. Create the main desert ground plane
        const groundGeo = new THREE.PlaneGeometry(800, 800);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        groundMat.color.copy(lighting.hemiLight.groundColor);

        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.mesh.add(groundMesh);
        
        // ✨ CHANGED: Generate a custom mesh for the mine with a slope and lower level
        const mineWidth = 50;
        const mineLength = 60; // Use length for the dimension with the slope
        const mineDepth = 5;   // How far down the lower level is
        
        const slopeLength = 20; // The length of the ramp
        const lowerLevelLength = mineLength - slopeLength;

        // Create a plane with enough vertices to deform into a slope
        const mineGeo = new THREE.PlaneGeometry(mineWidth, mineLength, mineWidth, mineLength);
        const positions = mineGeo.attributes.position;

        // Deform the plane's vertices to create the slope
        for (let i = 0; i < positions.count; i++) {
            const z = positions.getZ(i); // In a default plane, Z is the up/down axis

            // The plane's origin is its center. The length (Z) goes from -30 to +30.
            // We'll make the section from Z = -30 to Z = 10 the lower level.
            const lowerLevelBoundary = -mineLength / 2 + lowerLevelLength;

            if (z < lowerLevelBoundary) {
                // This vertex is on the flat, lower level
                positions.setZ(i, -mineDepth);
            } else {
                // This vertex is on the slope
                const slopeStart = lowerLevelBoundary;
                const slopeEnd = mineLength / 2;
                
                // Calculate how far along the slope this vertex is (0.0 to 1.0)
                const slopeProgress = (z - slopeStart) / (slopeEnd - slopeStart);
                
                // Interpolate the height based on the progress
                const height = -mineDepth + (slopeProgress * mineDepth);
                positions.setZ(i, height);
            }
        }
        
        // Recalculate normals for correct lighting on the new shape
        mineGeo.computeVertexNormals();
        
        const mineColor = groundMat.color.clone().multiplyScalar(0.8);
        const mineMat = new THREE.MeshLambertMaterial({ color: mineColor });
        
        const mineMesh = new THREE.Mesh(mineGeo, mineMat);
        // Rotate it to lie flat on the XZ plane
        mineMesh.rotation.x = -Math.PI / 2;
        mineMesh.receiveShadow = true;
        
        // Position the entire mine area
        mineMesh.position.set(50, 0, 50); 
        this.mesh.add(mineMesh);
    }

    update(time) {
        // No animation in this version
    }
}
