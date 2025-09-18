// File: src/world/Landscape.js
import * as THREE from 'three';

export default class Landscape {
    constructor(scene, lighting) {
        
        // ✨ CHANGED: The entire landscape is now one unified, high-resolution mesh.
        // We use 200x200 segments to have enough vertices to deform.
        const landscapeGeo = new THREE.PlaneGeometry(800, 800, 200, 200);
        const positions = landscapeGeo.attributes.position;

        // Define the quarry's properties
        const quarry = {
            center: new THREE.Vector2(50, 50),
            width: 50,
            length: 60,
            depth: 10,
            slopeWidth: 8, // How wide the sloping sides are
        };

        const minX = quarry.center.x - quarry.width / 2;
        const maxX = quarry.center.x + quarry.width / 2;
        const minZ = quarry.center.y - quarry.length / 2; // Using y for z-axis in a 2D vector
        const maxZ = quarry.center.y + quarry.length / 2;

        // Iterate over every vertex in the landscape and modify its height
        for (let i = 0; i < positions.count; i++) {
            const vx = positions.getX(i);
            const vz = positions.getY(i); // In a default plane, Y corresponds to the world's Z axis

            // Check if the vertex is within the quarry's rectangular footprint
            if (vx > minX && vx < maxX && vz > minZ && vz < maxZ) {
                // Calculate the vertex's distance to the nearest horizontal/vertical edge of the quarry
                const distToEdge = Math.min(
                    vx - minX,
                    maxX - vx,
                    vz - minZ,
                    maxZ - vz
                );

                let height = 0;
                if (distToEdge < quarry.slopeWidth) {
                    // This vertex is on the slope.
                    // Calculate its progress from the top rim (0.0) to the bottom (1.0).
                    const slopeProgress = distToEdge / quarry.slopeWidth;
                    // Interpolate the height from 0 down to the full depth.
                    height = -quarry.depth * (1 - slopeProgress);
                } else {
                    // This vertex is on the flat bottom of the quarry.
                    height = -quarry.depth;
                }
                
                // Set the vertex's height (its Z-coordinate in the original geometry).
                positions.setZ(i, height);
            }
        }
        
        // We need to tell the geometry to update and recalculate normals for correct lighting
        landscapeGeo.attributes.position.needsUpdate = true;
        landscapeGeo.computeVertexNormals();

        const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        groundMat.color.copy(lighting.hemiLight.groundColor);
        
        this.mesh = new THREE.Mesh(landscapeGeo, groundMat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
    }

    update(time) {
        // No animation in this version
    }
}
