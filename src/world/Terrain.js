import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js';

// Add a helper method to THREE.Vector2
THREE.Vector2.prototype.distanceToSegment = function(v, w) {
    const l2 = v.distanceToSq(w); if (l2 === 0) return this.distanceTo(v);
    let t = ((this.x - v.x) * (w.x - v.x) + (this.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const closestPoint = new THREE.Vector2(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
    return this.distanceTo(closestPoint);
};

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const segments = 200;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const positions = geometry.attributes.position; // Define positions here

        // Add a color attribute to the geometry
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3));

        // Use vertex colors in the material
        const material = new THREE.MeshLambertMaterial({
            color: 0xffffff, // Base color is white, we use vertex colors
            vertexColors: true
        });

        const simplex = new SimplexNoise();
        const colors = geometry.attributes.color;
        const vertex = new THREE.Vector3();
        const tempVec2 = new THREE.Vector2();

        const slopeHeight = 1.0;
        const sandColor = new THREE.Color(0xdbb480);
        const darkSandColor = new THREE.Color(0xb89460);
        const trailColor = new THREE.Color(0x9c7c4f);

        // --- Create a full trail network ---
        const TRAIL_WIDTH = 2;
        const TRAIL_DEPTH = 0.7; // Deeper trails
        const trails = [
            new THREE.CatmullRomCurve3([ new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y, 0), new THREE.Vector3(30, 30, 0), new THREE.Vector3(MINE_AREA.x, MINE_AREA.y, 0) ]),
            new THREE.CatmullRomCurve3([ new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y, 0), new THREE.Vector3(-25, -40, 0), new THREE.Vector3(OASIS_AREA.x, OASIS_AREA.y, 0) ]),
            new THREE.CatmullRomCurve3([ new THREE.Vector3(MINE_AREA.x, MINE_AREA.y, 0), new THREE.Vector3(0, 20, 0), new THREE.Vector3(OASIS_AREA.x, OASIS_AREA.y, 0) ])
        ].map(curve => curve.getPoints(50));
        
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            let finalHeight = simplex.noise(vertex.x * 0.02, vertex.y * 0.02) * slopeHeight;
            let finalColor = sandColor.clone();

            const mineRect = new THREE.Box2(
                new THREE.Vector2(MINE_AREA.x - MINE_AREA.width / 2, MINE_AREA.y - MINE_AREA.depth / 2),
                new THREE.Vector2(MINE_AREA.x + MINE_AREA.width / 2, MINE_AREA.y + MINE_AREA.depth / 2)
            );
            const point = new THREE.Vector2(vertex.x, vertex.y);

            const blendDistance = 5;
            const distToMine = mineRect.distanceToPoint(point);
            if (distToMine < blendDistance) {
                finalHeight = THREE.MathUtils.lerp(MINE_AREA.height, finalHeight, distToMine / blendDistance);
                finalColor.lerp(darkSandColor, 1.0 - (distToMine / blendDistance));
            }
            
            let minTrailDist = Infinity;
            tempVec2.set(vertex.x, vertex.y);
            for (const trail of trails) {
                for (let j = 0; j < trail.length - 1; j++) {
                    minTrailDist = Math.min(minTrailDist, tempVec2.distanceToSegment(new THREE.Vector2(trail[j].x, trail[j].y), new THREE.Vector2(trail[j+1].x, trail[j+1].y)));
                }
            }
            if (minTrailDist < TRAIL_WIDTH) {
                const depressionFactor = 1.0 - (minTrailDist / TRAIL_WIDTH);
                finalHeight -= TRAIL_DEPTH * Math.sin(depressionFactor * Math.PI);
                finalColor.lerp(trailColor, depressionFactor);
            }

            colors.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
            positions.setZ(i, finalHeight);
        }

        geometry.computeVertexNormals();
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
