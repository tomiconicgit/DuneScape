import * as THREE from 'three';

const VisualMap = {
    scene: null,
    tiles: new Map(),
    size: 100,
    divisions: 100,
    tileSize: 1,
    textures: {},
    sky: null,
    sun: null,
    cloudGroup: null,
    clouds: [],
    clock: new THREE.Clock(),
    weatherFactor: 0.6, // 0 = clear, 1 = overcast

    init(scene) {
        this.scene = scene;
        this._loadTextures();
        this._createTiles();
        this._createSky();
        this._createSun();
        this._createCloudGroup();
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
                tile.receiveShadow = false; // grid tiles stay shadow-free
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
        // Sky as large sphere
        const radius = this.size * 8;
        const skyGeo = new THREE.SphereGeometry(radius, 64, 32);
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: { },
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPos;
                void main() {
                    vec3 top = vec3(0.53,0.81,0.92);
                    vec3 horizon = vec3(0.87,0.93,0.98);
                    float t = (vPos.y + ${radius.toFixed(1)}) / (${(radius*2).toFixed(1)});
                    vec3 color = mix(horizon, top, t);
                    gl_FragColor = vec4(color,1.0);
                }
            `
        });

        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.sky.position.set(0, 0, 0);
        this.scene.add(this.sky);
    },

    _createSun() {
        this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sun.position.set(-50, 40, -50); // Horizon angle
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.camera.near = 1;
        this.sun.shadow.camera.far = 200;
        this.sun.shadow.camera.left = -100;
        this.sun.shadow.camera.right = 100;
        this.sun.shadow.camera.top = 100;
        this.sun.shadow.camera.bottom = -100;
        this.scene.add(this.sun);

        // Subtle ambient light to soften shadows
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);
    },

    _createCloudGroup() {
        this.cloudGroup = new THREE.Group();
        this.scene.add(this.cloudGroup);
    },

    _createClouds() {
        const cloudCount = Math.floor(5 + 20 * this.weatherFactor);
        for (let i = 0; i < cloudCount; i++) {
            const cluster = new THREE.Group();
            const puffCount = 5 + Math.floor(Math.random() * 10);
            const baseSpread = 10 + 15 * this.weatherFactor;
            const yBase = 20 + Math.random() * 10;

            for (let j = 0; j < puffCount; j++) {
                const radius = 1 + Math.random() * 2;

                const puffGeo = new THREE.SphereGeometry(radius, 16, 16);
                const puffMat = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.6,
                    shininess: 0,
                    depthWrite: false
                });

                const puff = new THREE.Mesh(puffGeo, puffMat);
                puff.position.set(
                    (Math.random() - 0.5) * baseSpread,
                    yBase + Math.random() * 2,
                    (Math.random() - 0.5) * baseSpread
                );

                puff.castShadow = true;
                puff.receiveShadow = false;
                cluster.add(puff);
            }

            cluster.userData = { speed: 0.002 + Math.random() * 0.004 };
            cluster.position.set(
                (Math.random() - 0.5) * this.size,
                0,
                (Math.random() - 0.5) * this.size
            );

            this.clouds.push(cluster);
            this.cloudGroup.add(cluster);
        }
    },

    update() {
        const delta = this.clock.getDelta();

        // Clouds drift slowly
        this.clouds.forEach(c => {
            c.position.x += c.userData.speed * delta * 5;
            if (c.position.x > this.size / 2) c.position.x = -this.size / 2;
        });
    }
};

export default VisualMap;