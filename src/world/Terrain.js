import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA, trailNetwork } from './WorldData.js';

export default class Terrain {
    constructor(scene) {
        const size = 800;
        const segments = 256;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

        // --- PBR Sand Texture ---
        const textureLoader = new THREE.TextureLoader();
        const colorMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Sand 002_COLOR.jpg');
        const normalMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Sand 002_NORM.jpg');
        const roughnessMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Sand 002_ROUGH.jpg');

        for (let map of [colorMap, normalMap, roughnessMap]) {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.repeat.set(200, 200);
        }
        
        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            normalMap: normalMap,
            roughnessMap: roughnessMap
        });

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const slopeHeight = 1.5;
        
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            let finalHeight = simplex.noise(vertex.x * 0.01, vertex.y * 0.01) * slopeHeight;
            
            const areas = [TOWN_AREA, MINE_AREA, OASIS_AREA];
            for (const area of areas) {
                const rect = new THREE.Box2(
                    new THREE.Vector2(area.x - area.width / 2, area.y - area.depth / 2),
                    new THREE.Vector2(area.x + area.width / 2, area.y + area.depth / 2)
                );
                const point = new THREE.Vector2(vertex.x, vertex.y);
                const blendDistance = 8;
                const distToArea = rect.distanceToPoint(point);
                if (distToArea < blendDistance) {
                    const blendFactor = 1.0 - (distToArea / blendDistance);
                    finalHeight = THREE.MathUtils.lerp(finalHeight, area.height, blendFactor);
                }
            }
            positions.setZ(i, finalHeight);
        }

        geometry.computeVertexNormals();
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        this._createTrails(scene, this.mesh);
    }

    _createTrails(scene, terrainMesh) {
        const trailMaterial = new THREE.MeshStandardMaterial({
            color: 0x9c7c4f, // Darker trail color
            roughness: 1.0
        });

        const raycaster = new THREE.Raycaster();
        const down = new THREE.Vector3(0, -1, 0);

        Object.values(trailNetwork).forEach(curve => {
            const points = curve.getPoints(200);
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];
                const segmentLength = p1.distanceTo(p2);
                if (segmentLength < 0.1) continue;

                const segmentGeo = new THREE.PlaneGeometry(3, segmentLength);
                const segmentMesh = new THREE.Mesh(segmentGeo, trailMaterial);
                const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                
                raycaster.set(new THREE.Vector3(midPoint.x, 50, midPoint.z), down);
                const intersects = raycaster.intersectObject(terrainMesh);
                if (intersects.length > 0) {
                    const groundHeight = intersects[0].point.y;
                    segmentMesh.position.set(midPoint.x, groundHeight + 0.05, midPoint.z);
                }

                segmentMesh.lookAt(p2);
                segmentMesh.rotation.x = -Math.PI / 2;
                segmentMesh.receiveShadow = true;
                scene.add(segmentMesh);
            }
        });
    }
}
