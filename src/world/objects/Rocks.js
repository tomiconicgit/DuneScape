import * as THREE from 'three';

// --- Rock Settings ---
const ROCK_COUNT = 80; // Increased count for more density
const BASE_GEOMETRY_SEGMENTS = 2; // Low number to keep angularity, more means smoother
const DEFORMATION_FACTOR = 0.3; // How much to randomly shift vertices

export default class Rocks {
    constructor(scene, mineArea) {
        this.scene = scene;
        this.mineArea = mineArea;

        // --- Materials for different ore types (using MeshStandardMaterial) ---
        const materials = {
            stone: new THREE.MeshStandardMaterial({
                color: 0x808080, // Basic grey stone
                roughness: 0.8,
                metalness: 0.0
            }),
            iron: new THREE.MeshStandardMaterial({
                color: 0x8E4A3B, // Rusty red-brown iron ore
                roughness: 0.5,
                metalness: 0.3
            }),
            carbon: new THREE.MeshStandardMaterial({
                color: 0x222222, // Dark charcoal for carbon/coal
                roughness: 0.4,
                metalness: 0.0
            }),
            limestone: new THREE.MeshStandardMaterial({
                color: 0xE5E4D7, // Off-white/light grey for limestone
                roughness: 0.9,
                metalness: 0.0
            })
        };
        const oreTypes = Object.keys(materials);

        // --- Generate and Place Rocks ---
        for (let i = 0; i < ROCK_COUNT; i++) {
            // 1. Create base BoxGeometry with minimal segments for angularity
            const baseGeometry = new THREE.BoxGeometry(
                1, 1, 1, // Base size
                BASE_GEOMETRY_SEGMENTS, BASE_GEOMETRY_SEGMENTS, BASE_GEOMETRY_SEGMENTS
            );

            // 2. Deform the vertices directly to create jagged, irregular shapes
            const positionAttribute = baseGeometry.attributes.position;
            const tempVector = new THREE.Vector3();

            for (let j = 0; j < positionAttribute.count; j++) {
                tempVector.fromBufferAttribute(positionAttribute, j);
                
                // Randomly shift each vertex
                tempVector.x += (Math.random() - 0.5) * DEFORMATION_FACTOR;
                tempVector.y += (Math.random() - 0.5) * DEFORMATION_FACTOR;
                tempVector.z += (Math.random() - 0.5) * DEFORMATION_FACTOR;

                positionAttribute.setXYZ(j, tempVector.x, tempVector.y, tempVector.z);
            }
            baseGeometry.computeVertexNormals(); // Crucial for correct lighting after deformation

            // 3. Select a random ore type and its material
            const type = oreTypes[Math.floor(Math.random() * oreTypes.length)];
            const material = materials[type];

            // 4. Create the mesh
            const rockMesh = new THREE.Mesh(baseGeometry, material);

            // 5. Apply random scale, rotation, and position within the mine area
            const scale = THREE.MathUtils.randFloat(0.8, 4.0); // Wider range for different sizes
            rockMesh.scale.set(
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3)
            );
            
            // Random position within the mine area boundaries
            const xOffset = (Math.random() - 0.5) * mineArea.width;
            const zOffset = (Math.random() - 0.5) * mineArea.depth; // Use depth for Z
            
            rockMesh.position.set(
                mineArea.x + xOffset,
                mineArea.height, // Start at ground level
                mineArea.y + zOffset
            );

            // Ensure the rock sits on the terrain by moving it up by half its height
            rockMesh.geometry.computeBoundingBox();
            const rockHeight = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
            rockMesh.position.y += (rockHeight * rockMesh.scale.y) / 2;

            // Random rotation
            rockMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Enable shadows
            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            this.scene.add(rockMesh);
        }
    }
}
