import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { MINE_AREA, TOWN_AREA, OASIS_AREA } from './WorldData.js';

export default class Terrain {
    constructor(scene) {
        const size = 800;
        const segments = 256; // Reduced segments for better performance

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        // --- NEW: PBR Sand Texture ---
        const textureLoader = new THREE.TextureLoader();
        const colorMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Sand 002_COLOR.jpg');
        const normalMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Sand 002_NORM.jpg');
        const roughnessMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Sand 002_ROUGH.jpg');

        // Allow textures to repeat across the large surface
        for (let map of [colorMap, normalMap, roughnessMap]) {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.repeat.set(200, 200); // How many times the texture repeats
        }
        
        // Use MeshStandardMaterial for realistic lighting with textures
        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
            color: 0xf0e0b0 // Base color tint
        });

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const slopeHeight = 1.5;
        
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            let finalHeight = simplex.noise(vertex.x * 0.01, vertex.y * 0.01) * slopeHeight;
            
            // Flatten designated areas
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
    }
}
