import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js';

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const segments = 200;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        // Add a color attribute to the geometry
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3));

        // Use vertex colors in the material
        const material = new THREE.MeshLambertMaterial({
            color: 0xffffff, // Base color is now white, we use vertex colors for everything
            vertexColors: true
        });

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const colors = geometry.attributes.color;
        const vertex = new THREE.Vector3();

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

            // Blend the mine area color and height
            const blendDistance = 5;
            const distToMine = mineRect.distanceToPoint(point);
            if (distToMine < blendDistance) {
                finalHeight = MINE_AREA.height;
                if (distToMine === 0) {
                    finalColor.copy(darkSandColor);
                } else {
                    const blendFactor = 1.0 - (distToMine / blendDistance);
                    finalColor.lerp(darkSandColor, blendFactor);
                }
            }
            
            // Carve and color trails
            let minTrailDist = Infinity;
            // ... (trail logic from previous versions, using vertex colors)

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
