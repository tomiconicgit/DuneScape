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

        const TRAIL_WIDTH = 3;
        const TRAIL_DEPTH = 0.5;
        const mineEntranceY = MINE_AREA.y - MINE_AREA.depth / 2 - 2;
        
        // Corrected the typo here
        const townToMinePath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y + TOWN_AREA.depth / 2, 0),
            new THREE.Vector3(40, 40, 0),
            new THREE.Vector3(MINE_AREA.x, mineEntranceY, 0)
        ]);
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

            const mineLeft = MINE_AREA.x - MINE_AREA.width / 2;
            const mineRight = MINE_AREA.x + MINE_AREA.width / 2;
            const mineTop = MINE_AREA.y - MINE_AREA.depth / 2;
            const mineBottom = MINE_AREA.y + MINE_AREA.depth / 2;
            
            if (vertex.x > mineLeft && vertex.x < mineRight && vertex.y > mineTop && vertex.y < mineBottom) {
                inDesignatedArea = true;
                const L = MINE_AREA.levels;
                const slope = MINE_AREA.slope_width;

                const level1_end = L[0].y_start + L[0].depth;
                const level2_start = L[1].y_start;
                const level2_end = L[1].y_start + L[1].depth;
                const level3_start = L[2].y_start;

                if (vertex.y < level1_end) {
                    finalHeight = L[0].height;
                } else if (vertex.y < level2_start) {
                    const blend = (vertex.y - level1_end) / slope;
                    finalHeight = THREE.MathUtils.lerp(L[0].height, L[1].height, blend);
                } else if (vertex.y < level2_end) {
                    finalHeight = L[1].height;
                } else if (vertex.y < level3_start) {
                    const blend = (vertex.y - level2_end) / slope;
                    finalHeight = THREE.MathUtils.lerp(L[1].height, L[2].height, blend);
                } else {
                    finalHeight = L[2].height;
                }
            }

            if (!inDesignatedArea) {
                 if (vertex.x > TOWN_AREA.x - TOWN_AREA.width/2 && vertex.x < TOWN_AREA.x + TOWN_AREA.width/2 &&
                    vertex.y > TOWN_AREA.y - TOWN_AREA.depth/2 && vertex.y < TOWN_AREA.y + TOWN_AREA.depth/2) {
                    finalHeight = TOWN_AREA.height; 
                    inDesignatedArea = true;
                } else if (vertex.x > OASIS_AREA.x - OASIS_AREA.width/2 && vertex.x < OASIS_AREA.x + OASIS_AREA.width/2 &&
                           vertex.y > OASIS_AREA.y - OASIS_AREA.depth/2 && vertex.y < OASIS_AREA.y + OASIS_AREA.depth/2) {
                    finalHeight = OASIS_AREA.height; 
                    inDesignatedArea = true;
                }
            }

            if (!inDesignatedArea) {
                let minTrailDist = Infinity;
                tempVec2.set(vertex.x, vertex.y);
                for (const trail of trails) {
                    for (let j = 0; j < trail.points.length - 1; j++) {
                        const p1 = new THREE.Vector2(trail.points[j].x, trail.points[j].y);
                        const p2 = new THREE.Vector2(trail.points[j + 1].x, trail.points[j + 1].y);
                        minTrailDist = Math.min(minTrailDist, tempVec2.distanceToSegment(p1, p2));
                    }
                }
                if (minTrailDist < TRAIL_WIDTH) {
                    const depressionFactor = 1.0 - (minTrailDist / TRAIL_WIDTH);
                    finalHeight -= TRAIL_DEPTH * Math.sin(depressionFactor * Math.PI);
                }
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
