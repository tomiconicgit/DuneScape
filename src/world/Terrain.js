import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js';

// Helper function for smooth interpolation
function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const segments = 256;

        // --- Trail to Mine Entrance (can be re-enabled if needed) ---
        // const TRAIL_WIDTH = 3;
        // const TRAIL_DEPTH = 0.5;
        // const townToMinePath = new THREE.CatmullRomCurve3([ ... ]);
        
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const material = new THREE.MeshLambertMaterial({ color: 0xdbb480 });

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const mineCenter = new THREE.Vector2(MINE_AREA.x, MINE_AREA.y);

        const slopeHeight = 1.5;
        const detailHeight = 0.25;

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            let height = simplex.noise(vertex.x * 0.02, vertex.y * 0.02) * slopeHeight;
            height += simplex.noise(vertex.x * 0.2, vertex.y * 0.2) * detailHeight;

            // --- NEW Open-Pit Mine Generation Logic ---
            const distToMineCenter = mineCenter.distanceTo(new THREE.Vector2(vertex.x, vertex.y));

            if (distToMineCenter < MINE_AREA.radius) {
                // 1. Create a smooth, bowl-shaped pit.
                // The value goes from 0 at the edge to 1 at the center.
                const bowlFactor = 1.0 - (distToMineCenter / MINE_AREA.radius);
                const smoothDepth = MINE_AREA.depth * smoothstep(0, 1, bowlFactor);

                // 2. Quantize the depth to create the stepped terraces.
                const terraceStepHeight = MINE_AREA.depth / MINE_AREA.terraces;
                const terracedDepth = Math.round(smoothDepth / terraceStepHeight) * terraceStepHeight;

                // 3. Add some noise to the walls to make them look more natural and less perfect.
                const wallNoise = simplex.noise(vertex.x * 0.1, vertex.y * 0.1) * 0.5;
                let mineHeight = -terracedDepth + wallNoise;

                // 4. Blend the outer rim of the pit smoothly with the surrounding desert.
                const blendDistance = 3.0;
                const blendFactor = smoothstep(MINE_AREA.radius - blendDistance, MINE_AREA.radius, distToMineCenter);
                height = THREE.MathUtils.lerp(mineHeight, height, blendFactor);
            }

            // Other flat area logic (Town, Oasis) can be added back here if desired
            // ...

            positions.setZ(i, height);
        }

        geometry.computeVertexNormals();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
