import * as THREE from 'three';

const vertexShader = `
varying vec3 vWorldPosition;
void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uEdgeStart;
uniform float uEdgeEnd;
uniform float uTime;
uniform sampler2D uNoise;
varying vec3 vWorldPosition;

void main() {
    // 1. Fog based on distance from camera
    float dist = distance(vWorldPosition, cameraPosition);
    float distFactor = smoothstep(uFogNear, uFogFar, dist);

    // 2. Fog based on distance from the center of the map (the edges)
    float edgeDist = length(vWorldPosition.xz);
    float edgeFactor = smoothstep(uEdgeStart, uEdgeEnd, edgeDist);

    // 3. Animated swirling noise for a more dynamic feel
    vec2 noiseUV = vWorldPosition.xz * 0.005 + uTime * 0.02;
    float noise = texture(uNoise, noiseUV).r * 0.4; // Control noise intensity

    // Combine the factors: we want fog if it's far away OR at the edge
    float totalFog = max(distFactor, edgeFactor) + noise;
    
    // Clamp the final alpha value to be between 0.0 and 1.0
    float finalAlpha = clamp(totalFog, 0.0, 1.0);

    gl_FragColor = vec4(uFogColor, finalAlpha);
}`;

export default class Fog {
    constructor(scene) {
        // Use the same noise texture as the clouds for consistency
        const noiseTexture = new THREE.TextureLoader().load('https://unpkg.com/three@0.158.0/examples/textures/cloud.png');
        noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;

        // A very large plane to sit under the map
        const geometry = new THREE.PlaneGeometry(500, 500);
        
        this.uniforms = {
            uFogColor: { value: new THREE.Color('#030A14') }, // Match the night sky
            uFogNear: { value: 50.0 },  // Distance fog starts at 50 units
            uFogFar: { value: 150.0 }, // Distance fog is full at 150 units
            uEdgeStart: { value: 45.0 }, // Edge fog starts at radius of 45 (just inside the grid)
            uEdgeEnd: { value: 60.0 },   // Edge fog is full at radius of 60
            uTime: { value: 0.0 },
            uNoise: { value: noiseTexture }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = -0.5; // Sit just below the grid
        scene.add(this.mesh);
    }

    update(delta) {
        this.uniforms.uTime.value += delta;
    }
}
