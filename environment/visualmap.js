import * as THREE from 'three';

const VisualMap = {
    scene: null,
    tiles: new Map(),
    size: 100,
    divisions: 100,
    tileSize: 1,
    textures: {},
    sky: null,
    clouds: null,
    clock: new THREE.Clock(),

    init(scene) {
        this.scene = scene;
        this._loadTextures();
        this._createTiles();
        this._createSky();
        this._createClouds();
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
                tile.receiveShadow = false;

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
                    gl_FragColor = vec4(base,1.0);
                }
            `
        });

        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.sky.position.set(0, this.size / 2, 0);
        this.scene.add(this.sky);
    },

    _createClouds() {
        // Plane above gridmap
        const cloudGeo = new THREE.PlaneGeometry(this.size * 4, this.size * 4, 256, 256);

        const cloudMat = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: { time: { value: 0 } },
            vertexShader: `
                varying vec2 vUv;
                varying float vHeight;
                void main() {
                    vUv = uv;
                    vHeight = position.y;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vHeight;

                // Simple 2D noise
                float noise(vec2 p){
                    return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453);
                }

                void main() {
                    vec2 p = vUv * 10.0;
                    float n = noise(p + time*0.05);
                    float c = smoothstep(0.5,0.7,n); // cloud density
                    gl_FragColor = vec4(vec3(1.0), c*0.6);
                }
            `
        });

        this.clouds = new THREE.Mesh(cloudGeo, cloudMat);
        this.clouds.rotation.x = -Math.PI / 2;
        this.clouds.position.y = this.size / 2 + 20; // above grid
        this.scene.add(this.clouds);
    },

    update() {
        const elapsed = this.clock.getElapsedTime();
        if (this.sky) this.sky.material.uniforms.time.value = elapsed;
        if (this.clouds) this.clouds.material.uniforms.time.value = elapsed;
    }
};

export default VisualMap;