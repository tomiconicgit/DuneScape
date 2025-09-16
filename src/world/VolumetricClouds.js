import * as THREE from 'three';

const MAX_DISTANCE = 4000.0;

const vertexShader = `
varying vec3 vWorldPosition;
void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
varying vec3 vWorldPosition;
uniform vec3 uSunPosition;
uniform sampler2D uNoise;
uniform float uTime;
uniform float uCloudCover;
uniform float uCloudSharpness;
uniform float uMaxDistance;

const int STEPS = 64;

// Pseudo-random number generator
float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

// 3D noise function (using a 2D texture lookup for performance)
float noise(vec3 p) {
    float z_factor = p.z * 0.1;
    return texture(uNoise, p.xy * 0.01 + z_factor).r;
}

// Fractional Brownian Motion for cloud shapes
float fbm(vec3 p) {
    float f = 0.0;
    mat3 m = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
    f += 0.5000 * noise(p); p = m * p * 2.02;
    f += 0.2500 * noise(p); p = m * p * 2.03;
    f += 0.1250 * noise(p); p = m * p * 2.01;
    f += 0.0625 * noise(p);
    return f;
}

// Calculates cloud density at a given point in space
float getCloudDensity(vec3 pos) {
    // MODIFIED: Lowered the cloud layer to a visible height
    pos.y -= 20;
    
    pos.x += uTime * 100.0; // Animate cloud movement
    float base_fbm = fbm(pos * 0.001);
    
    // Shaping the cloud layer
    float height_factor = 1.0 - smoothstep(0.0, 1500.0, pos.y);
    float density = smoothstep(uCloudCover, 1.0, base_fbm);
    
    return density * height_factor;
}

// Raymarching loop
vec4 raymarch(vec3 rayOrigin, vec3 rayDir) {
    float step_size = uMaxDistance / float(STEPS);
    vec3 lightDir = normalize(uSunPosition);
    vec4 color = vec4(0.0);

    for(int i = 0; i < STEPS; i++) {
        vec3 pos = rayOrigin + rayDir * (float(i) + rand(rayDir.xy)) * step_size;

        if(pos.y > 2500.0) continue;

        float density = getCloudDensity(pos);
        if(density > 0.01) {
            float light_absorption = exp(-density * uCloudSharpness);
            vec3 lightColor = vec3(1.0, 0.9, 0.75); 
            vec3 cloud_color = mix(vec3(0.8, 0.85, 1.0), lightColor, light_absorption);
            color.rgb += (1.0 - color.a) * cloud_color * density;
            color.a += (1.0 - color.a) * density;
        }
        if(color.a > 0.99) break;
    }
    return color;
}

void main() {
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
    vec3 rayOrigin = cameraPosition;
    
    vec4 cloudColor = raymarch(rayOrigin, rayDir);
    
    if (cloudColor.a < 0.01) {
        discard;
    }

    gl_FragColor = cloudColor;
}`;


export default class VolumetricClouds {
    constructor(scene) {
        const noiseTexture = new THREE.TextureLoader().load('https://unpkg.com/three@0.158.0/examples/textures/cloud.png');
        noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        this.uniforms = {
            uSunPosition: { value: new THREE.Vector3() },
            uNoise: { value: noiseTexture },
            uTime: { value: 0 },
            uCloudCover: { value: 0.55 },
            uCloudSharpness: { value: 30.0 },
            uMaxDistance: { value: MAX_DISTANCE }
        };
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: false,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.set(MAX_DISTANCE * 2.0, 3000, MAX_DISTANCE * 2.0);
        scene.add(this.mesh);
    }

    update(sunPosition, delta) {
        this.uniforms.uSunPosition.value.copy(sunPosition);
        this.uniforms.uTime.value += delta;
    }
}
