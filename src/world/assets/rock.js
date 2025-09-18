// File: src/world/assets/rock.js
import * as THREE from 'three';

// Stable Simplex Noise for geometry deformation.
class SimplexNoise {
  constructor(seed = 0) {
    this.p = new Uint8Array(512);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 0; i < 256; i++) {
      const r = i + Math.floor(Math.sin(seed + i) * 128 + 128) % (256 - i);
      [this.p[i], this.p[r]] = [this.p[r], this.p[i]];
    }
    for (let i = 0; i < 256; i++) this.p[i + 256] = this.p[i];
  }

  noise3D(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = this.fade(x), v = this.fade(y), w = this.fade(z);
    const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z,
          B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;
    return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
                                     this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))),
                       this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                                     this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

// GLSL shader code for the "Wet stone" visual style
const rockShader = {
    shader: `
    varying vec3 vWorldPosition;
    varying vec3 vObjectNormal;

    uniform vec2 uAoParam;
    uniform vec2 uCornerParam;
    
    // GLSL functions ported from target shader
    float hash11(float p) { return fract(sin(p * 727.1)*435.545); }
    vec3 hash31(float p) {
        vec3 h = vec3(127.231, 491.7, 718.423) * p;
        return fract(sin(h)*435.543);
    }
    float noise_3(in vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash11(i.x+i.y*157.0+113.0*i.z),hash11(i.x+1.0+i.y*157.0+113.0*i.z),u.x),
                       mix(hash11(i.x+i.y*157.0+113.0*i.z+1.0),hash11(i.x+1.0+i.y*157.0+113.0*i.z+1.0),u.x),u.z),
                   mix(mix(hash11(i.x+i.y*157.0+113.0*i.z+157.0),hash11(i.x+1.0+i.y*157.0+113.0*i.z+157.0),u.x),
                       mix(hash11(i.x+i.y*157.0+113.0*i.z+1.0+157.0),hash11(i.x+1.0+i.y*157.0+113.0*i.z+1.0+157.0),u.x),u.z),u.y);
    }
    float fbm(vec3 p, int octaves) {
        float a = 0.0;
        float v = 0.5;
        for (int i = 0; i < octaves; i++) {
            a += noise_3(p)*v;
            p *= 2.0;
            v *= 0.5;
        }
        return a;
    }
    // Ambient Occlusion approximation for a mesh
    float calcAO(vec3 p, vec3 n) {
        float ao = 0.0;
        float invSamples = 1.0 / 4.0;
        for (int i = 0; i < 4; i++) {
            vec3 dir = reflect(hash31(float(i)*10.0), n);
            dir = normalize(mix(dir, n, 0.5));
            float d = fbm(p + dir * uAoParam.x, 3) * uAoParam.y;
            ao += d;
        }
        return 1.0 - clamp(ao * invSamples * 0.5, 0.0, 1.0); // FIX: Scaled down AO effect
    }
  `
};

export function createProceduralRock({
  radius = 1,
  detail = 7,
  displacement = 0.4,
  seed = Math.random(),
  aoParam = new THREE.Vector2(0.8, 1.5), // FIX: Tuned default AO params
  cornerParam = new THREE.Vector2(0.25, 40.0),
  metalness = 0.1,
} = {}) {
  
  const geometry = new THREE.SphereGeometry(radius, detail * 8, detail * 4);
  geometry.deleteAttribute('uv');
  
  const position = geometry.attributes.position;
  const deformNoise = new SimplexNoise(seed);

  // Apply FBM noise displacement for a detailed and stable shape
  for (let i = 0; i < position.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(position, i);
    const n = p.clone().normalize();
    let noiseValue = 0;
    let frequency = 1.5;
    let amplitude = 0.5;
    for(let j = 0; j < 5; j++) {
        noiseValue += deformNoise.noise3D(p.x * frequency, p.y * frequency, p.z * frequency) * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    p.add(n.multiplyScalar(noiseValue * displacement * radius));
    position.setXYZ(i, p.x, p.y, p.z);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    metalness: metalness,
    roughness: 0.2,
    flatShading: false,
  });

  material.userData.uniforms = {
      uAoParam: { value: aoParam },
      uCornerParam: { value: cornerParam },
  };

  material.onBeforeCompile = shader => {
    shader.uniforms.uAoParam = material.userData.uniforms.uAoParam;
    shader.uniforms.uCornerParam = material.userData.uniforms.uCornerParam;
    
    shader.vertexShader = `
      varying vec3 vWorldPosition;
      varying vec3 vObjectNormal;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
       vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
       vObjectNormal = normal;
      `
    );

    shader.fragmentShader = `
      ${rockShader.shader}
      ${shader.fragmentShader}
    `.replace(
      `#include <color_fragment>`,
      `#include <color_fragment>
      
      // ✨ FIX: Complete rewrite of the final color calculation.
      // This version is simpler, more stable, and works correctly with PBR lighting.
      
      // 1. Define base colors
      vec3 color_dark = vec3(0.1, 0.1, 0.15); // Dark crevice color
      vec3 color_base = vec3(0.4, 0.4, 0.45); // Main rock color
      vec3 color_highlight = vec3(0.8, 0.85, 0.9); // Highlight color

      // 2. Calculate Ambient Occlusion to find crevices
      float ao = calcAO(vWorldPosition * 0.2, vObjectNormal);
      
      // 3. Calculate a simple top-down highlight (like from the sky)
      float highlight = pow(clamp(dot(vObjectNormal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0), 2.0);

      // 4. Blend the colors
      // Start with the base color
      vec3 finalColor = color_base;
      // Darken the crevices using AO
      finalColor = mix(color_dark, finalColor, ao);
      // Add highlights to the top surfaces
      finalColor = mix(finalColor, color_highlight, highlight * 0.5);
      
      // 5. Assign the final color. The scene's lights will illuminate this.
      diffuseColor.rgb = finalColor;
      `
    );
  };
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}
