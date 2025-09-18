// File: src/world/Landscape.js
import * as THREE from 'three';
import TerrainGenerator from './generators/TerrainGenerator.js';

export default class Landscape {
    constructor() {
        this.config = {
            size: 500,
            resolution: 128
        };

        this.generator = new TerrainGenerator();
        this.geometry = new THREE.PlaneGeometry(
            this.config.size,
            this.config.size,
            this.config.resolution,
            this.config.resolution
        );
        
        // Rotate the geometry so we can work with y-up coordinates
        this.geometry.rotateX(-Math.PI / 2);

        this.generate(); // Apply the height and color data

        this.material = new THREE.MeshLambertMaterial({
            vertexColors: true,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.receiveShadow = true;
    }

    generate() {
        console.log("Applying landscape data to mesh...");

        const vertices = this.geometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);

        for (let i = 0; i < vertices.length / 3; i++) {
            const x = vertices[i * 3];
            // y is vertices[i * 3 + 1]
            const z = vertices[i * 3 + 2];

            const data = this.generator.getHeightAndColor(x, z);

            // Set the height (y-coordinate)
            vertices[i * 3 + 1] = data.height;

            // Set the color
            colors[i * 3] = data.color.r;
            colors[i * 3 + 1] = data.color.g;
            colors[i * 3 + 2] = data.color.b;
        }
        
        // Inform Three.js that the vertex positions have changed
        this.geometry.attributes.position.needsUpdate = true;
        
        // Add the color attribute to the geometry
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        this.geometry.computeVertexNormals();
        console.log("Landscape mesh generation complete.");
    }
}
