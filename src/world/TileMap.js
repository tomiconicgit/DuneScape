import * as THREE from 'three';

export default class TileMap {
    constructor(scene) {
        this.scene = scene;
        this.tiles = new Map();
        this.textures = {};
        this.size = 100;
        
        this._loadTextures();
        this._createTiles();
    }

    _loadTextures() {
        const loader = new THREE.TextureLoader();
        const wrap = t => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.minFilter = THREE.LinearFilter;
            t.magFilter = THREE.LinearFilter;
            return t;
        };
        this.textures = {
            grass: wrap(loader.load('./assets/grass.jpeg')),
            dirt: wrap(loader.load('./assets/dirt.jpeg')),
            sand: wrap(loader.load('./assets/sand.jpeg')),
            stone: wrap(loader.load('./assets/stone.jpeg')),
        };
    }

    _createTiles() {
        const half = this.size / 2;
        const geometry = new THREE.PlaneGeometry(1, 1);
        geometry.rotateX(-Math.PI / 2);

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                const material = new THREE.MeshLambertMaterial({ map: this.textures.grass });
                const tile = new THREE.Mesh(geometry, material);
                tile.position.set(x - half + 0.5, 0, z - half + 0.5);
                tile.receiveShadow = true;
                this.scene.add(tile);
                this.tiles.set(`${x},${z}`, tile);
            }
        }
    }

    paintTile(gridPos, type) {
        const key = `${gridPos.x},${gridPos.z}`;
        const tile = this.tiles.get(key);
        const texture = this.textures[type];

        if (tile && texture) {
            tile.material.map = texture;
            tile.material.needsUpdate = true;
        }
    }
}
