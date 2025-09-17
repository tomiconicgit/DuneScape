import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

// --- Rock Settings ---
const ROCK_COUNT = 50;
const BASE_ROCK_SIZE = 1.0;
const SUBDIVISIONS = 4; // Increased for more detail. This is now used as segments.
const DISPLACEMENT_STRENGTH = 0.4;
const DISPLACEMENT_SCALE = 0.8;

// Helper to generate a 3D noise texture for displacement
function generateDisplacementNoiseTexture(size = 32) {
    const data = new Uint8Array(size * size * size);
    const perlin = new ImprovedNoise();
    const noiseScale = 0.1;
    let i = 0;
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size; const ny = y / size; const nz = z / size;
                let val = perlin.noise(nx * noiseScale, ny * noiseScale, nz * noiseScale) * 0.5;
                val += perlin.noise(nx * noiseScale * 2.0, ny * noiseScale * 2.0, nz * noiseScale * 2.0) * 0.25;
                data[i] = (val + 0.5) * 255;
                i++;
            }
        }
    }
    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapR = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}


export default class Rocks {
    constructor(scene, mineArea) {
        this.scene = scene;
        this.mineArea = mineArea;

        const displacementTexture = generateDisplacementNoiseTexture();

        // Shader for Displacement
        const rockVertexShader = `
            uniform sampler3D displacementMap;
            uniform float displacementStrength;
            uniform float displacementScale;
            
            varying vec3 vNormal;
            varying vec3 vWorldPosition;

            void main() {
                vNormal = normal;
                
                vec3 noiseCoord = position * displacementScale;
                float noiseVal = texture(displacementMap, noiseCoord).r;
                
                vec3 displacedPosition = position + normal * (noiseVal - 0.5) * displacementStrength;

                vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
                vWorldPosition = worldPosition.xyz;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
            }
        `;
        
        // Use a standard material and modify its vertex shader
        const setupMaterial = (material) => {
            material.onBeforeCompile = (shader) => {
                shader.uniforms.displacementMap = { value: displacementTexture };
                shader.uniforms.displacementStrength = { value: DISPLACEMENT_STRENGTH };
                shader.uniforms.displacementScale = { value: DISPLACEMENT_SCALE };

                // Inject code into the existing vertex shader
                shader.vertexShader = 'uniform sampler3D displacementMap;\n' +
                                      'uniform float displacementStrength;\n' +
                                      'uniform float displacementScale;\n' +
                                      shader.vertexShader;

                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `
                    vec3 noiseCoord = position * displacementScale;
                    float noiseVal = texture(displacementMap, noiseCoord).r;
                    vec3 transformed = position + normal * (noiseVal - 0.5) * displacementStrength;
                    `
                );
            };
            return material;
        };
        
        const materials = {
            iron: setupMaterial(new THREE.MeshStandardMaterial({ color: 0x8E4A3B, roughness: 0.6, metalness: 0.4 })),
            carbon: setupMaterial(new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.0 })),
            limestone: setupMaterial(new THREE.MeshStandardMaterial({ color: 0xE5E4D7, roughness: 0.9, metalness: 0.0 }))
        };
        const oreTypes = Object.keys(materials);

        // --- Generate and Place Rocks ---
        for (let i = 0; i < ROCK_COUNT; i++) {
            
            // --- FIX: Use modern BufferGeometry with segments ---
            const rockGeometry = new THREE.BoxGeometry(
                BASE_ROCK_SIZE, BASE_ROCK_SIZE, BASE_ROCK_SIZE,
                SUBDIVISIONS, SUBDIVISIONS, SUBDIVISIONS
            );
            // --- END FIX ---

            const type = oreTypes[Math.floor(Math.random() * oreTypes.length)];
            const material = materials[type];
            const rockMesh = new THREE.Mesh(rockGeometry, material);

            const scale = THREE.MathUtils.randFloat(0.8, 3.0);
            rockMesh.scale.set(
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3)
            );
            
            rockMesh.position.set(
                mineArea.x + (Math.random() - 0.5) * mineArea.width * 0.9,
                mineArea.height, // Start at ground level
                mineArea.y + (Math.random() - 0.5) * mineArea.depth * 0.9
            );
            // Adjust Y so the bottom of the rock rests on the ground
            rockMesh.geometry.computeBoundingBox();
            const rockHeight = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
            rockMesh.position.y += (rockHeight * rockMesh.scale.y) / 2;


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
