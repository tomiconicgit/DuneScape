import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js';

// Re-add the helper method to THREE.Vector2
THREE.Vector2.prototype.distanceToSegment = function(v, w) {
    const dx = v.x - w.x; const dy = v.y - w.y; const l2 = dx * dx + dy * dy;
    if (l2 === 0) return this.distanceTo(v);
    let t = ((this.x - v.x) * (w.x - v.x) + (this.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const closestPoint = new THREE.Vector2(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
    return this.distanceTo(closestPoint);
};

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const segments = 256;

        // --- Trail to Mine Entrance ---
        const TRAIL_WIDTH = 3;
        const TRAIL_DEPTH = 0.5;
        const mineEntranceY = MINE_AREA.y - MINE_AREA.depth / 2 - 2;
        const townToMinePath = new THREE.CatcatmullRomCurve3([
            new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y + TOWN_AREA.depth / 2, 0),
            new THREE.Vector3(40, 40, 0),
            new THREE.Vector3(MINE_AREA.x, mineEntranceY, 0)
        ]);
        // Other trails can be added back here if needed
        const trails = [{ points: townToMinePath.getPoints(50) }];

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const material = new THREE.MeshLambertMaterial({ color: 0xdbb480 });

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const tempVec2 = new THREE.Vector2();

        const slopeHeight = 1.5;
        const detailHeight = 0.25;

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            let height = simplex.noise(vertex.x * 0.02, vertex.y * 0.02) * slopeHeight;
            height += simplex.noise(vertex.x * 0.2, vertex.y * 0.2) * detailHeight;

            let finalHeight = height;
            let inDesignatedArea = false;

            // --- Rectangular Terraced Mine Generation ---
            const mineLeft = MINE_AREA.x - MINE_AREA.width / 2;
            const mineRight = MINE_AREA.x + MINE_AREA.width / 2;
            const mineTop = MINE_AREA.y - MINE_AREA.depth / 2;
            const mineBottom = MINE_AREA.y + MINE_AREA.depth / 2;
            
            if (vertex.x > mineLeft && vertex.x < mineRight && vertex.y > mineTop && vertex.y < mineBottom) {
                inDesignatedArea = true;
                const L = MINE_AREA.levels;
                const slope = MINE_AREA.slope_width;

                if (vertex.y < L[0].y_start + L[0].depth) { // Carbon Level
                    finalHeight = L[0].height;
                } else if (vertex.y < L[1].y_start) { // Slope 1
                    const blend = (vertex.y - (L[0].y_start + L[0].depth)) / slope;
                    finalHeight = THREE.MathUtils.lerp(L[0].height, L[1].height, blend);
                } else if (vertex.y < L[1].y_start + L[1].depth) { // Limestone Level
                    finalHeight = L[1].height;
                } else if (vertex.y < L[2].y_start) { // Slope 2
                    const blend = (vertex.y - (L[1].y_start + L[1].depth)) / slope;
                    finalHeight = THREE.MathUtils.lerp(L[1].height, L[2].height, blend);
                } else { // Iron Level
                    finalHeight = L[2].height;
                }
            }

            // Flatten other areas
            // ... (Town/Oasis flattening logic can be re-added here if needed)

            // Carve trails
            if (!inDesignatedArea) {
                // ... (Trail carving logic)
            }

            positions.setZ(i, finalHeight);
        }

        geometry.computeVertexNormals();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
