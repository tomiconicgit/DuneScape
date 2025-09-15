import * as THREE from 'three';

const VisualMap = {
    scene: null,
    tiles: new Map(),
    size: 100,
    divisions: 100,
    tileSize: 1,
    textures: {},
    sky: null,
    clock: new THREE.Clock(),

    init(scene) {
        this.scene = scene;
        this._loadTextures();
        this._createTiles();
        this._createSky();
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
        };
    },

    _createTiles() {
        const half = this.size / 2;
        for (let x = 0; x < this.divisions; x++) {
            for (let z = 0; z < this.divisions; z++) {
                const geometry = new THREE.PlaneGeometry(this.tileSize, this.tileSize);
                geometry.rotateX(-Math.PI / 2);

                const material = new THREE.MeshLambertMaterial({
                    map: this.textures.grass.clone(),
                });

                const tile = new THREE.Mesh(geometry, material);
                tile.position.set(x - half + 0.5, 0, z - half + 0.5);
                tile.receiveShadow = false; // don't cast shadows on dev map

                this.scene.add(tile);
                this.tiles.set(`${x},${z}`, tile);
            }
        }
    },

    paintTile(gridPos, type) {
        const key = `${gridPos.x},${gridPos.z}`;
        const tile = this.tiles.get(key);
        if (!tile) return;
        const tex = this.textures[type];
        if (!tex) return;
        tile.material.map = tex;
        tile.material.needsUpdate = true;
    },

    _createSky() {
        const radius = this.size * 4;
        const skyGeo = new THREE.SphereGeometry(radius, 64, 32);

        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: { time: { value: 0 } },
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vPos;
                void main() {
                    vec3 base = mix(vec3(0.3,0.5,0.8), vec3(0.6,0.85,1.0), smoothstep(-1.0,1.0,vPos.y/200.0));
                    float clouds = sin(vPos.x*0.02 + time*0.15) * sin(vPos.z*0.02 + time*0.15) * 0.12;
                    clouds = clamp(clouds,0.0,1.0);
                    vec3 color = base + clouds;
                    gl_FragColor = vec4(color,1.0);
                }
            `
        });

        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.sky.position.set(0, this.size / 2, 0); // bottom level aligned with grid
        this.scene.add(this.sky);
    },

    update() {
        if (this.sky) this.sky.material.uniforms.time.value = this.clock.getElapsedTime();
    }
};

export default VisualMap;