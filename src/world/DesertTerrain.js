import * as THREE from 'three';

// ... (PerlinNoise class is unchanged) ...
class PerlinNoise { constructor(seed = Math.random()) { this.seed = seed; this.perm = new Array(512); this.gradP = new Array(512); const p = new Array(256); for (let i = 0; i < 256; i++) { p[i] = Math.floor(seed * 10000 + i) % 256; } for (let i = 0; i < 512; i++) { this.perm[i] = p[i & 255]; this.gradP[i] = this.gradients[this.perm[i] % 12]; } } gradients = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]]; fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); } lerp(a, b, t) { return (1 - t) * a + t * b; } grad(hash, x, y, z) { const g = this.gradP[hash]; return g[0] * x + g[1] * y + g[2] * z; } noise(x, y, z = 0) { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255; x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z); const u = this.fade(x), v = this.fade(y), w = this.fade(z); const A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z; const B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z; return this.lerp(this.lerp(this.lerp(this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z), u), this.lerp(this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z), u), v), this.lerp(this.lerp(this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1), u), this.lerp(this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1), u), v), w); } }

export class DesertTerrain {
    constructor(scene, townDimensions) {
        this.scene = scene;
        this.townDimensions = townDimensions;
        const townSize = Math.max(townDimensions.width, townDimensions.length);
        const desertSize = Math.max(5000, townSize * 25);
        this.config = {
            size: desertSize, resolution: 196, cactiCount: 120,
            noiseScale: { base: 0.0003, dunes: 0.0008, secondaryDunes: 0.0015, ridges: 0.003, detail: 0.01, flat: 0.0003, microRipples: 0.04, sandGrains: 0.3 },
            heightScale: { base: 15, dunes: 40, secondaryDunes: 20, ridges: 10, detail: 8, microRipples: 2.0, sandGrains: 0.3 },
            duneDirection: Math.PI * 0.25, sandColors: [new THREE.Color(0xec9e5c), new THREE.Color(0xd4884a), new THREE.Color(0xf7b777), new THREE.Color(0xb7703e), new THREE.Color(0xffc890)],
            dunes: { smoothing: true, smoothingFactor: 0.7, ridgeSharpness: 0.4 }, townBuffer: townSize * 1.2
        };
        console.log(`Creating desert terrain with size ${desertSize} around town of size ${townSize}`);
        this.baseNoise = new PerlinNoise(Math.random()); this.duneNoise = new PerlinNoise(Math.random() + 100); this.secondaryDuneNoise = new PerlinNoise(Math.random() + 150); this.ridgeNoise = new PerlinNoise(Math.random() + 175); this.detailNoise = new PerlinNoise(Math.random() + 200); this.colorNoise = new PerlinNoise(Math.random() + 300); this.microRipplesNoise = new PerlinNoise(Math.random() + 400); this.sandGrainsNoise = new PerlinNoise(Math.random() + 500);
    }
    // ... (getDirectionalDuneHeight, isNearTrainTrack, getTownBlendFactor methods are unchanged)
    getDirectionalDuneHeight(x, z) { const direction = this.config.duneDirection; const rotX = x * Math.cos(direction) + z * Math.sin(direction); const rotZ = -x * Math.sin(direction) + z * Math.cos(direction); const duneHeight = this.duneNoise.noise(rotX * this.config.noiseScale.dunes, rotZ * this.config.noiseScale.dunes * 0.5) * this.config.heightScale.dunes; const secondaryHeight = this.secondaryDuneNoise.noise(rotX * this.config.noiseScale.secondaryDunes, rotZ * this.config.noiseScale.secondaryDunes) * this.config.heightScale.secondaryDunes; const ridges = this.ridgeNoise.noise(rotX * this.config.noiseScale.ridges, rotZ * this.config.noiseScale.ridges); let ridgeHeight; if (this.config.dunes.smoothing) { const smoothedRidge = (Math.abs(ridges * 2 - 1)); const smoothingPower = 1.0 + this.config.dunes.smoothingFactor * 2.0; ridgeHeight = Math.pow(smoothedRidge, smoothingPower) * this.config.heightScale.ridges; ridgeHeight *= this.config.dunes.ridgeSharpness; } else { ridgeHeight = (Math.abs(ridges * 2 - 1)) * this.config.heightScale.ridges; } return duneHeight + secondaryHeight + ridgeHeight; }
    isNearTrainTrack(x, z) { return false; /* Simplified */ }
    getTownBlendFactor(x, z) { const distFromTown = Math.sqrt(x * x + z * z); if (distFromTown < this.config.townBuffer) { return 0; } else if (distFromTown < this.config.townBuffer * 1.5) { const transitionFactor = (distFromTown - this.config.townBuffer) / (this.config.townBuffer * 0.5); return Math.pow(transitionFactor, 2.0); } else { return 1.0; } }
    
    generateTerrain() {
        const normalMapTexture = this.createSandNormalMap();
        const geometry = new THREE.PlaneGeometry(this.config.size, this.config.size, this.config.resolution, this.config.resolution);
        geometry.rotateX(-Math.PI / 2);
        const vertices = geometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i], z = vertices[i + 2];
            const townBlend = this.getTownBlendFactor(x, z);
            let height = this.baseNoise.noise(x * this.config.noiseScale.base, z * this.config.noiseScale.base) * this.config.heightScale.base;
            height += this.getDirectionalDuneHeight(x, z) * townBlend;
            const detailHeight = this.detailNoise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;
            height += detailHeight * Math.min(1, height / 20) * townBlend;
            const windDirection = this.config.duneDirection;
            const alignedX = x * Math.cos(windDirection) + z * Math.sin(windDirection), alignedZ = -x * Math.sin(windDirection) + z * Math.cos(windDirection);
            const microRipples = this.microRipplesNoise.noise(alignedX * this.config.noiseScale.microRipples, alignedZ * this.config.noiseScale.microRipples * 5) * this.config.heightScale.microRipples;
            const secondaryRipples = this.microRipplesNoise.noise(alignedX * this.config.noiseScale.microRipples * 2, alignedZ * this.config.noiseScale.microRipples * 7) * this.config.heightScale.microRipples * 0.4;
            const sandGrains = this.sandGrainsNoise.noise(x * this.config.noiseScale.sandGrains, z * this.config.noiseScale.sandGrains) * this.config.heightScale.sandGrains;
            height += (microRipples + secondaryRipples + sandGrains) * townBlend;
            const flatArea = this.baseNoise.noise(x * this.config.noiseScale.flat + 500, z * this.config.noiseScale.flat + 500);
            if (flatArea > 0.6 && townBlend > 0.8) { height *= 0.2; }
            vertices[i + 1] = height;
            
            const colorNoise = this.colorNoise.noise(x * this.config.noiseScale.base * 2, z * this.config.noiseScale.base * 2);
            let slope = 0; if (i > 3 && i < vertices.length - 3) { const prevHeight = vertices[i - 2], nextHeight = vertices[i + 4]; slope = Math.abs(nextHeight - prevHeight) / 2; }
            const heightFactor = Math.max(0, Math.min(1, (height + 10) / 80));
            let finalColor = this.config.sandColors[0].clone();
            if (heightFactor < 0.5) { finalColor.lerp(this.config.sandColors[1], 0.5 - heightFactor); }
            if (heightFactor > 0.5) { finalColor.lerp(this.config.sandColors[2], (heightFactor - 0.5) * 2); }
            if (colorNoise > 0) { finalColor.lerp(this.config.sandColors[4], colorNoise * 0.3); } else { finalColor.lerp(this.config.sandColors[3], -colorNoise * 0.3); }
            if (slope > 0.2) { const slopeFactor = Math.min(1, (slope - 0.2) * 5); finalColor.lerp(this.config.sandColors[3], slopeFactor * 0.5); }
            const microDetail = microRipples / this.config.heightScale.microRipples;
            if (microDetail > 0.3) { finalColor.lerp(this.config.sandColors[4], (microDetail - 0.3) * 0.2); } else if (microDetail < -0.3) { finalColor.lerp(this.config.sandColors[3], Math.abs(microDetail + 0.3) * 0.2); }
            
            const colorIdx = i; colors[colorIdx] = finalColor.r; colors[colorIdx + 1] = finalColor.g; colors[colorIdx + 2] = finalColor.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        const sandMaterial = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 0, specular: new THREE.Color(0x000000), normalMap: normalMapTexture, normalScale: new THREE.Vector2(1.2, 1.2) });
        this.terrainMesh = new THREE.Mesh(geometry, sandMaterial);
        this.terrainMesh.receiveShadow = true; this.terrainMesh.castShadow = true;
        this.terrainMesh.position.y = -0.05;
        this.scene.add(this.terrainMesh);
        return this.terrainMesh;
    }
    // ... (createSandNormalMap is unchanged)
    createSandNormalMap() { const size = 1024; const data = new Uint8Array(size * size * 4); const normalStrength = 40; for (let y = 0; y < size; y++) { for (let x = 0; x < size; x++) { const nx = x / size, ny = y / size; const windDirection = this.config.duneDirection; const windAlignedX = nx * Math.cos(windDirection) + ny * Math.sin(windDirection), windAlignedY = -nx * Math.sin(windDirection) + ny * Math.cos(windDirection); const ripples = this.microRipplesNoise.noise(windAlignedX * 35, windAlignedY * 12) * 1.8; const grains = this.sandGrainsNoise.noise(nx * 200, ny * 200) * 0.2; const mediumVar = this.detailNoise.noise(nx * 40, ny * 40) * 0.5; const combined = ripples * 0.8 + grains * 0.3 + mediumVar * 0.2; const idx = (y * size + x) * 4; const left = x > 0 ? ripples * 0.8 + this.sandGrainsNoise.noise((nx - 1/size) * 200, ny * 200) * 0.2 + this.detailNoise.noise((nx - 1/size) * 40, ny * 40) * 0.3 : combined; const right = x < size-1 ? ripples * 0.8 + this.sandGrainsNoise.noise((nx + 1/size) * 200, ny * 200) * 0.2 + this.detailNoise.noise((nx + 1/size) * 40, ny * 40) * 0.3 : combined; const up = y > 0 ? ripples * 0.8 + this.sandGrainsNoise.noise(nx * 200, (ny - 1/size) * 200) * 0.2 + this.detailNoise.noise(nx * 40, (ny - 1/size) * 40) * 0.3 : combined; const down = y < size-1 ? ripples * 0.8 + this.sandGrainsNoise.noise(nx * 200, (ny + 1/size) * 200) * 0.2 + this.detailNoise.noise(nx * 40, (ny + 1/size) * 40) * 0.3 : combined; data[idx] = Math.min(255, Math.max(0, 128 + normalStrength * (right - left))); data[idx + 1] = Math.min(255, Math.max(0, 128 + normalStrength * (down - up))); data[idx + 2] = 255; data[idx + 3] = 255; } } const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat); texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(15, 15); texture.needsUpdate = true; return texture; }
    // ... (addCacti and its helpers are unchanged)
    addCacti() { const cactusMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5c2d, roughness: 0.8, metalness: 0.2, }); const segmentGeometries = [this.createCactusTrunk(2.5, 4, 20, 8), this.createCactusArm(1.8, 2.2, 8, 8), this.createCactusTrunk(1.5, 1.8, 12, 8),]; const cactusCount = this.config.cactiCount; const instancedSegments = []; for (let i = 0; i < segmentGeometries.length; i++) { const instancedMesh = new THREE.InstancedMesh(segmentGeometries[i], cactusMaterial, cactusCount * (i === 0 ? 1 : 2)); instancedMesh.castShadow = true; instancedMesh.receiveShadow = true; instancedSegments.push(instancedMesh); } const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), rotation = new THREE.Euler(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(); for (let i = 0; i < cactusCount; i++) { let x, z, townBlend; const angle = Math.random() * Math.PI * 2; const minRadius = Math.max(this.townDimensions.width, this.townDimensions.length) + 150; const maxRadius = this.config.size * 0.3; const radius = minRadius + Math.random() * (maxRadius - minRadius); x = Math.cos(angle) * radius; z = Math.sin(angle) * radius; townBlend = this.getTownBlendFactor(x, z); if (townBlend < 0.9) { const adjustedRadius = minRadius * 1.2; x = Math.cos(angle) * adjustedRadius; z = Math.sin(angle) * adjustedRadius; } const baseHeight = this.baseNoise.noise(x * this.config.noiseScale.base, z * this.config.noiseScale.base) * this.config.heightScale.base; const duneHeight = this.getDirectionalDuneHeight(x, z); const y = baseHeight + duneHeight; const cactusScale = 0.3 + Math.random() * 0.5; const trunkRotation = Math.random() * Math.PI * 2; position.set(x, y, z); rotation.set(0, trunkRotation, 0); quaternion.setFromEuler(rotation); scale.set(cactusScale, cactusScale, cactusScale); matrix.compose(position, quaternion, scale); instancedSegments[0].setMatrixAt(i, matrix); for (let arm = 0; arm < 2; arm++) { const armHeight = 5 + Math.random() * 8, armAngle = arm * Math.PI + (Math.random() * 0.5 - 0.25), armLength = 4 + Math.random() * 3; const armX = x + Math.cos(trunkRotation + armAngle) * 2 * cactusScale, armZ = z + Math.sin(trunkRotation + armAngle) * 2 * cactusScale, armY = y + armHeight * cactusScale; position.set(armX, armY, armZ); rotation.set(Math.PI/2, trunkRotation + armAngle + Math.PI/2, 0); quaternion.setFromEuler(rotation); matrix.compose(position, quaternion, scale); instancedSegments[1].setMatrixAt(i * 2 + arm, matrix); const tipX = armX + Math.cos(trunkRotation + armAngle) * armLength * cactusScale, tipZ = armZ + Math.sin(trunkRotation + armAngle) * armLength * cactusScale, tipY = armY; position.set(tipX, tipY, tipZ); rotation.set(0, trunkRotation, 0); quaternion.setFromEuler(rotation); matrix.compose(position, quaternion, scale); instancedSegments[2].setMatrixAt(i * 2 + arm, matrix); } } for (const instancedMesh of instancedSegments) { instancedMesh.instanceMatrix.needsUpdate = true; this.scene.add(instancedMesh); } return instancedSegments; }
    createCactusTrunk(topRadius, bottomRadius, height, segments) { const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments); geometry.translate(0, height/2, 0); return geometry; }
    createCactusArm(topRadius, bottomRadius, length, segments) { const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, length, segments); geometry.rotateZ(Math.PI/2); geometry.translate(length/2, 0, 0); return geometry; }
    generate() { console.log("Generating procedural desert terrain..."); this.generateTerrain(); this.addCacti(); console.log("Desert terrain generation complete"); return this.terrainMesh; }
}
