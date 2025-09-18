// File: src/world/Landscape.js
import * as THREE from 'three';

// A self-contained Perlin noise implementation.
class PerlinNoise {
    constructor() {
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        let n = 256;
        while(n-- > 1) {
            const k = Math.floor((n + 1) * Math.random());
            [p[n], p[k]] = [p[k], p[n]];
        }
        for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return (1 - t) * a + t * b; }
    grad(hash, x, y) {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    noise(x, y) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
        x -= Math.floor(x); y -= Math.floor(y);
        const u = this.fade(x), v = this.fade(y);
        const A = this.perm[X] + Y, B = this.perm[X + 1] + Y;
        return this.lerp(v, this.lerp(u, this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y)),
                           this.lerp(u, this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1)));
    }
}

export default class Landscape {
    constructor() {
        this.config = {
            size: 500,
            resolution: 128,
            noiseScale: {
                dunes: 0.03,
                detail: 0.1,
            },
            // ✨ KEY CHANGE: Drastically reduced height for a flat plain with gentle dunes
            heightScale: {
                dunes: 2.5,  // Was 35, now very subtle
                detail: 0.5, // Was 5, now very subtle
            },
            trail: {
                width: 4,
                fadeDistance: 3,
            },
            colors: {
                sand: new THREE.Color(0xd8c593),
                sandDark: new THREE.Color(0xc2b280),
                mine: new THREE.Color(0x8a8d91),
                oasis: new THREE.Color(0x556b2f), // Dark olive green
                wildlands: new THREE.Color(0x9b7653), // Darker, rougher sand
                trail: new THREE.Color(0x9e8a78),
            }
        };

        this.BIOMES = {
            MINE:      { x: -125, z: -125, size: 50 },
            TOWN:      { x: -125, z:  125, size: 80 },
            OASIS:     { x:  125, z:  125, size: 50 },
            WILDLANDS: { x:  125, z: -125, size: 250 },
        };
        
        this.TRAIL_PATH = [
            new THREE.Vector2(this.BIOMES.OASIS.x, this.BIOMES.OASIS.z),
            new THREE.Vector2(this.BIOMES.TOWN.x, this.BIOMES.TOWN.z),
            new THREE.Vector2(this.BIOMES.MINE.x, this.BIOMES.MINE.z),
            new THREE.Vector2(this.BIOMES.WILDLANDS.x, this.BIOMES.WILDLANDS.z),
        ];

        this.noise = new PerlinNoise();
        this.createMesh();
        this.generate();
    }

    createMesh() {
        this.geometry = new THREE.PlaneGeometry(this.config.size, this.config.size, this.config.resolution, this.config.resolution);
        this.geometry.rotateX(-Math.PI / 2);

        this.material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            // flatShading is removed for a smoother look
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.receiveShadow = true;
    }

    generate() {
        console.log("Generating flat landscape with subtle features...");
        const vertices = this.geometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);

        for (let i = 0; i < vertices.length / 3; i++) {
            const x = vertices[i * 3];
            const z = vertices[i * 3 + 2];

            const biomeWeights = this.getBiomeWeights(x, z);
            const trailFactor = this.getTrailFactor(x, z);

            // --- 1. Calculate Subtle Height ---
            const duneHeight = this.noise.noise(x * this.config.noiseScale.dunes, z * this.config.noiseScale.dunes) * this.config.heightScale.dunes;
            const detailHeight = this.noise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;
            let height = duneHeight + detailHeight;

            // Slightly flatten the trail, but don't dig a trench
            height *= (1.0 - (1.0 - trailFactor.factor) * 0.2);
            vertices[i * 3 + 1] = height;

            // --- 2. Calculate Color based on Biomes and Trails ---
            const colorNoiseVal = (this.noise.noise(x * 0.1, z * 0.1) + 1) / 2;
            
            // Start with base sand color
            let finalColor = this.config.colors.sand.clone();
            finalColor.lerp(this.config.colors.sandDark, colorNoiseVal * 0.5); // Add subtle variation

            // Blend biome colors based on location
            finalColor.lerp(this.config.colors.mine, biomeWeights.MINE);
            finalColor.lerp(this.config.colors.wildlands, biomeWeights.WILDLANDS);
            finalColor.lerp(this.config.colors.oasis, biomeWeights.OASIS);
            
            // Override other colors to draw the trail
            finalColor.lerp(this.config.colors.trail, (1.0 - trailFactor.factor));
            
            colors[i * 3] = finalColor.r;
            colors[i * 3 + 1] = finalColor.g;
            colors[i * 3 + 2] = finalColor.b;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.computeVertexNormals();
        console.log("Flat landscape generation complete.");
    }
    
    getBiomeWeights(x, z) {
        const weights = { MINE: 0, TOWN: 0, OASIS: 0, WILDLANDS: 0 };
        let totalInfluence = 0;
        const falloff = 2; // How quickly biome influence fades

        for (const key in this.BIOMES) {
            const biome = this.BIOMES[key];
            const dx = x - biome.x;
            const dz = z - biome.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            // Calculate influence that fades to zero at the edge of the biome's intended size
            const influence = Math.max(0, 1.0 - (dist / (biome.size * falloff)));
            weights[key] = influence;
            totalInfluence += influence;
        }
        
        // Normalize only if a point is in multiple biomes at once
        if (totalInfluence > 1) {
            for (const key in weights) {
                weights[key] /= totalInfluence;
            }
        }
        return weights;
    }

    getTrailFactor(x, z) {
        let minDistance = Infinity;
        const p = new THREE.Vector2(x, z);
        for (let i = 0; i < this.TRAIL_PATH.length - 1; i++) {
            minDistance = Math.min(minDistance, this.distanceToLineSegment(p, this.TRAIL_PATH[i], this.TRAIL_PATH[i+1]));
        }
        const { width, fadeDistance } = this.config.trail;
        const factor = THREE.MathUtils.smoothstep(minDistance, width, width + fadeDistance);
        return { distance: minDistance, factor: factor };
    }

    distanceToLineSegment(p, a, b) {
        const l2 = a.distanceToSquared(b);
        if (l2 === 0) return p.distanceTo(a);
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = a.clone().lerp(b, t);
        return p.distanceTo(projection);
    }
}
