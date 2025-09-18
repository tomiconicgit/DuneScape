// File: src/world/Landscape.js
import * as THREE from 'three';

// A self-contained, high-quality Perlin noise implementation.
class PerlinNoise {
    constructor(seed = Math.random()) {
        const p = new Array(256).fill(0).map((_, i) => i);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        this.perm = new Uint8Array(512);
        for(let i=0; i < 512; i++) this.perm[i] = p[i & 255];
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return a + t * (b - a); }
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
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
            // ✨ KEY CHANGE: Corrected noise scales for smaller, more frequent features.
            noiseScale: {
                base: 0.01,
                dunes: 0.02,
                secondaryDunes: 0.05,
                ridges: 0.08,
                detail: 0.2,
                microRipples: 0.5,
                sandGrains: 4.0
            },
            // ✨ KEY CHANGE: Re-balanced heights for small, smooth slopes.
            heightScale: {
                base: 2.0,
                dunes: 5.0,         // Primary dunes are the main feature
                secondaryDunes: 1.5,// Secondary dunes are smaller
                ridges: 0.5,        // Ridges are very subtle
                detail: 0.25,
                microRipples: 0.1,
                sandGrains: 0.02
            },
            sandColors: [
                new THREE.Color(0xec9e5c).lerp(new THREE.Color(0xffffff), 0.35), // Base
                new THREE.Color(0xd4884a).lerp(new THREE.Color(0xffffff), 0.35), // Darker
                new THREE.Color(0xf7b777).lerp(new THREE.Color(0xffffff), 0.35), // Lighter
                new THREE.Color(0xb7703e).lerp(new THREE.Color(0xffffff), 0.35), // Shadow
                new THREE.Color(0xffc890).lerp(new THREE.Color(0xffffff), 0.35)  // Highlight
            ],
            duneDirection: Math.PI * 0.25
        };

        this.initNoise();
        this.generate();
    }

    initNoise() {
        this.baseNoise = new PerlinNoise();
        this.duneNoise = new PerlinNoise();
        this.secondaryDuneNoise = new PerlinNoise();
        this.ridgeNoise = new PerlinNoise();
        this.detailNoise = new PerlinNoise();
        this.colorNoise = new PerlinNoise();
        this.microRipplesNoise = new PerlinNoise();
        this.sandGrainsNoise = new PerlinNoise();
    }

    generate() {
        console.log("Generating smooth, curved landscape...");
        
        const geometry = new THREE.PlaneGeometry(this.config.size, this.config.size, this.config.resolution, this.config.resolution);
        geometry.rotateX(-Math.PI / 2);

        const vertices = geometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];

            // --- Height Generation ---
            let height = this.baseNoise.noise(x * this.config.noiseScale.base, z * this.config.noiseScale.base) * this.config.heightScale.base;
            height += this.getDirectionalDuneHeight(x, z);
            height += this.detailNoise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;

            const windDirection = this.config.duneDirection;
            const alignedX = x * Math.cos(windDirection) + z * Math.sin(windDirection);
            const alignedZ = -x * Math.sin(windDirection) + z * Math.cos(windDirection);
            const microRipples = this.microRipplesNoise.noise(alignedX * this.config.noiseScale.microRipples, alignedZ * this.config.noiseScale.microRipples * 5) * this.config.heightScale.microRipples;
            height += microRipples;
            height += this.sandGrainsNoise.noise(x * this.config.noiseScale.sandGrains, z * this.config.noiseScale.sandGrains) * this.config.heightScale.sandGrains;
            
            vertices[i + 1] = height;

            // --- Color Generation ---
            const colorNoise = this.colorNoise.noise(x * this.config.noiseScale.base * 4, z * this.config.noiseScale.base * 4);
            const heightFactor = Math.max(0, Math.min(1, height / 8)); // Normalize height for color
            let finalColor = this.config.sandColors[0].clone();

            finalColor.lerp(this.config.sandColors[1], Math.max(0, 0.5 - heightFactor));
            finalColor.lerp(this.config.sandColors[2], Math.max(0, heightFactor - 0.5));
            finalColor.lerp(colorNoise > 0 ? this.config.sandColors[4] : this.config.sandColors[3], Math.abs(colorNoise) * 0.2);

            colors[i] = finalColor.r;
            colors[i + 1] = finalColor.g;
            colors[i + 2] = finalColor.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        
        const normalMap = this.createProceduralNormalMap();
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            shininess: 0,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(0.2, 0.2)
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        console.log("Landscape generation complete.");
    }
    
    getDirectionalDuneHeight(x, z) {
        const direction = this.config.duneDirection;
        const rotX = x * Math.cos(direction) + z * Math.sin(direction);
        const rotZ = -x * Math.sin(direction) + z * Math.cos(direction);
        
        let duneHeight = this.duneNoise.noise(rotX * this.config.noiseScale.dunes, rotZ * this.config.noiseScale.dunes * 0.5) * this.config.heightScale.dunes;
        duneHeight += this.secondaryDuneNoise.noise(rotX * this.config.noiseScale.secondaryDunes, rotZ * this.config.noiseScale.secondaryDunes) * this.config.heightScale.secondaryDunes;
        
        const ridges = this.ridgeNoise.noise(rotX * this.config.noiseScale.ridges, rotZ * this.config.noiseScale.ridges);
        const smoothedRidge = Math.pow(Math.abs(ridges * 2 - 1), 2.4);
        duneHeight += smoothedRidge * this.config.heightScale.ridges;
        
        return duneHeight;
    }

    createProceduralNormalMap() {
        const size = 512;
        const data = new Uint8Array(size * size * 4);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size, ny = y / size;
                const windDirection = this.config.duneDirection;
                const windAlignedX = nx * Math.cos(windDirection) + ny * Math.sin(windDirection);
                const windAlignedY = -nx * Math.sin(windDirection) + ny * Math.cos(windDirection);

                const getHeight = (ax, ay) => this.microRipplesNoise.noise(ax * 35, ay * 12) * 1.8 + this.sandGrainsNoise.noise(ax * 200, ay * 200) * 0.2;

                const hL = getHeight(windAlignedX - 1/size, windAlignedY);
                const hR = getHeight(windAlignedX + 1/size, windAlignedY);
                const hD = getHeight(windAlignedX, windAlignedY - 1/size);
                const hU = getHeight(windAlignedX, windAlignedY + 1/size);

                const normal = new THREE.Vector3(hL - hR, hD - hU, 2 / size).normalize();
                
                const idx = (y * size + x) * 4;
                data[idx] = (normal.x * 0.5 + 0.5) * 255;
                data[idx + 1] = (normal.y * 0.5 + 0.5) * 255;
                data[idx + 2] = 1.0 * 255;
                data[idx + 3] = 255;
            }
        }
        
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(30, 30);
        texture.needsUpdate = true;
        return texture;
    }
}
