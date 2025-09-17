import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

// --- FIX: Add a helper method to THREE.Vector2 for distance-to-segment calculation ---
THREE.Vector2.prototype.distanceToSegment = function(v, w) {
    const l2 = v.distanceToSq(w);
    if (l2 === 0) return this.distanceTo(v);
    let t = ((this.x - v.x) * (w.x - v.x) + (this.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const closestPoint = new THREE.Vector2(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
    return this.distanceTo(closestPoint);
};
// --- END FIX ---

export default class Terrain {
    constructor(scene) {
        // --- Core Terrain Parameters ---
        const size = 200;
        const segments = 200; // Increased segments for more detailed trails and area blending

        // --- Designated Area Definitions (positions are relative to the center [0,0]) ---
        const TOWN_AREA = { x: 10, y: 0, width: 20, depth: 40, height: 0.1 };
        const MINE_AREA = { x: 75, y: 75, width: 30, depth: 30, height: 0.1 };
        const OASIS_AREA = { x: -60, y: -80, width: 20, depth: 40, height: -1.0 }; // Negative height to create a depression

        // --- Trail Definitions ---
        const TRAIL_WIDTH = 3;
        const TRAIL_DEPTH = 0.5;

        // Trail from Town to the Mine
        const townToMinePath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y + TOWN_AREA.depth / 2, 0), // Start at top of town
            new THREE.Vector3(30, 40, 0),
            new THREE.Vector3(MINE_AREA.x - MINE_AREA.width / 2, MINE_AREA.y, 0)  // End at left of mine
        ]);

        // Trail from Town to the Oasis
        const townToOasisPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(TOWN_AREA.x - TOWN_AREA.width / 2, TOWN_AREA.y, 0), // Start at left of town
            new THREE.Vector3(-15, -40, 0),
            new THREE.Vector3(OASIS_AREA.x + OASIS_AREA.width / 2, OASIS_AREA.y, 0) // End at right of oasis
        ]);
        
        const trails = [
            { curve: townToMinePath, points: townToMinePath.getPoints(50) },
            { curve: townToOasisPath, points: townToOasisPath.getPoints(50) }
        ];

        // --- Geometry and Material Setup ---
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const material = new THREE.MeshLambertMaterial({
            color: 0xdbb480 
        });

        // --- Procedural Generation Logic ---
        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const tempVec2 = new THREE.Vector2();

        // Parameters for the general landscape shape
        const slopeScale = 0.02;     // How spread out the slopes are
        const slopeHeight = 1.5;     // Maximum height of the gentle slopes

        const detailScale = 0.2;     // Scale of smaller bumps
        const detailHeight = 0.25;   // Height of smaller bumps

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);

            // 1. Calculate base height with gentle slopes and fine detail
            let height = simplex.noise(vertex.x * slopeScale, vertex.y * slopeScale) * slopeHeight;
            height += simplex.noise(vertex.x * detailScale, vertex.y * detailScale) * detailHeight;

            let inDesignatedArea = false;

            // 2. Flatten designated areas
            const areas = [TOWN_AREA, MINE_AREA, OASIS_AREA];
            for (const area of areas) {
                if (vertex.x > area.x - area.width / 2 && vertex.x < area.x + area.width / 2 &&
                    vertex.y > area.y - area.depth / 2 && vertex.y < area.y + area.depth / 2) {
                    height = area.height;
                    inDesignatedArea = true;
                    break;
                }
            }
            
            // 3. Carve trails into the terrain, but not inside the flat areas
            if (!inDesignatedArea) {
                let minTrailDist = Infinity;
                tempVec2.set(vertex.x, vertex.y);

                for (const trail of trails) {
                    for (let j = 0; j < trail.points.length - 1; j++) {
                        const p1 = new THREE.Vector2(trail.points[j].x, trail.points[j].y);
                        const p2 = new THREE.Vector2(trail.points[j + 1].x, trail.points[j + 1].y);
                        // The call below now works because of the helper function added at the top
                        const dist = tempVec2.distanceToSegment(p1, p2);
                        if (dist < minTrailDist) {
                            minTrailDist = dist;
                        }
                    }
                }

                if (minTrailDist < TRAIL_WIDTH) {
                    // Create a smooth depression for the trail
                    const depressionFactor = 1.0 - (minTrailDist / TRAIL_WIDTH);
                    height -= TRAIL_DEPTH * Math.sin(depressionFactor * Math.PI); // Using sin for a rounded bottom
                }
            }

            positions.setZ(i, height);
        }

        geometry.computeVertexNormals();

        // --- Final Mesh Creation ---
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
