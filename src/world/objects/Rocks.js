import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js'; // Using ImprovedNoise for displacement

// --- Rock Settings ---
const ROCK_COUNT = 50; // Total number of rocks to generate
const BASE_ROCK_SIZE = 1.0; // Base scale for the box geometry
const SUBDIVISIONS = 2; // How many times to subdivide the box (more = smoother, but can lose angularity)
const DISPLACEMENT_STRENGTH = 0.5; // How much the shader displaces the surface
const DISPLACEMENT_SCALE_PRIMARY = 0.8; // Scale of primary displacement features
const DISPLACEMENT_SCALE_DETAIL = 3.0; // Scale of fine detail displacement

// --- Helper for generating displacement noise texture (since we can't directly use shader in constructor) ---
// This creates a 3D texture for the displacement effect, similar to how the clouds worked.
function generateDisplacementNoiseTexture(size = 32) {
    const data = new Uint8Array(size * size * size);
    const perlin = new ImprovedNoise();
    const noiseScale = 0.1; // Adjust this for overall frequency of noise
    let i = 0;
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size - 0.5;
                const ny = y / size - 0.5;
                const nz = z / size - 0.5;
                // Layered noise for more complex displacement patterns
                const val = perlin.noise(nx * noiseScale, ny * noiseScale, nz * noiseScale) * 0.5 +
                            perlin.noise(nx * noiseScale * 2.0, ny * noiseScale * 2.0, nz * noiseScale * 2.0) * 0.25 +
                            perlin.noise(nx * noiseScale * 4.0, ny * noiseScale * 4.0, nz * noiseScale * 4.0) * 0.125;
                data[i] = (val * 0.5 + 0.5) * 255; // Normalize to 0-255
                i++;
            }
        }
    }
    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    return texture;
}


export default class Rocks {
    constructor(scene, mineArea) {
        this.scene = scene;
        this.mineArea = mineArea;

        const displacementTexture = generateDisplacementNoiseTexture();

        // --- Shader for Displacement (inspired by provided "Wet stone" noise principles) ---
        const rockVertexShader = `
            uniform sampler3D displacementMap;
            uniform float displacementStrength;
            uniform float displacementScalePrimary;
            uniform float displacementScaleDetail;
            
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv; // We'll need UVs for sampling the 3D texture
            
            // Output to fragment shader
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            varying vec2 vUv;

            void main() {
                vUv = uv; // Pass UVs
                vNormal = normal; // Pass normal
                
                vec3 displacedPosition = position;
                
                // Sample 3D noise for displacement
                vec3 noiseCoord = position * displacementScalePrimary;
                float noiseVal = texture(displacementMap, noiseCoord + uv.xxy * 0.1).r; // Add UV for variety
                
                // Apply displacement along the normal
                displacedPosition += normal * (noiseVal - 0.5) * displacementStrength;

                vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
                vWorldPosition = worldPosition.xyz;
                vViewPosition = -worldPosition.xyz; // Needed for lighting calculations
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
            }
        `;

        const rockFragmentShader = `
            uniform vec3 diffuseColor;
            uniform float roughness;
            uniform float metalness;
            uniform vec3 ambientLightColor;

            // Lights (simplified, relying on Three.js standard lighting setup)
            uniform vec3 directionalLightDirection;
            uniform vec3 directionalLightColor;
            uniform vec3 hemisphereLightSkyColor;
            uniform vec3 hemisphereLightGroundColor;
            
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            varying vec2 vUv;

            void main() {
                vec3 normal = normalize(vNormal); // Ensure normal is normalized

                // Simplified PBR-like lighting (approximate without full PBR calculations)
                vec3 ambient = ambientLightColor; // Base ambient
                
                // Hemisphere light contribution
                float hemiFactor = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5; // Simulate sky/ground mix
                vec3 hemiLight = mix(hemisphereLightGroundColor, hemisphereLightSkyColor, hemiFactor);

                // Directional light contribution
                vec3 lightDir = normalize(directionalLightDirection);
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 directional = directionalLightColor * diff;

                vec3 totalLight = ambient + hemiLight + directional;
                
                vec3 finalColor = diffuseColor * totalLight;

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;


        // --- Ore Type Materials with Displacement Shader ---
        const createRockMaterial = (color, roughness, metalness) => {
            return new THREE.ShaderMaterial({
                vertexShader: rockVertexShader,
                fragmentShader: rockFragmentShader,
                uniforms: {
                    displacementMap: { value: displacementTexture },
                    displacementStrength: { value: DISPLACEMENT_STRENGTH },
                    displacementScalePrimary: { value: DISPLACEMENT_SCALE_PRIMARY },
                    displacementScaleDetail: { value: DISPLACEMENT_SCALE_DETAIL },

                    // Material properties
                    diffuseColor: { value: color },
                    roughness: { value: roughness },
                    metalness: { value: metalness },
                    
                    // Lighting uniforms (will be updated dynamically by Game.js / Three.js)
                    ambientLightColor: { value: new THREE.Color(0x404040) }, // Placeholder, Three.js provides this
                    directionalLightDirection: { value: new THREE.Vector3() },
                    directionalLightColor: { value: new THREE.Color() },
                    hemisphereLightSkyColor: { value: new THREE.Color() },
                    hemisphereLightGroundColor: { value: new THREE.Color() },
                },
                lights: true // IMPORTANT: Tells Three.js to manage standard lighting uniforms for this shader
            });
        };

        this.materials = {
            iron: createRockMaterial(new THREE.Color(0x8E4A3B), 0.6, 0.4), // Rusty red-brown, metallic
            carbon: createRockMaterial(new THREE.Color(0x222222), 0.4, 0.0), // Dark charcoal, slightly shiny
            limestone: createRockMaterial(new THREE.Color(0xE5E4D7), 0.9, 0.0) // Off-white/light grey, matte
        };
        const oreTypes = Object.keys(this.materials);

        // --- Generate and Place Rocks ---
        for (let i = 0; i < ROCK_COUNT; i++) {
            // 1. Create a base angular geometry (BoxGeometry, then subdivide)
            const baseGeometry = new THREE.BoxGeometry(BASE_ROCK_SIZE, BASE_ROCK_SIZE, BASE_ROCK_SIZE);
            const rockGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.Geometry().fromBufferGeometry(baseGeometry)); // Convert to non-indexed for easier subdivision
            
            // Subdivide to add more vertices for displacement
            for(let s = 0; s < SUBDIVISIONS; s++) {
                 rockGeometry.subdivide();
            }
            rockGeometry.computeVertexNormals(); // Recalculate normals after subdivision

            // 2. Pick a random ore type and material
            const type = oreTypes[Math.floor(Math.random() * oreTypes.length)];
            const material = this.materials[type];

            // 3. Create the mesh
            const rockMesh = new THREE.Mesh(rockGeometry, material);

            // 4. Set a random position, rotation, and scale within the mine area
            const scale = THREE.MathUtils.randFloat(0.8, 3.0); // Slightly larger scale variation
            rockMesh.scale.set(
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3)
            );
            
            // Position on the terrain, accounting for height and scale
            rockMesh.position.set(
                mineArea.x + (Math.random() - 0.5) * mineArea.width * 0.8, // Slightly inside bounds
                mineArea.height + (rockMesh.geometry.boundingSphere.radius * rockMesh.scale.y) - 0.2, // Adjust based on bounding sphere
                mineArea.y + (Math.random() - 0.5) * mineArea.depth * 0.8 // Note: using y for z-depth
            );

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
