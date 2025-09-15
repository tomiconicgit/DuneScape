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
        const wrap = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; return t; };
        this.textures = {
            grass: wrap(loader.load('./environment/assets/grass.jpeg')),
            dirt: wrap(loader.load('./environment/assets/dirt.jpeg')),
            sand: wrap(loader.load('./environment/assets/sand.jpeg')),
            stone: wrap(loader.load('./environment/assets/stone.jpeg'))
        };
    },

    _createTiles() {
        const half = this.size / 2;
        for (let x = 0; x < this.divisions; x++) {
            for (let z = 0; z < this.divisions; z++) {
                const geometry = new THREE.PlaneGeometry(this.tileSize, this.tileSize);
                geometry.rotateX(-Math.PI / 2);

                const material = new THREE.MeshLambertMaterial({
                    map: this.textures.grass.clone()
                });

                const tile = new THREE.Mesh(geometry, material);
                tile.position.set(x - half + 0.5, 0, z - half + 0.5);
                tile.receiveShadow = true;

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
        const skyGeo = new THREE.SphereGeometry(500, 64, 32);
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vPos;

                float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }

                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    float a = hash(i);
                    float b = hash(i + vec2(1.0,0.0));
                    float c = hash(i + vec2(0.0,1.0));
                    float d = hash(i + vec2(1.0,1.0));
                    vec2 u = f*f*(3.0-2.0*f);
                    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
                }

                void main() {
                    vec3 dir = normalize(vPos);
                    float t = dir.y * 0.5 + 0.5;
                    vec3 skyColor = mix(vec3(0.2,0.3,0.6), vec3(0.6,0.8,1.0), t);

                    // Clouds
                    float cloud = noise(dir.xz*5.0 + vec2(time*0.02,0.0));
                    cloud = smoothstep(0.5,0.7,cloud);
                    skyColor = mix(skyColor, vec3(1.0), cloud*0.5);

                    gl_FragColor = vec4(skyColor,1.0);
                }
            `
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
        this.sky = sky;
    },

    update() {
        if (this.sky) {
            this.sky.material.uniforms.time.value = this.clock.getElapsedTime();
        }
    }
};

export default VisualMap;