import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export default class Terrain {
    constructor(scene) {
        const size = 200;
        // Increase segments for more detail in the dunes.
        const segments = 256; 

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        // --- Procedural Generation ---
        const noise2D = createNoise2D();
        const vertices = geometry.attributes.position.array;

        // Tweak these values to change the look of the desert
        const duneScale = 80;   // How large the main dunes are. Larger number = larger dunes.
        const duneHeight = 8;     // How high the main dunes are.
        const rippleScale = 8;    // How large the smaller surface ripples are.
        const rippleHeight = 0.4;   // How high the ripples are.

        for (let i = 0; i < vertices.length; i += 3) {
            // Get the original x and y coordinates of the vertex
            const x = vertices[i];
            const y = vertices[i + 1];

            // Generate the height for the large dunes
            const largeDuneNoise = noise2D(x / duneScale, y / duneScale) * duneHeight;

            // Generate the height for the smaller ripples and add it to the dunes
            const smallRipplesNoise = noise2D(x / rippleScale, y / rippleScale) * rippleHeight;
            
            // Apply the combined height to the z-coordinate of the vertex
            // (z is 'up' for a plane before it's rotated)
            vertices[i + 2] = largeDuneNoise + smallRipplesNoise;
        }

        // The geometry needs to be told that the vertices have been updated.
        geometry.attributes.position.needsUpdate = true;
        // Recalculate normals for correct lighting on the new surface.
        geometry.computeVertexNormals();

        // --- Material & Mesh ---
        // Using MeshStandardMaterial for more realistic lighting (PBR).
        const material = new THREE.MeshStandardMaterial({
            color: 0xdbb480, // A neutral sand color
            roughness: 0.9,  // Sand is not shiny
            metalness: 0.1,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
