import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export default class Clouds {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.clouds = [];
        this.frame = 0;

        // --- Cloud Settings ---
        const CLOUD_COUNT_MIN = 8;
        const CLOUD_COUNT_MAX = 15;
        const AREA_SIZE = 200;
        const ALTITUDE_MIN = 35;
        const ALTITUDE_MAX = 55;

        const cloudCount = THREE.MathUtils.randInt(CLOUD_COUNT_MIN, CLOUD_COUNT_MAX);
        for (let i = 0; i < cloudCount; i++) {
            const cloudMesh = this._createCloud();
            
            cloudMesh.position.set(
                (Math.random() - 0.5) * AREA_SIZE,
                THREE.MathUtils.randFloat(ALTITUDE_MIN, ALTITUDE_MAX),
                (Math.random() - 0.5) * AREA_SIZE
            );
            const scale = THREE.MathUtils.randFloat(20, 35);
            cloudMesh.scale.set(scale * THREE.MathUtils.randFloat(1.5, 2.5), scale * THREE.MathUtils.randFloat(0.3, 0.6), scale * THREE.MathUtils.randFloat(1.5, 2.5));

            cloudMesh.userData = {
                rotationSpeed: (Math.random() - 0.5) * 0.005,
                driftSpeed: new THREE.Vector3(THREE.MathUtils.randFloat(-0.05, 0.05), 0, THREE.MathUtils.randFloat(-0.05, 0.05)),
                thresholdOffset: Math.random() * 1000
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
        const noiseScaleX = 0.02; 
        const noiseScaleY = 0.01;
        const noiseScaleZ = 0.02;

        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const d = 1.0 - vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
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
            uniform vec3 uSunColor;    // Pure sun color (e.g., orange at sunset)
            uniform vec3 uHemiColor;   // Pure ambient color (e.g., blue from sky)
            uniform float threshold;
            uniform float opacity;
            uniform float range;
            uniform float steps;
            uniform float frame;
            uniform float uOverallLightness; // 0.0 (night) to 1.0 (day)

            uint wang_hash(uint seed) {
                seed = (seed ^ 61u) ^ (seed >> 16u); seed *= 9u; seed = seed ^ (seed >> 4u);
                seed *= 0x27d4eb2du; seed = seed ^ (seed >> 15u); return seed;
            }
            float randomFloat(inout uint seed) { return float(wang_hash(seed)) / 4294967296.; }

            vec2 hitBox(vec3 orig, vec3 dir) {
                const vec3 box_min = vec3(-0.5); const vec3 box_max = vec3(0.5);
                vec3 inv_dir = 1.0 / dir; vec3 tmin_tmp = (box_min - orig) * inv_dir;
                vec3 tmax_tmp = (box_max - orig) * inv_dir; vec3 tmin = min(tmin_tmp, tmax_tmp);
                vec3 tmax = max(tmin_tmp, tmax_tmp); float t0 = max(tmin.x, max(tmin.y, tmin.z));
                float t1 = min(tmax.x, min(tmax.y, tmax.z)); return vec2(t0, t1);
            }

            float sample1(vec3 p) { return texture(map, p).r; }
            float shading(vec3 coord) { float step = 0.01; return sample1(coord + vec3(-step)) - sample1(coord + vec3(step)); }
            vec4 linearToSRGB(in vec4 value) { return vec4(mix(pow(value.rgb,vec3(0.41666))*1.055-vec3(0.055),value.rgb*12.92,vec3(lessThanEqual(value.rgb,vec3(0.0031308)))),value.a); }

            void main() {
                vec3 rayDir = normalize(vDirection);
                vec2 bounds = hitBox(vOrigin, rayDir);
                if (bounds.x > bounds.y) discard;
                bounds.x = max(bounds.x, 0.0);
                vec3 p = vOrigin + bounds.x * rayDir;
                vec3 inc = 1.0 / abs(rayDir); float delta = min(inc.x, min(inc.y, inc.z)); delta /= steps;
                uint seed = uint(gl_FragCoord.x)*1973u+uint(gl_FragCoord.y)*9277u+uint(frame)*26699u;
                p += rayDir * randomFloat(seed) * (1.0/vec3(textureSize(map, 0)).x);

                vec4 accumulatedColor = vec4(0.0);

                // *** NEW LIGHTING LOGIC ***
                const float minBrightness = 0.15; // The minimum brightness at night
                const float dayBrightness = 1.0;  // The brightness during the day

                for (float t = bounds.x; t < bounds.y; t += delta) {
                    float density = sample1(p + 0.5);
                    density = smoothstep(threshold - range, threshold + range, density) * opacity; 

                    if (density > 0.005) {
                        float shade = shading(p + 0.5) * 2.0 + 0.5; // Controls volume/shadows
                        
                        // 1. Determine the cloud's core brightness based on time of day
                        float coreBrightness = mix(minBrightness, dayBrightness, uOverallLightness);
                        
                        // 2. Determine the cloud's color by tinting it with sun/ambient light
                        vec3 tintColor = mix(uHemiColor, uSunColor, uOverallLightness);
                        
                        // 3. Combine them: a bright white cloud, tinted by the light color
                        vec3 finalCloudColor = vec3(coreBrightness) * tintColor * shade;
                        
                        accumulatedColor.rgb += (1.0 - accumulatedColor.a) * density * finalCloudColor;
                        accumulatedColor.a += (1.0 - accumulatedColor.a) * density;

                        if (accumulatedColor.a >= 0.95) break;
                    }
                    p += rayDir * delta;
                }
                color = linearToSRGB(accumulatedColor);
                if (color.a < 0.005) discard;
            }
        `;

        const material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: {
                map: { value: texture },
                cameraPos: { value: new THREE.Vector3() },
                uSunColor: { value: new THREE.Color() },
                uHemiColor: { value: new THREE.Color() },
                uOverallLightness: { value: 1.0 },
                threshold: { value: 0.35 },
                opacity: { value: 0.08 }, // Further reduced for even softer clouds
                range: { value: 0.2 }, // Increased for softer edges
                steps: { value: 60 },
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

        const overallLightness = THREE.MathUtils.smoothstep(currentElevation, -10, 60); 
        
        for (const cloud of this.clouds) {
            const uniforms = cloud.material.uniforms;
            uniforms.cameraPos.value.copy(cameraPosition);
            uniforms.frame.value = this.frame;
            uniforms.uOverallLightness.value = overallLightness;

            // Pass the PURE color to the shader, without intensity.
            // The shader now handles brightness internally.
            uniforms.uSunColor.value.copy(sunLight.color);
            uniforms.uHemiColor.value.copy(hemiLight.color);
            
            cloud.rotation.y += cloud.userData.rotationSpeed * delta;
            cloud.position.addScaledVector(cloud.userData.driftSpeed, delta);

            const time = (performance.now() * 0.0001) + cloud.userData.thresholdOffset;
            uniforms.threshold.value = 0.35 + (Math.sin(time) * 0.05);
            uniforms.opacity.value = 0.08 + (Math.sin(time * 0.7) * 0.03);
        }
    }
}
