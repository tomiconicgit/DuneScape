import * as THREE from 'three';

// --- Rock Settings ---
const ROCK_COUNT = 60; // Total number of rocks
const DEFORMATION_STRENGTH = 0.3; // How much the noise affects the shape
const NOISE_SCALE = 1.5; // How detailed the rock shape is

export default class Rocks {
    constructor(scene, mineArea) {
        this.scene = scene;
        this.mineArea = mineArea;

        // --- Texture Loading ---
        // We will load a set of high-quality PBR textures for a realistic look.
        // These are loaded once and reused for all rocks.
        const textureLoader = new THREE.TextureLoader();
        
        // Textures from ambientCG.com (CC0 licensed)
        const rockColorMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Rock035_1K_Color.jpg');
        const rockNormalMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Rock035_1K_NormalGL.jpg');
        const rockRoughnessMap = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/Fifa-Soccer-Class-2022@3a45c34/public/img/Rock035_1K_Roughness.jpg');

        // --- Materials for different ore types ---
        // They all share the same detail textures but have different base colors.
        const materials = {
            stone: new THREE.MeshStandardMaterial({
                map: rockColorMap,
                normalMap: rockNormalMap,
                roughnessMap: rockRoughnessMap,
                color: 0x999999 // A neutral grey to blend with the texture
            }),
            iron: new THREE.MeshStandardMaterial({
                map: rockColorMap,
                normalMap: rockNormalMap,
                roughnessMap: rockRoughnessMap,
                color: 0x8E574A, // Tinted rusty red
                metalness: 0.2
            }),
            carbon: new THREE.MeshStandardMaterial({
                map: rockColorMap,
                normalMap: rockNormalMap,
                roughnessMap: rockRoughnessMap,
                color: 0x444444 // Tinted dark charcoal
            }),
            limestone: new THREE.MeshStandardMaterial({
                map: rockColorMap,
                normalMap: rockNormalMap,
                roughnessMap: rockRoughnessMap,
                color: 0xE5E4D7 // Tinted off-white
            })
        };
        const oreTypes = Object.keys(materials);

        // --- Generate and Place Rocks ---
        for (let i = 0; i < ROCK_COUNT; i++) {
            // 1. Create a base IcosahedronGeometry for a more natural starting shape
            const baseGeometry = new THREE.IcosahedronGeometry(1, 1);

            // 2. Deform the vertices with a noise function for a unique, organic shape
            const positionAttribute = baseGeometry.attributes.position;
            const tempVector = new THREE.Vector3();
            const noise = new SimplexNoise(); // Create a noise generator

            for (let j = 0; j < positionAttribute.count; j++) {
                tempVector.fromBufferAttribute(positionAttribute, j);
                
                // Get a noise value based on the vertex's original position
                const noiseValue = noise.noise3D(
                    tempVector.x * NOISE_SCALE,
                    tempVector.y * NOISE_SCALE,
                    tempVector.z * NOISE_SCALE
                );

                // Push the vertex outwards along its normal by the noise amount
                tempVector.add(tempVector.clone().normalize().multiplyScalar(noiseValue * DEFORMATION_STRENGTH));
                
                positionAttribute.setXYZ(j, tempVector.x, tempVector.y, tempVector.z);
            }
            baseGeometry.computeVertexNormals(); // Essential for correct lighting

            // 3. Select a random ore type and its material
            const type = oreTypes[Math.floor(Math.random() * oreTypes.length)];
            const material = materials[type];

            // 4. Create the mesh
            const rockMesh = new THREE.Mesh(baseGeometry, material);

            // 5. Apply random scale, rotation, and position
            const scale = THREE.MathUtils.randFloat(0.8, 3.5);
            rockMesh.scale.set(
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3),
                scale * THREE.MathUtils.randFloat(0.7, 1.3)
            );
            
            rockMesh.position.set(
                mineArea.x + (Math.random() - 0.5) * mineArea.width,
                mineArea.height,
                mineArea.y + (Math.random() - 0.5) * mineArea.depth
            );

            rockMesh.geometry.computeBoundingBox();
            const rockHeight = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
            rockMesh.position.y += (rockHeight * rockMesh.scale.y) / 2 - 0.1; // Settle it into the sand slightly

            rockMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            this.scene.add(rockMesh);
        }
    }
}

// A standalone Simplex Noise implementation since it's not in the core Three.js
class SimplexNoise {
  constructor(r = Math) {
    this.grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(r.random() * 256);
    }
    this.perm = [];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  noise3D(xin, yin, zin) {
    let n0, n1, n2, n3;
    const F3 = 1 / 3;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1 / 6;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    let i1, j1, k1;
    let i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
    const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
    const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0); }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1); }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2); }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0;
    else { t3 *= t3; n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3); }
    return 32 * (n0 + n1 + n2 + n3);
  }
}
