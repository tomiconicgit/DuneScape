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
uniform float uTimeOfDay; // 0.0 to 1.0

uniform sampler2D uZenithGradient;
uniform sampler2D uHorizonGradient;

uniform vec3 uSunColor;

varying vec3 vWorldPosition;

void main() {
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
    vec3 sunDir = normalize(uSunPosition);

    // Sky Color from Gradient Textures
    vec2 gradientUv = vec2(uTimeOfDay, 0.5);
    vec3 zenithColor = texture2D(uZenithGradient, gradientUv).rgb;
    vec3 horizonColor = texture2D(uHorizonGradient, gradientUv).rgb;
    
    // Sky Gradient Calculation
    float zenithFactor = smoothstep(0.0, 1.0, rayDir.y);
    vec3 skyGradient = mix(horizonColor, zenithColor, zenithFactor);

    // Sun haze and disk
    float sunDot = dot(rayDir, sunDir);
    float sunHaze = smoothstep(0.9, 1.0, sunDot);
    vec3 finalColor = mix(skyGradient, uSunColor, sunHaze * sunHaze);
    float sunDisk = smoothstep(0.998, 1.0, sunDot);
    finalColor += uSunColor * sunDisk * 2.0;

    // RE-ADDED: Day/Night brightness fade
    float dayNightFade = smoothstep(-0.15, 0.1, sunDir.y);
    finalColor *= dayNightFade;

    // RE-ADDED: Horizon line blend to hide the void below the map
    vec3 groundColor = vec3(0.0, 0.0, 0.0);
    float horizonBlend = smoothstep(0.01, -0.01, rayDir.y);
    finalColor = mix(finalColor, groundColor, horizonBlend);
    
    // Final color processing
    finalColor *= uExposure;
    finalColor = finalColor / (finalColor + vec3(1.0));

    gl_FragColor = vec4(finalColor, 1.0);
}`;

// Helper function to create a gradient texture from color stops
function createGradientTexture(stops) {
    const size = 64; // Texture resolution
    const data = new Uint8Array(size * 4);
    const colors = stops.map(s => new THREE.Color(s.color));

    for (let i = 0; i < size; i++) {
        const t = i / (size - 1); // Progress along the gradient (0 to 1)
        let color = new THREE.Color();
        
        if (t <= stops[0].stop) {
            color = colors[0];
        } else if (t >= stops[stops.length-1].stop) {
            color = colors[stops.length-1];
        } else {
            for(let j = 0; j < stops.length - 1; j++) {
                if (t >= stops[j].stop && t < stops[j+1].stop) {
                    const localT = (t - stops[j].stop) / (stops[j+1].stop - stops[j].stop);
                    color = colors[j].clone().lerp(colors[j+1], localT);
                    break;
                }
            }
        }
        
        data[i * 4] = Math.floor(color.r * 255);
        data[i * 4 + 1] = Math.floor(color.g * 255);
        data[i * 4 + 2] = Math.floor(color.b * 255);
        data[i * 4 + 3] = 255;
    }
    return new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
}

export default class Atmosphere {
    constructor(scene) {
        const geometry = new THREE.SphereGeometry(10000, 32, 32);
        
        const zenithStops = [
            { stop: 0, color: '#02040A' },      // Midnight
            { stop: 6/24, color: '#050814' },   // 6am Sunrise: Black-blue
            { stop: 8/24, color: '#3A506B' },   // 8am: Dark blue
            { stop: 9/24, color: '#87CEEB' },   // 9am: Clear fresh morning blue
            { stop: 11/24, color: '#0077FF' },  // 11am-2pm: Polarizing midday blue
            { stop: 14/24, color: '#0077FF' },
            { stop: 15/24, color: '#3A506B' },  // 3pm-5pm: Blue orange evening (zenith is blue)
            { stop: 17/24, color: '#1C0B19' },  // 5pm-7pm: Darker blues (zenith is purple)
            { stop: 21/24, color: '#02040A' },  // 9pm Night
            { stop: 1, color: '#02040A' }       // Midnight
        ];
        
        const horizonStops = [
            { stop: 0, color: '#030A14' },      // Midnight
            { stop: 6/24, color: '#030A14' },   // 6am Sunrise: Black-blue
            { stop: 7/24, color: '#F08A5D' },   // 7am: Touches of orange
            { stop: 8/24, color: '#ADD8E6' },   // 8am: Light blue and orange
            { stop: 9/24, color: '#ADD8E6' },   // 9am: Clear light blue
            { stop: 11/24, color: '#BDE8F9' },  // 11am-2pm: Lighter blue
            { stop: 14/24, color: '#BDE8F9' },
            { stop: 15/24, color: '#FF4E50' },  // 3pm-5pm: Blue orange evening (horizon is orange)
            { stop: 17/24, color: '#FF4E50' },  // 5pm-7pm: Sunset oranges
            { stop: 21/24, color: '#030A14' },  // 9pm Night
            { stop: 1, color: '#030A14' }       // Midnight
        ];

        this.uniforms = {
            uSunPosition: { value: new THREE.Vector3() },
            uExposure: { value: 1.5 },
            uTimeOfDay: { value: 0 },
            uSunColor: { value: new THREE.Color('#FFFFFF') },
            uZenithGradient: { value: createGradientTexture(zenithStops) },
            uHorizonGradient: { value: createGradientTexture(horizonStops) }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.renderOrder = -1000;
        scene.add(this.mesh);
    }
    
    update(sunPosition, timeOfDay) {
        this.uniforms.uSunPosition.value.copy(sunPosition);
        this.uniforms.uTimeOfDay.value = timeOfDay;
    }
}
