// File: src/world/Landscape.js
import * as THREE from 'three';
import TerrainGenerator from './generators/TerrainGenerator.js';

export default class Landscape {
    constructor() {
        this.config = {
            size: 500,
            resolution: 128 // Segments per side
        };

        this.generator = new TerrainGenerator();
        this.geometry = new THREE.PlaneGeometry(
            this.config.size,
            this.config.size,
            this.config.resolution,
            this.config.resolution
        );
        
        this.generate();

        this.material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotateX(-Math.PI / 2); // Lay the plane flat
        this.mesh.receiveShadow = true;
    }

    generate() {
        console.log("Generating landscape data...");
        const terrainData = this.generator.generate(this.config.size, this.config.resolution);
        
        const vertices = this.geometry.attributes.position.array;
        
        // Apply height data from the generator
        for (let i = 0; i < terrainData.heightMap.length; i++) {
            vertices[i * 3 + 1] = terrainData.heightMap[i];
        }
        
        // Apply color data from the generator
        this.geometry.setAttribute('color', new THREE.BufferAttribute(terrainData.colorMap, 3));
        
        this.geometry.computeVertexNormals();
        console.log("Landscape mesh created.");
    }
}
