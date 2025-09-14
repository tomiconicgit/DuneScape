import * as THREE from 'three';
import { createWaterMaterial } from './map/assets/textures/codetextures/water.js'; // Fixed path (added /map/)

const MapTexture = {
    scene: null,
    tiles: new Map(), // key: `${x},${grid.z}`, value: mesh
    materials: {},
    textureLoader: new THREE.TextureLoader(),

    init(scene) {
        this.scene = scene;
        // Load image textures with error handling
        this.materials.grass = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/grass.jpeg', undefined, undefined, (err) => console.error(`Failed to load grass texture: ${err}`)) });
        this.materials.dirt = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/dirt.jpeg', undefined, undefined, (err) => console.error(`Failed to load dirt texture: ${err}`)) });
        this.materials.sand = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/sand.jpeg', undefined, undefined, (err) => console.error(`Failed to load sand texture: ${err}`)) });
        this.materials.stone = new THREE.MeshBasicMaterial({ map: this.textureLoader.load('environment/map/assets/textures/imagetextures/stone.jpeg', undefined, undefined, (err) => console.error(`Failed to load stone texture: ${err}`)) });
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