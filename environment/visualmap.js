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
    },

    _createSky() {
        const size = this.size * 3;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // Invert the normals for inside of box
        geometry.scale(1,1,1);
        for (let i = 0; i < geometry.attributes.position.count; i++) {
            geometry.attributes.position.setY(i, geometry.attributes.position.getY(i));
        }

        const vertexShader = `
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vPosition;
            uniform float uTime;

            float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
            float noise(vec2 p){
                vec2 i = floor(p);
                vec2 f = fract(p);
                float a = hash(i);
                float b = hash(i + vec2(1.0,0.0));
                float c = hash(i + vec2(0.0,1.0));
                float d = hash(i + vec2(1.0,1.0));
                vec2 u = f*f*(3.0-2.0*f);
                return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
            }

            void main(){
                vec3 color = vec3(0.0);
                if(vPosition.y > 0.0){
                    vec2 uv = vPosition.xz*0.05 + vec2(uTime*0.02,0.0);
                    float n = noise(uv*10.0);
                    float cloud = smoothstep(0.5,0.7,n);
                    vec3 skyColor = vec3(0.53,0.81,0.92);
                    vec3 cloudColor = vec3(1.0);
                    color = mix(skyColor, cloudColor, cloud);
                }
                gl_FragColor = vec4(color,1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            side: THREE.BackSide,
            uniforms: { uTime: { value: 0 } }
        });

        this.sky = new THREE.Mesh(geometry, material);
        this.sky.position.set(0, this.size/2, 0);
        this.scene.add(this.sky);
    },

    updateSky() {
        if(this.sky){
            this.sky.material.uniforms.uTime.value = this.clock.getElapsedTime();
        }
    }
};

export default VisualMap;