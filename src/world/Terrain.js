import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const resolution = 128;

        const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        geometry.rotateX(-Math.PI / 2);

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;

        // Deform vertices to create dunes
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // Multiple layers of noise (octaves) for detail
            const largeDunes = simplex.noise(x * 0.01, z * 0.01) * 2.5;
            const mediumDunes = simplex.noise(x * 0.05, z * 0.05) * 0.5;
            const ripples = simplex.noise(x * 0.2, z * 0.2) * 0.25;

            positions.setY(i, largeDunes + mediumDunes + ripples);
        }
        geometry.computeVertexNormals(); // Recalculate normals for correct lighting

        const textureLoader = new THREE.TextureLoader();
        const sandTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/sand/sand_diffuse.jpg');
        sandTexture.wrapS = THREE.RepeatWrapping;
        sandTexture.wrapT = THREE.RepeatWrapping;
        sandTexture.repeat.set(20, 20); // Tile the texture

        const material = new THREE.MeshStandardMaterial({
            map: sandTexture,
            roughness: 0.8,
            metalness: 0.2
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
