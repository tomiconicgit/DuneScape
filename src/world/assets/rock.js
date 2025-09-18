// File: src/world/assets/rock.js
// rock.js — Procedural rock mesh with flat base
import * as THREE from 'three';

// Simplex noise generator (inline, zero dependency)
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
    // Basic 3D noise approximation (fast, not perfect)
    return Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453 % 1;
  }
}

// ✨ CHANGED: Function now accepts a single config object with more parameters
export function createProceduralRock({
  radius = 1,
  detail = 3,
  roughness = 0.5,
  noiseScale = 0.8,
  seed = Math.random(),
  color = 0x888888,
  materialRoughness = 1,
  metalness = 0,
  flatShading = true
} = {}) {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const position = geometry.attributes.position;
  const noise = new SimplexNoise(seed);

  for (let i = 0; i < position.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(position, i);

    // Flatten bottom: push vertices below Y=0 up to Y=0
    if (vertex.y < 0) vertex.y = 0;

    // Apply noise-based displacement for roughness
    const n = noise.noise3D(vertex.x * noiseScale, vertex.y * noiseScale, vertex.z * noiseScale);
    vertex.multiplyScalar(1 + n * roughness);

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: materialRoughness,
    metalness: metalness,
    flatShading: flatShading
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}
