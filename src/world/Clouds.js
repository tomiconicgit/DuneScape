import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export default class Clouds {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.clouds = [];
        this.frame = 0;

        // --- Cloud Settings ---
        const CLOUD_COUNT_MIN = 8; // Increased count for more coverage
        const CLOUD_COUNT_MAX = 15;
        const AREA_SIZE = 200; // Larger area for cloud distribution
        const ALTITUDE_MIN = 35; // Slightly higher minimum height
        const ALTITUDE_MAX = 55; // Slightly higher maximum height

        const cloudCount = THREE.MathUtils.randInt(CLOUD_COUNT_MIN, CLOUD_COUNT_MAX);
        for (let i = 0; i < cloudCount; i++) {
            const cloudMesh = this._createCloud();
            
            // Randomize position and scale
            cloudMesh.position.set(
                (Math.random() - 0.5) * AREA_SIZE,
                THREE.MathUtils.randFloat(ALTITUDE_MIN, ALTITUDE_MAX),
                (Math.random() - 0.5) * AREA_SIZE
            );
            const scale = THREE.MathUtils.randFloat(20, 35); // Larger scale for flatter, wider clouds
            // Make clouds significantly wider and deeper than they are tall for a flatter look
            cloudMesh.scale.set(scale * THREE.MathUtils.randFloat(1.5, 2.5), scale * THREE.MathUtils.randFloat(0.3, 0.6), scale * THREE.MathUtils.randFloat(1.5, 2.5));

            // Store custom data for animation
            cloudMesh.userData = {
                rotationSpeed: (Math.random() - 0.5) * 0.005, // Slower rotation
                driftSpeed: new THREE.Vector3(THREE.MathUtils.randFloat(-0.05, 0.05), 0, THREE.MathUtils.randFloat(-0.05, 0.05)), // Added horizontal drift
                thresholdOffset: Math.random() * 1000 // To desynchronize shape-shifting
            };
            
            this.scene.add(cloudMesh);
            this.clouds.push(cloudMesh);
        }
    }

    _createCloud() {
        // --- 1. Generate 3D Noise Texture ---
        const size = 128;
        const data = new Uint8Array(size * size * size);
        const perlin = new ImprovedNoise();
        const vector = new THREE.Vector3();

        let i = 0;
        // Adjusted noise scale for flatter, more stretched shapes
        const noiseScaleX = 0.02; 
        const noiseScaleY = 0.01; // Smaller Y scale to compress vertically
        const noiseScaleZ = 0.02;

        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    // Flatten the noise along Y-axis and make it less dense
                    const d = 1.0 - vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
                    // Multiplied noise value by 0.7 to make clouds less dense
                    data[i] = (128 + 128 * perlin.noise(x * noiseScaleX, y * noiseScaleY, z * noiseScaleZ)) * d * d * 0.7; 
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

        // --- 2. Define Custom Shader Material ---
        const vertexShader = /* glsl */`
            in vec3 position;
            uniform mat4 modelMatrix;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform vec3 cameraPos;
            out vec3 vOrigin;
            out vec3 vDirection;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPos, 1.0)).xyz;
                vDirection = position - vOrigin;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = /* glsl */`
            precision highp float;
            precision highp sampler3D;
            in vec3 vOrigin;
            in vec3 vDirection;
            out vec4 color;

            uniform sampler3D map;
            uniform vec3 uSunColor;
            uniform vec3 uHemiColor;
            uniform float threshold;
            uniform float opacity;
            uniform float range;
            uniform float steps;
            uniform float frame;

            // Day/Night control for cloud brightness
            uniform float uOverallLightness; // 0.0 (night) to 1.0 (day)

            uint wang_hash(uint seed) {
                seed = (seed ^ 61u) ^ (seed >> 16u);
                seed *= 9u;
                seed = seed ^ (seed >> 4u);
                seed *= 0x27d4eb2du;
                seed = seed ^ (seed >> 15u);
                return seed;
            }

            float randomFloat(inout uint seed) {
                return float(wang_hash(seed)) / 4294967296.;
            }

            vec2 hitBox(vec3 orig, vec3 dir) {
                const vec3 box_min = vec3(-0.5);
                const vec3 box_max = vec3(0.5);
                vec3 inv_dir = 1.0 / dir;
                vec3 tmin_tmp = (box_min - orig) * inv_dir;
                vec3 tmax_tmp = (box_max - orig) * inv_dir;
                vec3 tmin = min(tmin_tmp, tmax_tmp);
                vec3 tmax = max(tmin_tmp, tmax_tmp);
                float t0 = max(tmin.x, max(tmin.y, tmin.z));
                float t1 = min(tmax.x, min(tmax.y, tmax.z));
                return vec2(t0, t1);
            }

            float sample1(vec3 p) {
                return texture(map, p).r;
            }
            
            // Basic self-shadowing - adjusted to be softer
            float shading(vec3 coord) {
                float step = 0.005; // Smaller step for softer shadows
                // Use a slightly larger sample radius for broader shading effects
                float s1 = sample1(coord + vec3(-step));
                float s2 = sample1(coord + vec3(step));
                return (s1 - s2) * 1.5 + 0.5; // Adjusted intensity and bias
            }
            
            vec4 linearToSRGB(in vec4 value) {
                return vec4(mix(pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), value.rgb * 12.92, vec3(lessThanEqual(value.rgb, vec3(0.0031308)))), value.a);
            }

            void main() {
                vec3 rayDir = normalize(vDirection);
                vec2 bounds = hitBox(vOrigin, rayDir);
                if (bounds.x > bounds.y) discard;
                bounds.x = max(bounds.x, 0.0);
                vec3 p = vOrigin + bounds.x * rayDir;
                vec3 inc = 1.0 / abs(rayDir);
                float delta = min(inc.x, min(inc.y, inc.z));
                delta /= steps;
                
                uint seed = uint(gl_FragCoord.x) * 1973u + uint(gl_FragCoord.y) * 9277u + uint(frame) * 26699u;
                p += rayDir * randomFloat(seed) * (1.0 / vec3(textureSize(map, 0)).x);

                vec4 accumulatedColor = vec4(0.0);
                // Base cloud color, always somewhat visible
                vec3 baseCloudColor = vec3(1.0, 1.0, 1.0); 

                for (float t = bounds.x; t < bounds.y; t += delta) {
                    float density = sample1(p + 0.5);
                    // Increased range for softer edges, higher threshold for sparser clouds
                    density = smoothstep(threshold - range, threshold + range, density) * opacity; 

                    if (density > 0.005) { // Lower threshold for rendering small wisps
                        float shade = shading(p + 0.5); 
                        
                        // Blend sun and hemi colors for overall lighting
                        vec3 combinedLight = mix(uHemiColor, uSunColor, clamp(uOverallLightness * 1.5, 0.0, 1.0)); // Amplify daytime effect
                        
                        // Apply self-shading and overall lightness to the base color
                        vec3 finalCloudColor = baseCloudColor * combinedLight * clamp(shade + uOverallLightness * 0.5, 0.1, 1.0); // Ensure minimal darkness
                        
                        accumulatedColor.rgb += (1.0 - accumulatedColor.a) * density * finalCloudColor;
                        accumulatedColor.a += (1.0 - accumulatedColor.a) * density;
                        if (accumulatedColor.a >= 0.95) break;
                    }
                    p += rayDir * delta;
                }
                color = linearToSRGB(accumulatedColor);
                if (color.a < 0.005) discard; // Lower discard threshold to keep very faint wisps
            }
        `;

        const material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: {
                map: { value: texture },
                cameraPos: { value: new THREE.Vector3() },
                uSunColor: { value: new THREE.Color() },
                uHemiColor: { value: new THREE.Color() },
                uOverallLightness: { value: 1.0 }, // New uniform for overall brightness
                threshold: { value: 0.35 }, // Higher threshold for sparser clouds
                opacity: { value: 0.1 }, // Reduced opacity for lighter, wispier clouds
                range: { value: 0.15 }, // Increased range for softer edges
                steps: { value: 60 }, // Reduced steps for performance and softer look
                frame: { value: 0 }
            },
            vertexShader,
            fragmentShader,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false, 
        });

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        return new THREE.Mesh(geometry, material);
    }
    
    update(delta, sunLight, hemiLight, cameraPosition, currentElevation) {
        this.frame++;

        // Calculate a general lightness factor for clouds based on sun elevation
        // This makes them consistently bright during the day and gracefully dimmer at night,
        // but never fully black.
        const overallLightness = THREE.MathUtils.smoothstep(currentElevation, -10, 60); 
        
        for (const cloud of this.clouds) {
            const uniforms = cloud.material.uniforms;
            uniforms.cameraPos.value.copy(cameraPosition);
            uniforms.frame.value = this.frame;

            // Pass the calculated overall lightness to the shader
            uniforms.uOverallLightness.value = overallLightness;

            // Adjust sun and hemi colors. Sun color is bright, hemi provides ambient fill
            uniforms.uSunColor.value.copy(sunLight.color).multiplyScalar(sunLight.intensity * 2.0); // Boost sun impact
            uniforms.uHemiColor.value.copy(hemiLight.color).multiplyScalar(hemiLight.intensity * 1.5); // Boost ambient impact
            
            // Animate cloud drift
            cloud.rotation.y += cloud.userData.rotationSpeed * delta;
            cloud.position.addScaledVector(cloud.userData.driftSpeed, delta);

            // Animate shape and density over time
            const time = (performance.now() * 0.0001) + cloud.userData.thresholdOffset; // Slower, more subtle changes
            uniforms.threshold.value = 0.35 + (Math.sin(time) * 0.05); // More subtle shape changes
            uniforms.opacity.value = 0.1 + (Math.sin(time * 0.7) * 0.03); // Subtle opacity changes
        }
    }
}
