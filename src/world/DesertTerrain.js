import * as THREE from 'three';

// A simple Perlin noise implementation for terrain generation
class PerlinNoise {
    constructor(seed = Math.random()) { this.seed = seed; this.perm = new Array(512); this.gradP = new Array(512); const p = new Array(256); for (let i = 0; i < 256; i++) { p[i] = Math.floor(seed * 10000 + i) % 256; } for (let i = 0; i < 512; i++) { this.perm[i] = p[i & 255]; this.gradP[i] = this.gradients[this.perm[i] % 12]; } } gradients = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]]; fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); } lerp(a, b, t) { return (1 - t) * a + t * b; } grad(hash, x, y, z) { const g = this.gradP[hash]; return g[0] * x + g[1] * y + g[2] * z; } noise(x, y, z = 0) { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255; x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z); const u = this.fade(x), v = this.fade(y), w = this.fade(z); const A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z; const B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z; return this.lerp(this.lerp(this.lerp(this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z), u), this.lerp(this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z), u), v), this.lerp(this.lerp(this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1), u), this.lerp(this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1), u), v), w); }
}

export class DesertTerrain {
    constructor(scene) {
        this.scene = scene;
        this.config = {
            size: 100, // MODIFIED: Set size to 100x100
            resolution: 100, // MODIFIED: Adjusted resolution
            noiseScale: { base: 0.05, dunes: 0.1, detail: 0.5 },
            heightScale: { base: 1, dunes: 3, detail: 0.5 },
            sandColors: [new THREE.Color(0xec9e5c), new THREE.Color(0xd4884a), new THREE.Color(0xf7b777)]
        };
        this.baseNoise = new PerlinNoise(Math.random());
        this.duneNoise = new PerlinNoise(Math.random() + 100);
        this.detailNoise = new PerlinNoise(Math.random() + 200);
        this.colorNoise = new PerlinNoise(Math.random() + 300);
    }
    
    generate() {
        console.log("Generating 100x100 procedural desert terrain...");
        const geometry = new THREE.PlaneGeometry(this.config.size, this.config.size, this.config.resolution, this.config.resolution);
        geometry.rotateX(-Math.PI / 2);
        
        const vertices = geometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            let height = this.baseNoise.noise(x * this.config.noiseScale.base, z * this.config.noiseScale.base) * this.config.heightScale.base;
            height += this.duneNoise.noise(x * this.config.noiseScale.dunes, z * this.config.noiseScale.dunes) * this.config.heightScale.dunes;
            height += this.detailNoise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;
            
            vertices[i + 1] = height;
            
            const colorNoiseVal = this.colorNoise.noise(x * 0.1, z * 0.1);
            let finalColor = this.config.sandColors[0].clone();
            if (colorNoiseVal > 0.3) {
                finalColor.lerp(this.config.sandColors[1], (colorNoiseVal - 0.3) * 0.5);
            } else if (colorNoiseVal < -0.3) {
                finalColor.lerp(this.config.sandColors[2], (-colorNoiseVal - 0.3) * 0.5);
            }
            
            const colorIdx = i;
            colors[colorIdx] = finalColor.r;
            colors[colorIdx + 1] = finalColor.g;
            colors[colorIdx + 2] = finalColor.b;
        }
        
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        
        const sandMaterial = new THREE.MeshLambertMaterial({
            vertexColors: true,
            shininess: 0
        });
        
        this.terrainMesh = new THREE.Mesh(geometry, sandMaterial);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = false;
        this.scene.add(this.terrainMesh);
        
        console.log("Desert terrain generation complete");
        return this.terrainMesh;
    }
}
