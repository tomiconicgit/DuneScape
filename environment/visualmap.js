import * as THREE from 'three';

const VisualMap = {
    scene: null,
    tiles: new Map(),
    size: 100,
    divisions: 100,
    tileSize: 1,
    textures: {},
    sky: null,
    clouds: [],
    cloudGroup: new THREE.Group(),
    clock: new THREE.Clock(),
    weatherFactor: 0.5, // 0 = clear, 1 = fully cloudy

    init(scene) {
        this.scene = scene;
        this._loadTextures();
        this._createTiles();
        this._createSky();
        this._createSun();
        this._createClouds();
        scene.add(this.cloudGroup);
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
                tile.receiveShadow = false; // gridmap is dev map

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
            uniforms: { sunPos: { value: new THREE.Vector3() } },
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPos;
                uniform vec3 sunPos;
                void main() {
                    float h = normalize(vPos).y;
                    vec3 horizonColor = vec3(1.0,0.6,0.3);
                    vec3 midColor = vec3(0.5,0.7,1.0);
                    vec3 zenithColor = vec3(0.1,0.2,0.5);
                    vec3 base = mix(horizonColor, midColor, smoothstep(0.0,0.5,h));
                    base = mix(base, zenithColor, smoothstep(0.5,1.0,h));
                    gl_FragColor = vec4(base,1.0);
                }
            `
        });

        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.sky.position.set(0, 0, 0);
        this.scene.add(this.sky);
    },

    _createSun() {
        const sunColor = 0xffeeaa;
        this.sunLight = new THREE.DirectionalLight(sunColor, 1.0);
        this.sunLight.position.set(50, 50, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);

        // Visual sun
        const sunGeo = new THREE.SphereGeometry(3, 32, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: sunColor, transparent: true, opacity: 0.8 });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.sunMesh.position.copy(this.sunLight.position);
        this.scene.add(this.sunMesh);
    },

    _createClouds() {
        const cloudCount = Math.floor(5 + 20 * this.weatherFactor);
        for (let i = 0; i < cloudCount; i++) {
            const cluster = new THREE.Group();
            const puffCount = 3 + Math.floor(Math.random() * 7);
            const spread = 10 + 20 * this.weatherFactor;
            const yBase = 15 + Math.random() * 10;

            for (let j = 0; j < puffCount; j++) {
                const radius = 1 + Math.random() * 2;
                const puff = new THREE.Mesh(
                    new THREE.SphereGeometry(radius, 16, 16),
                    new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
                );
                puff.position.set(
                    (Math.random() - 0.5) * spread,
                    yBase + Math.random() * 2,
                    (Math.random() - 0.5) * spread
                );
                puff.castShadow = true;
                cluster.add(puff);
            }
            cluster.userData = { speed: 0.01 + Math.random() * 0.02 };
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

        // Move clouds horizontally
        this.clouds.forEach(c => {
            c.position.x += c.userData.speed * delta * 5;
            if (c.position.x > this.size / 2) c.position.x = -this.size / 2;
        });
    }
};

export default VisualMap;