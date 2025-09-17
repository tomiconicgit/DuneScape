import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export default class Clouds {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.clouds = [];
        this.frame = 0;

        // --- Wind & Sky Settings ---
        this.windDirection = new THREE.Vector3(0.3, 0, 0.7).normalize(); // Direction the wind blows
        this.windSpeed = 2.0; // How fast the clouds move
        this.areaSize = 250;  // How far clouds can spawn from the center
        const CLOUD_COUNT_MIN = 25; // Increased for a more clouded sky
        const CLOUD_COUNT_MAX = 35;
        const ALTITUDE_MIN = 30;
        const ALTITUDE_MAX = 45;

        const cloudCount = THREE.MathUtils.randInt(CLOUD_COUNT_MIN, CLOUD_COUNT_MAX);
        for (let i = 0; i < cloudCount; i++) {
            const cloudMesh = this._createCloud();
            
            // Randomize initial position within the area
            cloudMesh.position.set(
                (Math.random() - 0.5) * this.areaSize * 2,
                THREE.MathUtils.randFloat(ALTITUDE_MIN, ALTITUDE_MAX),
                (Math.random() - 0.5) * this.areaSize * 2
            );
            const scale = THREE.MathUtils.randFloat(20, 35);
            cloudMesh.scale.set(scale, scale * 0.6, scale);

            // Store custom data for animation
            cloudMesh.userData = {
                rotationSpeed: (Math.random() - 0.5) * 0.02,
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
        const scale = 0.05;
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const d = 1.0 - vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
                    data[i] = (128 + 128 * perlin.noise(x * scale, y * scale, z * scale)) * d * d;
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
            in vec3 position; uniform mat4 modelMatrix; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
            uniform vec3 cameraPos; out vec3 vOrigin; out vec3 vDirection;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPos, 1.0)).xyz;
                vDirection = position - vOrigin;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = /* glsl */`
            precision highp float; precision highp sampler3D;
            in vec3 vOrigin; in vec3 vDirection; out vec4 color;
            uniform sampler3D map; uniform vec3 uSunColor; uniform vec3 uHemiColor;
            uniform float threshold; uniform float opacity; uniform float range;
            uniform float steps; uniform float frame;

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
                vec3 rayDir = normalize(vDirection); vec2 bounds = hitBox(vOrigin, rayDir);
                if (bounds.x > bounds.y) discard; bounds.x = max(bounds.x, 0.0);
                vec3 p = vOrigin + bounds.x * rayDir; vec3 inc = 1.0 / abs(rayDir);
                float delta = min(inc.x, min(inc.y, inc.z)); delta /= steps;
                uint seed = uint(gl_FragCoord.x)*1973u+uint(gl_FragCoord.y)*9277u+uint(frame)*26699u; // <-- CORRECTED CASING HERE
                p += rayDir * randomFloat(seed) * (1.0/vec3(textureSize(map, 0)).x);

                vec4 accumulatedColor = vec4(0.0);
                for (float t = bounds.x; t < bounds.y; t += delta) {
                    float density = sample1(p + 0.5);
                    density = smoothstep(threshold - range, threshold + range, density) * opacity;
                    if (density > 0.01) {
                        float shade = shading(p + 0.5) * 2.0 + 0.5;
                        vec3 mixedLight = mix(uHemiColor, uSunColor, shade);
                        accumulatedColor.rgb += (1.0 - accumulatedColor.a) * density * mixedLight;
                        accumulatedColor.a += (1.0 - accumulatedColor.a) * density;
                        if (accumulatedColor.a >= 0.95) break;
                    }
                    p += rayDir * delta;
                }
                color = linearToSRGB(accumulatedColor);
                if (color.a < 0.01) discard;
            }
        `;

        const material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: {
                map: { value: texture },
                cameraPos: { value: new THREE.Vector3() },
                uSunColor: { value: new THREE.Color() },
                uHemiColor: { value: new THREE.Color() },
                threshold: { value: 0.25 },
                opacity: { value: 0.15 },
                range: { value: 0.1 },
                steps: { value: 80 },
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
    
    update(delta, sunLight, hemiLight, cameraPosition) {
        this.frame++;
        
        const perpendicularWind = new THREE.Vector3(-this.windDirection.z, 0, this.windDirection.x);

        for (const cloud of this.clouds) {
            const uniforms = cloud.material.uniforms;
            uniforms.cameraPos.value.copy(cameraPosition);
            uniforms.frame.value = this.frame;

            uniforms.uSunColor.value.copy(sunLight.color).multiplyScalar(sunLight.intensity / 3.0);
            uniforms.uHemiColor.value.copy(hemiLight.color).multiplyScalar(hemiLight.intensity / 2.0);
            
            cloud.position.addScaledVector(this.windDirection, this.windSpeed * delta);
            
            cloud.rotation.y += cloud.userData.rotationSpeed * delta;

            const distance = cloud.position.length();
            if (distance > this.areaSize * 1.2) {
                let resetPos = this.windDirection.clone().multiplyScalar(-this.areaSize);
                let randomOffset = perpendicularWind.clone().multiplyScalar((Math.random() - 0.5) * this.areaSize * 2);
                resetPos.add(randomOffset);
                cloud.position.copy(resetPos);
            }

            const time = performance.now() * 0.0002;
            uniforms.threshold.value = 0.25 + (Math.sin(time + cloud.userData.thresholdOffset) * 0.03);
        }
    }
}
