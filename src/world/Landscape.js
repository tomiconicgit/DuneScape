// File: src/world/Landscape.js
import * as THREE from 'three';

// A self-contained Perlin noise implementation. It's simple and effective.
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
            resolution: 40, // Low resolution for the low-poly look
            noiseScale: {
                dunes: 0.02,
                detail: 0.1,
            },
            heightScale: {
                dunes: 35,
                detail: 5,
            },
            colors: {
                deepSand: new THREE.Color(0xc2b280),
                midSand: new THREE.Color(0xd8c593),
                highlightSand: new THREE.Color(0xf5e1a9),
            }
        };

        this.noise = new PerlinNoise();
        this.createMesh();
        this.generate();
    }

    createMesh() {
        this.geometry = new THREE.PlaneGeometry(
            this.config.size, this.config.size,
            this.config.resolution, this.config.resolution
        );
        this.geometry.rotateX(-Math.PI / 2);

        this.material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            flatShading: true, // This is the key to the faceted, low-poly look!
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
    }

    generate() {
        console.log("Generating low-poly landscape...");
        const vertices = this.geometry.attributes.position.array;
        let minHeight = Infinity;
        let maxHeight = -Infinity;

        // --- Pass 1: Set Heights ---
        // We loop through and set the height of each vertex based on noise.
        for (let i = 0; i < vertices.length / 3; i++) {
            const x = vertices[i * 3];
            const z = vertices[i * 3 + 2];

            const duneHeight = this.noise.noise(x * this.config.noiseScale.dunes, z * this.config.noiseScale.dunes) * this.config.heightScale.dunes;
            const detailHeight = this.noise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;
            
            const height = duneHeight + detailHeight;
            vertices[i * 3 + 1] = height;

            if (height < minHeight) minHeight = height;
            if (height > maxHeight) maxHeight = height;
        }

        // --- Pass 2: Set Colors ---
        // Now that we know the min/max height, we can color each vertex based on its normalized height.
        const colors = new Float32Array(vertices.length);
        const heightRange = maxHeight - minHeight;
        
        for (let i = 0; i < vertices.length / 3; i++) {
            const height = vertices[i * 3 + 1];
            const normalizedHeight = (height - minHeight) / heightRange;

            // Create a gradient from deep sand to highlight sand
            const color = this.config.colors.deepSand.clone();
            if (normalizedHeight < 0.5) {
                color.lerp(this.config.colors.midSand, normalizedHeight * 2);
            } else {
                color.copy(this.config.colors.midSand);
                color.lerp(this.config.colors.highlightSand, (normalizedHeight - 0.5) * 2);
            }
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.computeVertexNormals();
        console.log("Low-poly landscape generated.");
    }
}
