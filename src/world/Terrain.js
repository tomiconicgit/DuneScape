import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

// GLSL noise function that we will inject into the material's shader
const glsl_noise = `
    // 2D simplex noise function
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
`;

export default class Terrain {
    constructor(scene) {
        const size = 200;
        const resolution = 128;

        const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        geometry.rotateX(-Math.PI / 2);

        const simplex = new SimplexNoise();
        const positions = geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const largeDunes = simplex.noise(x * 0.01, z * 0.01) * 2.5;
            const mediumDunes = simplex.noise(x * 0.05, z * 0.05) * 0.5;
            const ripples = simplex.noise(x * 0.2, z * 0.2) * 0.25;
            positions.setY(i, largeDunes + mediumDunes + ripples);
        }
        geometry.computeVertexNormals();

        // MODIFIED: We no longer load a texture file
        const material = new THREE.MeshStandardMaterial({
            roughness: 0.8,
            metalness: 0.2
        });

        // MODIFIED: This function injects our procedural code into the standard material
        material.onBeforeCompile = (shader) => {
            // Add custom uniforms for our sand colors
            shader.uniforms.uSandColor1 = { value: new THREE.Color(0xec9e5c) };
            shader.uniforms.uSandColor2 = { value: new THREE.Color(0xd4884a) };
            shader.uniforms.uSandColor3 = { value: new THREE.Color(0xf7b777) };

            // Add the GLSL noise function to the top of the shader
            shader.fragmentShader = glsl_noise + shader.fragmentShader;

            // Replace the standard texture mapping with our procedural color logic
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `
                float noise = snoise(vUv * 20.0); // Use UV coordinates for the noise pattern
                vec3 sandColor = uSandColor1;
                
                // Mix in darker and lighter colors based on the noise
                if (noise > 0.3) {
                    sandColor = mix(sandColor, uSandColor2, (noise - 0.3) * 0.5);
                } else if (noise < -0.3) {
                    sandColor = mix(sandColor, uSandColor3, (-noise - 0.3) * 0.5);
                }

                // Apply the procedural color
                diffuseColor.rgb = sandColor;
                `
            );
        };

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
