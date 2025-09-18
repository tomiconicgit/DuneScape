// File: src/world/assets/rock.js
import * as THREE from 'three';

// A small JS library to mimic GLSL vector math for porting the SDF
const GLSL = {
    vec3: (x, y, z) => new THREE.Vector3(x, y, z),
    add: (a, b) => a.clone().add(b),
    sub: (a, b) => a.clone().sub(b),
    mul: (a, s) => a.clone().multiplyScalar(s),
    div: (a, s) => a.clone().divideScalar(s),
    abs: (a) => new THREE.Vector3(Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)),
    min: (a, b) => Math.min(a, b),
    max: (a, b) => Math.max(a, b),
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    fract: (n) => n - Math.floor(n),
    hash11: (p) => GLSL.fract(Math.sin(p * 727.1) * 435.545),
    noise_3: (p) => {
        const i = new THREE.Vector3(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
        const f = p.clone().sub(i);
        const u = f.clone().multiply(f).multiply(GLSL.sub(GLSL.vec3(3,3,3), GLSL.mul(f, 2.0)));
        const a = GLSL.hash11(i.x + i.y * 157.0 + 113.0 * i.z);
        const b = GLSL.hash11(i.x + 1.0 + i.y * 157.0 + 113.0 * i.z);
        const c = GLSL.hash11(i.x + i.y * 157.0 + 113.0 * i.z + 1.0);
        const d = GLSL.hash11(i.x + 1.0 + i.y * 157.0 + 113.0 * i.z + 1.0);
        return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u.x), THREE.MathUtils.lerp(c, d, u.x), u.z);
    },
    fbm: (p, octaves) => {
        let a = 0.0;
        let v = 0.5;
        for (let i = 0; i < octaves; i++) {
            a += GLSL.noise_3(p) * v;
            p.multiplyScalar(2.0);
            v *= 0.5;
        }
        return a;
    }
};

// Ported SDF (Signed Distance Function) from the "Wet stone" shader
function map(p, displacement) {
    let d = p.length() - 1.0;
    d += GLSL.fbm(GLSL.add(p, GLSL.vec3(0, 0, 0)), 5) * displacement;
    return d;
}

const rockShader = {
    shader: `
    varying vec3 vWorldPosition;
    varying vec3 vObjectNormal;

    uniform vec2 uAoParam;
    uniform vec2 uCornerParam;
    uniform float uLightIntensity;

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
        return 1.0 - clamp(ao * invSamples, 0.0, 1.0);
    }
  `
};

export function createProceduralRock({
  radius = 1,
  detail = 7,
  displacement = 0.4,
  seed = Math.random(),
  aoParam = new THREE.Vector2(1.2, 3.5),
  cornerParam = new THREE.Vector2(0.25, 40.0),
  lightIntensity = 0.25,
  metalness = 0.1,
} = {}) {
  // ✨ FIX: Drastically reduced segment count to prevent browser freezing on startup.
  const geometry = new THREE.SphereGeometry(radius, detail * 8, detail * 4);
  geometry.deleteAttribute('uv');
  
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;

  for (let i = 0; i < position.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(position, i);
    const d = map(GLSL.div(p, radius), displacement);
    const n = new THREE.Vector3().fromBufferAttribute(normal, i);
    p.add(n.multiplyScalar(d * radius));
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
      uLightIntensity: { value: lightIntensity },
  };

  material.onBeforeCompile = shader => {
    shader.uniforms.uAoParam = material.userData.uniforms.uAoParam;
    shader.uniforms.uCornerParam = material.userData.uniforms.uCornerParam;
    shader.uniforms.uLightIntensity = material.userData.uniforms.uLightIntensity;

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
      
      // Base colors from the original shader
      vec3 orange = vec3(1.0, 0.67, 0.43);
      vec3 blue = vec3(0.54, 0.77, 1.0);
      
      // Calculate AO and corner highlights
      float ao = calcAO(vWorldPosition * 0.2, vObjectNormal);
      float corner = pow(clamp(dot(vObjectNormal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0), uCornerParam.y) * uCornerParam.x;
      
      // ✨ FIX: Simplified lighting model.
      // We now provide a base texture, and let Three.js handle the actual lighting from scene lights.
      vec3 baseColor = mix(blue, orange, vObjectNormal.y * 0.5 + 0.5);
      
      // Apply AO and highlights to the base material color
      vec3 finalColor = baseColor * ao * uLightIntensity + (corner * uLightIntensity);

      diffuseColor.rgb *= finalColor; // Multiply with existing color to blend with PBR material
      `
    );
  };
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}
