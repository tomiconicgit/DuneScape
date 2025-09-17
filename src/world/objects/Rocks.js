import * as THREE from 'three';

// --- Rock Settings ---
const ROCK_COUNT = 80; // Total number of rocks
const DEFORMATION_STRENGTH = 0.4; // How jagged the rocks are

export default class Rocks {
    constructor(scene, mineArea) {
        this.scene = scene;
        this.mineArea = mineArea;

        // --- Materials for different ore types (using simple, reliable MeshStandardMaterial) ---
        const materials = {
            stone: new THREE.MeshStandardMaterial({
                color: 0x8a8a8a, // Basic grey stone
                roughness: 0.8,
            }),
            iron: new THREE.MeshStandardMaterial({
                color: 0x8E574A, // Rusty red-brown iron ore
                roughness: 0.6,
                metalness: 0.2
            }),
            carbon: new THREE.MeshStandardMaterial({
                color: 0x282828, // Dark charcoal for carbon/coal
                roughness: 0.5,
            }),
            limestone: new THREE.MeshStandardMaterial({
                color: 0xd4d2c8, // Off-white/light grey for limestone
                roughness: 0.9,
            })
        };
        const oreTypes = Object.keys(materials);

        // --- Generate and Place Rocks ---
        for (let i = 0; i < ROCK_COUNT; i++) {
            // 1. Create a base IcosahedronGeometry for a more natural, angular shape
            const rockGeometry = new THREE.IcosahedronGeometry(0.5, 0); // Base radius of 0.5

            // 2. Deform the vertices to make each rock unique
            const positionAttribute = rockGeometry.attributes.position;
            const tempVector = new THREE.Vector3();
            for (let j = 0; j < positionAttribute.count; j++) {
                tempVector.fromBufferAttribute(positionAttribute, j);
                const distortion = 1 + (Math.random() - 0.5) * DEFORMATION_STRENGTH;
                tempVector.multiplyScalar(distortion);
                positionAttribute.setXYZ(j, tempVector.x, tempVector.y, tempVector.z);
            }
            rockGeometry.computeVertexNormals(); // Crucial for correct lighting

            // 3. Select a random ore type and its material
            const type = oreTypes[Math.floor(Math.random() * oreTypes.length)];
            const material = materials[type];

            // 4. Create the mesh
            const rockMesh = new THREE.Mesh(rockGeometry, material);

            // 5. Apply a random scale smaller than the character
            const scale = THREE.MathUtils.randFloat(0.3, 0.9);
            rockMesh.scale.set(scale, scale, scale);
            
            // 6. Set a random position within the mine area
            rockMesh.position.set(
                mineArea.x + (Math.random() - 0.5) * mineArea.width,
                mineArea.height, // Start at ground level
                mineArea.y + (Math.random() - 0.5) * mineArea.depth
            );

            // 7. Ensure the rock sits on the terrain
            rockMesh.geometry.computeBoundingBox();
            const rockHeight = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
            rockMesh.position.y += (rockHeight * rockMesh.scale.y) / 2;

            // 8. Random rotation
            rockMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            this.scene.add(rockMesh);
        }
    }
}
