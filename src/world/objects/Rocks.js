import * as THREE from 'three';

// --- Rock Settings ---
const ROCK_COUNT = 50; // Total number of rocks to generate
const DEFORMATION_AMOUNT = 0.4; // How jagged the rocks are

export default class Rocks {
    constructor(scene, mineArea) {
        this.scene = scene;
        this.mineArea = mineArea;

        // --- Create Materials for each Ore Type ---
        const materials = {
            iron: new THREE.MeshStandardMaterial({
                color: 0x8E4A3B, // Rusty red-brown
                roughness: 0.6,
                metalness: 0.4 // Slightly metallic
            }),
            carbon: new THREE.MeshStandardMaterial({
                color: 0x222222, // Dark charcoal
                roughness: 0.4, // A bit shiny like coal
                metalness: 0.0
            }),
            limestone: new THREE.MeshStandardMaterial({
                color: 0xE5E4D7, // Off-white/light grey
                roughness: 0.9, // Very matte and chalky
                metalness: 0.0
            })
        };
        const oreTypes = Object.keys(materials);

        // --- Generate and Place Rocks ---
        for (let i = 0; i < ROCK_COUNT; i++) {
            // 1. Create a unique, deformed geometry for each rock
            const rockGeometry = new THREE.IcosahedronGeometry(1, 1); // Start with a base shape
            const positions = rockGeometry.attributes.position;
            const vertex = new THREE.Vector3();

            for (let j = 0; j < positions.count; j++) {
                vertex.fromBufferAttribute(positions, j);
                const randomOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * DEFORMATION_AMOUNT,
                    (Math.random() - 0.5) * DEFORMATION_AMOUNT,
                    (Math.random() - 0.5) * DEFORMATION_AMOUNT
                );
                vertex.add(randomOffset);
                positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
            }
            rockGeometry.computeVertexNormals();

            // 2. Pick a random ore type and material
            const type = oreTypes[Math.floor(Math.random() * oreTypes.length)];
            const material = materials[type];

            // 3. Create the mesh
            const rockMesh = new THREE.Mesh(rockGeometry, material);

            // 4. Set a random position, rotation, and scale within the mine area
            const scale = THREE.MathUtils.randFloat(0.5, 2.5);
            rockMesh.scale.set(
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3)
            );
            
            rockMesh.position.set(
                mineArea.x + (Math.random() - 0.5) * mineArea.width,
                mineArea.height + (scale / 2) - 0.2, // Place on the ground, accounting for scale
                mineArea.y + (Math.random() - 0.5) * mineArea.depth // Note: using y for z-depth
            );

            rockMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // 5. Enable shadows and add to the scene
            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            this.scene.add(rockMesh);
        }
    }
}
