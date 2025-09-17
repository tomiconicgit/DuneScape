import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js';

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const segments = 200;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const material = new THREE.MeshLambertMaterial({ color: 0xdbb480 });

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        // Very gentle slopes for the main world
        const slopeHeight = 1.0;

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            
            // 1. Calculate a base height with very gentle slopes
            let finalHeight = simplex.noise(vertex.x * 0.02, vertex.y * 0.02) * slopeHeight;

            // 2. Define the main mine area boundaries
            const mineLeft = MINE_AREA.x - MINE_AREA.width / 2;
            const mineRight = MINE_AREA.x + MINE_AREA.width / 2;
            const mineTop = MINE_AREA.y - MINE_AREA.depth / 2;
            const mineBottom = MINE_AREA.y + MINE_AREA.depth / 2;

            // 3. Check if the vertex is inside the main mine area
            if (vertex.x > mineLeft && vertex.x < mineRight && vertex.y > mineTop && vertex.y < mineBottom) {
                // If it is, start with a perfectly flat base height
                finalHeight = MINE_AREA.base_height;

                // 4. Check if the vertex is inside any of the smaller ore patches
                for (const patch of MINE_AREA.patches) {
                    const patchLeft = patch.x - patch.width / 2;
                    const patchRight = patch.x + patch.width / 2;
                    const patchTop = patch.y - patch.depth / 2;
                    const patchBottom = patch.y + patch.depth / 2;

                    if (vertex.x > patchLeft && vertex.x < patchRight && vertex.y > patchTop && vertex.y < patchBottom) {
                        finalHeight = patch.height; // Set the height to the patch's height
                        break; // Stop checking once we find a patch
                    }
                }
            }
            
            // (Other areas like Town/Oasis can be flattened here as well)

            positions.setZ(i, finalHeight);
        }

        geometry.computeVertexNormals();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
