import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

export default class Terrain {
    constructor(scene) {
        const size = 200;
        // Increased segments for more detail in the dunes
        const segments = 100;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        const material = new THREE.MeshLambertMaterial({
            color: 0xdbb480, // A neutral sand color
            // side: THREE.DoubleSide // Uncomment for debugging if needed
        });

        // --- Procedural Generation Logic ---

        // Create a noise generator
        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;

        // Tweak these values to change the look of your desert!
        const dunePrimaryScale = 0.02;   // How spread out the main dunes are
        const dunePrimaryHeight = 10;    // How high the main dunes are

        const duneSecondaryScale = 0.1;  // Scale for smaller, secondary dunes
        const duneSecondaryHeight = 2;   // Height of secondary dunes

        const ripplesScale = 0.8;         // Scale of the small wind ripples
        const ripplesHeight = 0.3;       // Height of the small wind ripples

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);

            // 1. Generate large, primary dunes
            let z = simplex.noise(x * dunePrimaryScale, y * dunePrimaryScale) * dunePrimaryHeight;

            // 2. Add smaller, secondary dunes on top
            z += simplex.noise(x * duneSecondaryScale, y * duneSecondaryScale) * duneSecondaryHeight;
            
            // 3. Add fine wind ripples
            z += simplex.noise(x * ripplesScale, y * ripplesScale) * ripplesHeight;

            positions.setZ(i, z);
        }

        // The geometry has been modified, so we need to update the normals for correct lighting
        geometry.computeVertexNormals();

        // --- End of Procedural Logic ---

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
