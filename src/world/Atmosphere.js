import * as THREE from 'three';

// GLSL code for the shader
const vertexShader = `
varying vec3 vWorldPosition;
void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const fragmentShader = `
varying vec3 vWorldPosition;
uniform vec3 uSunPosition;
uniform float uRayleigh;
uniform float uMie;
uniform float uMieDirectionalG;
uniform float uHorizonOffset;
uniform float uExposure; // NEW: Brightness control

// ... (Atmosphere scattering logic remains the same) ...
const float PI = 3.1415926535897932384626433832795;
const float earthRadius = 6371e3;
const float atmosphereHeight = 80e3;

vec3 getSkyColor(vec3 rayDir) {
    vec3 sunDir = normalize(uSunPosition);
    float sunfade = 1.0 - clamp(1.0 - exp((uSunPosition.y / 450000.0)), 0.0, 1.0);
    float rayleigh = uRayleigh * (1.0 - 0.2 * sunfade);
    vec3 betaR = vec3(5.5e-6, 13.0e-6, 22.4e-6) * rayleigh;
    vec3 betaM = vec3(21e-6) * uMie;
    float sunAngle = dot(sunDir, rayDir);
    float r = length(vWorldPosition);
    float mu = dot(rayDir, normalize(vWorldPosition));
    float phaseR = (3.0 / (16.0 * PI)) * (1.0 + pow(sunAngle, 2.0));
    float g = uMieDirectionalG;
    float phaseM = (1.0 / (4.0 * PI)) * ((1.0 - g*g) / pow(1.0 - 2.0*g*sunAngle + g*g, 1.5));
    vec3 dayExtinction = exp(-(betaR / 0.8e3 + betaM / 0.8e3) * (sqrt(max(0.0, earthRadius * earthRadius * mu * mu + 2.0 * earthRadius * r + r * r)) - earthRadius * mu));
    vec3 color = (phaseR * betaR + phaseM * betaM) / (betaR + betaM) * (1.0 - dayExtinction) * 2.0;
    color.r = pow(color.r, 1.5);
    color.g = pow(color.g, 1.5);
    color.b = pow(color.b, 1.5);
    return color;
}

void main() {
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
    vec3 finalColor = getSkyColor(rayDir);

    float sunDisk = smoothstep(0.999, 0.9995, dot(rayDir, normalize(uSunPosition)));
    finalColor += vec3(1.0, 0.9, 0.7) * sunDisk * 20.0;
    
    vec3 groundColor = vec3(0.05, 0.05, 0.08);
    float horizonBlend = smoothstep(-0.02 + uHorizonOffset, 0.02 + uHorizonOffset, rayDir.y);
    finalColor = mix(groundColor, finalColor, horizonBlend);
    
    // MODIFIED: Apply exposure and tone mapping
    finalColor *= uExposure;
    finalColor = finalColor / (finalColor + vec3(1.0)); // Simple Reinhard tone mapping
    
    gl_FragColor = vec4(finalColor, 1.0);
}`;

export default class Atmosphere {
    constructor(scene) {
        const geometry = new THREE.SphereGeometry(10000, 32, 32);
        this.uniforms = {
            uSunPosition: { value: new THREE.Vector3() },
            uRayleigh: { value: 2.5 },
            uMie: { value: 0.001 },
            uMieDirectionalG: { value: 0.8 },
            uHorizonOffset: { value: 0.0 },
            uExposure: { value: 1.0 } // MODIFIED: Add new uniform
        };
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, material);
        scene.add(this.mesh);
    }

    update(sunPosition) {
        this.uniforms.uSunPosition.value.copy(sunPosition);
    }
}
