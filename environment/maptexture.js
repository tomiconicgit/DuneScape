import * as THREE from 'three';
import { createWaterMaterial } from './assets/textures/codetextures/water.js';

const MapTexture = {
    scene: null,
    tiles: new Map(), // key: `${x},${z}`, value: mesh
    materials: {},
    textureLoader: new THREE.TextureLoader(),

    init(scene) {
        this.scene = scene;
        // Load image textures (assume paths relative to root)
        this.materials.grass = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/grass.JPEG') });
        this.materials.dirt = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/dirt.JPEG') });
        this.materials.sand = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/sand.JPEG') });
        this.materials.stone = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/stone.JPEG') });
        this.materials.water = createWaterMaterial();
    },

    update(delta) {
        // Update water time if any tiles use it
        this.materials.water.uniforms.time.value += delta;
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