// File: src/world/Landscape.js
import * as THREE from 'three';

export default class Landscape {
    constructor() {
        console.log("Initializing new landscape design...");
        const size = 500;
        const segments = 256;

        this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        this.geometry.rotateX(-Math.PI / 2);

        const duneAmp = 2.5;
        const rippleAmp = 0.4;
        const rippleFreq = 0.12;

        const positions = this.geometry.attributes.position;
        this.baseY = []; // Store base heights for animation

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // Simple sine waves for dunes and ripples
            const dune = Math.sin(x * 0.005) * Math.cos(z * 0.005) * duneAmp;
            const ripple = Math.sin(x * rippleFreq) * Math.sin(z * rippleFreq) * rippleAmp;

            const y = dune + ripple;
            this.baseY.push(y);
            positions.setY(i, y);
        }

        this.geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: 0xeed9b6,
            roughness: 0.95,
            metalness: 0.05,
        });

        // The mesh is now stored as a property, as Game.js expects
        this.mesh = new THREE.Mesh(this.geometry, material);
        this.mesh.receiveShadow = true;
    }

    // This new update method will be called from the main game loop
    update(time) {
        const positions = this.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            // Animate wind ripples over time
            const wind = Math.sin(x * 0.05 + time * 0.5) * Math.cos(z * 0.05 + time * 0.5) * 0.2;
            positions.setY(i, this.baseY[i] + wind);
        }
        positions.needsUpdate = true;
        // We must re-compute normals if we animate vertices, otherwise lighting looks wrong
        this.geometry.computeVertexNormals();
    }
}
