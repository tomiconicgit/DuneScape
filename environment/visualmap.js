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
        const wrap = t => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.minFilter = t.magFilter = THREE.LinearFilter;
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
        const skyGeo = new THREE.PlaneGeometry(this.size * 3, this.size * 3, 1, 1);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    pos.y += 20.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform float uTime;
                
                float rand(vec2 co){
                    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                }

                void main(){
                    vec2 uv = vUv * 10.0;
                    float cloud = rand(uv + uTime * 0.05);
                    cloud = smoothstep(0.5, 0.8, cloud);
                    vec3 skyColor = vec3(0.53,0.81,0.92);
                    vec3 cloudColor = vec3(1.0);
                    vec3 color = mix(skyColor, cloudColor, cloud);
                    gl_FragColor = vec4(color,1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.sky.rotation.x = -Math.PI / 2;
        this.sky.position.y = 0;
        this.scene.add(this.sky);
    },

    updateSky() {
        if (!this.sky) return;
        this.sky.material.uniforms.uTime.value = this.clock.getElapsedTime();
    }
};

export default VisualMap;