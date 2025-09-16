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
uniform float uExposure;

// Sky Color uniforms
uniform vec3 uZenithMorning;
uniform vec3 uHorizonMorning;
uniform vec3 uZenithDay;
uniform vec3 uHorizonDay;
uniform vec3 uZenithEvening;
uniform vec3 uHorizonEvening;
uniform vec3 uZenithNight;
uniform vec3 uHorizonNight;
uniform vec3 uSunColor;

varying vec3 vWorldPosition;

void main() {
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
    vec3 sunDir = normalize(uSunPosition);

    // Time of Day Blending for Sky Colors
    float dayMix = smoothstep(0.15, 0.4, sunDir.y);
    float eveningMix = smoothstep(0.15, 0.0, sunDir.y);
    float nightMix = smoothstep(0.0, -0.15, sunDir.y);
    vec3 zenithColor = mix(uZenithMorning, uZenithDay, dayMix);
    vec3 horizonColor = mix(uHorizonMorning, uHorizonDay, dayMix);
    zenithColor = mix(zenithColor, uZenithEvening, eveningMix);
    horizonColor = mix(horizonColor, uHorizonEvening, eveningMix);
    zenithColor = mix(zenithColor, uZenithNight, nightMix);
    horizonColor = mix(horizonColor, uHorizonNight, nightMix);

    // Final Sky Gradient Calculation
    float zenithFactor = smoothstep(0.0, 1.0, rayDir.y);
    vec3 skyGradient = mix(horizonColor, zenithColor, zenithFactor);

    // Sun haze/glow and disk
    float sunDot = dot(rayDir, sunDir);
    float sunHaze = smoothstep(0.9, 1.0, sunDot);
    vec3 finalColor = mix(skyGradient, uSunColor, sunHaze * sunHaze);
    float sunDisk = smoothstep(0.998, 1.0, sunDot);
    finalColor += uSunColor * sunDisk * 2.0;

    // Day/Night brightness fade
    float dayNightFade = smoothstep(-0.2, 0.1, sunDir.y);
    finalColor *= dayNightFade;
    
    // Final color processing
    finalColor *= uExposure;
    finalColor = finalColor / (finalColor + vec3(1.0));

    gl_FragColor = vec4(finalColor, 1.0);
}`;

export default class Atmosphere {
    constructor(scene) {
        const geometry = new THREE.SphereGeometry(10000, 32, 32);
        this.uniforms = {
            uSunPosition: { value: new THREE.Vector3() },
            uExposure: { value: 1.5 },
            uZenithMorning: { value: new THREE.Color('#3A506B') },
            uHorizonMorning: { value: new THREE.Color('#F08A5D') },
            uZenithDay: { value: new THREE.Color('#0077FF') },
            uHorizonDay: { value: new THREE.Color('#87CEEB') },
            uZenithEvening: { value: new THREE.Color('#1C0B19') },
            uHorizonEvening: { value: new THREE.Color('#FF4E50') },
            uZenithNight: { value: new THREE.Color('#02040A') },
            uHorizonNight: { value: new THREE.Color('#030A14') },
            uSunColor: { value: new THREE.Color('#FFFFFF') }
        };
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        // Render this behind everything else
        this.mesh.renderOrder = -1000;
        scene.add(this.mesh);
    }
    update(sunPosition) {
        this.uniforms.uSunPosition.value.copy(sunPosition);
    }
}
