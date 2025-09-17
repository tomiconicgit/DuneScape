import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js';

// Helper for smoothstep interpolation
function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const segments = 256;

        const TRAIL_WIDTH = 3;
        const TRAIL_DEPTH = 0.5;
        const townToMinePath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y + TOWN_AREA.depth / 2, 0),
            new THREE.Vector3(40, 40, 0),
            new THREE.Vector3(MINE_AREA.x, MINE_AREA.y - MINE_AREA.radius - 5, 0) // End trail at the pit's edge
        ]);
        const trails = [{ points: townToMinePath.getPoints(50) }];

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

            // --- Open-Pit Mine Generation ---
            const distToMineCenter = mineCenter.distanceTo(new THREE.Vector2(vertex.x, vertex.y));
            if (distToMineCenter < MINE_AREA.radius) {
                // Calculate the smooth, bowl-shaped depth
                const smoothDepth = MINE_AREA.depth * Math.sqrt(1 - (distToMineCenter / MINE_AREA.radius));
                
                // Calculate which terrace this point belongs to
                const terraceWidth = MINE_AREA.radius / MINE_AREA.terraces;
                const positionInTerrace = distToMineCenter % terraceWidth;

                // Calculate the depth of the flat part of the current and next terraces
                const currentTerrace = Math.floor(distToMineCenter / terraceWidth);
                const depth1 = (currentTerrace / MINE_AREA.terraces) * MINE_AREA.depth;
                const depth2 = ((currentTerrace + 1) / MINE_AREA.terraces) * MINE_AREA.depth;
                
                let mineHeight;
                if (positionInTerrace < terraceWidth * MINE_AREA.tread) {
                    // This is the flat part of the terrace
                    mineHeight = -depth1;
                } else {
                    // This is the sloped wall between terraces
                    const blend = (positionInTerrace - (terraceWidth * MINE_AREA.tread)) / (terraceWidth * (1.0 - MINE_AREA.tread));
                    mineHeight = THREE.MathUtils.lerp(-depth1, -depth2, blend);
                }

                // Add some noise to the mine walls to make them less perfect
                mineHeight += simplex.noise(vertex.x * 0.1, vertex.y * 0.1) * 0.5;
                
                // Blend the outer edge of the pit with the main terrain
                const blendFactor = smoothstep(MINE_AREA.radius - 2, MINE_AREA.radius, distToMineCenter);
                height = THREE.MathUtils.lerp(mineHeight, height, blendFactor);
            }

            // Other flat area and trail logic can be added here if needed

            positions.setZ(i, height);
        }

        geometry.computeVertexNormals();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
