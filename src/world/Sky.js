// File: src/world/Sky.js
import * as THREE from 'three';

export default class Sky {
    constructor(scene, lighting) {
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;

            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;

        const uniforms = {
            topColor:    { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset:      { value: 0 },
            exponent:    { value: 0.6 }
        };

        // Link the sky color to the hemisphere light color
        uniforms.topColor.value.copy(lighting.hemiLight.color);

        // Set up scene fog to match the sky
        scene.fog = new THREE.Fog(scene.background, 1, 5000);
        scene.fog.color.copy(uniforms.bottomColor.value);

        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        scene.add(sky);
    }
    
    // This sky is static, so the update function is empty for now
    update(time) {
        // No animation in this version
    }
}
