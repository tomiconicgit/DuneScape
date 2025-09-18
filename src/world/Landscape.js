// File: src/world/Landscape.js
import * as THREE from 'three';

export default class Landscape {
    constructor(scene, lighting) {
        
        // The entire landscape is one unified, high-resolution mesh.
        const landscapeGeo = new THREE.PlaneGeometry(800, 800, 200, 200);
        const positions = landscapeGeo.attributes.position;

        // ✨ ADDED: Attribute for vertex colors
        landscapeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3));
        const colors = landscapeGeo.attributes.color;

        // Define the quarry's properties
        const quarry = {
            center: new THREE.Vector2(50, 50),
            width: 50,
            length: 60,
            depth: 10,
            topLevelLength: 20, // The flat entrance area at the back
            slopeLength: 15,   // The length of the ramp
        };

        const minX = quarry.center.x - quarry.width / 2;
        const maxX = quarry.center.x + quarry.width / 2;
        const minZ = quarry.center.y - quarry.length / 2;
        const maxZ = quarry.center.y + quarry.length / 2;

        // Define the two terrain colors
        const desertColor = lighting.hemiLight.groundColor.clone();
        const mineColor = desertColor.clone().multiplyScalar(0.8);

        // Iterate over every vertex to set its height and color
        for (let i = 0; i < positions.count; i++) {
            const vx = positions.getX(i);
            const vz = positions.getY(i); // In a default plane, Y corresponds to the world's Z axis
            let isMineArea = false;

            // Check if the vertex is within the quarry's rectangular footprint
            if (vx > minX && vx < maxX && vz > minZ && vz < maxZ) {
                isMineArea = true;

                // ✨ CHANGED: New 3-zone logic for the quarry shape
                // Define the Z-axis boundaries for each section of the quarry
                const topLevelBoundaryZ = maxZ - quarry.topLevelLength;
                const slopeBoundaryZ = topLevelBoundaryZ - quarry.slopeLength;

                let height = 0;

                if (vz > topLevelBoundaryZ) {
                    // Zone 1: Top Level Entrance - height remains 0.
                    height = 0;
                } else if (vz > slopeBoundaryZ) {
                    // Zone 2: The Slope
                    const slopeProgress = (topLevelBoundaryZ - vz) / quarry.slopeLength;
                    height = -quarry.depth * slopeProgress;
                } else {
                    // Zone 3: The Lower Level Quarry Floor
                    height = -quarry.depth;
                }
                
                // Set the vertex's height (its Z-coordinate in the original geometry)
                positions.setZ(i, height);
            }

            // Set the color for the vertex
            const color = isMineArea ? mineColor : desertColor;
            colors.setXYZ(i, color.r, color.g, color.b);
        }
        
        landscapeGeo.attributes.position.needsUpdate = true;
        landscapeGeo.attributes.color.needsUpdate = true;
        landscapeGeo.computeVertexNormals();
        
        // The material must be told to use the vertex colors
        const groundMat = new THREE.MeshLambertMaterial({ vertexColors: true });
        
        this.mesh = new THREE.Mesh(landscapeGeo, groundMat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
    }

    update(time) {
        // No animation in this version
    }
}
