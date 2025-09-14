import * as THREE from 'three';
import { createWaterMaterial } from './map/assets/textures/codetextures/water.js'; // Fixed path (added /map/)

const MapTexture = {
    scene: null,
    tiles: new Map(), // key: `${x},${grid.z}`, value: mesh
    materials: {},
    textureLoader: new THREE.TextureLoader(),

    init(scene) {
        this.scene = scene;
        // Temporary color materials for testing load issues
        this.materials.grass = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.materials.dirt = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
        this.materials.sand = new THREE.MeshBasicMaterial({ color: 0xf4a460 });
        this.materials.stone = new THREE.MeshBasicMaterial({ color: 0x808080 });
        this.materials.water = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Temporary basic blue for testing
    },

    update(delta) {
        // Update water time if any tiles use it (disabled for test)
        // this.materials.water.uniforms.time.value += delta;
    },

    apply(type, grid) {
        const key = `${grid.x},${grid.z}`;
        let tile = this.tiles.get(key);
        if (!tile) {
            const geometry = new THREE.PlaneGeometry(1, 1);
            tile = new THREE.Mesh(geometry, this.materials[type]);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(grid.x + 0.5, Math.random() * 0.2 - 0.1, grid.z + 0.5); // Random height
            this.scene.add(tile);
            this.tiles.set(key, tile);
        } else {
            tile.material = this.materials[type];
            tile.position.y = Math.random() * 0.2 - 0.1; // Update height
        }
        // Note: Blending not implemented (edges sharp); future: use single terrain mesh.
    },
};

export default MapTexture;