import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js'; // Import shared data

// Helper function to smoothly blend values
function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

// Re-add the helper method to THREE.Vector2 for distance-to-segment calculation
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
        const segments = 256; // More segments for smoother mine slopes

        // --- Trail Definitions ---
        const TRAIL_WIDTH = 3;
        const TRAIL_DEPTH = 0.5;
        const townToMinePath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y + TOWN_AREA.depth / 2, 0),
            new THREE.Vector3(30, 40, 0),
            new THREE.Vector3(MINE_AREA.x, MINE_AREA.y + MINE_AREA.levels[0].radius + 2, 0) // End at the mine entrance
        ]);
        const townToOasisPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(TOWN_AREA.x - TOWN_AREA.width/2, TOWN_AREA.y, 0),
            new THREE.Vector3(-15, -40, 0),
            new THREE.Vector3(OASIS_AREA.x + OASIS_AREA.width/2, OASIS_AREA.y, 0)
        ]);
        const trails = [ { points: townToMinePath.getPoints(50) }, { points: townToOasisPath.getPoints(50) } ];
        
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const material = new THREE.MeshLambertMaterial({ color: 0xdbb480 });

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const tempVec2 = new THREE.Vector2();
        const mineCenter = new THREE.Vector2(MINE_AREA.x, MINE_AREA.y);

        const slopeHeight = 1.5;
        const detailHeight = 0.25;

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            let height = simplex.noise(vertex.x * 0.02, vertex.y * 0.02) * slopeHeight;
            height += simplex.noise(vertex.x * 0.2, vertex.y * 0.2) * detailHeight;

            let finalHeight = height;
            let inDesignatedArea = false;

            // --- Terraced Mine Generation ---
            const distToMineCenter = mineCenter.distanceTo(new THREE.Vector2(vertex.x, vertex.y));
            const mineOuterRadius = MINE_AREA.levels[0].radius;

            if (distToMineCenter < mineOuterRadius + 4) { // Check if near the mine
                inDesignatedArea = true;
                let mineHeight = height;

                if (distToMineCenter <= MINE_AREA.levels[2].radius) {
                    mineHeight = -MINE_AREA.levels[2].depth;
                } 
                else if (distToMineCenter <= MINE_AREA.levels[1].radius) {
                    const inner = MINE_AREA.levels[2]; const outer = MINE_AREA.levels[1];
                    const blend = (distToMineCenter - inner.radius) / (outer.radius - inner.radius);
                    mineHeight = THREE.MathUtils.lerp(-inner.depth, -outer.depth, blend);
                } 
                else if (distToMineCenter <= MINE_AREA.levels[0].radius) {
                    const inner = MINE_AREA.levels[1]; const outer = MINE_AREA.levels[0];
                    const blend = (distToMineCenter - inner.radius) / (outer.radius - inner.radius);
                    mineHeight = THREE.MathUtils.lerp(-inner.depth, -outer.depth, blend);
                }

                const blendFactor = smoothstep(mineOuterRadius, mineOuterRadius + 4, distToMineCenter);
                finalHeight = THREE.MathUtils.lerp(mineHeight, height, blendFactor);
            }
            
            // Flatten Town and Oasis areas
            if (!inDesignatedArea) {
                 if (vertex.x > TOWN_AREA.x - TOWN_AREA.width/2 && vertex.x < TOWN_AREA.x + TOWN_AREA.width/2 &&
                    vertex.y > TOWN_AREA.y - TOWN_AREA.depth/2 && vertex.y < TOWN_AREA.y + TOWN_AREA.depth/2) {
                    finalHeight = TOWN_AREA.height; inDesignatedArea = true;
                } else if (vertex.x > OASIS_AREA.x - OASIS_AREA.width/2 && vertex.x < OASIS_AREA.x + OASIS_AREA.width/2 &&
                           vertex.y > OASIS_AREA.y - OASIS_AREA.depth/2 && vertex.y < OASIS_AREA.y + OASIS_AREA.depth/2) {
                    finalHeight = OASIS_AREA.height; inDesignatedArea = true;
                }
            }
            
            // Carve trails
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
