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

// ✨ ADDED: GLSL shader code for procedural texturing
const rockShader = {
  uniforms: {
    uTopColor: { value: new THREE.Color(0xaaaaaa) },
    uBottomColor: { value: new THREE.Color(0x666666) },
    uTextureScale: { value: 10.0 },
    uWetness: { value: 0.0 },
  },
  shader: `
    // GLSL noise function (ported from webgl-noise)
    float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
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
    
    // Varyings and Uniforms to be injected
    varying vec3 vWorldPosition;
    uniform vec3 uTopColor;
    uniform vec3 uBottomColor;
    uniform float uTextureScale;
    uniform float uWetness;
  `
};

export function createProceduralRock({
  radius = 1,
  detail = 3,
  roughness = 0.5,
  noiseScale = 0.8,
  seed = Math.random(),
  // ✨ CHANGED: Parameters now control the shader
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
  
  // Pass height data to shader via vertex attributes
  const heightData = [];
  for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      heightData.push((y - minY) / (maxY - minY + 0.001)); // Normalized height
  }
  geometry.setAttribute('aHeight', new THREE.Float32BufferAttribute(heightData, 1));

  geometry.computeVertexNormals();

  // ✨ CHANGED: Material is now driven by a custom shader via onBeforeCompile
  const material = new THREE.MeshStandardMaterial({
    metalness: metalness,
    roughness: 0.8, // Base roughness
    flatShading: true, // Flat shading is now handled by geometry normals
  });
  
  // Store custom uniforms for easy access later
  material.userData.uniforms = rockShader.uniforms;
  material.userData.uniforms.uTopColor.value.set(topColor);
  material.userData.uniforms.uBottomColor.value.set(bottomColor);
  material.userData.uniforms.uTextureScale.value = textureScale;
  material.userData.uniforms.uWetness.value = wetness;

  material.onBeforeCompile = shader => {
    // Link our custom uniforms to the compiled shader
    shader.uniforms.uTopColor = material.userData.uniforms.uTopColor;
    shader.uniforms.uBottomColor = material.userData.uniforms.uBottomColor;
    shader.uniforms.uTextureScale = material.userData.uniforms.uTextureScale;
    shader.uniforms.uWetness = material.userData.uniforms.uWetness;

    // Inject varyings and attributes
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

    // Inject the main procedural texturing code
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
      
      // Apply wetness by reducing roughness
      // A wet surface is smooth (low roughness)
      float finalRoughness = roughnessFactor * (1.0 - uWetness);
      
      // Add wet patches using noise for more realism
      float wetNoise = snoise(vWorldPosition * 2.0) * 0.5 + 0.5;
      if (wetNoise > 0.8) {
          finalRoughness *= (1.0 - uWetness * 0.9); // Make patches extra smooth
      }
      
      // Output to PBR channels
      gl_FragColor = vec4(diffuseColor.rgb, 1.0);
      
      // We are replacing the rest of the PBR calculations, so use a return
      // The below are simplified PBR outputs
      vec4 outColor = vec4(diffuseColor.rgb, 1.0);
      #include <premultiplied_alpha_fragment>
      #include <tonemapping_fragment>
      #include <encodings_fragment>
      gl_FragColor = outColor;
      return; // Stop further processing by three.js default shader
      `
    ).replace(
        `#include <roughnessmap_fragment>`,
        `
        float finalRoughness = roughness * (1.0 - uWetness);
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
