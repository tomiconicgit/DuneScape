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
            resolution: 150,
            noiseScale: {
                dunes: 0.01,
                detail: 0.05,
            },
            heightScale: {
                dunes: 10, // Moderate height for rolling dunes
                detail: 2,
            }
        };

        this.noise = new PerlinNoise();
        this.createMesh();
        this.generateGeometry();
    }

    createMesh() {
        this.geometry = new THREE.PlaneGeometry(
            this.config.size, this.config.size,
            this.config.resolution, this.config.resolution
        );
        this.geometry.rotateX(-Math.PI / 2);

        const rippleNormalMap = this.createRippleNormalMap();

        // Use a PBR material for realistic lighting
        this.material = new THREE.MeshStandardMaterial({
            color: 0xeacda3, // A realistic, pale sand color
            roughness: 0.85, // Sand is not shiny
            metalness: 0.1,
            normalMap: rippleNormalMap,
            normalScale: new THREE.Vector2(0.5, 0.5), // Adjust strength of the ripples
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
    }

    generateGeometry() {
        console.log("Generating realistic dune geometry...");
        const vertices = this.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length / 3; i++) {
            const x = vertices[i * 3];
            const z = vertices[i * 3 + 2];

            // Generate height for the large, rolling dunes
            const duneHeight = this.noise.noise(x * this.config.noiseScale.dunes, z * this.config.noiseScale.dunes) * this.config.heightScale.dunes;
            const detailHeight = this.noise.noise(x * this.config.noiseScale.detail, z * this.config.noiseScale.detail) * this.config.heightScale.detail;
            
            vertices[i * 3 + 1] = duneHeight + detailHeight;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        console.log("Dune geometry complete.");
    }

    /**
     * Creates a procedural normal map texture to simulate fine sand ripples.
     */
    createRippleNormalMap() {
        const size = 512;
        const data = new Uint8Array(size * size * 4);
        const rippleNoise = new PerlinNoise();
        const grainNoise = new PerlinNoise();

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Use multiple noise layers for the ripple effect
                // The key is stretching the noise in one direction to create lines
                const ripple1 = rippleNoise.noise(x * 0.05, y * 0.5);
                const ripple2 = rippleNoise.noise(x * 0.1, y * 1.0);
                const grain = grainNoise.noise(x * 0.8, y * 0.8) * 0.25; // Fine grain
                
                // Combine noise layers to get a height value
                const combinedHeight = ripple1 + ripple2 + grain;

                // Calculate normals by sampling adjacent points
                const sample = (offsetX, offsetY) => {
                    const r1 = rippleNoise.noise((x + offsetX) * 0.05, (y + offsetY) * 0.5);
                    const r2 = rippleNoise.noise((x + offsetX) * 0.1, (y + offsetY) * 1.0);
                    const g = grainNoise.noise((x + offsetX) * 0.8, (y + offsetY) * 0.8) * 0.25;
                    return r1 + r2 + g;
                };

                const normal = new THREE.Vector3(
                    sample(-1, 0) - sample(1, 0), // Difference in X
                    0.05, // Small vertical component, controls "strength"
                    sample(0, -1) - sample(0, 1)  // Difference in Z (Y for texture)
                ).normalize();

                const index = (y * size + x) * 4;
                data[index]     = (normal.x * 0.5 + 0.5) * 255;
                data[index + 1] = (normal.z * 0.5 + 0.5) * 255; // Green channel for Z in world space
                data[index + 2] = (normal.y * 0.5 + 0.5) * 255; // Blue channel for Y (up)
                data[index + 3] = 255;
            }
        }

        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(this.config.size / 20, this.config.size / 20); // Repeat the texture over the terrain
        texture.needsUpdate = true;
        
        return texture;
    }
}
