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
                tile.receiveShadow = false; // gridmap should not receive shadows

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
        // Sphere radius 4x size of grid
        const radius = this.size * 4;
        const skyGeo = new THREE.SphereGeometry(radius, 64, 32);

        // Shift sky down so bottom aligns with gridmap (y=0)
        const skyYPos = radius - (this.size / 2);

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
                    gl_FragColor = vec4(base, 1.0);
                }
            `
        });

        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.sky.position.set(0, skyYPos, 0);
        this.scene.add(this.sky);
    },

    _createClouds() {
        const cloudGroup = new THREE.Group();
        const numClouds = 25;
        const cloudHeight = 30; // above map
        const cloudArea = this.size * 1.5;

        for (let i = 0; i < numClouds; i++) {
            const cloud = new THREE.Group();
            const numPuffs = 3 + Math.floor(Math.random() * 3);

            for (let j = 0; j < numPuffs; j++) {
                const puff = new THREE.Mesh(
                    new THREE.SphereGeometry(2 + Math.random() * 2, 16, 16),
                    new THREE.MeshLambertMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.7
                    })
                );
                puff.position.set(
                    Math.random() * 5 - 2.5,
                    Math.random() * 2,
                    Math.random() * 5 - 2.5
                );
                puff.castShadow = true; // subtle shadows onto scene
                cloud.add(puff);
            }

            cloud.position.set(
                Math.random() * cloudArea - cloudArea / 2,
                cloudHeight + Math.random() * 5,
                Math.random() * cloudArea - cloudArea / 2
            );

            cloud.userData = {
                speed: 0.005 + Math.random() * 0.008 // slow horizontal movement
            };

            cloudGroup.add(cloud);
        }

        this.clouds = cloudGroup;
        this.scene.add(this.clouds);
    },

    update() {
        const elapsed = this.clock.getElapsedTime();

        if (this.sky) this.sky.material.uniforms.time.value = elapsed;

        if (this.clouds) {
            this.clouds.children.forEach(cloud => {
                cloud.position.x += cloud.userData.speed;
                if (cloud.position.x > this.size) cloud.position.x = -this.size;
            });
        }
    }
};

export default VisualMap;