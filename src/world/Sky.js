// File: src/world/Sky.js
import * as THREE from 'three';

export default class Sky {
    constructor(scene) {
        this.scene = scene;

        // Create lighting
        this.sun = new THREE.DirectionalLight(0xffffff, 1.5);
        this.sun.castShadow = true;
        this.moon = new THREE.DirectionalLight(0xaaaaff, 0.3);
        this.ambient = new THREE.HemisphereLight(0xffeebc, 0x444466, 0.6);
        this.scene.add(this.sun, this.moon, this.ambient);

        // Volumetric cloud layer
        const cloudGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
        this.cloudMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: 0.4 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                varying vec2 vUv;

                // A simple noise function
                float noise(vec2 uv) {
                    return fract(sin(dot(uv * 100.0 + time * 0.05, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    float n = noise(vUv);
                    gl_FragColor = vec4(vec3(1.0), opacity * smoothstep(0.4, 0.7, n));
                }
            `,
            transparent: true,
            depthWrite: false,
        });

        const clouds = new THREE.Mesh(cloudGeometry, this.cloudMaterial);
        clouds.rotation.x = -Math.PI / 2;
        clouds.position.y = 150;
        this.scene.add(clouds);

        // Day/Night cycle configuration
        this.cycleDuration = 6 * 60; // 6 minutes for a full cycle
    }

    update(time) {
        const cycleTime = time % this.cycleDuration;
        const phase = (cycleTime / this.cycleDuration) * 2 * Math.PI; // Full 2*PI cycle

        // Sun and moon position
        const sunY = Math.sin(phase) * 200;
        const sunX = Math.cos(phase) * 200;
        this.sun.position.set(sunX, sunY, 50);

        const moonY = Math.sin(phase + Math.PI) * 200;
        const moonX = Math.cos(phase + Math.PI) * 200;
        this.moon.position.set(moonX, moonY, 50);

        // Lighting intensity and scene background color
        if (sunY > -50) { // Daytime
            this.sun.intensity = 1.5 * Math.max(0, sunY / 200);
            this.moon.intensity = 0;
            this.scene.background = new THREE.Color(0x87CEEB).lerp(new THREE.Color(0x000022), 1 - Math.max(0, sunY / 200));
        } else { // Nighttime
            this.sun.intensity = 0;
            this.moon.intensity = 0.3;
            this.scene.background = new THREE.Color(0x000022);
        }

        // Cloud animation
        this.cloudMaterial.uniforms.time.value = time;
    }
}
