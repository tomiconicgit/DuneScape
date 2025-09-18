// File: src/world/Landscape.js
import * as THREE from 'three';

export default class Landscape {
    constructor() {
        console.log("Initializing new landscape design...");
        const size = 500;
        const segments = 256;

        this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        this.geometry.rotateX(-Math.PI / 2);

        const duneAmp = 2.5;
        const rippleAmp = 0.4;
        const rippleFreq = 0.12;

        const positions = this.geometry.attributes.position;
        this.baseY = [];
        this.trailMask = new Float32Array(positions.count); // for shader

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            let dune = Math.sin(x * 0.005) * Math.cos(z * 0.005) * duneAmp;
            let ripple = Math.sin(x * rippleFreq) * Math.sin(z * rippleFreq) * rippleAmp;
            let y = dune + ripple;

            // Zones
            if (x < 0 && z > 0 && x > -250 && z < 250) {
                if (x > -250 + 110 && x < -250 + 140 && z > 100 && z < 150) y = 0;
            }
            if (x < 0 && z < 0 && x > -250 && z > -250) {
                if (x > -200 && x < -150 && z > -200 && z < -130) y = 0;
            }
            if (x > 0 && z < 0 && x < 250 && z > -250) {
                if (x > 80 && x < 120 && z > -160 && z < -80) y = -1.5;
            }

            // Trail carve
            const trail = this.isOnTrail(x, z);
            if (trail) {
                y -= 1.2;
                this.trailMask[i] = 1.0; // mark for shader
            } else {
                this.trailMask[i] = 0.0;
            }

            this.baseY.push(y);
            positions.setY(i, y);
        }

        this.geometry.setAttribute('trailMask', new THREE.BufferAttribute(this.trailMask, 1));
        this.geometry.computeVertexNormals();

        // Shader material with trail overlay
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0xeed9b6) },
                trailColor: { value: new THREE.Color(0xccaa88) },
            },
            vertexShader: `
                attribute float trailMask;
                varying vec2 vUv;
                varying float vTrail;
                void main() {
                    vUv = uv;
                    vTrail = trailMask;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform vec3 trailColor;
                varying vec2 vUv;
                varying float vTrail;

                void main() {
                    float shimmer = sin(vUv.x * 20.0 + time * 2.0) * 0.05;
                    vec3 color = mix(baseColor, trailColor, vTrail);
                    color += vTrail * shimmer;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.receiveShadow = true;
    }

    isOnTrail(x, z) {
        const trailWidth = 6;
        if (x < -150 && z < 150 && z > -150) return true;
        if (z < -130 && x > -150 && x < 100) return true;
        if (x > 100 && z > -80 && z < 100) return true;
        return false;
    }

    update(time) {
        const positions = this.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const wind = Math.sin(x * 0.05 + time * 0.5) * Math.cos(z * 0.05 + time * 0.5) * 0.2;
            positions.setY(i, this.baseY[i] + wind);
        }
        positions.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.material.uniforms.time.value = time;
    }
}
