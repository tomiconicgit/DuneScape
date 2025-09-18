// File: src/world/generators/TerrainGenerator.js
import * as THREE from 'three';

// PerlinNoise class remains the same as before...
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
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        const A = this.perm[X] + Y;
        const AA = this.perm[A] + Z;
        const AB = this.perm[A + 1] + Z;
        const B = this.perm[X + 1] + Y;
        const BA = this.perm[B] + Z;
        const BB = this.perm[B + 1] + Z;

        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x-1, y, z)),
                                      this.lerp(u, this.grad(this.perm[AB], x, y-1, z), this.grad(this.perm[BB], x-1, y-1, z))),
                              this.lerp(v, this.lerp(u, this.grad(this.perm[AA+1], x, y, z-1), this.grad(this.perm[BA+1], x-1, y, z-1)),
                                      this.lerp(u, this.grad(this.perm[AB+1], x, y-1, z-1), this.grad(this.perm[BB+1], x-1, y-1, z-1))));
    }
}


export default class TerrainGenerator {
    constructor() {
        this.config = {
            noiseScale: {
                base: 0.015,
                dunes: 0.02,
                detail: 0.1
            },
            heightScale: {
                base: 10,
                dunes: 20,
                detail: 2
            },
            sandColors: [
                new THREE.Color(0xec9e5c), // Base sand color
                new THREE.Color(0xd4884a), // Darker
                new THREE.Color(0xf7b777), // Lighter
            ]
        };

        this.baseNoise = new PerlinNoise(Math.random());
        this.duneNoise = new PerlinNoise(Math.random());
        this.detailNoise = new PerlinNoise(Math.random());
        this.colorNoise = new PerlinNoise(Math.random());
    }

    /**
     * Calculates the height and color for a specific point in the world.
     * @param {number} x - The world x-coordinate.
     * @param {number} z - The world z-coordinate.
     * @returns {{height: number, color: THREE.Color}} - The calculated height and color.
     */
    getHeightAndColor(x, z) {
        // --- Height Calculation ---
        let height = 0;
        height += this.baseNoise.noise(x * this.config.noiseScale.base, z * this.config.noiseScale.base) * this.config.heightScale.base;
        const duneNoiseVal = this.duneNoise.noise(x * this.config.noiseScale.dunes, z * this.config.noiseScale.dunes);
        height += Math.pow(Math.abs(duneNoiseVal), 2) * this.config.heightScale.dunes;
        height += this.detailNoise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;

        // --- Color Calculation ---
        const colorNoiseVal = this.colorNoise.noise(x * 0.05, z * 0.05);
        let finalColor = this.config.sandColors[0].clone();
        if (colorNoiseVal > 0.3) {
            finalColor.lerp(this.config.sandColors[1], (colorNoiseVal - 0.3) * 2);
        } else if (colorNoiseVal < -0.3) {
            finalColor.lerp(this.config.sandColors[2], (Math.abs(colorNoiseVal) - 0.3) * 2);
        }
        
        return { height, color: finalColor };
    }
}
