// File: src/world/Landscape.js
import * as THREE from 'three';

// A self-contained Perlin noise implementation, adapted from the reference.
class PerlinNoise {
    constructor(seed = Math.random()) {
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        
        let n = 256;
        while(n-- > 1) {
            const k = Math.floor((n + 1) * Math.random());
            [p[n], p[k]] = [p[k], p[n]];
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return (1 - t) * a + t * b; }
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z = 0) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        const u = this.fade(x), v = this.fade(y), w = this.fade(z);
        const A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z;
        const B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z;
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x-1, y, z)),
                                      this.lerp(u, this.grad(this.perm[AB], x, y-1, z), this.grad(this.perm[BB], x-1, y-1, z))),
                              this.lerp(v, this.lerp(u, this.grad(this.perm[AA+1], x, y, z-1), this.grad(this.perm[BA+1], x-1, y, z-1)),
                                      this.lerp(u, this.grad(this.perm[AB+1], x, y-1, z-1), this.grad(this.perm[BB+1], x-1, y-1, z-1))));
    }
}


export default class Landscape {
    constructor() {
        this.config = {
            size: 500,
            resolution: 196,
            noiseScale: { // Scales adjusted for 500x500 world
                base: 0.006,
                dunes: 0.016,
                ridges: 0.06,
                detail: 0.2,
                mine: 0.15, // Special noise for the mine area
            },
            heightScale: {
                base: 5,
                dunes: 15,
                ridges: 5,
                detail: 1,
                mine: 12, // Ruggedness for the mine
            },
            trail: {
                width: 3,
                fadeDistance: 4,
            },
            colors: {
                sand: [ new THREE.Color(0xec9e5c), new THREE.Color(0xd4884a), new THREE.Color(0xf7b777) ],
                mine: [ new THREE.Color(0x9a9a9a), new THREE.Color(0x7a7a7a) ],
                oasis: [ new THREE.Color(0x2a9d8f), new THREE.Color(0x264653) ],
                wildlands: [ new THREE.Color(0xb7703e), new THREE.Color(0x8a5a2e) ],
                trail: new THREE.Color(0x9e8a78), // Packed earth color
            }
        };

        // Define biome locations within the 500x500 world
        this.BIOMES = {
            MINE:      { x: -125, z: -125, size: 50 }, // Top-Left (-x, -z)
            TOWN:      { x: -125, z:  125, size: 80 }, // Bottom-Left (-x, +z)
            OASIS:     { x:  125, z:  125, size: 50 }, // Bottom-Right (+x, +z)
            WILDLANDS: { x:  125, z: -125, size: 250 },// Top-Right (+x, -z)
        };
        
        // Define the trail path connecting the biomes
        this.TRAIL_PATH = [
            new THREE.Vector2(this.BIOMES.OASIS.x, this.BIOMES.OASIS.z),
            new THREE.Vector2(this.BIOMES.TOWN.x, this.BIOMES.TOWN.z),
            new THREE.Vector2(this.BIOMES.MINE.x, this.BIOMES.MINE.z),
            new THREE.Vector2(this.BIOMES.WILDLANDS.x, this.BIOMES.WILDLANDS.z),
        ];

        this.initNoise();
        this.createMesh();
        this.generate();
    }

    initNoise() {
        this.baseNoise = new PerlinNoise(Math.random());
        this.duneNoise = new PerlinNoise(Math.random());
        this.ridgeNoise = new PerlinNoise(Math.random());
        this.detailNoise = new PerlinNoise(Math.random());
        this.colorNoise = new PerlinNoise(Math.random());
        this.mineNoise = new PerlinNoise(Math.random());
    }

    createMesh() {
        this.geometry = new THREE.PlaneGeometry(
            this.config.size, this.config.size,
            this.config.resolution, this.config.resolution
        );
        this.geometry.rotateX(-Math.PI / 2);

        const normalMap = this.createProceduralNormalMap();
        this.material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            shininess: 5,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(0.5, 0.5),
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
    }

    // Master generation function
    generate() {
        console.log("Generating consolidated landscape...");
        const vertices = this.geometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);

        for (let i = 0; i < vertices.length / 3; i++) {
            const x = vertices[i * 3];
            const z = vertices[i * 3 + 2];

            const biomeWeights = this.getBiomeWeights(x, z);
            const trailFactor = this.getTrailFactor(x, z);

            // --- 1. Calculate Height ---
            let height = 0;
            const baseHeight = this.baseNoise.noise(x * this.config.noiseScale.base, z * this.config.noiseScale.base) * this.config.heightScale.base;
            const duneHeight = Math.pow(Math.abs(this.duneNoise.noise(x * this.config.noiseScale.dunes, z * this.config.noiseScale.dunes)), 2.5) * this.config.heightScale.dunes;
            const ridgeHeight = Math.abs(this.ridgeNoise.noise(x * this.config.noiseScale.ridges, z * this.config.noiseScale.ridges)) * this.config.heightScale.ridges;
            const detailHeight = this.detailNoise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;

            // Biome-specific height modifications
            const mineHeight = this.mineNoise.noise(x * this.config.noiseScale.mine, z * this.config.noiseScale.mine) * this.config.heightScale.mine * biomeWeights.MINE;
            const wildlandsHeight = duneHeight * 1.5; // Make wildlands have larger dunes

            height = baseHeight + ridgeHeight + detailHeight + mineHeight;
            height = THREE.MathUtils.lerp(height + duneHeight, height + wildlandsHeight, biomeWeights.WILDLANDS);
            height = THREE.MathUtils.lerp(height, height * 0.1, biomeWeights.OASIS); // Flatten oasis

            // Carve the trail by flattening terrain
            height *= (1.0 - (1.0 - trailFactor.factor) * 0.95); // Flatten 95% on the trail

            vertices[i * 3 + 1] = height;

            // --- 2. Calculate Color ---
            let finalColor = new THREE.Color();
            const colorNoiseVal = (this.colorNoise.noise(x * 0.05, z * 0.05) + 1) / 2;
            
            // Base sand color
            const sandColor = this.config.colors.sand[0].clone().lerp(this.config.colors.sand[1], colorNoiseVal);
            finalColor.copy(sandColor);

            // Blend biome colors
            finalColor.lerp(this.config.colors.mine[0], biomeWeights.MINE);
            finalColor.lerp(this.config.colors.wildlands[0], biomeWeights.WILDLANDS);
            finalColor.lerp(this.config.colors.oasis[0], biomeWeights.OASIS * 2.0); // Stronger oasis color
            
            // Apply trail color
            finalColor.lerp(this.config.colors.trail, (1.0 - trailFactor.factor));
            
            colors[i * 3] = finalColor.r;
            colors[i * 3 + 1] = finalColor.g;
            colors[i * 3 + 2] = finalColor.b;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.computeVertexNormals();
        console.log("Landscape generation complete.");
    }
    
    // Calculate the influence of each biome on a point (x, z)
    getBiomeWeights(x, z) {
        const weights = { MINE: 0, TOWN: 0, OASIS: 0, WILDLANDS: 0 };
        let totalWeight = 0;

        for (const key in this.BIOMES) {
            const biome = this.BIOMES[key];
            const dx = x - biome.x;
            const dz = z - biome.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            // Use inverse distance weighting
            const weight = Math.pow(1.0 / (dist + 1.0), 4);
            weights[key] = weight;
            totalWeight += weight;
        }
        
        // Normalize weights so they sum to 1
        if (totalWeight > 0) {
            for (const key in weights) {
                weights[key] /= totalWeight;
            }
        }
        return weights;
    }

    // Calculate how close a point is to the trail network
    getTrailFactor(x, z) {
        let minDistance = Infinity;
        const p = new THREE.Vector2(x, z);

        for (let i = 0; i < this.TRAIL_PATH.length - 1; i++) {
            const a = this.TRAIL_PATH[i];
            const b = this.TRAIL_PATH[i + 1];
            minDistance = Math.min(minDistance, this.distanceToLineSegment(p, a, b));
        }
        
        const { width, fadeDistance } = this.config.trail;
        const factor = THREE.MathUtils.smoothstep(minDistance, width, width + fadeDistance);
        return { distance: minDistance, factor: factor };
    }

    // Helper for trail calculation: distance from point p to line segment ab
    distanceToLineSegment(p, a, b) {
        const l2 = a.distanceToSquared(b);
        if (l2 === 0) return p.distanceTo(a);
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = a.clone().lerp(b, t);
        return p.distanceTo(projection);
    }

    createProceduralNormalMap() {
        const size = 512;
        const data = new Uint8Array(size * size * 4);
        const noise = new PerlinNoise(Math.random());
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size, ny = y / size;
                const h1 = noise.noise(nx * 15, ny * 45); // Wind ripples
                const h2 = noise.noise(nx * 150, ny * 150) * 0.2; // Grains
                
                // Calculate normals from height differences
                const getHeight = (dx, dy) => noise.noise((nx + dx) * 15, (ny + dy) * 45) + noise.noise((nx+dx)*150, (ny+dy)*150)*0.2;
                const normal = new THREE.Vector3(
                    getHeight(-1/size, 0) - getHeight(1/size, 0),
                    2/size,
                    getHeight(0, -1/size) - getHeight(0, 1/size)
                ).normalize();

                const idx = (y * size + x) * 4;
                data[idx] = (normal.x * 0.5 + 0.5) * 255;
                data[idx + 1] = (normal.z * 0.5 + 0.5) * 255; // Y-up in world, so Z is green
                data[idx + 2] = (normal.y * 0.5 + 0.5) * 255; // B is up/down in normal map
                data[idx + 3] = 255;
            }
        }
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        texture.needsUpdate = true;
        return texture;
    }
}
