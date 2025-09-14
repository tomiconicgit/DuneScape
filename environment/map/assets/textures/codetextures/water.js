import * as THREE from 'three';

/**
 * Creates a procedural water material with minimal waves and reflection.
 * @returns {THREE.ShaderMaterial} The water material.
 */
export function createWaterMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vUv = uv;
                vNormal = normal;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                float wave = sin(vUv.x * 10.0 + time * 0.5) * 0.02 + sin(vUv.y * 10.0 + time * 0.5) * 0.02;
                vec3 color = vec3(0.0, 0.5, 1.0) + wave;
                vec3 viewDir = normalize(vViewPosition);
                float fresnel = pow(1.0 - dot(vNormal, viewDir), 3.0);
                gl_FragColor = vec4(mix(color, vec3(1.0), fresnel * 0.5), 1.0);
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
    });
}