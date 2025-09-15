import * as THREE from 'three';

const VisualMap = {
    scene: null,
    tiles: new Map(), // key "x,z" -> mesh
    size: 100,
    divisions: 100,
    tileSize: 1,

    textures: {},

    init(scene) {
        this.scene = scene;
        this._loadTextures();
        this._createTiles();
    },

    _loadTextures() {
        const loader = new THREE.TextureLoader();
        const wrap = (t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.minFilter = THREE.NearestFilter;
            t.magFilter = THREE.NearestFilter;
            return t;
        };

        this.textures = {
            grass: wrap(loader.load('./environment/assets/grass.jpeg')),
            dirt: wrap(loader.load('./environment/assets/dirt.jpeg')),
            sand: wrap(loader.load('./environment/assets/sand.jpeg')),
            stone: wrap(loader.load('./environment/assets/stone.jpeg')),
            // water: wrap(loader.load('./environment/assets/water.jpeg')), // not used yet
        };
    },

    _createTiles() {
        const half = this.size / 2;

        for (let x = 0; x < this.divisions; x++) {
            for (let z = 0; z < this.divisions; z++) {
                const geometry = new THREE.PlaneGeometry(this.tileSize, this.tileSize);
                geometry.rotateX(-Math.PI / 2);

                const material = new THREE.MeshLambertMaterial({
                    map: this.textures.grass.clone(), // default starting texture
                });

                const tile = new THREE.Mesh(geometry, material);
                tile.position.set(x - half + 0.5, 0, z - half + 0.5);

                this.scene.add(tile);
                this.tiles.set(`${x},${z}`, tile);
            }
        }
    },

    paintTile(gridPos, type) {
        const key = `${gridPos.x},${gridPos.z}`; // <- corrected key usage
        const tile = this.tiles.get(key);
        if (!tile) return;

        const tex = this.textures[type];
        if (!tex) return;

        tile.material.map = tex;
        tile.material.needsUpdate = true;

        this._blendNeighbors(gridPos, type);
    },

    _blendNeighbors(gridPos, type) {
        const offsets = [
            { dx: 1, dz: 0 },
            { dx: -1, dz: 0 },
            { dx: 0, dz: 1 },
            { dx: 0, dz: -1 },
        ];

        for (const o of offsets) {
            const key = `${gridPos.x + o.dx},${gridPos.z + o.dz}`;
            const neighbor = this.tiles.get(key);
            if (neighbor && neighbor.material.map !== this.textures[type]) {
                neighbor.material.color = new THREE.Color(0.85, 0.85, 0.85);
                neighbor.material.needsUpdate = true;
            }
        }
    }
};

export default VisualMap;