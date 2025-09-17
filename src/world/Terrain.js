import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

export default class Terrain {
    constructor(scene) {
        const size = 200;
        // Add segments for detail. A flat plane has too few vertices to create dunes.
        const segments = 100;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        // This material reacts to the lights in your scene (from Lighting.js and Sky.js)
        const material = new THREE.MeshLambertMaterial({
            color: 0xdbb480 // A neutral sand color
        });

        // --- Procedural Generation Logic ---

        // Create a noise generator
        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;

        // You can tweak these values to change the look of your desert
        const duneScale = 0.03;      // How spread out the main dunes are (lower = bigger dunes)
        const duneHeight = 8;        // How high the main dunes are

        const rippleScale = 0.4;     // Scale of the small wind ripples (higher = smaller ripples)
        const rippleHeight = 0.2;    // Height of the small wind ripples

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i); // In a PlaneGeometry, the coordinates are x and y

            // 1. Generate large, primary dunes
            let z = simplex.noise(x * duneScale, y * duneScale) * duneHeight;

            // 2. Add smaller, fine wind ripples on top
            z += simplex.noise(x * rippleScale, y * rippleScale) * rippleHeight;

            // Set the new height (z-axis) for this vertex
            positions.setZ(i, z);
        }

        // The geometry has been modified, so we MUST update the normals for correct lighting
        geometry.computeVertexNormals();

        // --- End of Procedural Logic ---

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2; // Rotate the plane to be flat
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
