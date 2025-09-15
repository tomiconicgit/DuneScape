import * as THREE from 'three';

const vertexShader = `
varying vec3 vWorldPosition;
void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const fragmentShader = `
uniform vec3 uSunPosition;
uniform float uHorizonOffset;
uniform float uExposure;

varying vec3 vWorldPosition;

// Artistic sky shader, not physically based but looks good and is controllable
void main() {
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
    vec3 sunDir = normalize(uSunPosition);

    // Main sky color gradient (from zenith to horizon)
    float zenithFactor = smoothstep(0.0, 1.0, rayDir.y);
    vec3 zenithColor = vec3(0.2, 0.4, 0.8);
    vec3 horizonColor = vec3(0.6, 0.8, 1.0);
    vec3 skyGradient = mix(horizonColor, zenithColor, zenithFactor);

    // Sun haze/glow
    float sunDot = dot(rayDir, sunDir);
    float sunHaze = smoothstep(0.9, 1.0, sunDot);
    vec3 sunColor = vec3(1.0, 0.95, 0.8);
    vec3 finalColor = mix(skyGradient, sunColor, sunHaze * sunHaze);

    // Sun disk
    float sunDisk = smoothstep(0.998, 1.0, sunDot);
    finalColor += sunColor * sunDisk * 2.0;

    // Day/Night fade
    float dayNightFade = smoothstep(-0.1, 0.1, sunDir.y);
    finalColor *= dayNightFade;

    // Horizon line blend
    vec3 groundColor = vec3(0.05, 0.05, 0.08);
    float horizonBlend = smoothstep(-0.02 + uHorizonOffset, 0.02 + uHorizonOffset, rayDir.y);
    finalColor = mix(groundColor, finalColor, horizonBlend);

    // Exposure and tone mapping
    finalColor *= uExposure;
    finalColor = finalColor / (finalColor + vec3(1.0));

    gl_FragColor = vec4(finalColor, 1.0);
}`;

export default class Atmosphere {
    constructor(scene) {
        const geometry = new THREE.SphereGeometry(10000, 32, 32);
        this.uniforms = {
            uSunPosition: { value: new THREE.Vector3() },
            uHorizonOffset: { value: 0.0 },
            uExposure: { value: 1.0 }
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
