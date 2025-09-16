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

// NEW: Color uniforms for different times of day
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

    // --- Time of Day Blending ---
    // Calculate mix factors based on sun's height (sunDir.y)
    float dayMix = smoothstep(0.15, 0.4, sunDir.y); // Transition from morning to day
    float eveningMix = smoothstep(0.15, 0.0, sunDir.y); // Transition from day to evening
    float nightMix = smoothstep(0.0, -0.15, sunDir.y); // Transition from evening to night

    // Blend Zenith and Horizon colors through the day
    vec3 zenithColor = mix(uZenithMorning, uZenithDay, dayMix);
    vec3 horizonColor = mix(uHorizonMorning, uHorizonDay, dayMix);
    
    // Blend in evening colors as sun sets
    zenithColor = mix(zenithColor, uZenithEvening, eveningMix);
    horizonColor = mix(horizonColor, uHorizonEvening, eveningMix);

    // Blend in night colors when sun is below horizon
    zenithColor = mix(zenithColor, uZenithNight, nightMix);
    horizonColor = mix(horizonColor, uHorizonNight, nightMix);

    // --- Final Sky Gradient Calculation ---
    float zenithFactor = smoothstep(0.0, 1.0, rayDir.y);
    vec3 skyGradient = mix(horizonColor, zenithColor, zenithFactor);

    // Sun haze/glow
    float sunDot = dot(rayDir, sunDir);
    float sunHaze = smoothstep(0.9, 1.0, sunDot);
    vec3 finalColor = mix(skyGradient, uSunColor, sunHaze * sunHaze);

    // Sun disk
    float sunDisk = smoothstep(0.998, 1.0, sunDot);
    finalColor += uSunColor * sunDisk * 2.0;

    // Day/Night brightness fade
    float dayNightFade = smoothstep(-0.2, 0.1, sunDir.y);
    finalColor *= dayNightFade;

    // Horizon line blend
    vec3 groundColor = vec3(0.0, 0.0, 0.0); // Black ground
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
            uExposure: { value: 1.5 }, // Increased default brightness a bit
            
            // Define the color palettes for each time of day
            uZenithMorning: { value: new THREE.Color('#3A506B') },   // Slate Blue
            uHorizonMorning: { value: new THREE.Color('#F08A5D') }, // Orange-Peach
            
            uZenithDay: { value: new THREE.Color('#0077FF') },       // Bright Blue
            uHorizonDay: { value: new THREE.Color('#87CEEB') },     // Sky Blue
            
            uZenithEvening: { value: new THREE.Color('#1C0B19') },   // Deep Purple
            uHorizonEvening: { value: new THREE.Color('#FF4E50') }, // Fiery Red
            
            uZenithNight: { value: new THREE.Color('#02040A') },     // Almost Black
            uHorizonNight: { value: new THREE.Color('#030A14') },    // Very Dark Blue

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
        scene.add(this.mesh);
    }

    update(sunPosition) {
        this.uniforms.uSunPosition.value.copy(sunPosition);
    }
}
