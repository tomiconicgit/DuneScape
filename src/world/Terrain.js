import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA, trailNetwork } from './WorldData.js';

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
        const size = 800;
        const segments = 512;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const positions = geometry.attributes.position;
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3));

        const material = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            vertexColors: true
        });

        const simplex = new SimplexNoise();
        const colors = geometry.attributes.color;
        const vertex = new THREE.Vector3();
        const tempVec2 = new THREE.Vector2();

        const slopeHeight = 1.5;
        const sandColor = new THREE.Color(0xf0e0b0); // Brighter base sand
        const darkSandColor = new THREE.Color(0xd8c0a0);
        const trailColor = new THREE.Color(0xbfa67f);

        const TRAIL_WIDTH = 3;
        const TRAIL_DEPTH = 0.8;
        const trails = Object.values(trailNetwork).map(curve => curve.getPoints(100));
        
        const areas = [TOWN_AREA, MINE_AREA, OASIS_AREA];
        
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            let finalHeight = simplex.noise(vertex.x * 0.01, vertex.y * 0.01) * slopeHeight;
            let finalColor = sandColor.clone();
            
            const point = new THREE.Vector2(vertex.x, vertex.y);
            let onTrail = false;

            let minTrailDist = Infinity;
            for (const trail of trails) {
                for (let j = 0; j < trail.length - 1; j++) {
                    minTrailDist = Math.min(minTrailDist, tempVec2.distanceToSegment(new THREE.Vector2(trail[j].x, trail[j].y), new THREE.Vector2(trail[j+1].x, trail[j+1].y)));
                }
            }
            if (minTrailDist < TRAIL_WIDTH) {
                onTrail = true;
                const depressionFactor = 1.0 - (minTrailDist / TRAIL_WIDTH);
                finalHeight -= TRAIL_DEPTH * Math.sin(depressionFactor * Math.PI);
                finalColor.lerp(trailColor, depressionFactor);
            }

            if (!onTrail) {
                for (const area of areas) {
                    const rect = new THREE.Box2(
                        new THREE.Vector2(area.x - area.width / 2, area.y - area.depth / 2),
                        new THREE.Vector2(area.x + area.width / 2, area.y + area.depth / 2)
                    );

                    const blendDistance = 8;
                    const distToArea = rect.distanceToPoint(point);

                    if (distToArea < blendDistance) {
                        const blendFactor = 1.0 - (distToArea / blendDistance);
                        finalHeight = THREE.MathUtils.lerp(finalHeight, area.height, blendFactor);
                        
                        if (area === MINE_AREA) {
                            finalColor.lerp(darkSandColor, blendFactor);
                        }
                    }
                }
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
