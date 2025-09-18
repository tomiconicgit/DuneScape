// File: src/world/assets/rock.js
import * as THREE from 'three';

// Simplex noise generator (for mesh deformation)
class SimplexNoise {
  constructor(seed = 0) {
    this.p = new Uint8Array(512);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 0; i < 256; i++) {
      const r = i + Math.floor(seed * 256) % (256 - i);
      [this.p[i], this.p[r]] = [this.p[r], this.p[i]];
    }
    for (let i = 0; i < 256; i++) this.p[i + 256] = this.p[i];
  }

  noise3D(x, y, z) {
    return Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453 % 1;
  }
}

// ✨ CHANGED: Updated the shader code to fix errors and improve integration
const rockShader = {
  uniforms: {
    uTopColor: { value: new THREE.Color(0xaaaaaa) },
    uBottomColor: { value: new THREE.Color(0x666666) },
    uTextureScale: { value: 10.0 },
    uWetness: { value: 0.0 },
  },
  shader: `
    // Varyings and Uniforms to be injected
    varying vec3 vWorldPosition;
    varying float vHeight; // <-- FIX: Added missing varying for fragment shader
    uniform vec3 uTopColor;
    uniform vec3 uBottomColor;
    uniform float uTextureScale;
    uniform float uWetness;
  
    // GLSL noise function (ported from webgl-noise)
    float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; } // <-- FIX: Added missing vec3 overload
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
  `
};

export function createProceduralRock({
  radius = 1,
  detail = 3,
  roughness = 0.5,
  noiseScale = 0.8,
  seed = Math.random(),
  topColor = 0xaaaaaa,
  bottomColor = 0x666666,
  textureScale = 10.0,
  wetness = 0.0,
  metalness = 0.0,
} = {}) {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const position = geometry.attributes.position;
  const deformNoise = new SimplexNoise(seed);

  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < position.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(position, i);
    if (vertex.y < 0) vertex.y = 0;

    const n = deformNoise.noise3D(vertex.x * noiseScale, vertex.y * noiseScale, vertex.z * noiseScale);
    vertex.multiplyScalar(1 + n * roughness);
    
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);

    if (vertex.y < minY) minY = vertex.y;
    if (vertex.y > maxY) maxY = vertex.y;
  }
  
  const heightData = [];
  for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      heightData.push((y - minY) / (maxY - minY + 0.001));
  }
  geometry.setAttribute('aHeight', new THREE.Float32BufferAttribute(heightData, 1));

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    metalness: metalness,
    roughness: 0.8, 
    flatShading: true,
  });
  
  material.userData.uniforms = rockShader.uniforms;
  material.userData.uniforms.uTopColor.value.set(topColor);
  material.userData.uniforms.uBottomColor.value.set(bottomColor);
  material.userData.uniforms.uTextureScale.value = textureScale;
  material.userData.uniforms.uWetness.value = wetness;

  material.onBeforeCompile = shader => {
    shader.uniforms.uTopColor = material.userData.uniforms.uTopColor;
    shader.uniforms.uBottomColor = material.userData.uniforms.uBottomColor;
    shader.uniforms.uTextureScale = material.userData.uniforms.uTextureScale;
    shader.uniforms.uWetness = material.userData.uniforms.uWetness;

    shader.vertexShader = `
      varying vec3 vWorldPosition;
      attribute float aHeight;
      varying float vHeight;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
       vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
       vHeight = aHeight;
      `
    );

    shader.fragmentShader = `
      ${rockShader.shader}
      ${shader.fragmentShader}
    `.replace(
      `#include <color_fragment>`,
      `#include <color_fragment>
      
      // Procedural texture based on world position
      float noise = snoise(vWorldPosition * uTextureScale * 0.1) * 0.5 + 0.5;
      
      // Height-based color gradient
      vec3 heightGradient = mix(uBottomColor, uTopColor, vHeight);
      
      // Mix gradient with noise for a textured look
      vec3 finalColor = mix(heightGradient * 0.6, heightGradient * 1.2, noise);
      diffuseColor.rgb = finalColor;
      `
    ).replace(
        `#include <roughnessmap_fragment>`,
        `
        // Base roughness is taken from the material
        float finalRoughness = roughness;

        // Apply wetness by reducing roughness (a wet surface is smooth)
        finalRoughness *= (1.0 - uWetness);
        
        // Add wet patches using noise for more realism
        float wetNoise = snoise(vWorldPosition * 2.0) * 0.5 + 0.5;
        if (wetNoise > 0.8) {
            finalRoughness *= (1.0 - uWetness * 0.9); // Make patches extra smooth
        }
        
        roughnessFactor = finalRoughness;
        `
    );
  };
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}
